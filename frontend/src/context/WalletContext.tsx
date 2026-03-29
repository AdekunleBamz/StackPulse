'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

// Types for @stacks/connect - we'll dynamically import the actual module
type UserSession = {
  isUserSignedIn: () => boolean;
  loadUserData: () => { profile: { stxAddress: { mainnet: string; testnet: string } } };
  signUserOut: () => void;
};

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
          // Initial hydrate defaults to mainnet; network-specific switching is handled in a separate effect.
          setAddress(userData.profile?.stxAddress?.mainnet);
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
