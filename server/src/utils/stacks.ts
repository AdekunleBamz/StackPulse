/**
 * Stacks API Utility
 * Helper functions for interacting with Stacks blockchain
 */

import logger from './logger';

const API_URLS = {
  STACKS_API: 'https://stacks-node-api.mainnet.stacks.co',
  STACKS_API_TESTNET: 'https://stacks-node-api.testnet.stacks.co',
} as const;

interface Transaction {
  tx_id: string;
  tx_status: string;
  block_height: number;
  burn_block_time: number;
}

interface ContractCall {
  contract_id: string;
  function_name: string;
  function_args: unknown[];
}

interface AddressBalanceResponse {
  stx?: {
    balance?: string;
  };
}

interface PaginatedTransactionsResponse {
  results?: Transaction[];
}

interface ContractSourceResponse {
  source: string;
}

interface CoreApiInfoResponse {
  stx_tip_height: number;
}

type GenericJsonObject = Record<string, unknown>;
type StacksNetwork = 'mainnet' | 'testnet';
const JSON_ACCEPT_HEADERS = { Accept: 'application/json' } as const;

/**
 * Get Stacks API URL based on network
 */
export function getStacksApiUrl(network: StacksNetwork = 'mainnet'): string {
  return network === 'mainnet' 
    ? API_URLS.STACKS_API 
    : API_URLS.STACKS_API_TESTNET;
}

/**
 * Fetch transaction by ID
 */
export async function getTransaction(txId: string, network: StacksNetwork = 'mainnet'): Promise<Transaction | null> {
  const baseUrl = getStacksApiUrl(network);
  
  try {
    const response = await fetch(`${baseUrl}/extended/v1/tx/${txId}`, {
      headers: JSON_ACCEPT_HEADERS,
    });
    if (!response.ok) return null;
    return (await response.json()) as Transaction;
  } catch (error) {
    logger.error('Error fetching transaction', { txId, network, error });
    return null;
  }
}

/**
 * Get account balance
 */
