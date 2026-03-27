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
const DEFAULT_WALLETS_PATH = './scripts/test-wallets.json';

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

async function fetchJsonWithRetry(url: string, label: string, maxAttempts = 6) {
  let attempt = 1;

  while (attempt <= maxAttempts) {
    const res = await fetch(url);

    if (res.ok) {
      return res.json();
    }

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === maxAttempts) {
      throw new Error(`${label} failed: ${res.status}`);
    }

    const waitMs = Math.min(3000 * attempt, 20000);
    await sleep(waitMs);
    attempt++;
  }

  throw new Error(`${label} failed: exhausted retries`);
}

function isMaxAlertsReachedError(message: string) {
  return message.includes('(err u103)') || message.includes('ERR-MAX-ALERTS-REACHED');
}

function parseUintLike(value: unknown, label: string) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number(value);
  }

  throw new Error(`${label} missing in response`);
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
  const data: any = await fetchJsonWithRetry(
    `${HIRO_API_ORIGIN}/extended/v1/address/${address}/nonces`,
    'Nonce fetch'
  );
  const nonce = data?.possible_next_nonce;
  if (typeof nonce !== 'number') throw new Error('Nonce missing in response');
  return nonce;
}

async function getBalanceUstx(address: string) {
  const data: any = await fetchJsonWithRetry(
    `${HIRO_API_ORIGIN}/extended/v1/address/${address}/balances`,
    'Balance fetch'
  );
  const balance = Number(data?.stx?.balance ?? NaN);
  if (!Number.isFinite(balance)) throw new Error('Balance missing in response');
  return balance;
}

function getTierCostUstx(tier: number) {
  // Keep in sync with contract constants.
  const stackpulse: Record<number, number> = { 0: 0, 1: 10_000, 2: 50_000, 3: 200_000 };
  const feeVault: Record<number, number> = { 0: 0, 1: 10_000, 2: 150_000, 3: 450_000 };
  return (stackpulse[tier] ?? 0) + (feeVault[tier] ?? 0);
}

function formatStx(ustx: number) {
  return `${(ustx / 1_000_000).toFixed(6)} STX`;
}

async function isStackpulseRegistered(address: string) {
  const ro: any = await callReadOnlyFunction({
    contractAddress: DEPLOYER_ADDRESS,
    contractName: 'stackpulse-v-j3',
    functionName: 'is-registered',
    functionArgs: [principalCV(address)],
    network,
    senderAddress: address,
  });
  return Boolean(cvToValue(ro));
}

async function getStackpulseTier(address: string) {
  const ro: any = await callReadOnlyFunction({
    contractAddress: DEPLOYER_ADDRESS,
    contractName: 'stackpulse-v-j3',
    functionName: 'get-user',
    functionArgs: [principalCV(address)],
    network,
    senderAddress: address,
  });
  const user = cvToValue(ro) as any;
  const tierValue = user?.value?.tier?.value;
  const tier = typeof tierValue === 'string' ? Number(tierValue) : NaN;
  return Number.isFinite(tier) ? tier : null;
}

async function getUserAlertCount(address: string) {
  const ro: any = await callReadOnlyFunction({
    contractAddress: DEPLOYER_ADDRESS,
    contractName: 'alert-manager-v-j3',
    functionName: 'get-user-alert-count',
    functionArgs: [principalCV(address)],
    network,
    senderAddress: address,
  });

  return parseUintLike(cvToValue(ro), 'Alert count');
}

async function getMaxAlertsForTier(tier: number, senderAddress: string) {
  const ro: any = await callReadOnlyFunction({
    contractAddress: DEPLOYER_ADDRESS,
    contractName: 'alert-manager-v-j3',
    functionName: 'get-max-alerts-for-tier',
    functionArgs: [uintCV(tier)],
    network,
    senderAddress,
  });

  return parseUintLike(cvToValue(ro), 'Max alerts');
}

async function broadcastAndConfirm(tx: any, label: string, timeoutMs: number) {
  const result: any = await broadcastTransaction(tx, network);

  if (typeof result === 'string') {
    await waitForTx(result, label, timeoutMs);
    return result;
  }

  if (result?.error) {
    const reason = result?.reason ? ` (${result.reason})` : '';
    const details = result?.reason_data ? ` ${JSON.stringify(result.reason_data)}` : '';
    throw new Error(`Broadcast failed: ${result.error}${reason}${details}`);
  }

  const txid = result?.txid;
  if (!txid) throw new Error('Broadcast did not return txid');
  await waitForTx(txid, label, timeoutMs);
  return txid;
}

async function getTxStatus(txid: string, maxAttempts = 4) {
  let attempt = 1;

  while (attempt <= maxAttempts) {
    const res = await fetch(`${HIRO_API_ORIGIN}/extended/v1/tx/${txid}`);
    if (res.ok) {
      return await res.json();
    }

    if (res.status === 404) {
      return null;
    }

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === maxAttempts) {
      return null;
    }

    await sleep(Math.min(1500 * attempt, 6000));
    attempt++;
  }

  return null;
}

