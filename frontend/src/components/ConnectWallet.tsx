'use client';

import { useWallet } from '@/context/WalletContext';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';

export default function ConnectWallet() {
  const { isConnected, address, network, connect, disconnect, switchNetwork } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  useEffect(() => {
    if (!showDropdown) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setShowDropdown(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDropdown(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showDropdown]);

  if (!isConnected) {
    return (
      <Button
        onClick={connect}
        variant="primary"
        size="lg"
        leftIcon={<Wallet className="w-5 h-5" />}
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Button
        onClick={() => setShowDropdown(!showDropdown)}
        variant="secondary"
        size="md"
        aria-haspopup="menu"
        aria-expanded={showDropdown}
      >
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="font-mono text-sm">{truncateAddress(address!)}</span>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {showDropdown && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50"
        >
          <div className="p-3 border-b border-gray-700">
            <p className="text-xs text-gray-400">Network</p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
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
                type="button"
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
            type="button"
            onClick={() => {
              disconnect();
              setShowDropdown(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-gray-700 transition-colors rounded-b-xl"
            role="menuitem"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
