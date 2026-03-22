'use client';

import { useState, useEffect, useCallback } from 'react';

export type UserSession = {
  isUserSignedIn: () => boolean;
  loadUserData: () => { profile: { stxAddress: { mainnet: string; testnet: string } } };
  signUserOut: () => void;
};

export function useWalletState(network: 'mainnet' | 'testnet' = 'mainnet') {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  const initSession = useCallback(async () => {
    try {
      const { AppConfig, UserSession } = await import('@stacks/connect');
      const appConfig = new AppConfig(['store_write', 'publish_data']);
      const session = new UserSession({ appConfig });
      setUserSession(session as unknown as UserSession);
      
      if (session.isUserSignedIn()) {
        const userData = session.loadUserData();
        setIsConnected(true);
        setAddress(network === 'mainnet' ? userData.profile?.stxAddress?.mainnet : userData.profile?.stxAddress?.testnet);
      }
      return session;
    } catch (error) {
      console.error('useWallet: Init error', error);
      return null;
    }
  }, [network]);

  const connect = useCallback(async () => {
    try {
      const { authenticate, AppConfig, UserSession } = await import('@stacks/connect');
      const appConfig = new AppConfig(['store_write', 'publish_data']);
      const session = new UserSession({ appConfig });
      
      await authenticate({
        appDetails: { name: 'StackPulse', icon: '/logo.svg' },
        onFinish: () => {
          const userData = session.loadUserData();
          setUserSession(session as unknown as UserSession);
          setIsConnected(true);
          setAddress(network === 'mainnet' ? userData.profile?.stxAddress?.mainnet : userData.profile?.stxAddress?.testnet);
        },
        userSession: session,
      });
    } catch (error) {
      console.error('useWallet: Connect error', error);
    }
  }, [network]);

  const disconnect = useCallback(async () => {
    try {
      const { disconnect: stacksDisconnect } = await import('@stacks/connect');
      stacksDisconnect();
      userSession?.signUserOut();
      setIsConnected(false);
      setAddress(null);
    } catch (error) {
      console.error('useWallet: Disconnect error', error);
    }
  }, [userSession]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  return { isConnected, address, userSession, connect, disconnect };
}
