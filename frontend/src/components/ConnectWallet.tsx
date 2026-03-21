'use client';

import { useWallet } from '@/context/WalletContext';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import CopyButton from '@/components/ui/CopyButton';
import { truncateAddress } from '@shared/utils/format';

export default function ConnectWallet() {
  const { isConnected, address, network, connect, disconnect, switchNetwork } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);


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
        aria-label="Connect your Stacks wallet"
      >
        Connect Wallet
      </Button>
    );
  }

  const explorerUrl =
    network === 'testnet'
      ? `https://explorer.hiro.so/address/${address}?chain=testnet`
      : `https://explorer.hiro.so/address/${address}?chain=mainnet`;

  return (
    <div ref={wrapperRef} className="relative">
      <Button
        onClick={() => setShowDropdown(!showDropdown)}
        variant="secondary"
        size="md"
        aria-haspopup="menu"
        aria-expanded={showDropdown}
        aria-label={`Wallet menu for address ${truncateAddress(address!)}`}
        className="focus:ring-2 focus:ring-purple-500/50"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
        <span className="font-mono text-sm">{truncateAddress(address!)}</span>
        <ChevronDown className="w-4 h-4" aria-hidden="true" />
      </Button>

      {showDropdown && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50"
        >
          <div className="p-3 border-b border-gray-700">
            <p className="text-xs text-gray-400">Wallet</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 font-mono text-xs text-gray-200 truncate">
                {address}
              </div>
              <CopyButton value={address || ''} />
            </div>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex text-xs text-purple-300 hover:text-purple-200 transition-colors focus:outline-none focus:underline"
              role="menuitem"
              aria-label={`View address ${address} on Stacks Explorer (opens in new tab)`}
            >
              View on explorer
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </div>
          <div className="p-3 border-b border-gray-700">
            <p className="text-xs text-gray-400">Network</p>
            <div className="flex gap-2 mt-2" role="none">
              <button
                type="button"
                onClick={() => {
                  switchNetwork('mainnet');
                  setShowDropdown(false);
                }}
                role="menuitem"
                aria-pressed={network === 'mainnet'}
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
                onClick={() => {
                  switchNetwork('testnet');
                  setShowDropdown(false);
                }}
                role="menuitem"
                aria-pressed={network === 'testnet'}
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
