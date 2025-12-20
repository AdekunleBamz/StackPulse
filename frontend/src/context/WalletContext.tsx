'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

// Types for @stacks/connect - we'll dynamically import the actual module
type UserSession = {
  isUserSignedIn: () => boolean;
  loadUserData: () => { profile: { stxAddress: { mainnet: string; testnet: string } } };
  signUserOut: () => void;
};

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
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('mainnet');
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Initialize on client only
  useEffect(() => {
    setIsClient(true);
    
    const initWallet = async () => {
      try {
        const { AppConfig, UserSession } = await import('@stacks/connect');
        const appConfig = new AppConfig(['store_write', 'publish_data']);
        const session = new UserSession({ appConfig });
        setUserSession(session as unknown as UserSession);
        
        if (session.isUserSignedIn()) {
          const userData = session.loadUserData();
          setIsConnected(true);
          setAddress(
            network === 'mainnet' 
              ? userData.profile?.stxAddress?.mainnet 
              : userData.profile?.stxAddress?.testnet
          );
        }
      } catch (error) {
        console.error('Failed to initialize wallet:', error);
      }
    };
    
    initWallet();
  }, []);

  // Update address when network changes
  useEffect(() => {
    if (userSession?.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      setAddress(
        network === 'mainnet' 
          ? userData.profile?.stxAddress?.mainnet 
          : userData.profile?.stxAddress?.testnet
      );
    }
  }, [network, userSession]);

  const handleConnect = useCallback(async () => {
    if (!isClient) return;
    
    try {
      const { authenticate, AppConfig, UserSession } = await import('@stacks/connect');
      const appConfig = new AppConfig(['store_write', 'publish_data']);
      const session = new UserSession({ appConfig });
      
      await authenticate({
        appDetails: {
          name: 'StackPulse',
          icon: '/logo.svg',
        },
        onFinish: () => {
          const userData = session.loadUserData();
          setUserSession(session as unknown as UserSession);
          setIsConnected(true);
          setAddress(
            network === 'mainnet' 
              ? userData.profile?.stxAddress?.mainnet 
              : userData.profile?.stxAddress?.testnet
          );
        },
        userSession: session,
      });
    } catch (error) {
      console.error('Connection error:', error);
    }
  }, [isClient, network]);

  const handleDisconnect = useCallback(async () => {
    if (!isClient) return;
    
    try {
      const { disconnect } = await import('@stacks/connect');
      disconnect();
      userSession?.signUserOut();
      setIsConnected(false);
      setAddress(null);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }, [isClient, userSession]);

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
