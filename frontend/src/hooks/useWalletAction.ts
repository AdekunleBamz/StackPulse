import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';

export function useWalletAction() {
  const { isConnected, address, network, connect, disconnect, switchNetwork } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = useCallback(() => {
    setShowDropdown(prev => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setShowDropdown(false);
  }, []);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setShowDropdown(false);
  }, [disconnect]);

  const handleSwitchNetwork = useCallback((net: 'mainnet' | 'testnet') => {
    switchNetwork(net);
    setShowDropdown(false);
  }, [switchNetwork]);

  const explorerUrl = address ? 
    (network === 'testnet'
      ? `https://explorer.hiro.so/address/${address}?chain=testnet`
      : `https://explorer.hiro.so/address/${address}?chain=mainnet`)
    : '';

  return {
    isConnected,
    address,
    network,
    showDropdown,
    explorerUrl,
    connect,
    disconnect: handleDisconnect,
    switchNetwork: handleSwitchNetwork,
    toggleDropdown,
    closeDropdown
  };
}
