import {
  AnchorMode,
  TransactionVersion,
  broadcastTransaction,
  getAddressFromPrivateKey,
  makeSTXTokenTransfer,
} from '@stacks/transactions';
import { generateSecretKey, generateWallet } from '@stacks/wallet-sdk';
import { StacksMainnet } from '@stacks/network';
import * as fs from 'fs';

const network = new StacksMainnet();
const DEFAULT_WALLETS_PATH = './scripts/test-wallets.json';
const HIRO_API_ORIGIN = 'https://api.mainnet.hiro.so';
const DEFAULT_WALLET_COUNT = 25;
const DEFAULT_RUNS = 2;
const DEFAULT_TARGET_PER_CONTRACT = 500;
const DEFAULT_FEE_USTX = 1000;
const DEFAULT_TRANSFER_FEE_USTX = 1000;
const DEFAULT_TIER = 0;
const DEFAULT_INCLUDE_BADGES = true;
const DEFAULT_BUFFER_USTX = 0;

type WalletEntry = {
  address: string;
  mnemonic?: string;
  privateKey?: string;
};

function parseArgs(argv: string[]) {
  const args = new Map<string, string>();
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args.set(key, 'true');
    } else {
      args.set(key, next);
      i++;
    }
  }
  return args;
}

function parseBool(value: string | undefined, fallback: boolean) {
  if (value == null) return fallback;
  const v = value.trim().toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes' || v === 'y') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'n') return false;
  return fallback;
}

function getStackpulseTierPriceUstx(tier: number) {
  const stackpulse: Record<number, number> = { 0: 0, 1: 10_000, 2: 50_000, 3: 200_000 };
  return stackpulse[tier] ?? 0;
}

function getFeeVaultTierPriceUstx(tier: number) {
  const feeVault: Record<number, number> = { 0: 0, 1: 10_000, 2: 50_000, 3: 200_000 };
  return feeVault[tier] ?? 0;
}

