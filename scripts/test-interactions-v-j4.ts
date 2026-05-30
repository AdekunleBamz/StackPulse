import {
  AnchorMode,
  PostConditionMode,
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
import * as fs from 'fs';

const network = 'mainnet' as const;
const DEPLOYER_ADDRESS = 'SP1THTSTZ8RQGD8R3GKPGK3ABQ908BD8X85P3J6X9';
const DEFAULT_WALLETS_PATH = './scripts/test-wallets.json';
const DEFAULT_STATE_PATH = './scripts/test-interactions-v-j4-state.json';

const hiroApiHosts = new Set(['api.hiro.so', 'api.mainnet.hiro.so', 'api.testnet.hiro.so']);

function getHiroApiOrigin() {
  return process.env.HIRO_API_ORIGIN || 'https://api.mainnet.hiro.so';
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value || !value.trim()) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getRetryAfterMs(res: Response, fallbackMs: number) {
  const header = res.headers.get('retry-after')?.trim();
  if (!header) return fallbackMs;

  if (/^\d+$/.test(header)) {
    return Math.max(Number.parseInt(header, 10) * 1000, fallbackMs);
  }

  const dateMs = Date.parse(header);
  if (Number.isFinite(dateMs)) {
    return Math.max(dateMs - Date.now(), fallbackMs);
  }

  return fallbackMs;
}

function isHiroApiRequest(input: RequestInfo | URL) {
  try {
    const urlString =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input instanceof Request
            ? input.url
            : '';
    if (!urlString) return false;
    const parsed = new URL(urlString);
    return hiroApiHosts.has(parsed.hostname);
  } catch {
    return false;
  }
}

loadEnvFromFile('.env');
loadEnvFromFile('.env.local');

if (typeof fetch === 'function') {
  const originalFetch = fetch.bind(globalThis);
  const requestsPerWindow = parsePositiveInt(process.env.HIRO_REQUESTS_PER_MINUTE, 45);
  const rateWindowMs = parsePositiveInt(process.env.HIRO_RATE_WINDOW_MS, 60_000);
  const requestSpacingMs = Math.max(
    parsePositiveInt(process.env.HIRO_REQUEST_MIN_INTERVAL_MS, 0),
    Math.ceil(rateWindowMs / requestsPerWindow)
  );
  let windowStartedAt = Date.now();
  let windowRequestCount = 0;
  let nextRequestAt = 0;

  const waitForHiroSlot = async () => {
    const now = Date.now();
    if (now - windowStartedAt >= rateWindowMs) {
      windowStartedAt = now;
      windowRequestCount = 0;
    }

    if (windowRequestCount >= requestsPerWindow) {
      const waitMs = Math.max(0, rateWindowMs - (now - windowStartedAt));
      if (waitMs > 0) {
        console.log(`      ${WARN} Hiro request window full. Waiting ${Math.ceil(waitMs / 1000)}s...`);
        await sleep(waitMs);
      }
      windowStartedAt = Date.now();
      windowRequestCount = 0;
    }

    const slotWaitMs = Math.max(0, nextRequestAt - Date.now());
    if (slotWaitMs > 0) {
      await sleep(slotWaitMs);
    }

    windowRequestCount++;
    nextRequestAt = Date.now() + requestSpacingMs;
  };

  (globalThis as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!isHiroApiRequest(input)) {
      return originalFetch(input, init);
    }

    await waitForHiroSlot();

    const apiKey = process.env.HIRO_API_KEY?.trim();
    if (!apiKey) {
      return originalFetch(input, init);
    }

    const headers = new Headers(init?.headers);
    if (!headers.has('x-api-key')) {
      headers.set('x-api-key', apiKey);
    }

    return originalFetch(input, { ...init, headers });
  };
}

type ContractKey = 'stackpulse' | 'alertManager' | 'feeVault' | 'badges';

type TxCounters = {
  success: number;
  failed: number;
  skipped: number;
};

type InteractionStats = Record<ContractKey, TxCounters>;

type WalletEntry = {
  address: string;
  mnemonic: string;
};

type WalletState = {
  effectiveTier?: number;
  alertId?: number;
  badgeType?: number;
  badgeTokenId?: number;
  badgeOwner?: string;
};

type ScriptState = {
  wallets: Record<string, WalletState>;
};

type WalletRuntime = {
  index: number;
  address: string;
  privateKey: string;
  nonce: number;
  balanceUstx: number;
  effectiveTier: number;
  alertId: number | null;
  badgeType: number | null;
  badgeTokenId: number | null;
  badgeOwner: string | null;
};

type WalletQuotas = {
  stackpulse: number[];
  alertManager: number[];
  feeVault: number[];
  badges: number[];
};

function loadEnvFromFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator <= 0) continue;

    const key = line.slice(0, separator).trim();
    if (!key) continue;
    const shouldOverride = key === 'HIRO_API_KEY' || key === 'HIRO_API_ORIGIN';
    if (process.env[key] !== undefined && !shouldOverride) continue;

    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

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

async function fetchJsonWithRetry(url: string, label: string, maxAttempts = 20) {
  let attempt = 1;

  while (attempt <= maxAttempts) {
    let res: Response;
    try {
      res = await fetch(url);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const canRetry = isNetworkFetchError(message);
      if (!canRetry || attempt === maxAttempts) {
        throw e;
      }
      const waitMs = Math.min(3000 * attempt, 20000);
      console.log(`      ${WARN} ${label} network issue. Retrying in ${Math.ceil(waitMs / 1000)}s...`);
      await sleep(waitMs);
      attempt++;
      continue;
    }

    if (res.ok) {
      return res.json();
    }

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === maxAttempts) {
      if (res.status === 429) {
        throw new Error(`${label} failed: Hiro rate-limited this run after ${maxAttempts} attempts (429). Wait a few minutes, lower HIRO_REQUESTS_PER_MINUTE, or use a fresh API key.`);
      }
      throw new Error(`${label} failed: ${res.status}`);
    }

    const waitMs =
      res.status === 429
        ? Math.min(getRetryAfterMs(res, 60_000), 120_000)
        : Math.min(3000 * attempt, 20_000);
    const reason = res.status === 429 ? 'rate-limited' : `returned ${res.status}`;
    console.log(`      ${WARN} ${label} ${reason}. Retrying in ${Math.ceil(waitMs / 1000)}s...`);
    await sleep(waitMs);
    attempt++;
  }

  throw new Error(`${label} failed: exhausted retries`);
}

function isReadOnlyRateLimitError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes('429') ||
    lower.includes('too many requests') ||
    lower.includes('rate limit exceeded') ||
    lower.includes('per-minute')
  );
}

function isNetworkFetchError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes('fetch failed') ||
    lower.includes('enotfound') ||
    lower.includes('eai_again') ||
    lower.includes('econnreset') ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('socket hang up') ||
    lower.includes('network error') ||
    lower.includes('failed to fetch')
  );
}

function isBroadcastRateLimitError(message: string) {
  const lower = message.toLowerCase();
  return (
    isReadOnlyRateLimitError(message) ||
    lower.includes('per-minute') ||
    lower.includes('rate limit') ||
    (lower.includes('unexpected token') && lower.includes('not valid json'))
  );
}

function isRetryableNetworkError(message: string) {
  return isReadOnlyRateLimitError(message) || isNetworkFetchError(message);
}

function isRetryableBroadcastError(message: string) {
  return isBroadcastRateLimitError(message) || isNetworkFetchError(message);
}

function isPendingTxTimeoutError(message: string) {
  return message.includes('Pending timeout waiting for confirmation');
}

function getReadOnlyRetryDelayMs(message: string, attempt: number) {
  const match = /try again in\s+(\d+)\s+seconds/i.exec(message);
  if (match) {
    return (Number(match[1]) + 1) * 1000;
  }
  return Math.min(2000 * attempt, 20_000);
}

