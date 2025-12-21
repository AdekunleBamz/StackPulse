'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Wallet, 
  Plus, 
  Settings, 
  Activity,
  Zap,
  FileCode,
  Image,
  Coins,
  ArrowLeftRight,
  Award,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const DEPLOYER_ADDRESS = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || '';

// Alert types matching the contracts and chainhooks
const alertTypes = [
  { id: 1, name: 'Whale Transfers', icon: Wallet, description: 'Large STX transfers (>10,000 STX)', color: 'blue' },
  { id: 2, name: 'Contract Deployments', icon: FileCode, description: 'New smart contract deployments', color: 'purple' },
  { id: 3, name: 'NFT Mints', icon: Image, description: 'NFT collection mints', color: 'pink' },
  { id: 4, name: 'Token Launches', icon: Coins, description: 'New SIP-010 token deployments', color: 'yellow' },
  { id: 5, name: 'Large Swaps', icon: ArrowLeftRight, description: 'DEX swaps over threshold', color: 'green' },
  { id: 6, name: 'Address Watch', icon: Activity, description: 'Monitor specific addresses', color: 'orange' },
];

interface UserAlert {
  id: number;
  type: number;
  name: string;
  enabled: boolean;
  threshold?: number;
  targetAddress?: string;
  triggerCount: number;
}

interface UserData {
  username: string;
  tier: number;
  alertsEnabled: number;
  subscriptionEnds: number;
}

