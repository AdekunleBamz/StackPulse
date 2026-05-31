import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { toast } from '@/components/Toast';
import { CONTRACT_NAMES, DEPLOYER_ADDRESS } from '@/lib/contracts';

const STACKS_API_URL = 'https://api.mainnet.hiro.so';

/**
 * On-chain account data for a registered StackPulse user.
 * @property tier - Subscription tier (0 = free, 2 = pro, 3 = premium)
 * @property subscriptionEnds - Block height at which subscription expires
 */
export interface UserAccountData {
  username: string;
  tier: number;
  alertsEnabled: number;
  subscriptionEnds: number;
}

export function useAccount() {
  const { address, isConnected, connect } = useWallet();
  const [isRegistered, setIsRegistered] = useState(false);
  const [userData, setUserData] = useState<UserAccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkRegistration = useCallback(async (isManual = false) => {
    if (!address || !DEPLOYER_ADDRESS) {
      setIsLoading(false);
      return;
    }

    let toastId;
    if (isManual) {
      toastId = toast.loading('Syncing Account', 'Fetching latest data from Stacks...');
    }

    try {
      const { principalCV, cvToHex, hexToCV, cvToValue } = await import('@stacks/transactions');
      
      const response = await fetch(
        `${STACKS_API_URL}/v2/contracts/call-read/${DEPLOYER_ADDRESS}/${CONTRACT_NAMES.stackpulse}/get-user`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: address,
            arguments: [cvToHex(principalCV(address))]
          })
        }
      );
      
      const data = await response.json();
      const registered = data.result && data.result !== '0x09';
      setIsRegistered(registered);

      if (registered && data.result) {
        const cv = hexToCV(data.result);
        const val = cvToValue(cv);
        if (val && val.value) {
          setUserData({
            username: val.value.username?.value ?? '',
            tier: Number(val.value.tier?.value ?? 0),
            alertsEnabled: Number(val.value['alerts-enabled']?.value ?? 0),
            subscriptionEnds: Number(val.value['subscription-ends']?.value ?? 0),
          });
          
          localStorage.setItem(`stackpulse_registered_${address}`, JSON.stringify({
            tier: Number(val.value.tier?.value ?? 0),
            username: val.value.username?.value ?? '',
            timestamp: Date.now()
          }));
        }
      } else {
        localStorage.removeItem(`stackpulse_registered_${address}`);
      }
      
      if (isManual) {
        toast.success('Sync Complete', 'Account data updated.');
      }
    } catch (error) {
      console.error('Error checking account:', error);
      if (isManual) {
        toast.error('Sync Failed', 'Could not refresh account data.');
      }
    } finally {
      setIsLoading(false);
      if (toastId) toast.dismiss(toastId);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      const cached = localStorage.getItem(`stackpulse_registered_${address}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setIsRegistered(true);
        setUserData(prev => ({
          username: parsed.username ?? '',
          tier: parsed.tier ?? 0,
          alertsEnabled: prev?.alertsEnabled ?? 0,
          subscriptionEnds: prev?.subscriptionEnds ?? 0
        }));
      }
    }
    
    checkRegistration(false);
  }, [address, checkRegistration]);

  return {
    address,
    isConnected,
    connect,
    isRegistered,
    userData,
    isLoading,
    refresh: () => checkRegistration(true)
  };
}
