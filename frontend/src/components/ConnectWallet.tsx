'use client';

import { Wallet, LogOut, ChevronDown } from 'lucide-react';
import { useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import CopyButton from '@/components/ui/CopyButton';
import { truncateAddress } from '@shared/utils/format';
import { useWalletAction } from '@/hooks/useWalletAction';

export default function ConnectWallet() {
  const { 
    isConnected, 
    address, 
    network, 
    showDropdown, 
    explorerUrl,
    connect, 
    disconnect, 
    switchNetwork,
    toggleDropdown,
    closeDropdown
  } = useWalletAction();
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDropdown) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDropdown();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showDropdown, closeDropdown]);

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-[0_10px_20px_-5px_rgba(168,85,247,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(168,85,247,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group/btn"
        aria-label="Connect your Stacks wallet"
      >
        <div className="relative w-4 h-4 mr-1">
          <div className="absolute inset-0 bg-white/20 rounded-full animate-ping group-hover/btn:animate-none opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          <Wallet className="w-4 h-4 text-white relative z-10" strokeWidth={2.5} />
        </div>
        Connect Wallet
      </button>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Button
        onClick={toggleDropdown}
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
          className="absolute right-0 mt-3 w-64 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right"
        >
          <div className="p-3 border-b border-gray-700">
            <p className="text-xs text-gray-400">Wallet</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="min-w-0 flex-1 rounded-xl border border-white/5 bg-gray-950/50 px-3 py-2.5 font-mono text-[10px] text-gray-300 truncate shadow-inner">
                {address}
              </div>
              <CopyButton value={address || ''} className="h-10 w-10 rounded-xl" />
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
                onClick={() => switchNetwork('mainnet')}
                role="menuitem"
                aria-pressed={network === 'mainnet'}
                aria-label="Switch to Mainnet"
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                  network === 'mainnet'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                Mainnet
              </button>
              <button
                type="button"
                onClick={() => switchNetwork('testnet')}
                role="menuitem"
                aria-pressed={network === 'testnet'}
                aria-label="Switch to Testnet"
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                  network === 'testnet'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                Testnet
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={disconnect}
            className="w-full flex items-center gap-2 px-4 py-4 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 rounded-b-2xl font-semibold border-t border-white/5"
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