export default function DashboardPage() {
  const { isConnected, address, connect } = useWallet();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [newAlertType, setNewAlertType] = useState(1);
  const [newAlertName, setNewAlertName] = useState('');
  const [newAlertThreshold, setNewAlertThreshold] = useState('10000');
  const [isCreating, setIsCreating] = useState(false);

  const tierNames = ['Free', 'Basic', 'Pro', 'Premium'];
  const maxAlerts = [3, 10, 25, 999];

  // Check user registration and load data
  useEffect(() => {
    const loadUserData = async () => {
      if (!address || !DEPLOYER_ADDRESS) {
        setIsLoading(false);
        return;
      }

      try {
        const { principalCV, cvToHex, hexToCV, cvToValue } = await import('@stacks/transactions');

        // Check V3 contract for user data
        const response = await fetch(
          `https://api.mainnet.hiro.so/v2/contracts/call-read/${DEPLOYER_ADDRESS}/stackpulse-v3-1/get-user`,
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
        
        if (data.result && data.result !== '0x09') {
          try {
            const cv = hexToCV(data.result);
            const parsed = cvToValue(cv);
            if (parsed && parsed.value) {
              setUserData({
                username: parsed.value.username?.value || '',
                tier: Number(parsed.value.tier?.value || 0),
                alertsEnabled: Number(parsed.value['alerts-enabled']?.value || 0),
                subscriptionEnds: Number(parsed.value['subscription-ends']?.value || 0)
              });
            }
          } catch (parseErr) {
            console.error('Error parsing user data:', parseErr);
          }
        }

        // Load alerts from server
        try {
          const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stackpulse-b8fw.onrender.com';
          const alertsResponse = await fetch(`${serverUrl}/api/users/${address}/alerts`);
          if (alertsResponse.ok) {
            const alertsData = await alertsResponse.json();
            if (alertsData.alerts) {
              setAlerts(alertsData.alerts);
            }
          }
        } catch (err) {
          console.error('Error loading alerts:', err);
        }

      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [address]);

  // Create alert on-chain
  const handleCreateAlert = async () => {
    if (!address || !userData) return;

    setIsCreating(true);
    try {
      const { openContractCall } = await import('@stacks/connect');
      const { uintCV, stringAsciiCV, noneCV } = await import('@stacks/transactions');

      await openContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: 'alert-manager-v3',
        functionName: 'create-alert',
        functionArgs: [
          uintCV(newAlertType),
          stringAsciiCV(newAlertName || alertTypes[newAlertType - 1].name),
          noneCV(), // target address (optional)
          uintCV(parseInt(newAlertThreshold) || 10000),
          uintCV(userData.tier)
        ],
        onFinish: async (data: { txId: string }) => {
          console.log('Alert created:', data.txId);
          
          // Save to server too
          try {
            const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stackpulse-b8fw.onrender.com';
            await fetch(`${serverUrl}/api/users/${address}/alerts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: newAlertType,
                name: newAlertName || alertTypes[newAlertType - 1].name,
                threshold: parseInt(newAlertThreshold) || 10000,
                txId: data.txId
              })
            });
          } catch (err) {
            console.error('Error saving alert to server:', err);
          }

          alert(`Alert created! TX: ${data.txId}`);
          setShowCreateAlert(false);
          setNewAlertName('');
          setNewAlertThreshold('10000');
          
          // Add to local state optimistically
          setAlerts(prev => [...prev, {
            id: Date.now(),
            type: newAlertType,
            name: newAlertName || alertTypes[newAlertType - 1].name,
            enabled: true,
            threshold: parseInt(newAlertThreshold),
            triggerCount: 0
          }]);
        },
        onCancel: () => {
          console.log('Alert creation cancelled');
        }
      });
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Failed to create alert. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle alert on/off
  const toggleAlert = async (alertId: number) => {
    // Update local state
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, enabled: !a.enabled } : a
    ));

    // Update on server
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stackpulse-b8fw.onrender.com';
      const alert = alerts.find(a => a.id === alertId);
      await fetch(`${serverUrl}/api/users/${address}/alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !alert?.enabled })
      });
    } catch (err) {
      console.error('Error toggling alert:', err);
    }
  };

  // Delete alert
  const deleteAlert = async (alertId: number) => {
    if (!confirm('Delete this alert?')) return;

    setAlerts(prev => prev.filter(a => a.id !== alertId));

    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stackpulse-b8fw.onrender.com';
      await fetch(`${serverUrl}/api/users/${address}/alerts/${alertId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  // Not connected - show connect prompt
  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400 mb-8">Connect your Stacks wallet to access your dashboard</p>
          <button
            onClick={connect}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all cursor-pointer"
          >
            Connect Wallet
          </button>
        </div>
      </main>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  // Not registered - redirect to pricing
  if (!userData) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bell className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Register First</h1>
          <p className="text-gray-400 mb-8">You need to register on StackPulse before accessing the dashboard</p>
          <button
            onClick={() => router.push('/#pricing')}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all cursor-pointer"
          >
            Register Now
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400">Welcome back, {userData.username || 'User'}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
              <span className="text-gray-400 text-sm">Plan: </span>
              <span className={`font-bold ${
                userData.tier === 0 ? 'text-gray-300' :
                userData.tier === 2 ? 'text-purple-400' :
                'text-yellow-400'
              }`}>
                {tierNames[userData.tier]}
              </span>
            </div>
            <button
              onClick={() => router.push('/#pricing')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-all cursor-pointer"
            >
              {userData.tier === 0 ? 'Upgrade' : 'Manage Plan'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400">Active Alerts</span>
            </div>
            <p className="text-3xl font-bold text-white">{alerts.filter(a => a.enabled).length}</p>
            <p className="text-sm text-gray-500">of {maxAlerts[userData.tier]} max</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400">Triggers Today</span>
            </div>
            <p className="text-3xl font-bold text-white">{alerts.reduce((sum, a) => sum + a.triggerCount, 0)}</p>
            <p className="text-sm text-gray-500">notifications sent</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-green-400" />
              <span className="text-gray-400">Alert Types</span>
            </div>
            <p className="text-3xl font-bold text-white">{new Set(alerts.map(a => a.type)).size}</p>
            <p className="text-sm text-gray-500">categories monitored</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400">Badges Earned</span>
            </div>
            <p className="text-3xl font-bold text-white">0</p>
            <p className="text-sm text-gray-500">reputation NFTs</p>
          </div>
        </div>

        {/* Alert Types Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Available Alert Types</h2>
            <button
              onClick={() => setShowCreateAlert(true)}
              disabled={alerts.length >= maxAlerts[userData.tier]}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Create Alert
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {alertTypes.map((type) => (
              <div key={type.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${type.color}-500/20`}>
                    <type.icon className={`w-5 h-5 text-${type.color}-400`} />
                  </div>
                  <h3 className="text-white font-semibold">{type.name}</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">{type.description}</p>
                <button
                  onClick={() => {
                    setNewAlertType(type.id);
                    setNewAlertName(type.name);
                    setShowCreateAlert(true);
                  }}
                  disabled={alerts.length >= maxAlerts[userData.tier]}
                  className="w-full py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:text-gray-500"
                >
                  {alerts.some(a => a.type === type.id) ? 'Add Another' : 'Enable'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* My Alerts Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">My Alerts</h2>
          
          {alerts.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No Alerts Yet</h3>
              <p className="text-gray-400 mb-4">Create your first alert to start monitoring the blockchain</p>
              <button
                onClick={() => setShowCreateAlert(true)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-all cursor-pointer"
              >
                Create Your First Alert
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const alertType = alertTypes.find(t => t.id === alert.type);
                return (
                  <div key={alert.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${alert.enabled ? 'bg-purple-500/20' : 'bg-gray-700'}`}>
                        {alertType && <alertType.icon className={`w-5 h-5 ${alert.enabled ? 'text-purple-400' : 'text-gray-500'}`} />}
                      </div>
                      <div>
                        <h4 className={`font-semibold ${alert.enabled ? 'text-white' : 'text-gray-500'}`}>{alert.name}</h4>
                        <p className="text-gray-500 text-sm">
                          {alertType?.description} • {alert.triggerCount} triggers
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleAlert(alert.id)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-all cursor-pointer"
                      >
                        {alert.enabled ? (
                          <ToggleRight className="w-6 h-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-500" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Alert Modal */}
        {showCreateAlert && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-purple-500/30">
              <h3 className="text-xl font-bold text-white mb-6">Create New Alert</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Alert Type</label>
                  <select
                    value={newAlertType}
                    onChange={(e) => {
                      setNewAlertType(parseInt(e.target.value));
                      setNewAlertName(alertTypes[parseInt(e.target.value) - 1].name);
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    {alertTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Alert Name</label>
                  <input
                    type="text"
                    value={newAlertName}
                    onChange={(e) => setNewAlertName(e.target.value)}
                    placeholder="My Whale Alert"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {(newAlertType === 1 || newAlertType === 5) && (
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Threshold (STX)</label>
                    <input
                      type="number"
                      value={newAlertThreshold}
                      onChange={(e) => setNewAlertThreshold(e.target.value)}
                      placeholder="10000"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-gray-500 text-xs mt-1">Alert when transfers exceed this amount</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateAlert(false)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAlert}
                  disabled={isCreating || !newAlertName.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Alert'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