export async function getAccountBalance(address: string, network: StacksNetwork = 'mainnet'): Promise<{ balance: number; stx: string } | null> {
  const baseUrl = getStacksApiUrl(network);
  
  try {
    const response = await fetch(`${baseUrl}/extended/v1/address/${address}/balances`, {
      headers: JSON_ACCEPT_HEADERS,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as AddressBalanceResponse;
    const stxBalance = data.stx?.balance || '0';
    const parsedBalance = Number.parseInt(stxBalance, 10);
    return {
      balance: Number.isFinite(parsedBalance) ? parsedBalance : 0,
      stx: stxBalance
    };
  } catch (error) {
    logger.error('Error fetching account balance', { address, network, error });
    return null;
  }
}

/**
 * Get account transactions
 */
export async function getAccountTransactions(
  address: string, 
  network: StacksNetwork = 'mainnet',
  limit: number = 20,
  offset: number = 0
): Promise<Transaction[]> {
  const baseUrl = getStacksApiUrl(network);
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 20;
  const safeOffset = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;
  
  try {
    const response = await fetch(
      `${baseUrl}/extended/v1/address/${address}/transactions?limit=${safeLimit}&offset=${safeOffset}`,
      { headers: JSON_ACCEPT_HEADERS }
    );
    if (!response.ok) return [];
    const data = (await response.json()) as PaginatedTransactionsResponse;
    return data.results ?? [];
  } catch (error) {
    logger.error('Error fetching account transactions', { address, network, error });
    return [];
  }
}

/**
 * Get contract source code
 */
export async function getContractSource(
  contractAddress: string,
  contractName: string,
  network: StacksNetwork = 'mainnet'
): Promise<ContractSourceResponse | null> {
  const baseUrl = getStacksApiUrl(network);
  
  try {
    const response = await fetch(
      `${baseUrl}/v2/contracts/source/${contractAddress}/${contractName}`,
      { headers: JSON_ACCEPT_HEADERS }
    );
    if (!response.ok) return null;
    return (await response.json()) as ContractSourceResponse;
  } catch (error) {
    logger.error('Error fetching contract source', { contractAddress, contractName, network, error });
    return null;
  }
}

/**
 * Get block info
 */
export async function getBlock(
  blockHeight: number,
  network: StacksNetwork = 'mainnet'
): Promise<GenericJsonObject | null> {
  const baseUrl = getStacksApiUrl(network);
  
  try {
    const response = await fetch(`${baseUrl}/extended/v1/block/${blockHeight}`, {
      headers: JSON_ACCEPT_HEADERS,
    });
    if (!response.ok) return null;
    return (await response.json()) as GenericJsonObject;
  } catch (error) {
    logger.error('Error fetching block', { blockHeight, network, error });
    return null;
  }
}

/**
 * Get mempool transactions
 */
export async function getMempoolTransactions(
  address: string,
  network: StacksNetwork = 'mainnet'
): Promise<Transaction[]> {
  const baseUrl = getStacksApiUrl(network);
  
  try {
    const response = await fetch(
      `${baseUrl}/extended/v1/address/${address}/mempool`,
      { headers: JSON_ACCEPT_HEADERS }
    );
    if (!response.ok) return [];
    const data = (await response.json()) as PaginatedTransactionsResponse;
    return data.results ?? [];
  } catch (error) {
    logger.error('Error fetching mempool transactions', { address, network, error });
    return [];
  }
}

/**
 * Get current block height
 */
export async function getCoreApiInfo(network: StacksNetwork = 'mainnet'): Promise<CoreApiInfoResponse | null> {
  const baseUrl = getStacksApiUrl(network);
  
  try {
    const response = await fetch(`${baseUrl}/v2/info`, { headers: JSON_ACCEPT_HEADERS });
    if (!response.ok) return null;
    return (await response.json()) as CoreApiInfoResponse;
  } catch (error) {
    logger.error('Error fetching core API info', { network, error });
    return null;
  }
}

/**
 * Get transactions for a block
 */
export async function getBlockTransactions(
  blockHeight: number,
  network: StacksNetwork = 'mainnet'
): Promise<Transaction[]> {
  const baseUrl = getStacksApiUrl(network);
  
  try {
    const response = await fetch(
      `${baseUrl}/extended/v1/block/${blockHeight}/transactions`,
      { headers: JSON_ACCEPT_HEADERS }
    );
    if (!response.ok) return [];
    const data = (await response.json()) as PaginatedTransactionsResponse;
    return data.results ?? [];
  } catch (error) {
    logger.error('Error fetching block transactions', { blockHeight, network, error });
    return [];
  }
}

/**
 * Compatibility helpers for event parsing.
 */
export function parseWhaleTransfer(event: GenericJsonObject): { amountSTX: string; amountFormatted: string; sender: string; recipient: string } | null {
  if ((event.type as string | undefined) !== 'STXTransferEvent') {
    return null;
  }

  const data = (event.data as GenericJsonObject | undefined) ?? {};
  const amount = Number(data.amount ?? 0);
  const sender = String(data.sender ?? '');
  const recipient = String(data.recipient ?? '');

  if (!amount || !sender || !recipient) {
    return null;
  }

  const amountSTX = (amount / 1_000_000).toFixed(6);
  return {
    amountSTX,
    amountFormatted: `${amountSTX} STX`,
    sender,
    recipient,
  };
}

export function parseContractDeployment(tx: GenericJsonObject): { contractId: string; contractName: string; deployer: string } | null {
  const metadata = (tx.metadata as GenericJsonObject | undefined) || {};
  const kind = (metadata.kind as GenericJsonObject | undefined) || {};
  const kindType = kind.type as string | undefined;

  if (kindType !== 'ContractDeployment') {
    return null;
  }

  const kindData = (kind.data as GenericJsonObject | undefined) || {};
  const contractId = String(kindData.contract_identifier ?? '');
  const deployer = String(metadata.sender ?? '');

  if (!contractId || !deployer) {
    return null;
  }

  const [_, ...contractNameParts] = contractId.split('.');
  const contractName = contractNameParts.join('.') || contractId;

  return { contractId, contractName, deployer };
}

export function parseNFTMint(event: GenericJsonObject): { assetIdentifier: string; assetName: string; tokenId: string; recipient: string; contractAddress: string } | null {
  if ((event.type as string | undefined) !== 'NFTTransferEvent') {
    return null;
  }

  const data = (event.data as GenericJsonObject | undefined) || {};
  const assetIdentifier = String(data.asset_identifier ?? '');
  const tokenId = String(data.value ?? '');
  const recipient = String(data.recipient ?? '');

  if (!assetIdentifier || !tokenId || !recipient) {
    return null;
  }

  const [contractAddress, ...assetNameParts] = assetIdentifier.split('::');
  const assetName = assetNameParts.join('::');
  return {
    assetIdentifier,
    assetName: assetName || assetIdentifier,
    tokenId,
    recipient,
    contractAddress: contractAddress ?? '',
  };
}

export function parseStackPulseEvent(event: GenericJsonObject): GenericJsonObject | null {
  if ((event.type as string | undefined) !== 'SmartContractEvent') {
    return null;
  }

  const data = (event.data as GenericJsonObject | undefined) || {};
  const value = data.value as GenericJsonObject | undefined;
  return value || null;
}

export function formatSTX(amountMicroStx: number | string): string {
  const amount = typeof amountMicroStx === 'string' ? Number(amountMicroStx) : amountMicroStx;
  if (!Number.isFinite(amount)) {
    return '0';
  }
  return (amount / 1_000_000).toFixed(6);
}

export function decodeClarityValue<T = unknown>(value: T): T {
  return value;
}

export const stacksAppConfig = {
  scopes: ['store_write', 'publish_data'],
} as const;

export function createUserSession(userData: GenericJsonObject = {}): { userData: GenericJsonObject; createdAt: number } {
  return {
    userData,
    createdAt: Date.now(),
  };
}
