/**
 * Stacks Utilities
 * Uses @stacks/transactions and @stacks/connect for blockchain data handling
 */

import {
  cvToJSON,
  hexToCV,
  cvToHex,
  principalCV,
  uintCV,
  stringAsciiCV,
  tupleCV,
  ClarityValue,
  ClarityType,
  cvToString,
  deserializeCV,
  serializeCV
} from '@stacks/transactions';

import {
  AppConfig,
  UserSession,
  showConnect,
  openContractCall
} from '@stacks/connect';

// ============================================
// CLARITY VALUE DECODERS
// ============================================

/**
 * Decode a hex-encoded Clarity value from chainhook payload
 */
export function decodeClarityValue(hexValue: string): any {
  try {
    const cv = hexToCV(hexValue);
    return cvToJSON(cv);
  } catch (error) {
    console.error('Failed to decode Clarity value:', error);
    return null;
  }
}

/**
 * Decode print event data from chainhook
 */
export function decodePrintEvent(hexData: string): Record<string, any> | null {
  try {
    const cv = hexToCV(hexData);
    const json = cvToJSON(cv);
    return json.value || json;
  } catch (error) {
    console.error('Failed to decode print event:', error);
    return null;
  }
}

/**
 * Parse STX amount from microSTX to STX
 */
export function microSTXToSTX(microSTX: bigint | string | number): number {
  const amount = typeof microSTX === 'bigint' ? microSTX : BigInt(microSTX);
  return Number(amount) / 1_000_000;
}

/**
 * Format STX amount for display
 */
export function formatSTX(microSTX: bigint | string | number): string {
  const stx = microSTXToSTX(microSTX);
  return `${stx.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} STX`;
}

// ============================================
// TRANSACTION BUILDERS
// ============================================

/**
 * Build a principal Clarity value
 */
export function buildPrincipal(address: string): ClarityValue {
  return principalCV(address);
}

/**
 * Build a uint Clarity value
 */
export function buildUint(value: number | bigint): ClarityValue {
  return uintCV(value);
}

/**
 * Build a string-ascii Clarity value
 */
export function buildString(value: string): ClarityValue {
  return stringAsciiCV(value);
}

/**
 * Build an alert creation tuple for contract calls
 */
export function buildAlertTuple(
  name: string,
  alertType: number,
  threshold: number,
  targetContract?: string
): ClarityValue {
  return tupleCV({
    name: stringAsciiCV(name),
    'alert-type': uintCV(alertType),
    threshold: uintCV(threshold),
    'target-contract': targetContract ? principalCV(targetContract) : principalCV('SP000000000000000000002Q6VF78')
  });
}

// ============================================
// CHAINHOOK DATA PARSERS
// ============================================

export interface WhaleTransferData {
  sender: string;
  recipient: string;
  amount: bigint;
  amountSTX: number;
  amountFormatted: string;
}

export interface ContractDeploymentData {
  contractId: string;
  deployer: string;
  contractName: string;
}

export interface NFTMintData {
  assetIdentifier: string;
  tokenId: string;
  recipient: string;
  contractAddress: string;
  assetName: string;
}

export interface TokenLaunchData {
  contractId: string;
  deployer: string;
  tokenName: string;
  implementsTrait: boolean;
}

/**
 * Parse whale transfer event from chainhook payload
 */
export function parseWhaleTransfer(event: any): WhaleTransferData | null {
  try {
    if (event.type !== 'STXTransferEvent') return null;
    
    const amount = BigInt(event.data.amount);
    return {
      sender: event.data.sender,
      recipient: event.data.recipient,
      amount,
      amountSTX: microSTXToSTX(amount),
      amountFormatted: formatSTX(amount)
    };
  } catch (error) {
    console.error('Failed to parse whale transfer:', error);
    return null;
  }
}

/**
 * Parse contract deployment from chainhook payload
 */
export function parseContractDeployment(tx: any): ContractDeploymentData | null {
  try {
    if (tx.metadata?.kind?.type !== 'ContractDeployment') return null;
    
    const contractId = tx.metadata.kind.data?.contract_identifier || '';
    const [deployer, contractName] = contractId.split('.');
    
    return {
      contractId,
      deployer: deployer || tx.metadata.sender,
      contractName: contractName || 'unknown'
    };
  } catch (error) {
    console.error('Failed to parse contract deployment:', error);
    return null;
  }
}

/**
 * Parse NFT mint event from chainhook payload
 */
export function parseNFTMint(event: any): NFTMintData | null {
  try {
    if (event.type !== 'NFTMintEvent') return null;
    
    const assetIdentifier = event.data.asset_identifier || '';
    const [contractAddress, assetName] = assetIdentifier.split('::');
    
    return {
      assetIdentifier,
      tokenId: event.data.value?.toString() || '0',
      recipient: event.data.recipient,
      contractAddress: contractAddress || '',
      assetName: assetName || 'unknown'
    };
  } catch (error) {
    console.error('Failed to parse NFT mint:', error);
    return null;
  }
}

/**
 * Parse print event for StackPulse contract events
 */
export function parseStackPulseEvent(event: any): { eventType: string; data: any } | null {
  try {
    if (event.type !== 'SmartContractEvent') return null;
    
    const printData = event.data.value;
    if (!printData?.event) return null;
    
    return {
      eventType: printData.event,
      data: printData
    };
  } catch (error) {
    console.error('Failed to parse StackPulse event:', error);
    return null;
  }
}

// ============================================
// CONNECT UTILITIES (for frontend integration reference)
// ============================================

/**
 * App configuration for Stacks Connect
 * Used when integrating with frontend wallet connections
 */
export const stacksAppConfig = new AppConfig(['store_write', 'publish_data']);

/**
 * Create a user session for wallet authentication
 */
export function createUserSession(): UserSession {
  return new UserSession({ appConfig: stacksAppConfig });
}

/**
 * Check if user is signed in
 */
export function isUserSignedIn(userSession: UserSession): boolean {
  return userSession.isUserSignedIn();
}

/**
 * Get user's Stacks address from session
 */
export function getUserAddress(userSession: UserSession): string | null {
  if (!userSession.isUserSignedIn()) return null;
  
  const userData = userSession.loadUserData();
  return userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
}

/**
 * Contract call options builder for StackPulse contracts
 */
export interface ContractCallOptions {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  network?: 'mainnet' | 'testnet';
}

export function buildContractCallOptions(options: ContractCallOptions) {
  return {
    contractAddress: options.contractAddress,
    contractName: options.contractName,
    functionName: options.functionName,
    functionArgs: options.functionArgs,
    network: options.network || 'mainnet'
  };
}

// ============================================
// EXPORTS
// ============================================

export {
  cvToJSON,
  hexToCV,
  cvToHex,
  cvToString,
  deserializeCV,
  serializeCV,
  ClarityType,
  // Re-export connect utilities
  showConnect,
  openContractCall,
  AppConfig,
  UserSession
};
