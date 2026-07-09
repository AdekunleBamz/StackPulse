'use client';

import { useWallet } from '@/context/WalletContext';
import { ChevronDown, LogOut, Wallet } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import CopyButton from '@/components/ui/CopyButton';
import { truncateAddress } from '@/utils/address';

export default function ConnectWallet() {
  const { isConnected, address, network, connect, disconnect, switchNetwork } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const safeAddress = address || '';
  const shortAddress = safeAddress ? truncateAddress(safeAddress) : 'connected wallet';
  const dropdownId = `wallet-dropdown-${safeAddress.slice(-6)}`;
  const closeDropdown = useCallback(() => setShowDropdown(false), []);
  const toggleDropdown = useCallback(() => setShowDropdown((prev) => !prev), []);

  useEffect(() => {
    if (!showDropdown) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
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
  }, [closeDropdown, showDropdown]);

  if (!isConnected) {
    return (
      <button
        type="button"
        onClick={connect}
        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-[0_10px_20px_-5px_rgba(168,85,247,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(168,85,247,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group/btn touch-manipulation"
        aria-label="Connect your Stacks wallet"
        title="Connect your Stacks wallet"
      >
        <Wallet className="w-4 h-4" aria-hidden="true" />
        Connect Wallet
      </button>
    );
  }

  const explorerUrl =
    network === 'testnet'
      ? `https://explorer.hiro.so/address/${safeAddress}?chain=testnet`
      : `https://explorer.hiro.so/address/${safeAddress}?chain=mainnet`;

  return (
    <div ref={wrapperRef} className="relative">
      <Button
        onClick={toggleDropdown}
        variant="secondary"
        size="md"
        aria-haspopup="menu"
        aria-expanded={showDropdown}
        aria-controls={showDropdown ? dropdownId : undefined}
        aria-label={`Wallet menu for ${shortAddress}`}
        className="focus:ring-2 focus:ring-purple-500/50"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
        <span className="font-mono text-sm">{shortAddress}</span>
        <ChevronDown className="w-4 h-4" aria-hidden="true" />
      </Button>

      {showDropdown && (
        <div
          id={dropdownId}
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
              aria-label={`View address ${address} on Hiro Explorer (opens in new tab)`}
            >
              View on Hiro Explorer
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
                  closeDropdown();
                }}
                role="menuitemradio"
                aria-checked={network === 'mainnet'}
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
                onClick={() => {
                  switchNetwork('testnet');
                  closeDropdown();
                }}
                role="menuitemradio"
                aria-checked={network === 'testnet'}
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
            onClick={() => {
              disconnect();
              closeDropdown();
            }}
            className="w-full flex items-center gap-2 px-4 py-4 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 rounded-b-2xl font-semibold border-t border-white/5"
            role="menuitem"
            title="Disconnect wallet"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
