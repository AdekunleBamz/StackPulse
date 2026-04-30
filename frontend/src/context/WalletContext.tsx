'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import logger from '@/lib/logger';
import { truncateAddress } from '@/utils';

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
  /** Truncated form of the address for display (e.g. "SP1234...5678"). Null when not connected. */
  shortAddress: string | null;
  /** True when the active network is mainnet. */
  isMainnet: boolean;
  /** True when the active network is testnet. */
  isTestnet: boolean;
  /** The active Stacks network (mainnet or testnet) */
  network: 'mainnet' | 'testnet';
  /** The @stacks/connect UserSession instance */
  userSession: UserSession | null;
  /** Initiates the Stacks wallet connection flow */
  connect: () => Promise<void>;
  /** Disconnects the current wallet session */
  disconnect: () => Promise<void>;
  /** Switches between mainnet and testnet */
  switchNetwork: (network: 'mainnet' | 'testnet') => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

const WALLET_APP_NAME = 'StackPulse';
const WALLET_APP_ICON = '/logo.svg';
const WALLET_APP_PERMISSIONS = ['store_write', 'publish_data'] as const;

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
        logger.error('Failed to initialize wallet:', error);
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
      const appConfig = new AppConfig([...WALLET_APP_PERMISSIONS]);
      const session = new UserSession({ appConfig });
      
      await authenticate({
        appDetails: {
          name: WALLET_APP_NAME,
          icon: WALLET_APP_ICON,
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
      logger.error('Connection error:', error);
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
      logger.error('Disconnect error:', error);
    }
  }, [isClient, userSession]);

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

export function getStacksNetwork(network: 'mainnet' | 'testnet'): typeof STACKS_MAINNET | typeof STACKS_TESTNET {
  return network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
}
