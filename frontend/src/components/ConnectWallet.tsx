'use client';

import { useWallet } from '@/context/WalletContext';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function ConnectWallet() {
  const { isConnected, address, network, connect, disconnect, switchNetwork } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <Wallet className="w-5 h-5" />
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-all duration-200 border border-gray-700"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="font-mono text-sm">{truncateAddress(address!)}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50">
          <div className="p-3 border-b border-gray-700">
            <p className="text-xs text-gray-400">Network</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => switchNetwork('mainnet')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  network === 'mainnet'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Mainnet
              </button>
              <button
                onClick={() => switchNetwork('testnet')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  network === 'testnet'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Testnet
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              disconnect();
              setShowDropdown(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-gray-700 transition-colors rounded-b-xl"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
