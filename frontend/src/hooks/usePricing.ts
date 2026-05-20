import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { toast } from '@/components/Toast';

const DEPLOYER_ADDRESS = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS ?? '';

export const TIER_PRICES_MICROSTACKS: Record<number, number> = {
  0: 0,         // Free
  1: 1000000,   // 1 STX for Basic
  2: 5000000,   // 5 STX for Pro
  3: 20000000,  // 20 STX for Premium
};

type StxPostCondition = {
  type: 'stx-postcondition';
  address: string;
  condition: 'eq';
  amount: number;
};

export function usePricing() {
  const { isConnected, connect, address } = useWallet();
  const [subscribingTier, setSubscribingTier] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (
    username: string, 
    email: string, 
    selectedTier: number = 0,
    onSuccess?: (tier: number, username: string) => void
  ) => {
    if (!isConnected) {
      connect();
      return;
    }

    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) {
      toast.warning('Username required', 'Enter a username to continue.');
      return;
    }

    const price = TIER_PRICES_MICROSTACKS[selectedTier] ?? 0;
    setIsSubmitting(true);
    setSubscribingTier(selectedTier);

    try {
      const { openContractCall } = await import('@stacks/connect');
      const { stringAsciiCV, uintCV } = await import('@stacks/transactions');

      const postConditions: StxPostCondition[] = price > 0 && address ? [
        {
          type: 'stx-postcondition',
          address: address,
          condition: 'eq',
          amount: price
        }
      ] : [];

      await openContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: 'stackpulse-v-j3',
        functionName: 'register-and-subscribe',
        functionArgs: [
          stringAsciiCV(normalizedUsername),
          stringAsciiCV(email || ''),
          uintCV(selectedTier),
          uintCV(31) // Enable all alert types
        ],
        postConditions,
        onFinish: async (data: { txId: string }) => {
          console.log('Registration + Subscription submitted:', data.txId);
          
          // Save notification preferences to server
          try {
            const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://stackpulse-b8fw.onrender.com';
            await fetch(`${serverUrl}/api/users`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address: address,
                username: normalizedUsername,
                email: email || undefined,
                tier: selectedTier,
                enabledAlerts: ['whale', 'contract', 'nft', 'token', 'swap', 'alert', 'badge']
              })
            });
          } catch (err) {
            console.error('Failed to save preferences:', err);
          }
          
          const tierName = selectedTier === 0 ? 'Free' : selectedTier === 2 ? 'Pro' : 'Premium';
          toast.success('Registration submitted', `Tier: ${tierName}. TX: ${data.txId}`);
          
          if (onSuccess) onSuccess(selectedTier, normalizedUsername);
          setSubscribingTier(null);
        },
        onCancel: () => {
          setSubscribingTier(null);
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed', 'Please try again.');
      setSubscribingTier(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubscribe = async (
    tier: number, 
    isRegistered: boolean,
    username: string,
    onSuccess?: (tier: number) => void
  ) => {
    if (!isConnected) {
      connect();
      return;
    }

    if (!isRegistered) {
      if (!username.trim()) {
        toast.warning('Username required', 'Enter a username to register first.');
        return;
      }
      await handleRegister(username, '', tier, (t) => onSuccess?.(t));
      return;
    }

    if (tier === 0) {
      toast.info('Free tier', 'Upgrade below for more features.');
      return;
    }

    const price = TIER_PRICES_MICROSTACKS[tier] ?? 0;
    setIsSubmitting(true);
    setSubscribingTier(tier);

    try {
      const { openContractCall } = await import('@stacks/connect');
      const { uintCV } = await import('@stacks/transactions');

      const postConditions: any[] = price > 0 && address ? [
        {
          type: 'stx-postcondition',
          address: address,
          condition: 'eq',
          amount: price
        }
      ] : [];

      await openContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: 'stackpulse-v-j3',
        functionName: 'upgrade-subscription',
        functionArgs: [uintCV(tier)],
        postConditions,
        onFinish: (data: { txId: string }) => {
          toast.success(
            'Subscription upgraded',
            `${tier === 1 ? 'Basic' : tier === 2 ? 'Pro' : 'Premium'} tier. TX: ${data.txId}`
          );
          if (onSuccess) onSuccess(tier);
          setSubscribingTier(null);
        },
        onCancel: () => {
          setSubscribingTier(null);
        },
      });
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Upgrade failed', 'Please try again.');
      setSubscribingTier(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    subscribingTier,
    isSubmitting,
    handleRegister,
    handleSubscribe
  };
}