function getBroadcastRetryDelayMs(message: string, attempt: number) {
  const match = /try again in\s+(\d+)\s+seconds/i.exec(message);
  if (match) {
    return (Number(match[1]) + 1) * 1000;
  }
  if (message.toLowerCase().includes('per-minute') || message.toLowerCase().includes('rate limit')) {
    return Math.min(15_000 * attempt, 60_000);
  }
  return Math.min(3000 * attempt, 20_000);
}

function isTooMuchChainingError(message: string) {
  const lower = message.toLowerCase();
  return lower.includes('toomuchchaining') || lower.includes('nonce would exceed chaining limit in mempool');
}

function getTooMuchChainingExpectedNonce(message: string) {
  const jsonMatch = /"expected"\s*:\s*(\d+)/i.exec(message);
  if (jsonMatch) {
    return Number(jsonMatch[1]);
  }
  const textMatch = /expected\s*[:=]\s*(\d+)/i.exec(message);
  if (textMatch) {
    return Number(textMatch[1]);
  }
  return null;
}

async function resolveNonceAfterChainingLimit(address: string, message: string, fallbackNonce: number) {
  const expectedNonce = getTooMuchChainingExpectedNonce(message);
  if (expectedNonce != null && Number.isFinite(expectedNonce)) {
    return expectedNonce;
  }
  try {
    return await getNextNonce(address);
  } catch {
    return fallbackNonce;
  }
}

async function callReadOnlyWithRetry(options: any, label: string, maxAttempts = 8) {
  let attempt = 1;

  while (attempt <= maxAttempts) {
    try {
      return await callReadOnlyFunction(options);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const canRetry = isRetryableNetworkError(message);
      if (!canRetry || attempt === maxAttempts) {
        throw e;
      }

      const waitMs = getReadOnlyRetryDelayMs(message, attempt);
      const reason = isReadOnlyRateLimitError(message) ? 'rate-limited' : 'network issue';
      console.log(`      ${WARN} ${label} ${reason}. Retrying in ${Math.ceil(waitMs / 1000)}s...`);
      await sleep(waitMs);
      attempt++;
    }
  }

  throw new Error(`${label} failed after retries`);
}

function isMaxAlertsReachedError(message: string) {
  return message.includes('(err u103)') || message.includes('ERR-MAX-ALERTS-REACHED');
}

