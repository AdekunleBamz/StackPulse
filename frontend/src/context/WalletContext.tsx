'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import logger from '@/lib/logger';
import { truncateAddress } from '@/utils';

type StoredAddress = {
  address: string;
  symbol?: string;
};

type WalletConnectResult = {
  addresses?: StoredAddress[];
  accounts?: StoredAddress[];
};

type WalletAddressSource =
  | string
  | StoredAddress
  | WalletConnectResult
  | WalletAddressSource[]
  | Record<string, unknown>
  | null
  | undefined;

/**
 * Context type for Stacks wallet management
 */
interface WalletContextType {
  /** Whether a wallet is currently connected */
  isConnected: boolean;
  /** The current Stacks address of the connected user */
  address: string | null;
  /** Truncated form of the address for display (e.g. "SP1234...5678"). Null when not connected. */
  shortAddress: string | null;
  /** True when the active network is mainnet. */
  isMainnet: boolean;
  /** True when the active network is testnet. */
  isTestnet: boolean;
  /** The active Stacks network (mainnet or testnet) */
  network: 'mainnet' | 'testnet';
  /** Initiates the Stacks wallet connection flow */
  connect: () => Promise<void>;
  /** Disconnects the current wallet session */
  disconnect: () => Promise<void>;
  /** Switches between mainnet and testnet */
  switchNetwork: (network: 'mainnet' | 'testnet') => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

function getStacksAddressCandidate(value?: string): string | null {
  if (!value) return null;
  const trimmedValue = value.trim();
  const caipAddress = trimmedValue.match(/(?:^|:)S[PT][A-Z0-9]+$/i)?.[0]?.replace(/^:/, '');
  const plainAddress = trimmedValue.match(/^S[PT][A-Z0-9]+$/i)?.[0];
  return caipAddress || plainAddress || null;
}

function collectAddresses(source: WalletAddressSource): StoredAddress[] {
  if (!source) return [];

  if (typeof source === 'string') {
    const address = getStacksAddressCandidate(source);
    return address ? [{ address }] : [];
  }

  if (Array.isArray(source)) {
    return source.flatMap((entry) => collectAddresses(entry));
  }

  if (typeof source === 'object') {
    const maybeAddress = 'address' in source ? getStacksAddressCandidate(String(source.address)) : null;
    const currentAddress = maybeAddress
      ? [{ address: maybeAddress, symbol: 'symbol' in source ? String(source.symbol) : undefined }]
      : [];
    const nestedAddresses = Object.entries(source)
      .filter(([key]) => key !== 'address' && key !== 'symbol')
      .flatMap(([, value]) => collectAddresses(value as WalletAddressSource));

    return [...currentAddress, ...nestedAddresses];
  }

  return [];
}

function isStacksAddress(address?: string): boolean {
  return Boolean(getStacksAddressCandidate(address));
}

function selectAddress(addresses: StoredAddress[] = [], network: 'mainnet' | 'testnet'): string | null {
  const networkPrefix = network === 'mainnet' ? 'SP' : 'ST';
  const stacksAddresses = addresses.filter((entry) => isStacksAddress(entry.address));
  const matchingAddress = stacksAddresses.find((entry) =>
    entry.address.toUpperCase().startsWith(networkPrefix)
  );
  const fallbackAddress =
    stacksAddresses.find((entry) => entry.symbol?.toUpperCase() === 'STX') || stacksAddresses[0];
  return matchingAddress?.address || fallbackAddress?.address || null;
}

function getResultAddresses(result: WalletConnectResult): StoredAddress[] {
  return collectAddresses(result);
}

/**
 * Provider component for Stacks wallet state and actions
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('mainnet');
  const [isClient, setIsClient] = useState(false);

  // Initialize on client only
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update address when network changes.
  useEffect(() => {
    const updateStoredAddress = async () => {
      try {
        const { getLocalStorage, isConnected: hasWalletConnection } = await import('@stacks/connect');
        const storedAddresses = getLocalStorage()?.addresses?.stx || [];
        const walletAddress = selectAddress(storedAddresses, network);
        setIsConnected(hasWalletConnection() && Boolean(walletAddress));
        setAddress(walletAddress);
      } catch (error) {
        logger.error('Failed to sync wallet address:', error);
      }
    };

    if (isClient) {
      updateStoredAddress();
    }
  }, [isClient, network]);

  const handleConnect = useCallback(async () => {
    if (!isClient) return;
    
    try {
      const { getLocalStorage, request } = await import('@stacks/connect');
      const result = await request({ forceWalletSelect: true }, 'getAddresses');
      const storage = getLocalStorage();
      const storedAddresses = storage?.addresses?.stx || [];
      const walletAddress = selectAddress(
        [...getResultAddresses(result), ...collectAddresses(storage as WalletAddressSource), ...storedAddresses],
        network
      );
      setIsConnected(Boolean(walletAddress));
      setAddress(walletAddress);
      if (!walletAddress) {
        logger.warn('Wallet connected but no Stacks address was returned', { result, storage });
      }
    } catch (error) {
      logger.error('Connection error:', error);
    }
  }, [isClient, network]);

  const handleDisconnect = useCallback(async () => {
    if (!isClient) return;
    
    try {
      const { disconnect } = await import('@stacks/connect');
      disconnect();
      setIsConnected(false);
      setAddress(null);
    } catch (error) {
      logger.error('Disconnect error:', error);
    }
  }, [isClient]);

  const switchNetwork = useCallback((newNetwork: 'mainnet' | 'testnet') => {
    setNetwork((current) => (current === newNetwork ? current : newNetwork));
  }, []);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        shortAddress: useMemo(() => (address ? truncateAddress(address) : null), [address]),
        isMainnet: network === 'mainnet',
        isTestnet: network === 'testnet',
        network,
        connect: handleConnect,
        disconnect: handleDisconnect,
        switchNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export function getStacksNetwork(network: 'mainnet' | 'testnet'): typeof STACKS_MAINNET | typeof STACKS_TESTNET {
  return network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
}
