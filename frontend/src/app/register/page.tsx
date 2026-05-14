'use client';

import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/Toast';
import TextField from '@/components/ui/TextField';
import { Breadcrumbs } from '@/components';
import { DEPLOYER_ADDRESS } from '@/lib/env';
import logger from '@/lib/logger';

export default function RegisterPage() {
  const { isConnected, connect, address } = useWallet();
  const [username, setUsername] = useState('');
  const [referrer, setReferrer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loadingStep, setLoadingStep] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setSubmitError('');

    if (!isConnected) {
      connect();
      return;
    }

    if (!username || username.length < 3 || username.length > 32) {
      setUsernameError('Username must be between 3 and 32 characters.');
      return;
    }

    // Only allow alphanumeric and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Use only letters, numbers, and underscores.');
      return;
    }

    setIsLoading(true);
    setLoadingStep('Preparing...');
    const toastId = toast.loading('Registering', 'Preparing registration transaction...');
 
    try {
      setLoadingStep('Connecting...');
      const { openContractCall } = await import('@stacks/connect');
      const { stringAsciiCV, uintCV } = await import('@stacks/transactions');
 
      setLoadingStep('Signature required...');
      // V-J3 contract: register-and-subscribe in one step (tier 0 = free)
      await openContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: 'stackpulse-v-j4',
        functionName: 'register-and-subscribe',
        functionArgs: [
          stringAsciiCV(username),
          stringAsciiCV(''), // email (optional)
          uintCV(0), // Free tier
          uintCV(31) // All alerts enabled
        ],
        onFinish: (data: { txId: string }) => {
          setLoadingStep('Success!');
          logger.info('Registration submitted:', data.txId);
          toast.dismiss(toastId);
          toast.success('Registration submitted', `TX: ${data.txId}`);
          // Redirect to pricing after a delay
          setTimeout(() => router.push('/#pricing'), 2000);
        },
        onCancel: () => {
          logger.debug('Registration cancelled');
          toast.dismiss(toastId);
          setIsLoading(false);
          setLoadingStep('');
        },
      });
    } catch (err) {
      logger.error('Registration error:', err);
      toast.dismiss(toastId);
      toast.error('Registration failed', 'Please try again.');
      setSubmitError('Failed to submit registration. Please try again.');
      setLoadingStep('');
      setIsLoading(false);
    } finally {
      // Note: loading state handled in callbacks
    }
  };

  return (
    <main id="main" className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Back button */}
          <button
            type="button"
            onClick={() => router.push('/')}
            className="group mb-10 text-gray-500 hover:text-white transition-all flex items-center gap-2.5 font-bold text-sm uppercase tracking-widest"
          >
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          Back to Home
        </button>

        <Breadcrumbs className="mb-8 w-full" />

        {/* Registration Card */}
        <div className="relative bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-purple-600 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/20 rotate-3 hover:rotate-0 transition-transform duration-500">
              <svg className="w-10 h-10 text-white fill-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Create Account</h1>
            <p className="text-gray-400 font-medium leading-relaxed">Join the next generation of Stacks monitoring</p>
          </div>

          {/* Wallet Status */}
          {!isConnected ? (
            <div className="mb-8 p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col items-center gap-4 group/wallet-prompt">
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center group-hover/wallet-prompt:scale-110 transition-transform">
                <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-amber-200/80 text-sm font-medium text-center">
                Stacks wallet connection required for registration
              </p>
              <button
                type="button"
                onClick={connect}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/20 active:scale-95"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="mb-8 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-emerald-400/90 text-sm font-mono font-bold">
                  {address?.slice(0, 8)}...{address?.slice(-6)}
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest">Connected</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-6">
            <TextField
              label="Username *"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="your_username"
              maxLength={32}
              disabled={!isConnected}
              error={usernameError || undefined}
              hint="3–32 characters, letters/numbers/underscores only"
              autoComplete="username"
              spellCheck={false}
            />

            <TextField
              label="Referral Code (Optional)"
              value={referrer}
              onChange={(e) => setReferrer(e.target.value)}
              placeholder="SP... (referrer's address)"
              disabled={!isConnected}
              autoComplete="off"
              spellCheck={false}
            />

            <div className="space-y-4">
              {submitError && (
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  <p className="text-red-400 text-[11px] font-bold uppercase tracking-wider">{submitError}</p>
                </div>
              )}
 
              <button
                type="submit"
                disabled={!isConnected || isLoading || !username}
                className={`w-full py-4.5 rounded-2xl font-bold transition-all duration-300 cursor-pointer transform hover:scale-[1.02] active:scale-95 ${
                  isConnected && username
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-500/20'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                }`}
              >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {loadingStep || 'Registering...'}
                </span>
              ) : (
                'Register Account'
              )}
            </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-10 pt-8 border-t border-white/5 flex items-start gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              <strong className="text-gray-200 block mb-0.5 uppercase tracking-wider">Free Registration</strong>
              Join StackPulse for free today. Once registered, you can explore our premium subscription plans to unlock advanced real-time monitoring features.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
