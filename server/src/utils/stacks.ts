/**
 * Stacks API Utility
 * Helper functions for interacting with Stacks blockchain
 */

import { API_URLS } from '@stackpulse/shared/constants';
import logger from './logger';

interface Transaction {
  tx_id: string;
  tx_status: string;
  block_height: number;
  burn_block_time: number;
}

interface ContractCall {
  contract_id: string;
  function_name: string;
  function_args: any[];
}

/**
 * Get Stacks API URL based on network
 */
export function getStacksApiUrl(network: 'mainnet' | 'testnet' = 'mainnet'): string {
  return network === 'mainnet' 
    ? API_URLS.STACKS_API 
    : API_URLS.STACKS_API_TESTNET;
}

/**
 * Fetch transaction by ID
 */
export async function getTransaction(txId: string, network: 'mainnet' | 'testnet' = 'mainnet'): Promise<Transaction | null> {
  const baseUrl = getStacksApiUrl(network);
  
  try {
    const response = await fetch(`${baseUrl}/extended/v1/tx/${txId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    logger.error('Error fetching transaction', { txId, network, error });
    return null;
  }
}

/**
 * Get account balance
 */
export async function getAccountBalance(address: string, network: 'mainnet' | 'testnet' = 'mainnet'): Promise<{ balance: number; stx: string } | null> {
  const baseUrl = getStacksApiUrl(network);
  
  try {
    const response = await fetch(`${baseUrl}/extended/v1/address/${address}/balances`);
    if (!response.ok) return null;
    const data = await response.json();
    return {
      balance: parseInt(data.stx.balance || '0'),
      stx: data.stx.balance || '0'
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
  network: 'mainnet' | 'testnet' = 'mainnet',
  limit: number = 20,
  offset: number = 0
): Promise<Transaction[]> {
  const baseUrl = getStacksApiUrl(network);
  
  try {
    const response = await fetch(
      `${baseUrl}/extended/v1/address/${address}/transactions?limit=${limit}&offset=${offset}`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
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
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<{ source: string; } | null> {
  const baseUrl = getStacksApiUrl(network);
  
  try {
    const response = await fetch(
      `${baseUrl}/v2/contracts/source/${contractAddress}/${contractName}`
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    logger.error('Error fetching contract source', { contractAddress, contractName, network, error });
    return null;
  }
}

/**
 * Get block info
 */
export async function getBlock(blockHeight: number, network: 'mainnet' | 'testnet' = 'mainnet'): Promise<any | null> {
  const baseUrl = getStacksApiUrl(network);
  
  try {
    const response = await fetch(`${baseUrl}/extended/v1/block/${blockHeight}`);
    if (!response.ok) return null;
    return await response.json();
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
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<Transaction[]> {
  const baseUrl = getStacksApiUrl(network);
  
  try {
    const response = await fetch(
      `${baseUrl}/extended/v1/address/${address}/mempool`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    logger.error('Error fetching mempool transactions', { address, network, error });
    return [];
  }
}

/**
 * Get current block height
 */
export async function getCoreApiInfo(network: 'mainnet' | 'testnet' = 'mainnet'): Promise<{ stx_tip_height: number } | null> {
  const baseUrl = getStacksApiUrl(network);
  
  try {
    const response = await fetch(`${baseUrl}/v2/info`);
    if (!response.ok) return null;
    return await response.json();
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
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<Transaction[]> {
  const baseUrl = getStacksApiUrl(network);
  
  try {
    const response = await fetch(
      `${baseUrl}/extended/v1/block/${blockHeight}/transactions`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    logger.error('Error fetching block transactions', { blockHeight, network, error });
    return [];
  }
}
/**
 * Execute a blockchain operation with exponential backoff and jitter
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = delay * 0.2 * (Math.random() * 2 - 1);
        const finalDelay = Math.max(0, delay + jitter);
        
        logger.warn(`Stacks API call failed (attempt ${attempt}/${maxRetries}). Retrying in ${Math.round(finalDelay)}ms...`, {
          error: error.message
        });
        
        await new Promise(resolve => setTimeout(resolve, finalDelay));
      }
    }
  }
  
  throw lastError;
}
