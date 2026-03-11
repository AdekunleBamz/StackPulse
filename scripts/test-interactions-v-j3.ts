import {
  AnchorMode,
  broadcastTransaction,
  callReadOnlyFunction,
  cvToValue,
  makeContractCall,
  noneCV,
  principalCV,
  getAddressFromPrivateKey,
  TransactionVersion,
  stringAsciiCV,
  uintCV,
} from '@stacks/transactions';
import { generateWallet } from '@stacks/wallet-sdk';
import { StacksMainnet } from '@stacks/network';
import * as fs from 'fs';

const network = new StacksMainnet();
const DEPLOYER_ADDRESS = 'SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT';
const HIRO_API_ORIGIN = 'https://api.mainnet.hiro.so';
const DEFAULT_WALLETS_PATH = '/Users/apple/aegis-vault/scripts/test-wallets.json';

const ansi = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
};

const OK = ansi.green('✓');
const FAIL = ansi.red('✗');
const WARN = ansi.yellow('!');

async function generateAccountKey(mnemonic: string) {
  const wallet = await generateWallet({ secretKey: mnemonic, password: 'password' });
  const account = wallet.accounts[0];
  return account.stxPrivateKey;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

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

async function getNextNonce(address: string) {
  const res = await fetch(`${HIRO_API_ORIGIN}/extended/v1/address/${address}/nonces`);
  if (!res.ok) throw new Error(`Nonce fetch failed: ${res.status}`);
  const data: any = await res.json();
  const nonce = data?.possible_next_nonce;
  if (typeof nonce !== 'number') throw new Error('Nonce missing in response');
  return nonce;
}

async function broadcastAndConfirm(tx: any, label: string, timeoutMs: number) {
  const result: any = await broadcastTransaction(tx, network);

  if (typeof result === 'string') {
    await waitForTx(result, label, timeoutMs);
    return result;
  }

  if (result?.error) {
    const reason = result?.reason ? `: ${result.reason}` : '';
    throw new Error(`Broadcast failed${reason}`);
  }

  const txid = result?.txid;
  if (!txid) throw new Error('Broadcast did not return txid');
  await waitForTx(txid, label, timeoutMs);
  return txid;
}

async function waitForTx(txid: string, label: string, timeoutMs: number) {
  const started = Date.now();
  const pollMs = 15_000;

  while (true) {
    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timeout waiting for confirmation (${txid})`);
    }

    const res = await fetch(`${HIRO_API_ORIGIN}/extended/v1/tx/${txid}`);
    if (!res.ok) {
      await sleep(pollMs);
      continue;
    }
    const data: any = await res.json();
    const status = data?.tx_status;

    if (status === 'success') {
      console.log(`      ${OK} Confirmed: ${label} ${ansi.dim(txid)}`);
      return;
    }

    if (
      status === 'abort_by_response' ||
      status === 'abort_by_post_condition' ||
      status === 'dropped_replace_by_fee' ||
      status === 'dropped_replace_across_fork' ||
      status === 'dropped_too_expensive' ||
      status === 'dropped_stale_garbage_collect'
    ) {
      const reason = data?.tx_result?.repr || data?.tx_result || '';
      throw new Error(`Tx ${status}: ${reason || txid}`);
    }

    process.stdout.write(`      ${ansi.dim('…')} Waiting: ${label} (${status || 'pending'})\r`);
    await sleep(pollMs);
  }
}

async function findFirstUnmintedBadgeType(recipient: string) {
  for (let badgeType = 1; badgeType <= 9; badgeType++) {
    const ro: any = await callReadOnlyFunction({
      contractAddress: DEPLOYER_ADDRESS,
      contractName: 'reputation-badges-v-j3',
      functionName: 'has-badge',
      functionArgs: [principalCV(recipient), uintCV(badgeType)],
      network,
      senderAddress: recipient,
    });

    const isOwned = Boolean(cvToValue(ro));
    if (!isOwned) return badgeType;
  }
  return null;
}

async function run() {
  const args = parseArgs(process.argv);
  const walletsPath = args.get('--wallets') || process.env.WALLETS_PATH || DEFAULT_WALLETS_PATH;
  const walletCount = Number(args.get('--count') || process.env.WALLET_COUNT || 25);
  const txFeeUstx = Number(args.get('--fee-ustx') || process.env.TX_FEE_USTX || 1000); // 0.001 STX
  const tier = Number(args.get('--tier') || process.env.SUBSCRIPTION_TIER || 0);
  const confirmTimeoutMs = Number(args.get('--confirm-timeout-ms') || process.env.CONFIRM_TIMEOUT_MS || 20 * 60 * 1000);

  const badgeMinterMnemonic = args.get('--badge-minter-mnemonic') || process.env.BADGE_MINTER_MNEMONIC;

  const data = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
  const wallets = data.wallets.slice(0, walletCount);

  console.log(`Starting interactions for ${wallets.length} wallets on -v-j3 contracts...`);
  console.log(`- Fee: ${txFeeUstx} uSTX (0.001 STX) per tx`);
  console.log(`- Tier: ${tier}`);
  console.log(`- Wallets: ${walletsPath}`);
  if (!badgeMinterMnemonic) {
    console.log(
      `${WARN} reputation-badges mint will be skipped (set BADGE_MINTER_MNEMONIC to an authorized minter/owner mnemonic).`
    );
  }

  let badgeMinterKey: string | null = null;
  let badgeMinterAddress: string | null = null;
  if (badgeMinterMnemonic) {
    badgeMinterKey = await generateAccountKey(badgeMinterMnemonic);
    badgeMinterAddress = getAddressFromPrivateKey(badgeMinterKey, TransactionVersion.Mainnet);
  }

  for (let i = 0; i < wallets.length; i++) {
    const w = wallets[i];
    console.log(`\n[${i + 1}/${wallets.length}] Wallet: ${w.address}`);

    try {
      const privateKey = await generateAccountKey(w.mnemonic);
      let nonce = await getNextNonce(w.address);

      // 1) stackpulse-v-j3: register-and-subscribe
      console.log(`   -> 1: Registering to StackPulse v-j3...`);
      const tx1 = await makeContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: 'stackpulse-v-j3',
        functionName: 'register-and-subscribe',
        functionArgs: [
          stringAsciiCV(`testuser${i}`),
          stringAsciiCV(`test${i}@stackpulse.app`),
          uintCV(tier),
          uintCV(31),
        ],
        senderKey: privateKey,
        network,
        nonce: nonce++,
        fee: txFeeUstx,
        anchorMode: AnchorMode.Any,
      });
      await broadcastAndConfirm(tx1, 'register-and-subscribe', confirmTimeoutMs);

      // 2) alert-manager-v-j3: create-alert (basic whale alert)
      console.log(`   -> 2: Creating alert (alert-manager-v-j3)...`);
      const tx2 = await makeContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: 'alert-manager-v-j3',
        functionName: 'create-alert',
        functionArgs: [
          uintCV(1),
          stringAsciiCV('Whale Alert'),
          noneCV(),
          uintCV(10_000),
          uintCV(tier),
        ],
        senderKey: privateKey,
        network,
        nonce: nonce++,
        fee: txFeeUstx,
        anchorMode: AnchorMode.Any,
      });
      await broadcastAndConfirm(tx2, 'create-alert', confirmTimeoutMs);

      // 3) fee-vault-v-j3: collect-subscription-fee
      console.log(`   -> 3: Collecting subscription fee (fee-vault-v-j3)...`);
      const tx3 = await makeContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: 'fee-vault-v-j3',
        functionName: 'collect-subscription-fee',
        functionArgs: [uintCV(tier), noneCV()],
        senderKey: privateKey,
        network,
        nonce: nonce++,
        fee: txFeeUstx,
        anchorMode: AnchorMode.Any,
      });
      await broadcastAndConfirm(tx3, 'collect-subscription-fee', confirmTimeoutMs);

      // 4) reputation-badges-v-j3: mint-badge (requires authorized minter/owner)
      if (badgeMinterKey) {
        console.log(`   -> 4: Minting badge (reputation-badges-v-j3)...`);
        const badgeType = await findFirstUnmintedBadgeType(w.address);
        if (!badgeType) {
          console.log(`      ${WARN} No available badge types to mint (already has all 1–9). Skipping.`);
        } else {
          const tx4 = await makeContractCall({
            contractAddress: DEPLOYER_ADDRESS,
            contractName: 'reputation-badges-v-j3',
            functionName: 'mint-badge',
            functionArgs: [principalCV(w.address), uintCV(badgeType)],
            senderKey: badgeMinterKey,
            network,
            // IMPORTANT: nonce must be for the minter address, not the recipient wallet.
            nonce: await getNextNonce(badgeMinterAddress || DEPLOYER_ADDRESS),
            fee: txFeeUstx,
            anchorMode: AnchorMode.Any,
          });
          await broadcastAndConfirm(tx4, `mint-badge (type ${badgeType})`, confirmTimeoutMs);
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.log(`   ${FAIL} Failed for ${w.address}: ${message}`);
      console.log(`   ${ansi.dim('Stopping further transactions for this wallet.')}`);
    }
  }

  console.log(`\nDone.`);
}

run();
