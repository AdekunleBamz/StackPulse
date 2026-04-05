import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  AnchorMode,
  broadcastTransaction,
  getAddressFromPrivateKey,
  makeContractDeploy,
  TransactionVersion,
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import { generateWallet } from '@stacks/wallet-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const network = new StacksMainnet();

const WALLET_PATH = path.join(repoRoot, 'scripts', 'test-wallets.json');
const CONTRACTS = [
  { name: 'stackpulse-v-j4', file: 'contracts/stackpulse-v-j4.clar' },
  { name: 'alert-manager-v-j4', file: 'contracts/alert-manager-v-j4.clar' },
  { name: 'fee-vault-v-j4', file: 'contracts/fee-vault-v-j4.clar' },
  { name: 'reputation-badges-v-j4', file: 'contracts/reputation-badges-v-j4.clar' },
];
const DEPLOY_FEE_USTX = 20_000; // 0.02 STX

async function generateAccountKey(mnemonic) {
  const wallet = await generateWallet({ secretKey: mnemonic, password: 'password' });
  return wallet.accounts[0].stxPrivateKey;
}

async function fetchJson(url, label) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${label} failed: ${res.status}`);
  }
  return await res.json();
}

async function getNonce(address) {
  const data = await fetchJson(
    `https://api.mainnet.hiro.so/extended/v1/address/${address}/nonces`,
    'Nonce fetch'
  );
  if (typeof data?.possible_next_nonce !== 'number') {
    throw new Error('Nonce missing in response');
  }
  return data.possible_next_nonce;
}

async function getBalance(address) {
  const data = await fetchJson(
    `https://api.mainnet.hiro.so/extended/v1/address/${address}/balances`,
    'Balance fetch'
  );
  const balance = Number(data?.stx?.balance ?? NaN);
  if (!Number.isFinite(balance)) {
    throw new Error('Balance missing in response');
  }
  return balance;
}

function formatStx(ustx) {
  return `${(ustx / 1_000_000).toFixed(6)} STX`;
}

async function run() {
  const walletsData = JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8'));
  const wallet1 = walletsData?.wallets?.[0];
  if (!wallet1?.mnemonic) {
    throw new Error('wallet #1 mnemonic not found in scripts/test-wallets.json');
  }

  const senderKey = await generateAccountKey(wallet1.mnemonic);
  const senderAddress = getAddressFromPrivateKey(senderKey, TransactionVersion.Mainnet);

  console.log(`Using wallet #1 address: ${senderAddress}`);
  if (wallet1.address && wallet1.address !== senderAddress) {
    throw new Error(`wallet #1 address mismatch: file=${wallet1.address}, derived=${senderAddress}`);
  }

  let nonce = await getNonce(senderAddress);
  const balance = await getBalance(senderAddress);
  const required = CONTRACTS.length * DEPLOY_FEE_USTX;

  console.log(`Balance: ${balance} uSTX (${formatStx(balance)})`);
  console.log(`Required deployment fees: ${required} uSTX (${formatStx(required)})`);

  if (balance < required) {
    throw new Error('insufficient balance for deployment fees');
  }

  for (const contract of CONTRACTS) {
    const contractPath = path.join(repoRoot, contract.file);
    const codeBody = fs.readFileSync(contractPath, 'utf8');

    console.log(`\nDeploying ${contract.name}...`);
    const tx = await makeContractDeploy({
      contractName: contract.name,
      codeBody,
      senderKey,
      network,
      nonce,
      fee: DEPLOY_FEE_USTX,
      anchorMode: AnchorMode.Any,
    });

    const result = await broadcastTransaction(tx, network);
    if (typeof result === 'string') {
      console.log(`  txid: ${result}`);
    } else if (result?.txid) {
      console.log(`  txid: ${result.txid}`);
    } else {
      console.log('  broadcast response:', result);
      throw new Error(`deployment failed for ${contract.name}`);
    }

    nonce += 1;
  }

  console.log('\nBroadcast complete for all v-j4 contracts.');
}

run().catch((error) => {
  console.error(`Deployment failed: ${error.message}`);
  process.exitCode = 1;
});
