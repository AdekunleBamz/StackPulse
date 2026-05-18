'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Award, ArrowLeft, Share2, Check, ExternalLink } from 'lucide-react';
import BadgeShowcase from '@/components/BadgeShowcase';
import { toast } from '@/components/Toast';
import { Breadcrumbs } from '@/components';
import { useWallet } from '@/context/WalletContext';

// Badge type definitions
const badgeDetails = [
  {
    id: 1,
    name: 'Early Adopter',
    description: 'Among the first 100 StackPulse users. This limited edition badge recognizes the pioneers who believed in StackPulse from the very beginning.',
    icon: '🌟',
    maxSupply: 100,
    requirements: ['Be among the first 100 registered users'],
    benefits: ['Exclusive Discord role', '10% discount on upgrades'],
    rarity: 'legendary',
  },
  {
    id: 2,
    name: 'Whale Watcher',
    description: 'Successfully detected 10 or more whale transfers using StackPulse alerts. You have keen eyes for big moves in the Stacks ecosystem.',
    icon: '🐋',
    maxSupply: 0,
    requirements: ['Have 10+ whale transfer alerts triggered'],
    benefits: ['Custom whale alert sounds', 'Priority notification delivery'],
    rarity: 'common',
  },
  {
    id: 3,
    name: 'Alert Master',
    description: 'Created 25 or more alerts on StackPulse. You are a power user who knows exactly what to monitor in the blockchain.',
    icon: '🔔',
    maxSupply: 0,
    requirements: ['Create 25+ active alerts'],
    benefits: ['Increased alert limit (+5 bonus)', 'Alert templates access'],
    rarity: 'rare',
  },
  {
    id: 4,
    name: 'Power User',
    description: 'Upgraded to Pro or Premium tier, supporting the StackPulse ecosystem and unlocking advanced features.',
    icon: '⚡',
    maxSupply: 0,
    requirements: ['Subscribe to Pro or Premium tier'],
    benefits: ['All tier benefits', 'Power User Discord channel'],
    rarity: 'epic',
  },
  {
    id: 5,
    name: 'Referral Champion',
    description: 'Referred 5 or more users to StackPulse. You are helping grow the community!',
    icon: '🤝',
    maxSupply: 0,
    requirements: ['Successfully refer 5+ new users'],
    benefits: ['5% of referred users\' subscription fees', 'Referral leaderboard placement'],
    rarity: 'rare',
  },
  {
    id: 6,
    name: 'Year One',
    description: 'Maintained an active StackPulse account for one full year. Your loyalty is appreciated!',
    icon: '🎂',
    maxSupply: 0,
    requirements: ['Be an active user for 365+ days'],
    benefits: ['Anniversary discount', 'Exclusive yearly rewards'],
    rarity: 'epic',
  },
  {
    id: 7,
    name: 'Community Builder',
    description: 'Active participant in StackPulse governance and community discussions.',
    icon: '🏛️',
    maxSupply: 0,
    requirements: ['Participate in 3+ governance proposals', 'Active in Discord community'],
    benefits: ['Governance voting weight bonus', 'Community leadership role'],
    rarity: 'rare',
  },
  {
    id: 8,
    name: 'Bug Hunter',
    description: 'Reported valid bugs that helped improve StackPulse. Security and quality heroes!',
    icon: '🐛',
    maxSupply: 0,
    requirements: ['Report valid bugs through official channels', 'Bugs must be confirmed by team'],
    benefits: ['Bug bounty rewards', 'Security researcher recognition'],
    rarity: 'epic',
  },
  {
    id: 9,
    name: 'StackPulse OG',
    description: 'Original beta tester who helped shape StackPulse before public launch. Forever immortalized in the blockchain.',
    icon: '👑',
    maxSupply: 50,
    requirements: ['Participated in beta testing', 'Provided feedback during development'],
    benefits: ['Lifetime Pro features', 'OG Discord role', 'All future badge drops'],
    rarity: 'legendary',
  },
];

const rarityColors = {
  common: { bg: 'from-gray-500 to-gray-600', text: 'text-gray-300' },
  rare: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-300' },
  epic: { bg: 'from-purple-500 to-purple-600', text: 'text-purple-300' },
  legendary: { bg: 'from-yellow-500 to-orange-500', text: 'text-yellow-300' },
};