function buildWalletQuotas(target: number, walletCount: number) {
  if (walletCount <= 0) return [];
  const base = Math.floor(target / walletCount);
  const remainder = target % walletCount;
  return Array.from({ length: walletCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

function formatStx(ustx: number) {
  return `${(ustx / 1_000_000).toFixed(6)} STX`;
}

function getBadgeWalletTxCountForRuns(quotaPerRun: number, runs: number) {
  if (quotaPerRun <= 0 || runs <= 0) return 0;

  let totalWalletPaidTx = 0;
  let hasToken = false;
  let owner: 'wallet' | 'minter' = 'wallet';

  for (let run = 0; run < runs; run++) {
    let interactionsRemaining = quotaPerRun;

    if (!hasToken) {
      hasToken = true; // mint-badge is paid by minter
      interactionsRemaining -= 1;
      if (interactionsRemaining < 0) interactionsRemaining = 0;
      owner = 'wallet';
    }

    for (let i = 0; i < interactionsRemaining; i++) {
      if (owner === 'wallet') {
        totalWalletPaidTx++;
        owner = 'minter';
      } else {
        owner = 'wallet';
      }
    }
  }

  return totalWalletPaidTx;
}

async function generateAccountKey(mnemonic: string) {
  const wallet = await generateWallet({ secretKey: mnemonic, password: 'password' });
  return wallet.accounts[0].stxPrivateKey;
}

async function resolvePrivateKey(entry: WalletEntry) {
  if (entry.privateKey && entry.privateKey.length > 0) {
    return entry.privateKey;
  }
  if (entry.mnemonic && entry.mnemonic.length > 0) {
    return generateAccountKey(entry.mnemonic);
  }
  throw new Error(`No privateKey/mnemonic for wallet ${entry.address}`);
}

async function getNextNonce(address: string) {
  const res = await fetch(`${HIRO_API_ORIGIN}/extended/v1/address/${address}/nonces`);
  if (!res.ok) {
    throw new Error(`Nonce fetch failed: ${res.status}`);
  }
  const nonceData: any = await res.json();
  if (typeof nonceData?.possible_next_nonce !== 'number') {
    throw new Error('Nonce missing in response');
  }
  return nonceData.possible_next_nonce;
}

async function getBalanceUstx(address: string) {
  const res = await fetch(`${HIRO_API_ORIGIN}/extended/v1/address/${address}/balances`);
  if (!res.ok) {
    throw new Error(`Balance fetch failed: ${res.status}`);
  }
  const balanceData: any = await res.json();
  const value = Number(balanceData?.stx?.balance ?? NaN);
  if (!Number.isFinite(value)) {
    throw new Error('Balance missing in response');
  }
  return value;
}

async function run() {
  const args = parseArgs(process.argv);
  const walletsPath = args.get('--wallets') || DEFAULT_WALLETS_PATH;
  const walletCount = Number(args.get('--count') || process.env.WALLET_COUNT || DEFAULT_WALLET_COUNT);
  const runs = Number(args.get('--runs') || process.env.RUNS || DEFAULT_RUNS);
  const targetPerContract = Number(
    args.get('--target-per-contract') || process.env.TARGET_PER_CONTRACT || DEFAULT_TARGET_PER_CONTRACT
  );
  const tier = Number(args.get('--tier') || process.env.SUBSCRIPTION_TIER || DEFAULT_TIER);
  const txFeeUstx = Number(args.get('--fee-ustx') || process.env.TX_FEE_USTX || DEFAULT_FEE_USTX);
  const transferFeeUstx = Number(
    args.get('--transfer-fee-ustx') || process.env.TRANSFER_FEE_USTX || DEFAULT_TRANSFER_FEE_USTX
  );
  const includeBadges = parseBool(
    args.get('--with-badges') || process.env.WITH_BADGES,
    DEFAULT_INCLUDE_BADGES
  );
  const bufferUstx = Number(args.get('--buffer-ustx') || process.env.BUFFER_USTX || DEFAULT_BUFFER_USTX);
  const dryRun = parseBool(args.get('--dry-run') || process.env.DRY_RUN, false);

  if (!Number.isFinite(walletCount) || walletCount < 2) {
    throw new Error('count must be at least 2');
  }
  if (!Number.isFinite(runs) || runs < 1) {
    throw new Error('runs must be a positive number');
  }
  if (!Number.isFinite(targetPerContract) || targetPerContract < 1) {
    throw new Error('target-per-contract must be a positive number');
  }

  if (!fs.existsSync(walletsPath)) {
    console.log(`Wallets file not found at ${walletsPath}. Generating new test wallets...`);
    const wallets = [];
    for (let i = 0; i < walletCount; i++) {
      const secretKey = generateSecretKey(256);
      const wallet = await generateWallet({ secretKey, password: 'password' });
      const account = wallet.accounts[0];
      const privateKey = account.stxPrivateKey;
      const address = getAddressFromPrivateKey(privateKey, TransactionVersion.Mainnet);

      wallets.push({
        address,
        privateKey,
        mnemonic: secretKey,
      });
    }

    fs.writeFileSync(walletsPath, JSON.stringify({ wallets }, null, 2));
    console.log(`Generated ${walletCount} test wallets and saved to ${walletsPath}`);
    console.log(`\nWallet 1 (${wallets[0].address}) is the funding wallet.`);
    console.log(`Send STX to wallet 1, then run this script again to distribute funds.\n`);
    process.exit(0);
  }

  const data = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
  const wallets: WalletEntry[] = data.wallets.slice(0, walletCount);

  if (wallets.length < 2) {
    throw new Error('Need at least 2 wallets in wallets file');
  }

  const senderWallet = wallets[0];
  const senderAddress = senderWallet.address;
  const senderKey = await resolvePrivateKey(senderWallet);
  const recipients = wallets.slice(1);
  const quotas = buildWalletQuotas(targetPerContract, wallets.length);
  const stackpulsePriceUstx = getStackpulseTierPriceUstx(tier);
  const feeVaultPriceUstx = getFeeVaultTierPriceUstx(tier);

  const perRecipientAmountUstx: number[] = [];
  for (let i = 0; i < recipients.length; i++) {
    const walletGlobalIndex = i + 1;
    const perRunQuota = quotas[walletGlobalIndex] ?? 0;
    const stackpulseCost = perRunQuota * runs * txFeeUstx + (perRunQuota > 0 ? stackpulsePriceUstx : 0);
    const alertCost = perRunQuota * runs * txFeeUstx;
    const feeVaultCost = perRunQuota * runs * (txFeeUstx + feeVaultPriceUstx);
    const badgeWalletTxCount = includeBadges ? getBadgeWalletTxCountForRuns(perRunQuota, runs) : 0;
    const badgeCost = badgeWalletTxCount * txFeeUstx;
    const total = stackpulseCost + alertCost + feeVaultCost + badgeCost + bufferUstx;
    perRecipientAmountUstx.push(total);
  }

  const totalDistributionUstx = perRecipientAmountUstx.reduce((sum, amount) => sum + amount, 0);
  const totalDistributionFeesUstx = recipients.length * transferFeeUstx;
  const senderRequiredUstx = totalDistributionUstx + totalDistributionFeesUstx;

  const senderBalance = await getBalanceUstx(senderAddress);
  let nonce = await getNextNonce(senderAddress);

  console.log(`Funding wallet: ${senderAddress}`);
  console.log(`Wallet count: ${wallets.length} (recipients: ${recipients.length})`);
  console.log(`Plan: ${runs} run(s), target ${targetPerContract} tx per contract, tier ${tier}`);
  console.log(`Include badges: ${includeBadges ? 'yes' : 'no'}`);
  console.log(`Dry run: ${dryRun ? 'yes' : 'no'}`);
  console.log(`Per-recipient amount:`);
  for (let i = 0; i < recipients.length; i++) {
    console.log(
      `- [${i + 2}/${wallets.length}] ${recipients[i].address} => ${perRecipientAmountUstx[i]} uSTX (${formatStx(
        perRecipientAmountUstx[i]
      )})`
    );
  }
  console.log(`\nDistribution total: ${totalDistributionUstx} uSTX (${formatStx(totalDistributionUstx)})`);
  console.log(`Distribution tx fees: ${totalDistributionFeesUstx} uSTX (${formatStx(totalDistributionFeesUstx)})`);
  console.log(`Sender required before interactions: ${senderRequiredUstx} uSTX (${formatStx(senderRequiredUstx)})`);
  console.log(`Sender current balance: ${senderBalance} uSTX (${formatStx(senderBalance)})`);

  if (senderBalance < senderRequiredUstx) {
    console.error(
      `Insufficient sender balance. Need at least ${senderRequiredUstx} uSTX (${formatStx(
        senderRequiredUstx
      )}) before running distribution.`
    );
    process.exit(1);
  }

  if (dryRun) {
    console.log('\nDry run enabled. No transfers were broadcast.');
    process.exit(0);
  }

  console.log(`\nStarting funding of ${recipients.length} wallets...`);
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    const amount = perRecipientAmountUstx[i];
    console.log(
      `[${i + 1}/${recipients.length}] Funding ${recipient.address} with ${amount} uSTX (${formatStx(amount)}), nonce ${nonce}`
    );

    try {
      const tx = await makeSTXTokenTransfer({
        recipient: recipient.address,
        amount,
        senderKey,
        network,
        nonce,
        fee: transferFeeUstx,
        anchorMode: AnchorMode.Any,
      });

      const res: any = await broadcastTransaction(tx, network);
      if (typeof res === 'string') {
        console.log(`   txid: ${res}`);
      } else if (res?.txid) {
        console.log(`   txid: ${res.txid}`);
      } else if (res?.error) {
        throw new Error(`${res.error}${res.reason ? ` (${res.reason})` : ''}`);
      } else {
        console.log(`   result: ${JSON.stringify(res)}`);
      }
      nonce++;
      successCount++;
    } catch (e) {
      failCount++;
      const message = e instanceof Error ? e.message : String(e);
      console.error(`   Failed: ${message}`);
    }
  }

  console.log(`\nFunding complete. Success: ${successCount}, Failed: ${failCount}`);
}

run();
