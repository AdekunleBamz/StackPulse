'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

import { useWalletState, UserSession } from '../hooks/useWallet';

/**
 * Context type for Stacks wallet management
 */
interface WalletContextType {
  /** Whether a wallet is currently connected */
  isConnected: boolean;
  /** The current Stacks address of the connected user */
  address: string | null;
  /** The active Stacks network (mainnet or testnet) */
  network: 'mainnet' | 'testnet';
  /** The @stacks/connect UserSession instance */
  userSession: UserSession | null;
  /** Initiates the Stacks wallet connection flow */
  connect: () => void;
  /** Disconnects the current wallet session */
  disconnect: () => void;
  /** Switches between mainnet and testnet */
  switchNetwork: (network: 'mainnet' | 'testnet') => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

/**
 * Provider component for Stacks wallet state and actions
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('mainnet');
  const { isConnected, address, userSession, connect, disconnect } = useWalletState(network);

  const switchNetwork = useCallback((newNetwork: 'mainnet' | 'testnet') => {
    setNetwork(newNetwork);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        network,
        userSession,
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

export function getStacksNetwork(network: 'mainnet' | 'testnet') {
  return network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
}
