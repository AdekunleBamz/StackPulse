'use client';

import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useRouter } from 'next/navigation';

const DEPLOYER_ADDRESS = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || '';

export default function RegisterPage() {
  const { isConnected, address, connect } = useWallet();
  const [username, setUsername] = useState('');
  const [referrer, setReferrer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isConnected) {
      connect();
      return;
    }

    if (!username || username.length < 3 || username.length > 32) {
      setError('Username must be between 3 and 32 characters');
      return;
    }

    // Only allow alphanumeric and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    setIsLoading(true);

    try {
      const { openContractCall } = await import('@stacks/connect');
      const { stringAsciiCV, noneCV, someCV, principalCV } = await import('@stacks/transactions');

      const referrerArg = referrer && referrer.startsWith('SP') 
        ? someCV(principalCV(referrer))
        : noneCV();

      await openContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: 'stackpulse-registry',
        functionName: 'register',
        functionArgs: [stringAsciiCV(username), referrerArg],
        onFinish: (data: { txId: string }) => {
          console.log('Registration submitted:', data.txId);
          alert(`Registration submitted! TX: ${data.txId}\n\nYou'll be redirected to pricing once confirmed.`);
          // Redirect to pricing after a delay
          setTimeout(() => router.push('/#pricing'), 2000);
        },
        onCancel: () => {
          console.log('Registration cancelled');
          setIsLoading(false);
        },
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to submit registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="mb-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>

        {/* Registration Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Create Your Account</h1>
            <p className="text-gray-400">Register to start monitoring the Stacks blockchain</p>
          </div>

          {/* Wallet Status */}
          {!isConnected ? (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-yellow-400 text-sm text-center">
                Please connect your wallet first
              </p>
              <button
                onClick={connect}
                className="mt-3 w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <p className="text-green-400 text-sm text-center">
                Connected: {address?.slice(0, 8)}...{address?.slice(-6)}
              </p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username *
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="your_username"
                maxLength={32}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                disabled={!isConnected}
              />
              <p className="mt-1 text-xs text-gray-500">3-32 characters, letters, numbers, underscores only</p>
            </div>

            <div>
              <label htmlFor="referrer" className="block text-sm font-medium text-gray-300 mb-2">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                id="referrer"
                value={referrer}
                onChange={(e) => setReferrer(e.target.value)}
                placeholder="SP... (referrer's address)"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                disabled={!isConnected}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!isConnected || isLoading || !username}
              className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95 ${
                isConnected && username
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/30'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Registering...
                </span>
              ) : (
                'Register Account'
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">
              Registration is free! After registering, you can subscribe to a plan to unlock premium features.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