function parseUintLike(value: unknown, label: string) {
  if (value && typeof value === 'object' && 'value' in value) {
    return parseUintLike((value as any).value, label);
  }

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

function parseOptionalUintLike(value: unknown, label: string) {
  if (value == null) return null;
  return parseUintLike(value, label);
}

function parsePrincipalLike(value: unknown, label: string) {
  if (value && typeof value === 'object' && 'value' in value) {
    return parsePrincipalLike((value as any).value, label);
  }

  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  throw new Error(`${label} missing in response`);
}

function parseOptionalPrincipalLike(value: unknown, label: string) {
  if (value == null) return null;
  return parsePrincipalLike(value, label);
}

function parseOkUintFromRepr(repr: string | undefined) {
  if (!repr) return null;
  const match = /\(ok u(\d+)\)/.exec(repr);
  if (!match) return null;
  return Number(match[1]);
}

function buildWalletQuotas(target: number, walletCount: number) {
  if (walletCount <= 0) return [];
  const base = Math.floor(target / walletCount);
  const remainder = target % walletCount;

  return Array.from({ length: walletCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

function redistributeQuotaAwayFromIndex(quotas: number[], excludedIndex: number) {
  if (excludedIndex < 0 || excludedIndex >= quotas.length) {
    return 0;
  }

  const moved = quotas[excludedIndex] ?? 0;
  if (moved <= 0) {
    return 0;
  }

  const recipientIndexes: number[] = [];
  for (let i = 0; i < quotas.length; i++) {
    if (i !== excludedIndex) {
      recipientIndexes.push(i);
    }
  }

  quotas[excludedIndex] = 0;
  if (recipientIndexes.length === 0) {
    return moved;
  }

  for (let i = 0; i < moved; i++) {
    const targetIndex = recipientIndexes[i % recipientIndexes.length];
    quotas[targetIndex] += 1;
  }

  return moved;
}

function createStats(): InteractionStats {
  return {
    stackpulse: { success: 0, failed: 0, skipped: 0 },
    alertManager: { success: 0, failed: 0, skipped: 0 },
    feeVault: { success: 0, failed: 0, skipped: 0 },
    badges: { success: 0, failed: 0, skipped: 0 },
  };
}

function readState(statePath: string): ScriptState {
  if (!fs.existsSync(statePath)) {
    return { wallets: {} };
  }

  try {
    const raw = fs.readFileSync(statePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { wallets: {} };
    const wallets = (parsed as ScriptState).wallets;
    if (!wallets || typeof wallets !== 'object') return { wallets: {} };
    return { wallets };
  } catch {
    return { wallets: {} };
  }
}

function writeState(statePath: string, state: ScriptState) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function getWalletState(state: ScriptState, address: string) {
  if (!state.wallets[address]) {
    state.wallets[address] = {};
  }
  return state.wallets[address];
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
    `${getHiroApiOrigin()}/extended/v1/address/${address}/nonces`,
    'Nonce fetch'
  );
  const nonce = data?.possible_next_nonce;
  if (typeof nonce !== 'number') throw new Error('Nonce missing in response');
  return nonce;
}

async function getBalanceUstx(address: string) {
  const data: any = await fetchJsonWithRetry(
    `${getHiroApiOrigin()}/extended/v1/address/${address}/balances`,
    'Balance fetch'
  );
  const balance = Number(data?.stx?.balance ?? NaN);
  if (!Number.isFinite(balance)) throw new Error('Balance missing in response');
  return balance;
}

function getStackpulseTierPriceUstx(tier: number) {
  const stackpulse: Record<number, number> = { 0: 0, 1: 10_000, 2: 50_000, 3: 200_000 };
  return stackpulse[tier] ?? 0;
}

function getFeeVaultTierPriceUstx(tier: number) {
  const feeVault: Record<number, number> = { 0: 0, 1: 10_000, 2: 50_000, 3: 200_000 };
  return feeVault[tier] ?? 0;
}

function formatStx(ustx: number) {
  return `${(ustx / 1_000_000).toFixed(6)} STX`;
}

async function isStackpulseRegistered(address: string) {
  const ro: any = await callReadOnlyWithRetry(
    {
      contractAddress: DEPLOYER_ADDRESS,
      contractName: 'stackpulse-v-j4',
      functionName: 'is-registered',
      functionArgs: [principalCV(address)],
      network,
      senderAddress: address,
    },
    'stackpulse-v-j4::is-registered'
  );
  return Boolean(cvToValue(ro));
}

async function getStackpulseTier(address: string) {
  const ro: any = await callReadOnlyWithRetry(
    {
      contractAddress: DEPLOYER_ADDRESS,
      contractName: 'stackpulse-v-j4',
      functionName: 'get-user',
      functionArgs: [principalCV(address)],
      network,
      senderAddress: address,
    },
    'stackpulse-v-j4::get-user'
  );
  const user = cvToValue(ro) as any;
  const tierValue = user?.value?.tier?.value;
  const tier = typeof tierValue === 'string' ? Number(tierValue) : NaN;
  return Number.isFinite(tier) ? tier : null;
}

async function getUserAlertCount(address: string) {
  const ro: any = await callReadOnlyWithRetry(
    {
      contractAddress: DEPLOYER_ADDRESS,
      contractName: 'alert-manager-v-j4',
      functionName: 'get-user-alert-count',
      functionArgs: [principalCV(address)],
      network,
      senderAddress: address,
    },
    'alert-manager-v-j4::get-user-alert-count'
  );

  return parseUintLike(cvToValue(ro), 'Alert count');
}

async function getMaxAlertsForTier(tier: number, senderAddress: string) {
  const ro: any = await callReadOnlyWithRetry(
    {
      contractAddress: DEPLOYER_ADDRESS,
      contractName: 'alert-manager-v-j4',
      functionName: 'get-max-alerts-for-tier',
      functionArgs: [uintCV(tier)],
      network,
      senderAddress,
    },
    'alert-manager-v-j4::get-max-alerts-for-tier'
  );

  return parseUintLike(cvToValue(ro), 'Max alerts');
}

async function getAlertManagerNextId(senderAddress: string) {
  const ro: any = await callReadOnlyWithRetry(
    {
      contractAddress: DEPLOYER_ADDRESS,
      contractName: 'alert-manager-v-j4',
      functionName: 'get-stats',
      functionArgs: [],
      network,
      senderAddress,
    },
    'alert-manager-v-j4::get-stats'
  );

  const stats = cvToValue(ro) as any;
  return parseUintLike(stats?.['next-id'], 'next-id');
}

async function getAlertById(alertId: number, senderAddress: string) {
  const ro: any = await callReadOnlyWithRetry(
    {
      contractAddress: DEPLOYER_ADDRESS,
      contractName: 'alert-manager-v-j4',
      functionName: 'get-alert',
      functionArgs: [uintCV(alertId)],
      network,
      senderAddress,
    },
    `alert-manager-v-j4::get-alert(${alertId})`
  );

  return cvToValue(ro) as any;
}

async function buildFirstAlertIdByOwner(ownerAddresses: string[], senderAddress: string) {
  const ownerSet = new Set(ownerAddresses);
  const result: Record<string, number> = {};

  if (ownerSet.size === 0) {
    return result;
  }

  const nextId = await getAlertManagerNextId(senderAddress);
  const scanWindow = 3000;
  const minAlertId = Math.max(1, nextId - scanWindow);
  for (let alertId = nextId - 1; alertId >= minAlertId; alertId--) {
    if (Object.keys(result).length >= ownerSet.size) {
      break;
    }

    const alert = await getAlertById(alertId, senderAddress);
    if (!alert) continue;

    const owner = parseOptionalPrincipalLike(alert?.value?.owner, `alert owner ${alertId}`);
    if (!owner) continue;
    if (!ownerSet.has(owner)) continue;
    if (result[owner] != null) continue;
    result[owner] = alertId;

    if (alertId % 15 === 0) {
      await sleep(200);
    }
  }

  return result;
}

async function getUserBadgeToken(recipient: string, badgeType: number) {
  const ro: any = await callReadOnlyWithRetry(
    {
      contractAddress: DEPLOYER_ADDRESS,
      contractName: 'reputation-badges-v-j4',
      functionName: 'get-user-badge-token',
      functionArgs: [principalCV(recipient), uintCV(badgeType)],
      network,
      senderAddress: recipient,
    },
    `reputation-badges-v-j4::get-user-badge-token(${badgeType})`
  );

  return parseOptionalUintLike(cvToValue(ro), 'User badge token');
}

async function getBadgeOwner(tokenId: number, senderAddress: string) {
  const ro: any = await callReadOnlyWithRetry(
    {
      contractAddress: DEPLOYER_ADDRESS,
      contractName: 'reputation-badges-v-j4',
      functionName: 'get-owner',
      functionArgs: [uintCV(tokenId)],
      network,
      senderAddress,
    },
    `reputation-badges-v-j4::get-owner(${tokenId})`
  );

  return parseOptionalPrincipalLike(cvToValue(ro), `Badge owner ${tokenId}`);
}

async function findExistingBadgeToken(recipient: string) {
  for (let badgeType = 1; badgeType <= 9; badgeType++) {
    const tokenId = await getUserBadgeToken(recipient, badgeType);
    if (tokenId != null) {
      return { badgeType, tokenId };
    }
  }
  return null;
}

type ConfirmedTxResult = {
  txid: string;
  txResultRepr: string | undefined;
};

async function broadcastTransactionWithRetry(tx: any, label: string, maxAttempts = 6) {
  let attempt = 1;

  while (attempt <= maxAttempts) {
    try {
      return await broadcastTransaction(tx, network);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const canRetry = isRetryableBroadcastError(message);
      if (!canRetry || attempt === maxAttempts) {
        throw e;
      }

      const waitMs = getBroadcastRetryDelayMs(message, attempt);
      const reason = isBroadcastRateLimitError(message) ? 'rate-limited' : 'network issue';
      console.log(`      ${WARN} ${label} broadcast ${reason}. Retrying in ${Math.ceil(waitMs / 1000)}s...`);
      await sleep(waitMs);
      attempt++;
    }
  }

  throw new Error(`Broadcast retry exhausted for ${label}`);
}

async function broadcastAndConfirm(
  tx: any,
  label: string,
  timeoutMs: number,
  pendingTimeoutMs: number
): Promise<ConfirmedTxResult> {
  const result: any = await broadcastTransactionWithRetry(tx, label);

  if (typeof result === 'string') {
    const txData = await waitForTx(result, label, timeoutMs, pendingTimeoutMs);
    return { txid: result, txResultRepr: txData?.tx_result?.repr };
  }

  if (result?.error) {
    const reason = result?.reason ? ` (${result.reason})` : '';
    const details = result?.reason_data ? ` ${JSON.stringify(result.reason_data)}` : '';
    throw new Error(`Broadcast failed: ${result.error}${reason}${details}`);
  }

  const txid = result?.txid;
  if (!txid) throw new Error('Broadcast did not return txid');
  const txData = await waitForTx(txid, label, timeoutMs, pendingTimeoutMs);
  return { txid, txResultRepr: txData?.tx_result?.repr };
}

async function getTxStatus(txid: string, maxAttempts = 4) {
  let attempt = 1;

  while (attempt <= maxAttempts) {
    let res: Response;
    try {
      res = await fetch(`${getHiroApiOrigin()}/extended/v1/tx/${txid}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const canRetry = isNetworkFetchError(message);
      if (!canRetry || attempt === maxAttempts) {
        return null;
      }
      await sleep(Math.min(1500 * attempt, 6000));
      attempt++;
      continue;
    }

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

    await sleep(res.status === 429 ? Math.min(getRetryAfterMs(res, 60_000), 120_000) : Math.min(1500 * attempt, 6000));
    attempt++;
  }

  return null;
}

async function waitForTx(txid: string, label: string, timeoutMs: number, pendingTimeoutMs: number) {
  const started = Date.now();
  const pollMs = 5_000;
  let pendingSince: number | null = null;

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
      return data;
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

    if (status === 'pending' || status === 'queued') {
      if (pendingSince == null) {
        pendingSince = Date.now();
      } else if (Date.now() - pendingSince > pendingTimeoutMs) {
        throw new Error(
          `Pending timeout waiting for confirmation (${txid}) after ${Math.ceil(pendingTimeoutMs / 1000)}s`
        );
      }
    } else {
      pendingSince = null;
    }

    process.stdout.write(`      ${ansi.dim('…')} Waiting: ${label} (${status || 'pending'})\r`);
    await sleep(pollMs);
  }
}

async function findFirstUnmintedBadgeType(recipient: string) {
  for (let badgeType = 1; badgeType <= 9; badgeType++) {
    const ro: any = await callReadOnlyWithRetry(
      {
        contractAddress: DEPLOYER_ADDRESS,
        contractName: 'reputation-badges-v-j4',
        functionName: 'has-badge',
        functionArgs: [principalCV(recipient), uintCV(badgeType)],
        network,
        senderAddress: recipient,
      },
      `reputation-badges-v-j4::has-badge(${badgeType})`
    );

    const isOwned = Boolean(cvToValue(ro));
    if (!isOwned) return badgeType;
  }
  return null;
}

async function isAuthorizedBadgeMinter(address: string) {
  if (address === DEPLOYER_ADDRESS) {
    return true;
  }

  const ro: any = await callReadOnlyWithRetry(
    {
      contractAddress: DEPLOYER_ADDRESS,
      contractName: 'reputation-badges-v-j4',
      functionName: 'is-authorized-minter',
      functionArgs: [principalCV(address)],
      network,
      senderAddress: address,
    },
    'reputation-badges-v-j4::is-authorized-minter'
  );

  return Boolean(cvToValue(ro));
}

async function run() {
  const args = parseArgs(process.argv);
  const walletsPath = args.get('--wallets') || process.env.WALLETS_PATH || DEFAULT_WALLETS_PATH;
  const statePath = args.get('--state-path') || process.env.STATE_PATH || DEFAULT_STATE_PATH;
  const walletCount = Number(args.get('--count') || process.env.WALLET_COUNT || 25);
  const onlyAddress = args.get('--only-address') || process.env.ONLY_ADDRESS || null;
  const onlyIndexRaw = args.get('--only-index') || process.env.ONLY_INDEX || null;
  const onlyIndex = onlyIndexRaw ? Number(onlyIndexRaw) : null; // 1-based
  const txFeeUstx = Number(args.get('--fee-ustx') || process.env.TX_FEE_USTX || 1000); // 0.001 STX
  const tier = Number(args.get('--tier') || process.env.SUBSCRIPTION_TIER || 0);
  const targetPerContract = Number(
    args.get('--target-per-contract') || process.env.TARGET_PER_CONTRACT || 500
  );
  const confirmTimeoutMs = Number(args.get('--confirm-timeout-ms') || process.env.CONFIRM_TIMEOUT_MS || 20 * 60 * 1000);
  const pendingTimeoutMs = Number(args.get('--pending-timeout-ms') || process.env.PENDING_TIMEOUT_MS || 600_000);

  const badgeMinterMnemonic = args.get('--badge-minter-mnemonic') || process.env.BADGE_MINTER_MNEMONIC;
  let includeBadges = Boolean(badgeMinterMnemonic);

  if (!Number.isFinite(targetPerContract) || targetPerContract < 1) {
    throw new Error('target-per-contract must be a positive number');
  }
  if (!Number.isFinite(pendingTimeoutMs) || pendingTimeoutMs < 1_000) {
    throw new Error('pending-timeout-ms must be at least 1000');
  }

  const data = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
  let wallets: WalletEntry[] = data.wallets.slice(0, walletCount);
  if (onlyAddress) {
    wallets = wallets.filter((w) => w.address === onlyAddress);
  } else if (onlyIndex != null && Number.isFinite(onlyIndex) && onlyIndex > 0) {
    const picked = wallets[onlyIndex - 1];
    wallets = picked ? [picked] : [];
  }

  if (wallets.length === 0) {
    throw new Error('No wallets selected. Check --count/--only-address/--only-index inputs.');
  }

  let badgeMinterKey: string | null = null;
  let badgeMinterAddress: string | null = null;
  let badgeMinterNonce: number | null = null;
  if (badgeMinterMnemonic) {
    try {
      badgeMinterKey = await generateAccountKey(badgeMinterMnemonic);
      badgeMinterAddress = getAddressFromPrivateKey(badgeMinterKey, TransactionVersion.Mainnet);
      const authorized = await isAuthorizedBadgeMinter(badgeMinterAddress);
      if (!authorized) {
        console.log(
          `${WARN} BADGE_MINTER_MNEMONIC (${badgeMinterAddress}) is not authorized in reputation-badges-v-j4. Badge interactions will be skipped.`
        );
        includeBadges = false;
      } else {
        badgeMinterNonce = await getNextNonce(badgeMinterAddress);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.log(`${WARN} Badge minter setup failed (${message}). Badge interactions will be skipped.`);
      includeBadges = false;
      badgeMinterKey = null;
      badgeMinterAddress = null;
      badgeMinterNonce = null;
    }
  }

  const quotas: WalletQuotas = {
    stackpulse: buildWalletQuotas(targetPerContract, wallets.length),
    alertManager: buildWalletQuotas(targetPerContract, wallets.length),
    feeVault: buildWalletQuotas(targetPerContract, wallets.length),
    badges: includeBadges ? buildWalletQuotas(targetPerContract, wallets.length) : wallets.map(() => 0),
  };

  if (includeBadges && badgeMinterAddress) {
    const minterIndex = wallets.findIndex((wallet) => wallet.address === badgeMinterAddress);
    if (minterIndex >= 0) {
      const moved = redistributeQuotaAwayFromIndex(quotas.badges, minterIndex);
      if (moved > 0 && wallets.length > 1) {
        console.log(
          `${WARN} Badge minter wallet is part of test wallets (index ${minterIndex + 1}). Reassigned ${moved} badge tx to other wallets to avoid self-transfer (err u2).`
        );
      } else if (moved > 0) {
        console.log(
          `${WARN} Only minter wallet selected; badge transfers cannot run because sender and recipient would be the same principal.`
        );
      }
    }
  }

  const stackpulsePrice = getStackpulseTierPriceUstx(tier);
  const feeVaultPrice = getFeeVaultTierPriceUstx(tier);
  const stackpulseParticipants = quotas.stackpulse.filter((quota) => quota > 0).length;
  const requiredForTarget = {
    stackpulse: targetPerContract * txFeeUstx + stackpulseParticipants * stackpulsePrice,
    alertManager: targetPerContract * txFeeUstx,
    feeVault: targetPerContract * (txFeeUstx + feeVaultPrice),
    badges: includeBadges ? targetPerContract * txFeeUstx : 0,
  };
  const totalRequiredForTarget =
    requiredForTarget.stackpulse +
    requiredForTarget.alertManager +
    requiredForTarget.feeVault +
    requiredForTarget.badges;

  console.log(`Starting interactions for ${wallets.length} wallets on -v-j4 contracts...`);
  console.log(`- Fee: ${txFeeUstx} uSTX (${formatStx(txFeeUstx)}) per tx`);
  console.log(`- Tier: ${tier}`);
  console.log(`- Wallets: ${walletsPath}`);
  console.log(`- State: ${statePath}`);
  if (process.env.HIRO_API_ORIGIN) {
    console.log(`- Hiro API: ${getHiroApiOrigin()}`);
  }
  if (process.env.HIRO_API_KEY?.trim()) {
    console.log(`- Hiro API key: enabled`);
  }
  const hiroRequestsPerMinute = parsePositiveInt(process.env.HIRO_REQUESTS_PER_MINUTE, 45);
  console.log(
    `- Hiro pacing: ${hiroRequestsPerMinute} requests/min ` +
    `(min ${Math.ceil(parsePositiveInt(process.env.HIRO_RATE_WINDOW_MS, 60_000) / hiroRequestsPerMinute)}ms between requests)`
  );
  console.log(`- Target per contract: ${targetPerContract}`);
  console.log(`- Pending timeout: ${Math.ceil(pendingTimeoutMs / 1000)}s`);
  if (onlyAddress) console.log(`- Only address: ${onlyAddress}`);
  if (onlyIndex != null && Number.isFinite(onlyIndex) && onlyIndex > 0) console.log(`- Only index: ${onlyIndex}`);
  if (!badgeMinterMnemonic) {
    console.log(
      `${WARN} reputation-badges mint will be skipped (set BADGE_MINTER_MNEMONIC to an authorized minter/owner mnemonic).`
    );
  }
  if (badgeMinterAddress && includeBadges) {
    console.log(`- Badge minter: ${badgeMinterAddress}`);
  }

  console.log('\nEstimated STX needed for target interactions:');
  console.log(
    `- stackpulse-v-j4 (${targetPerContract} tx): ${requiredForTarget.stackpulse} uSTX (${formatStx(requiredForTarget.stackpulse)})`
  );
  console.log(
    `- alert-manager-v-j4 (${targetPerContract} tx): ${requiredForTarget.alertManager} uSTX (${formatStx(requiredForTarget.alertManager)})`
  );
  console.log(
    `- fee-vault-v-j4 (${targetPerContract} tx): ${requiredForTarget.feeVault} uSTX (${formatStx(requiredForTarget.feeVault)})`
  );
  console.log(
    `- reputation-badges-v-j4 (${targetPerContract} tx): ${requiredForTarget.badges} uSTX (${formatStx(requiredForTarget.badges)})${includeBadges ? '' : ' (disabled)'}`
  );
  console.log(
    `- Total required: ${totalRequiredForTarget} uSTX (${formatStx(totalRequiredForTarget)})\n`
  );

  const stats = createStats();
  const state = readState(statePath);

  const runtimes: WalletRuntime[] = [];
  const missingAlertOwners: string[] = [];
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    const walletState = getWalletState(state, wallet.address);
    let privateKey: string;
    let nonce: number;
    let balanceUstx: number;

    try {
      privateKey = await generateAccountKey(wallet.mnemonic);
      nonce = await getNextNonce(wallet.address);
      balanceUstx = await getBalanceUstx(wallet.address);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const skippedStackpulse = quotas.stackpulse[i] ?? 0;
      const skippedAlertManager = quotas.alertManager[i] ?? 0;
      const skippedFeeVault = quotas.feeVault[i] ?? 0;
      const skippedBadges = quotas.badges[i] ?? 0;
      stats.stackpulse.skipped += skippedStackpulse;
      stats.alertManager.skipped += skippedAlertManager;
      stats.feeVault.skipped += skippedFeeVault;
      stats.badges.skipped += skippedBadges;
      console.log(
        `${WARN} Skipping wallet ${i + 1}/${wallets.length} (${wallet.address}): setup failed (${message}). ` +
        `Skipped quotas: stackpulse=${skippedStackpulse}, alert-manager=${skippedAlertManager}, fee-vault=${skippedFeeVault}, badges=${skippedBadges}.`
      );
      continue;
    }

    const runtime: WalletRuntime = {
      index: i,
      address: wallet.address,
      privateKey,
      nonce,
      balanceUstx,
      effectiveTier:
        typeof walletState.effectiveTier === 'number' && Number.isFinite(walletState.effectiveTier)
          ? walletState.effectiveTier
          : tier,
      alertId:
        typeof walletState.alertId === 'number' && Number.isFinite(walletState.alertId)
          ? walletState.alertId
          : null,
      badgeType:
        typeof walletState.badgeType === 'number' && Number.isFinite(walletState.badgeType)
          ? walletState.badgeType
          : null,
      badgeTokenId:
        typeof walletState.badgeTokenId === 'number' && Number.isFinite(walletState.badgeTokenId)
          ? walletState.badgeTokenId
          : null,
      badgeOwner: typeof walletState.badgeOwner === 'string' ? walletState.badgeOwner : null,
    };

    if (quotas.alertManager[i] > 0 && runtime.alertId == null) {
      missingAlertOwners.push(wallet.address);
    }

    runtimes.push(runtime);
  }

  if (runtimes.length === 0) {
    console.log(`${WARN} No wallets could be initialized. Nothing to broadcast this run.`);
    includeBadges = false;
  }

  if (missingAlertOwners.length > 0) {
    console.log(`Scanning existing alerts to recover IDs for ${missingAlertOwners.length} wallet(s)...`);
    const recovered = await buildFirstAlertIdByOwner(missingAlertOwners, wallets[0].address);
    for (const runtime of runtimes) {
      if (runtime.alertId != null) continue;
      const recoveredId = recovered[runtime.address];
      if (recoveredId == null) continue;
      runtime.alertId = recoveredId;
      getWalletState(state, runtime.address).alertId = recoveredId;
    }
  }

  let networkOutageDetected = false;

  for (const runtime of runtimes) {
    if (networkOutageDetected) {
      const qStackpulse = quotas.stackpulse[runtime.index];
      const qAlertManager = quotas.alertManager[runtime.index];
      const qFeeVault = quotas.feeVault[runtime.index];
      const qBadges = quotas.badges[runtime.index];
      stats.stackpulse.skipped += qStackpulse;
      stats.alertManager.skipped += qAlertManager;
      stats.feeVault.skipped += qFeeVault;
      stats.badges.skipped += qBadges;
      continue;
    }

    const walletState = getWalletState(state, runtime.address);
    const qStackpulse = quotas.stackpulse[runtime.index];
    const qAlertManager = quotas.alertManager[runtime.index];
    const qFeeVault = quotas.feeVault[runtime.index];
    const qBadges = quotas.badges[runtime.index];

    const expectedWalletBadgeTransfers = includeBadges ? Math.floor(qBadges / 2) : 0;
    const requiredUstxEstimate =
      qStackpulse * txFeeUstx +
      (qStackpulse > 0 ? stackpulsePrice : 0) +
      qAlertManager * txFeeUstx +
      qFeeVault * (txFeeUstx + feeVaultPrice) +
      expectedWalletBadgeTransfers * txFeeUstx;

    console.log(`\n[${runtime.index + 1}/${runtimes.length}] Wallet: ${runtime.address}`);
    console.log(
      `   Plan -> stackpulse:${qStackpulse}, alert-manager:${qAlertManager}, fee-vault:${qFeeVault}, badges:${qBadges}`
    );
    console.log(`   Balance: ${runtime.balanceUstx} uSTX (${formatStx(runtime.balanceUstx)})`);
    console.log(`   Required (est.): ${requiredUstxEstimate} uSTX (${formatStx(requiredUstxEstimate)})`);

    if (runtime.balanceUstx < requiredUstxEstimate) {
      console.log(`   ${FAIL} Insufficient STX for planned interactions. Skipping this wallet.`);
      stats.stackpulse.skipped += qStackpulse;
      stats.alertManager.skipped += qAlertManager;
      stats.feeVault.skipped += qFeeVault;
      stats.badges.skipped += qBadges;
      continue;
    }

    let networkUnavailableForWallet = false;
    let pendingStalledForWallet = false;

    let isRegistered = false;
    try {
      isRegistered = await isStackpulseRegistered(runtime.address);
      const currentTier = isRegistered ? await getStackpulseTier(runtime.address) : null;
      if (typeof currentTier === 'number') {
        runtime.effectiveTier = currentTier;
        walletState.effectiveTier = currentTier;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.log(`      ${FAIL} stackpulse pre-check failed: ${message}`);
      stats.stackpulse.skipped += qStackpulse;
      stats.alertManager.skipped += qAlertManager;
      stats.feeVault.skipped += qFeeVault;
      stats.badges.skipped += qBadges;

      if (isNetworkFetchError(message) || isReadOnlyRateLimitError(message)) {
        networkUnavailableForWallet = true;
        networkOutageDetected = true;
        console.log(`      ${WARN} Network/read-only API issue detected during pre-check.`);
        writeState(statePath, state);
        break;
      }

      writeState(statePath, state);
      continue;
    }

    if (qStackpulse > 0) {
      console.log(`   -> stackpulse-v-j4 (${qStackpulse} planned tx)`);
    }
    for (let n = 0; n < qStackpulse; n++) {
      try {
        let functionName: 'register-and-subscribe' | 'upgrade-subscription' | 'update-profile';
        let functionArgs: any[];

        if (n === 0 && !isRegistered) {
          functionName = 'register-and-subscribe';
          functionArgs = [
            stringAsciiCV(`testuser${runtime.index}`),
            stringAsciiCV(`test${runtime.index}@stackpulse.app`),
            uintCV(tier),
            uintCV(31),
          ];
        } else if (n === 0 && runtime.effectiveTier < tier) {
          functionName = 'upgrade-subscription';
          functionArgs = [uintCV(tier)];
        } else {
          functionName = 'update-profile';
          functionArgs = [
            stringAsciiCV(`testuser${runtime.index}`),
            stringAsciiCV(`test${runtime.index}@stackpulse.app`),
            uintCV(31),
          ];
        }

        const tx = await makeContractCall({
          contractAddress: DEPLOYER_ADDRESS,
          contractName: 'stackpulse-v-j4',
          functionName,
          functionArgs,
          senderKey: runtime.privateKey,
          network,
          nonce: runtime.nonce++,
          fee: txFeeUstx,
          anchorMode: AnchorMode.Any,
        });
        await broadcastAndConfirm(tx, `stackpulse:${functionName}`, confirmTimeoutMs, pendingTimeoutMs);
        stats.stackpulse.success++;

        if (functionName === 'register-and-subscribe' || functionName === 'upgrade-subscription') {
          isRegistered = true;
          runtime.effectiveTier = tier;
          walletState.effectiveTier = tier;
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (isPendingTxTimeoutError(message)) {
          const skipped = qStackpulse - n;
          if (skipped > 0) {
            stats.stackpulse.skipped += skipped;
          }
          pendingStalledForWallet = true;
          console.log(
            `      ${WARN} stackpulse tx ${n + 1}/${qStackpulse} exceeded pending timeout (${Math.ceil(
              pendingTimeoutMs / 1000
            )}s). Skipping remaining wallet interactions.`
          );
          break;
        }

        stats.stackpulse.failed++;
        console.log(`      ${FAIL} stackpulse tx ${n + 1}/${qStackpulse} failed: ${message}`);

        if (isTooMuchChainingError(message)) {
          const skipped = qStackpulse - n - 1;
          if (skipped > 0) {
            stats.stackpulse.skipped += skipped;
          }
          runtime.nonce = await resolveNonceAfterChainingLimit(runtime.address, message, runtime.nonce);
          pendingStalledForWallet = true;
          console.log(
            `      ${WARN} Wallet nonce chain limit reached. Synced nonce to ${runtime.nonce} and skipping remaining wallet interactions.`
          );
          break;
        }

        if (isRetryableBroadcastError(message)) {
          const skipped = qStackpulse - n - 1;
          if (skipped > 0) {
            stats.stackpulse.skipped += skipped;
          }
          networkUnavailableForWallet = true;
          networkOutageDetected = true;
          console.log(`      ${WARN} Network/API throttling issue detected. Stopping wallet execution to avoid cascading failures.`);
          break;
        }

        if (n === 0 && !isRegistered) {
          const skipped = qStackpulse - n - 1;
          if (skipped > 0) {
            stats.stackpulse.skipped += skipped;
          }
          break;
        }
      }
    }

    if (pendingStalledForWallet) {
      stats.alertManager.skipped += qAlertManager;
      stats.feeVault.skipped += qFeeVault;
      stats.badges.skipped += qBadges;
      writeState(statePath, state);
      continue;
    }

    if (networkUnavailableForWallet) {
      stats.alertManager.skipped += qAlertManager;
      stats.feeVault.skipped += qFeeVault;
      stats.badges.skipped += qBadges;
      writeState(statePath, state);
      break;
    }

    if (qAlertManager > 0) {
      console.log(`   -> alert-manager-v-j4 (${qAlertManager} planned tx)`);
    }
    if (qAlertManager > 0 && !isRegistered) {
      console.log(`      ${WARN} Wallet is not registered. Skipping alert-manager interactions.`);
      stats.alertManager.skipped += qAlertManager;
    } else {
      try {
        let alertInteractionsDone = 0;

        if (qAlertManager > 0 && runtime.alertId == null) {
          const currentAlertCount = await getUserAlertCount(runtime.address);
          const maxAlertsAllowed = await getMaxAlertsForTier(runtime.effectiveTier, runtime.address);
          if (currentAlertCount >= maxAlertsAllowed) {
            console.log(
              `      ${WARN} Max alerts already reached (${currentAlertCount}/${maxAlertsAllowed}) and no alert-id available to toggle.`
            );
            stats.alertManager.skipped += qAlertManager;
            alertInteractionsDone = qAlertManager;
          } else {
            try {
              const createTx = await makeContractCall({
                contractAddress: DEPLOYER_ADDRESS,
                contractName: 'alert-manager-v-j4',
                functionName: 'create-alert',
                functionArgs: [uintCV(1), stringAsciiCV('Whale Alert'), noneCV(), uintCV(10_000)],
                senderKey: runtime.privateKey,
                network,
                nonce: runtime.nonce++,
                fee: txFeeUstx,
                anchorMode: AnchorMode.Any,
              });
              const result = await broadcastAndConfirm(
                createTx,
                'alert-manager:create-alert',
                confirmTimeoutMs,
                pendingTimeoutMs
              );
              const alertIdFromResult = parseOkUintFromRepr(result.txResultRepr);
              runtime.alertId = alertIdFromResult;
              if (runtime.alertId == null) {
                const recoveredAfterCreate = await buildFirstAlertIdByOwner([runtime.address], runtime.address);
                runtime.alertId = recoveredAfterCreate[runtime.address] ?? null;
              }
              if (runtime.alertId != null) {
                walletState.alertId = runtime.alertId;
              }
              stats.alertManager.success++;
              alertInteractionsDone++;
            } catch (e) {
              const message = e instanceof Error ? e.message : String(e);
              if (isPendingTxTimeoutError(message)) {
                const remaining = qAlertManager - alertInteractionsDone;
                if (remaining > 0) {
                  stats.alertManager.skipped += remaining;
                }
                pendingStalledForWallet = true;
                alertInteractionsDone = qAlertManager;
                console.log(
                  `      ${WARN} create-alert exceeded pending timeout (${Math.ceil(
                    pendingTimeoutMs / 1000
                  )}s). Skipping remaining wallet interactions.`
                );
              } else {
                stats.alertManager.failed++;
                alertInteractionsDone++;
                console.log(`      ${FAIL} create-alert failed: ${message}`);

                if (isTooMuchChainingError(message)) {
                  runtime.nonce = await resolveNonceAfterChainingLimit(runtime.address, message, runtime.nonce);
                  pendingStalledForWallet = true;
                  alertInteractionsDone = qAlertManager;
                  console.log(
                    `      ${WARN} Wallet nonce chain limit reached. Synced nonce to ${runtime.nonce} and skipping remaining wallet interactions.`
                  );
                }

                if (isRetryableBroadcastError(message)) {
                  networkUnavailableForWallet = true;
                  networkOutageDetected = true;
                  console.log(`      ${WARN} Network/API throttling issue detected during alert-manager execution.`);
                }

                const remaining = qAlertManager - alertInteractionsDone;
                if (remaining > 0) {
                  stats.alertManager.skipped += remaining;
                }
              }
            }
          }
        }

        if (!pendingStalledForWallet && !networkUnavailableForWallet && runtime.alertId != null) {
          for (let n = alertInteractionsDone; n < qAlertManager; n++) {
            try {
              const toggleTx = await makeContractCall({
                contractAddress: DEPLOYER_ADDRESS,
                contractName: 'alert-manager-v-j4',
                functionName: 'toggle-alert',
                functionArgs: [uintCV(runtime.alertId)],
                senderKey: runtime.privateKey,
                network,
                nonce: runtime.nonce++,
                fee: txFeeUstx,
                anchorMode: AnchorMode.Any,
              });
              await broadcastAndConfirm(
                toggleTx,
                `alert-manager:toggle-alert (${runtime.alertId})`,
                confirmTimeoutMs,
                pendingTimeoutMs
              );
              stats.alertManager.success++;
            } catch (e) {
              const message = e instanceof Error ? e.message : String(e);
              if (isPendingTxTimeoutError(message)) {
                const remaining = qAlertManager - n;
                if (remaining > 0) {
                  stats.alertManager.skipped += remaining;
                }
                pendingStalledForWallet = true;
                console.log(
                  `      ${WARN} toggle-alert exceeded pending timeout (${Math.ceil(
                    pendingTimeoutMs / 1000
                  )}s). Skipping remaining wallet interactions.`
                );
                break;
              }

              stats.alertManager.failed++;
              if (isMaxAlertsReachedError(message)) {
                console.log(`      ${WARN} toggle-alert returned max-alert error: ${message}`);
              } else {
                console.log(`      ${FAIL} toggle-alert failed: ${message}`);
              }

              if (isTooMuchChainingError(message)) {
                const remaining = qAlertManager - n - 1;
                if (remaining > 0) {
                  stats.alertManager.skipped += remaining;
                }
                runtime.nonce = await resolveNonceAfterChainingLimit(runtime.address, message, runtime.nonce);
                pendingStalledForWallet = true;
                console.log(
                  `      ${WARN} Wallet nonce chain limit reached. Synced nonce to ${runtime.nonce} and skipping remaining wallet interactions.`
                );
                break;
              }

              if (isRetryableBroadcastError(message)) {
                const remaining = qAlertManager - n - 1;
                if (remaining > 0) {
                  stats.alertManager.skipped += remaining;
                }
                networkUnavailableForWallet = true;
                networkOutageDetected = true;
                console.log(`      ${WARN} Network/API throttling issue detected during alert-manager execution.`);
                break;
              }
            }
          }
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.log(`      ${FAIL} alert-manager pre-check failed: ${message}`);
        if (isPendingTxTimeoutError(message)) {
          pendingStalledForWallet = true;
          stats.alertManager.skipped += qAlertManager;
        } else if (isRetryableNetworkError(message) || isRetryableBroadcastError(message)) {
          networkUnavailableForWallet = true;
          networkOutageDetected = true;
          stats.alertManager.skipped += qAlertManager;
        } else {
          stats.alertManager.failed++;
        }
      }
    }

    if (pendingStalledForWallet) {
      stats.feeVault.skipped += qFeeVault;
      stats.badges.skipped += qBadges;
      writeState(statePath, state);
      continue;
    }

    if (networkUnavailableForWallet) {
      stats.feeVault.skipped += qFeeVault;
      stats.badges.skipped += qBadges;
      writeState(statePath, state);
      break;
    }

    if (qFeeVault > 0) {
      console.log(`   -> fee-vault-v-j4 (${qFeeVault} planned tx)`);
    }
    for (let n = 0; n < qFeeVault; n++) {
      try {
        const tx = await makeContractCall({
          contractAddress: DEPLOYER_ADDRESS,
          contractName: 'fee-vault-v-j4',
          functionName: 'collect-subscription-fee',
          functionArgs: [uintCV(tier), noneCV()],
          senderKey: runtime.privateKey,
          network,
          nonce: runtime.nonce++,
          fee: txFeeUstx,
          anchorMode: AnchorMode.Any,
        });
        await broadcastAndConfirm(tx, 'fee-vault:collect-subscription-fee', confirmTimeoutMs, pendingTimeoutMs);
        stats.feeVault.success++;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (isPendingTxTimeoutError(message)) {
          const remaining = qFeeVault - n;
          if (remaining > 0) {
            stats.feeVault.skipped += remaining;
          }
          pendingStalledForWallet = true;
          console.log(
            `      ${WARN} fee-vault tx ${n + 1}/${qFeeVault} exceeded pending timeout (${Math.ceil(
              pendingTimeoutMs / 1000
            )}s). Skipping remaining fee-vault interactions.`
          );
          break;
        }

        stats.feeVault.failed++;
        console.log(`      ${FAIL} fee-vault tx ${n + 1}/${qFeeVault} failed: ${message}`);

        if (isTooMuchChainingError(message)) {
          const remaining = qFeeVault - n - 1;
          if (remaining > 0) {
            stats.feeVault.skipped += remaining;
          }
          runtime.nonce = await resolveNonceAfterChainingLimit(runtime.address, message, runtime.nonce);
          pendingStalledForWallet = true;
          console.log(
            `      ${WARN} Wallet nonce chain limit reached. Synced nonce to ${runtime.nonce} and skipping remaining wallet interactions.`
          );
          break;
        }

        if (isRetryableBroadcastError(message)) {
          const remaining = qFeeVault - n - 1;
          if (remaining > 0) {
            stats.feeVault.skipped += remaining;
          }
          networkUnavailableForWallet = true;
          networkOutageDetected = true;
          console.log(`      ${WARN} Network/API throttling issue detected during fee-vault execution.`);
          break;
        }
      }
    }

    if (pendingStalledForWallet && qBadges > 0) {
      console.log(
        `      ${WARN} Continuing with badge interactions for this wallet despite fee-vault pending timeout.`
      );
      pendingStalledForWallet = false;
    }

    if (badgeMinterAddress === runtime.address && badgeMinterNonce != null) {
      badgeMinterNonce = Math.max(badgeMinterNonce, runtime.nonce);
    }

    if (networkUnavailableForWallet) {
      stats.badges.skipped += qBadges;
      writeState(statePath, state);
      break;
    }

    if (qBadges > 0) {
      console.log(`   -> reputation-badges-v-j4 (${qBadges} planned tx)`);
    }
    if (qBadges > 0 && (!includeBadges || !badgeMinterKey || !badgeMinterAddress || badgeMinterNonce == null)) {
      stats.badges.skipped += qBadges;
    } else {
      try {
        if (qBadges > 0 && runtime.badgeTokenId == null) {
          const existing = await findExistingBadgeToken(runtime.address);
          if (existing) {
            runtime.badgeType = existing.badgeType;
            runtime.badgeTokenId = existing.tokenId;
            walletState.badgeType = existing.badgeType;
            walletState.badgeTokenId = existing.tokenId;
          }
        }

        if (qBadges > 0 && runtime.badgeTokenId != null && badgeMinterAddress) {
          runtime.badgeOwner = await getBadgeOwner(runtime.badgeTokenId, badgeMinterAddress);
          if (runtime.badgeOwner) {
            walletState.badgeOwner = runtime.badgeOwner;
          }
        }

        let badgeInteractionsDone = 0;
        if (qBadges > 0 && runtime.badgeTokenId == null) {
          const badgeType = await findFirstUnmintedBadgeType(runtime.address);
          if (!badgeType) {
            console.log(`      ${WARN} No available badge types to mint for this wallet.`);
            stats.badges.skipped += qBadges;
            badgeInteractionsDone = qBadges;
          } else {
            try {
              const mintTx = await makeContractCall({
                contractAddress: DEPLOYER_ADDRESS,
                contractName: 'reputation-badges-v-j4',
                functionName: 'mint-badge',
                functionArgs: [principalCV(runtime.address), uintCV(badgeType)],
                senderKey: badgeMinterKey!,
                network,
                nonce: badgeMinterNonce!,
                fee: txFeeUstx,
                anchorMode: AnchorMode.Any,
                postConditionMode: PostConditionMode.Allow,
              });
              badgeMinterNonce!++;

              const mintResult = await broadcastAndConfirm(
                mintTx,
                `reputation-badges:mint-badge (type ${badgeType})`,
                confirmTimeoutMs,
                pendingTimeoutMs
              );
              const tokenFromResult = parseOkUintFromRepr(mintResult.txResultRepr);
              const fallbackToken = await getUserBadgeToken(runtime.address, badgeType);
              runtime.badgeType = badgeType;
              runtime.badgeTokenId = tokenFromResult ?? fallbackToken;
              runtime.badgeOwner = runtime.address;
              walletState.badgeType = runtime.badgeType;
              walletState.badgeTokenId = runtime.badgeTokenId ?? undefined;
              walletState.badgeOwner = runtime.badgeOwner;

              if (runtime.badgeTokenId == null) {
                throw new Error('Mint succeeded but token-id could not be resolved');
              }

              stats.badges.success++;
              badgeInteractionsDone++;
            } catch (e) {
              const message = e instanceof Error ? e.message : String(e);
              if (isPendingTxTimeoutError(message)) {
                const remaining = qBadges - badgeInteractionsDone;
                if (remaining > 0) {
                  stats.badges.skipped += remaining;
                }
                pendingStalledForWallet = true;
                badgeInteractionsDone = qBadges;
                console.log(
                  `      ${WARN} mint-badge exceeded pending timeout (${Math.ceil(
                    pendingTimeoutMs / 1000
                  )}s). Skipping remaining wallet interactions.`
                );
              } else {
                if (isTooMuchChainingError(message)) {
                  badgeMinterNonce = await resolveNonceAfterChainingLimit(
                    badgeMinterAddress!,
                    message,
                    badgeMinterNonce!
                  );
                  pendingStalledForWallet = true;
                  badgeInteractionsDone = qBadges;
                  console.log(
                    `      ${WARN} Badge minter chaining limit reached. Synced nonce to ${badgeMinterNonce} and skipping remaining badge interactions for this wallet.`
                  );
                } else if (isRetryableBroadcastError(message)) {
                  networkUnavailableForWallet = true;
                  networkOutageDetected = true;
                  console.log(`      ${WARN} Network/API throttling issue detected during badge mint.`);
                } else {
                  stats.badges.failed++;
                  badgeInteractionsDone++;
                  console.log(`      ${FAIL} mint-badge failed: ${message}`);
                }

                const remaining = qBadges - badgeInteractionsDone;
                if (remaining > 0) {
                  stats.badges.skipped += remaining;
                }
              }
            }
          }
        }

        if (!networkUnavailableForWallet && runtime.badgeTokenId != null && badgeMinterAddress) {
          for (let n = badgeInteractionsDone; n < qBadges; n++) {
            if (!runtime.badgeOwner) {
              runtime.badgeOwner = await getBadgeOwner(runtime.badgeTokenId, badgeMinterAddress);
              walletState.badgeOwner = runtime.badgeOwner ?? undefined;
            }

            if (runtime.badgeOwner !== runtime.address && runtime.badgeOwner !== badgeMinterAddress) {
              const remaining = qBadges - n;
              stats.badges.skipped += remaining;
              console.log(
                `      ${WARN} Token ${runtime.badgeTokenId} is owned by ${runtime.badgeOwner}. Cannot transfer with wallet/minter keys.`
              );
              break;
            }

            const senderIsWallet = runtime.badgeOwner === runtime.address;
            const senderAddress = senderIsWallet ? runtime.address : badgeMinterAddress;
            const recipientAddress = senderIsWallet ? badgeMinterAddress : runtime.address;

            if (senderAddress === recipientAddress) {
              const remaining = qBadges - n;
              if (remaining > 0) {
                stats.badges.skipped += remaining;
              }
              console.log(
                `      ${WARN} badge transfer would be sender==recipient (${senderAddress}); skipping remaining badge interactions for this wallet.`
              );
              break;
            }

            const senderKey = senderIsWallet ? runtime.privateKey : badgeMinterKey!;
            const nonce = senderIsWallet ? runtime.nonce++ : badgeMinterNonce!;
            if (!senderIsWallet) {
              badgeMinterNonce!++;
            }

            try {
              const transferTx = await makeContractCall({
                contractAddress: DEPLOYER_ADDRESS,
                contractName: 'reputation-badges-v-j4',
                functionName: 'transfer',
                functionArgs: [uintCV(runtime.badgeTokenId), principalCV(senderAddress), principalCV(recipientAddress)],
                senderKey,
                network,
                nonce,
                fee: txFeeUstx,
                anchorMode: AnchorMode.Any,
                postConditionMode: PostConditionMode.Allow,
              });
              await broadcastAndConfirm(
                transferTx,
                `reputation-badges:transfer token ${runtime.badgeTokenId}`,
                confirmTimeoutMs,
                pendingTimeoutMs
              );
              runtime.badgeOwner = recipientAddress;
              walletState.badgeOwner = recipientAddress;
              stats.badges.success++;
            } catch (e) {
              const message = e instanceof Error ? e.message : String(e);
              if (isPendingTxTimeoutError(message)) {
                const remaining = qBadges - n;
                if (remaining > 0) {
                  stats.badges.skipped += remaining;
                }
                pendingStalledForWallet = true;
                console.log(
                  `      ${WARN} badge transfer exceeded pending timeout (${Math.ceil(
                    pendingTimeoutMs / 1000
                  )}s). Skipping remaining wallet interactions.`
                );
                break;
              }

              if (isTooMuchChainingError(message)) {
                const remaining = qBadges - n;
                if (remaining > 0) {
                  stats.badges.skipped += remaining;
                }
                const fallbackNonce = senderIsWallet ? runtime.nonce : badgeMinterNonce!;
                const recoveredNonce = await resolveNonceAfterChainingLimit(senderAddress, message, fallbackNonce);
                if (senderIsWallet) {
                  runtime.nonce = recoveredNonce;
                } else {
                  badgeMinterNonce = recoveredNonce;
                }
                console.log(
                  `      ${WARN} Chaining limit reached for ${senderAddress}. Synced nonce to ${recoveredNonce} and skipping remaining badge interactions for this wallet.`
                );
                break;
              }

              if (isRetryableBroadcastError(message)) {
                const remaining = qBadges - n;
                if (remaining > 0) {
                  stats.badges.skipped += remaining;
                }
                networkUnavailableForWallet = true;
                networkOutageDetected = true;
                console.log(`      ${WARN} Network/API throttling issue detected during badge transfer.`);
                break;
              }

              stats.badges.failed++;
              console.log(`      ${FAIL} badge transfer failed: ${message}`);
            }
          }
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.log(`      ${FAIL} badge pre-check failed: ${message}`);
        if (isPendingTxTimeoutError(message)) {
          pendingStalledForWallet = true;
          stats.badges.skipped += qBadges;
        } else if (isRetryableNetworkError(message) || isRetryableBroadcastError(message)) {
          networkUnavailableForWallet = true;
          networkOutageDetected = true;
          stats.badges.skipped += qBadges;
        } else {
          stats.badges.failed++;
        }
      }
    }

    walletState.effectiveTier = runtime.effectiveTier;
    walletState.alertId = runtime.alertId ?? undefined;
    walletState.badgeType = runtime.badgeType ?? undefined;
    walletState.badgeTokenId = runtime.badgeTokenId ?? undefined;
    walletState.badgeOwner = runtime.badgeOwner ?? undefined;
    writeState(statePath, state);
  }

  if (!includeBadges) {
    stats.badges.skipped = targetPerContract;
  }

  console.log('\nTransaction summary (per contract):');
  console.log(
    `- stackpulse-v-j4 => success: ${stats.stackpulse.success}, failed: ${stats.stackpulse.failed}, skipped: ${stats.stackpulse.skipped}`
  );
  console.log(
    `- alert-manager-v-j4 => success: ${stats.alertManager.success}, failed: ${stats.alertManager.failed}, skipped: ${stats.alertManager.skipped}`
  );
  console.log(
    `- fee-vault-v-j4 => success: ${stats.feeVault.success}, failed: ${stats.feeVault.failed}, skipped: ${stats.feeVault.skipped}`
  );
  console.log(
    `- reputation-badges-v-j4 => success: ${stats.badges.success}, failed: ${stats.badges.failed}, skipped: ${stats.badges.skipped}`
  );
  console.log('\nTarget check:');
  console.log(`- stackpulse-v-j4: ${stats.stackpulse.success}/${targetPerContract}`);
  console.log(`- alert-manager-v-j4: ${stats.alertManager.success}/${targetPerContract}`);
  console.log(`- fee-vault-v-j4: ${stats.feeVault.success}/${targetPerContract}`);
  if (includeBadges) {
    console.log(`- reputation-badges-v-j4: ${stats.badges.success}/${targetPerContract}`);
  } else {
    console.log(`- reputation-badges-v-j4: disabled`);
  }

  console.log(`\nDone.`);
}

run();
