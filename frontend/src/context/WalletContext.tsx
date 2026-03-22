'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

import { useWalletState, UserSession } from '../hooks/useWallet';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  network: 'mainnet' | 'testnet';
  userSession: UserSession | null;
  connect: () => void;
  disconnect: () => void;
  switchNetwork: (network: 'mainnet' | 'testnet') => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

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
