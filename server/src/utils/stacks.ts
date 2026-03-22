/**
 * Stacks API Utility
 * Helper functions for interacting with Stacks blockchain
 */

import { API_URLS } from '@stackpulse/shared/constants';
import { 
  cvToJSON, 
  hexToCV,
  addressToString
} from '@stacks/transactions';
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
 * Decode Clarity value from hex string
 */
export function decodeClarityValue(hex: string): any {
  if (!hex || hex === '0x') return null;
  try {
    // Standardize hex string
    const normalizedHex = hex.startsWith('0x') ? hex : `0x${hex}`;
    const cv = hexToCV(normalizedHex);
    return cvToJSON(cv);
  } catch (error: any) {
    logger.error('Error decoding Clarity value', { hex, error: error.message });
    return null;
  }
}

/**
 * Parse Whale Transfer Event
 */
export function parseWhaleTransfer(event: any) {
  if (!event || event.type !== 'stx_transfer_event') return null;
  
  try {
    const { sender, recipient, amount } = event.data;
    const amountSTX = parseInt(amount) / 1000000;
    
    // Logic for whale detection (e.g., > 10,000 STX)
    if (amountSTX >= 10000) {
      return {
        sender,
        recipient,
        amount,
        amountSTX,
        amountFormatted: `${amountSTX.toLocaleString()} STX`,
        isWhale: true
      };
    }
  } catch (error: any) {
    logger.error('Error parsing whale transfer', { error: error.message });
  }
  return null;
}

/**
 * Parse Contract Deployment Event
 */
export function parseContractDeployment(tx: any) {
  if (!tx || tx.tx_type !== 'smart_contract') return null;
  
  try {
    return {
      contractId: tx.smart_contract.contract_id,
      sender: tx.sender_address,
      txId: tx.tx_id,
      timestamp: tx.burn_block_time
    };
  } catch (error: any) {
    logger.error('Error parsing contract deployment', { error: error.message });
    return null;
  }
}

/**
 * Parse NFT Mint Event
 */
export function parseNFTMint(event: any) {
  if (!event || event.type !== 'nft_mint_event') return null;
  
  try {
    return {
      assetId: event.data.asset_identifier,
      recipient: event.data.recipient,
      value: decodeClarityValue(event.data.value)
    };
  } catch (error: any) {
    logger.error('Error parsing NFT mint', { error: error.message });
    return null;
  }
}

/**
 * Parse StackPulse Protocol Event
 */
export function parseStackPulseEvent(event: any) {
  if (!event || event.type !== 'contract_event') return null;
  
  try {
    const contractId = event.contract_identifier;
    if (!contractId.includes('stackpulse') && !contractId.includes('alert-manager')) return null;
    
    const value = decodeClarityValue(event.data.value);
    return {
      contractId,
      eventName: event.data.topic,
      data: value ? value.value : null
    };
  } catch (error: any) {
    logger.error('Error parsing StackPulse event', { error: error.message });
    return null;
  }
}

/**
 * Format STX amount
 */
export function formatSTX(microStx: string | number): string {
  const amount = typeof microStx === 'string' ? parseInt(microStx) : microStx;
  return (amount / 1000000).toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 6 
  }) + ' STX';
}

/**
 * Create user session for internal tracking
 */
export function createUserSession(address: string) {
  return {
    id: `session_${Math.random().toString(36).slice(2, 11)}`,
    address,
    createdAt: Date.now()
  };
}

/**
 * Stacks App Configuration for Connect
 */
export const stacksAppConfig = {
  name: 'StackPulse',
  icon: '/logo.png'
};