async function waitForTx(txid: string, label: string, timeoutMs: number) {
  const started = Date.now();
  const pollMs = 15_000;

  while (true) {
    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timeout waiting for confirmation (${txid})`);
    }

    const data: any = await getTxStatus(txid);
    if (!data) {
      await sleep(pollMs);
      continue;
    }
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
  const onlyAddress = args.get('--only-address') || process.env.ONLY_ADDRESS || null;
  const onlyIndexRaw = args.get('--only-index') || process.env.ONLY_INDEX || null;
  const onlyIndex = onlyIndexRaw ? Number(onlyIndexRaw) : null; // 1-based
  const txFeeUstx = Number(args.get('--fee-ustx') || process.env.TX_FEE_USTX || 1000); // 0.001 STX
  const tier = Number(args.get('--tier') || process.env.SUBSCRIPTION_TIER || 0);
  const confirmTimeoutMs = Number(args.get('--confirm-timeout-ms') || process.env.CONFIRM_TIMEOUT_MS || 20 * 60 * 1000);

  const badgeMinterMnemonic = args.get('--badge-minter-mnemonic') || process.env.BADGE_MINTER_MNEMONIC;

  const data = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
  let wallets = data.wallets.slice(0, walletCount);
  if (onlyAddress) {
    wallets = wallets.filter((w: any) => w.address === onlyAddress);
  } else if (onlyIndex != null && Number.isFinite(onlyIndex) && onlyIndex > 0) {
    const picked = wallets[onlyIndex - 1];
    wallets = picked ? [picked] : [];
  }

  console.log(`Starting interactions for ${wallets.length} wallets on -v-j3 contracts...`);
  console.log(`- Fee: ${txFeeUstx} uSTX (0.001 STX) per tx`);
  console.log(`- Tier: ${tier}`);
  console.log(`- Wallets: ${walletsPath}`);
  if (onlyAddress) console.log(`- Only address: ${onlyAddress}`);
  if (onlyIndex != null && Number.isFinite(onlyIndex) && onlyIndex > 0) console.log(`- Only index: ${onlyIndex}`);
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
      const balanceUstx = await getBalanceUstx(w.address);

      const txCount = 3; // register + create-alert + collect-fee
      const requiredUstx = txFeeUstx * txCount + getTierCostUstx(tier);
      console.log(`   Balance: ${balanceUstx} uSTX (${formatStx(balanceUstx)})`);
      console.log(`   Required (est.): ${requiredUstx} uSTX (${formatStx(requiredUstx)})`);

      if (balanceUstx < requiredUstx) {
        console.log(`   ${FAIL} Insufficient STX to run interactions at tier ${tier}.`);
        console.log(`   ${ansi.dim('Fund this wallet (or run with --tier 0 / lower --fee-ustx). Skipping.')}`);
        continue;
      }

      // 1) stackpulse-v-j3: register-and-subscribe (or update/upgrade if already registered)
      const alreadyRegistered = await isStackpulseRegistered(w.address);
      const currentTier = alreadyRegistered ? await getStackpulseTier(w.address) : null;
      let effectiveTier = tier;

      if (alreadyRegistered) {
        effectiveTier = typeof currentTier === 'number' ? currentTier : tier;
        if (typeof currentTier === 'number' && tier > currentTier) {
          console.log(`   -> 1: Upgrading StackPulse subscription (current tier ${currentTier} → ${tier})...`);
          const upgradeTx = await makeContractCall({
            contractAddress: DEPLOYER_ADDRESS,
            contractName: 'stackpulse-v-j3',
            functionName: 'upgrade-subscription',
            functionArgs: [uintCV(tier)],
            senderKey: privateKey,
            network,
            nonce: nonce++,
            fee: txFeeUstx,
            anchorMode: AnchorMode.Any,
          });
          await broadcastAndConfirm(upgradeTx, 'upgrade-subscription', confirmTimeoutMs);
          effectiveTier = tier;
        } else {
          console.log(`   -> 1: Already registered (err u101). Updating profile instead...`);
          const updateTx = await makeContractCall({
            contractAddress: DEPLOYER_ADDRESS,
            contractName: 'stackpulse-v-j3',
            functionName: 'update-profile',
            functionArgs: [
              stringAsciiCV(`testuser${i}`),
              stringAsciiCV(`test${i}@stackpulse.app`),
              uintCV(31),
            ],
            senderKey: privateKey,
            network,
            nonce: nonce++,
            fee: txFeeUstx,
            anchorMode: AnchorMode.Any,
          });
          await broadcastAndConfirm(updateTx, 'update-profile', confirmTimeoutMs);
        }
      } else {
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
        effectiveTier = tier;
      }

      // 2) alert-manager-v-j3: create-alert (basic whale alert)
      const currentAlertCount = await getUserAlertCount(w.address);
      const maxAlertsAllowed = await getMaxAlertsForTier(effectiveTier, w.address);
      if (currentAlertCount >= maxAlertsAllowed) {
        console.log(
          `   -> 2: Skipping create-alert (alert limit reached: ${currentAlertCount}/${maxAlertsAllowed}).`
        );
      } else {
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
            uintCV(effectiveTier),
          ],
          senderKey: privateKey,
          network,
          nonce: nonce++,
          fee: txFeeUstx,
          anchorMode: AnchorMode.Any,
        });
        try {
          await broadcastAndConfirm(tx2, 'create-alert', confirmTimeoutMs);
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          if (!isMaxAlertsReachedError(message)) {
            throw e;
          }
          console.log(`      ${WARN} Max alerts reached for this wallet; skipping create-alert.`);
        }
      }

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