export default function BadgesPage() {
  const { address, isConnected } = useWallet();

  const userBadges = useMemo(() => {
    if (!isConnected || !address) return [];
    try {
      const raw = localStorage.getItem(`stackpulse:badges:${address}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((id) => Number.isInteger(id)) : [];
    } catch {
      return [];
    }
  }, [address, isConnected]);

  const legendaryEarnedCount = useMemo(
    () => badgeDetails.filter((badge) => badge.rarity === 'legendary' && userBadges.includes(badge.id)).length,
    [userBadges]
  );
  const finiteSupplyTotal = useMemo(
    () => badgeDetails.reduce((sum, badge) => sum + (badge.maxSupply ?? 0), 0),
    []
  );

  const shareCollection = useCallback(async () => {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: 'My StackPulse badges',
          text: 'Check out my StackPulse reputation badges.',
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copied', 'Share it anywhere.');
    } catch {
      toast.error('Share failed', 'Please try again.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-400" />
                <h1 className="text-xl font-semibold">Reputation Badges</h1>
              </div>
            </div>
	            <div className="flex items-center gap-2">
	              <button
	                type="button"
	                onClick={shareCollection}
	                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all"
	                aria-label="Share badge collection"
	              >
	                <Share2 className="w-4 h-4" />
	                <span className="hidden sm:inline">Share Collection</span>
	              </button>
	            </div>
          </div>
        </div>
	      </header>

	      <main id="main">
            <div className="container mx-auto px-4 pt-8 -mb-4">
              <Breadcrumbs />
            </div>
	        {/* Hero */}
	        <section className="py-12 bg-gradient-to-b from-purple-900/20 to-transparent">
	          <div className="container mx-auto px-4 text-center">
	            <h2 className="text-4xl font-bold mb-4">
	              Collect NFT Badges
	            </h2>
	            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
	              Earn unique SIP-009 NFT badges by using StackPulse. Each badge represents your achievements 
	              and contributions to the Stacks ecosystem. Display them proudly!
	            </p>
	            <div className="flex justify-center gap-4">
		            <a
		              href="https://explorer.hiro.so/address/SP1THTSTZ8RQGD8R3GKPGK3ABQ908BD8X85P3J6X9.reputation-badges-v-j4?chain=mainnet"
		              target="_blank"
		              rel="noopener noreferrer"
		              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90"
	              aria-label="View badges contract on Hiro Explorer"
	            >
	              View Contract
	              <ExternalLink className="w-4 h-4" />
	            </a>
	            </div>
	          </div>
	        </section>

	        {/* Stats */}
	        <section className="py-8 border-b border-gray-800">
	          <div className="container mx-auto px-4">
	            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
	              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
	                <div className="text-3xl font-bold text-white">{badgeDetails.length}</div>
	                <div className="text-gray-400 text-sm">Total Badges</div>
	              </div>
	              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
	                <div className="text-3xl font-bold text-purple-400">{userBadges.length}</div>
	                <div className="text-gray-400 text-sm">Earned</div>
	              </div>
		              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
		                <div className="text-3xl font-bold text-yellow-400">{legendaryEarnedCount}</div>
		                <div className="text-gray-400 text-sm">Legendary</div>
		              </div>
		              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
		                <div className="text-3xl font-bold text-green-400">{finiteSupplyTotal}</div>
		                <div className="text-gray-400 text-sm">Total Supply</div>
		              </div>
	            </div>
	          </div>
	        </section>

	        {/* Badge Showcase */}
	        <section className="py-8">
	          <div className="container mx-auto px-4">
	            <BadgeShowcase userBadges={userBadges} />
	          </div>
	        </section>

	        {/* Badge Details Section */}
	        <section className="py-12 bg-gray-900/30">
	          <div className="container mx-auto px-4">
	            <h3 className="text-2xl font-semibold mb-8">Badge Details</h3>
	            
	            <div className="grid gap-6">
	              {badgeDetails.map((badge) => {
	                const isEarned = userBadges.includes(badge.id);
	                const colors = rarityColors[badge.rarity as keyof typeof rarityColors];
	                
	                return (
	                  <div
	                    key={badge.id}
	                    className={`bg-gray-900/50 border rounded-xl p-6 transition-all ${
	                      isEarned ? 'border-purple-500/50' : 'border-gray-800'
	                    }`}
	                  >
	                    <div className="flex flex-col md:flex-row gap-6">
	                      {/* Badge Icon */}
	                      <div className={`w-24 h-24 rounded-xl flex items-center justify-center text-5xl bg-gradient-to-br ${colors.bg} bg-opacity-20 flex-shrink-0`}>
	                        {isEarned ? badge.icon : '🔒'}
	                      </div>

                    {/* Badge Info */}
                    <div className="flex-1">
	                      <div className="flex items-start justify-between mb-2">
	                        <div>
	                          <h4 className="text-xl font-semibold text-white flex items-center gap-2">
	                            {badge.name}
	                            {isEarned && <Check className="w-5 h-5 text-green-400" />}
	                          </h4>
	                          <span className={`text-sm font-medium ${colors.text}`}>
	                            {badge.rarity.toUpperCase()}
	                          </span>
	                        </div>
	                        <div className="flex flex-col items-end gap-2">
	                          <span
	                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
	                              isEarned
	                                ? 'bg-green-500/10 text-green-300 border border-green-500/20'
	                                : 'bg-gray-800 text-gray-300 border border-gray-700'
	                            }`}
	                          >
	                            {isEarned ? 'Earned' : 'Locked'}
	                          </span>
	                          {badge.maxSupply > 0 && (
	                            <span className="text-sm text-gray-500">
	                              Limited: {badge.maxSupply} max
	                            </span>
	                          )}
	                        </div>
	                      </div>
                      
                      <p className="text-gray-400 mb-4">{badge.description}</p>

                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Requirements */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Requirements</h5>
                          <ul className="space-y-1">
                            {badge.requirements.map((req, i) => (
                              <li key={i} className="text-sm text-gray-500 flex items-start gap-2">
                                <span className="text-gray-600">•</span>
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Benefits */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Benefits</h5>
                          <ul className="space-y-1">
                            {badge.benefits.map((benefit, i) => (
                              <li key={i} className="text-sm text-gray-500 flex items-start gap-2">
                                <span className="text-purple-400">✓</span>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

	        {/* CTA */}
	        <section className="py-12">
	          <div className="container mx-auto px-4 text-center">
	            <h3 className="text-2xl font-semibold mb-4">Start Earning Badges</h3>
	            <p className="text-gray-400 mb-6">
	              Create alerts, monitor the blockchain, and unlock unique NFT badges
	            </p>
	            <Link
	              href="/register"
	              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-medium transition-all"
	            >
	              Get Started Free
	            </Link>
	          </div>
	        </section>
	      </main>
	    </div>
	  );
	}
