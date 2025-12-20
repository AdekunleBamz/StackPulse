'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfig, UserSession, authenticate, disconnect } from '@stacks/connect';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  network: 'mainnet' | 'testnet';
  userSession: UserSession;
  connect: () => void;
  disconnect: () => void;
  switchNetwork: (network: 'mainnet' | 'testnet') => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('mainnet');

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      setIsConnected(true);
      setAddress(
        network === 'mainnet' 
          ? userData.profile.stxAddress.mainnet 
          : userData.profile.stxAddress.testnet
      );
    }
  }, [network]);

  const handleConnect = async () => {
    try {
      await authenticate({
        appDetails: {
          name: 'StackPulse',
          icon: '/logo.png',
        },
        onFinish: () => {
          const userData = userSession.loadUserData();
          setIsConnected(true);
          setAddress(
            network === 'mainnet' 
              ? userData.profile.stxAddress.mainnet 
              : userData.profile.stxAddress.testnet
          );
        },
        userSession,
      });
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    userSession.signUserOut();
    setIsConnected(false);
    setAddress(null);
  };

  const switchNetwork = (newNetwork: 'mainnet' | 'testnet') => {
    setNetwork(newNetwork);
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      setAddress(
        newNetwork === 'mainnet' 
          ? userData.profile.stxAddress.mainnet 
          : userData.profile.stxAddress.testnet
      );
    }
  };

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
