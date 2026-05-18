'use client';

import { useState, useMemo } from 'react';
import { Award, Lock, Check, ExternalLink } from 'lucide-react';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  maxSupply: number;
  mintedCount: number;
  earned: boolean;
  tokenId?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const badges: Badge[] = [
  {
    id: 1,
    name: 'Early Adopter',
    description: 'Among the first 100 StackPulse users',
    icon: '🌟',
    maxSupply: 100,
    mintedCount: 87,
    earned: false,
    rarity: 'legendary',
  },
  {
    id: 2,
    name: 'Whale Watcher',
    description: 'Detected 10+ whale transfers',
    icon: '🐋',
    maxSupply: 0,
    mintedCount: 234,
    earned: false,
    rarity: 'common',
  },
  {
    id: 3,
    name: 'Alert Master',
    description: 'Created 25+ alerts',
    icon: '🔔',
    maxSupply: 0,
    mintedCount: 156,
    earned: false,
    rarity: 'rare',
  },
  {
    id: 4,
    name: 'Power User',
    description: 'Pro or Premium subscriber',
    icon: '⚡',
    maxSupply: 0,
    mintedCount: 89,
    earned: false,
    rarity: 'epic',
  },
  {
    id: 5,
    name: 'Referral Champion',
    description: 'Referred 5+ users',
    icon: '🤝',
    maxSupply: 0,
    mintedCount: 67,
    earned: false,
    rarity: 'rare',
  },
  {
    id: 6,
    name: 'Year One',
    description: 'Active for 1 year',
    icon: '🎂',
    maxSupply: 0,
    mintedCount: 12,
    earned: false,
    rarity: 'epic',
  },
  {
    id: 7,
    name: 'Community Builder',
    description: 'Active in governance',
    icon: '🏛️',
    maxSupply: 0,
    mintedCount: 45,
    earned: false,
    rarity: 'rare',
  },
  {
    id: 8,
    name: 'Bug Hunter',
    description: 'Reported valid bugs',
    icon: '🐛',
    maxSupply: 0,
    mintedCount: 23,
    earned: false,
    rarity: 'epic',
  },
  {
    id: 9,
    name: 'StackPulse OG',
    description: 'Original beta tester',
    icon: '👑',
    maxSupply: 50,
    mintedCount: 50,
    earned: false,
    rarity: 'legendary',
  },
];

const rarityColors = {
  common: 'from-slate-500 to-slate-600',
  rare: 'from-blue-500 to-indigo-600',
  epic: 'from-purple-500 to-pink-600',
  legendary: 'from-amber-400 to-orange-500',
};

const rarityBorders = {
  common: 'border-gray-600',
  rare: 'border-blue-500/50',
  epic: 'border-purple-500/50',
  legendary: 'border-yellow-500/50',
};

interface BadgeCardProps {
  badge: Badge;
  onClick?: () => void;
}

function BadgeCard({ badge, onClick }: BadgeCardProps) {
  const isLimited = badge.maxSupply > 0;
  const isSoldOut = isLimited && badge.mintedCount >= badge.maxSupply;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-105 text-left w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
        badge.earned
          ? `bg-gradient-to-br ${rarityColors[badge.rarity]} bg-opacity-20 ${rarityBorders[badge.rarity]} hover:shadow-lg hover:border-white/20 ${
              badge.rarity === 'legendary' || badge.rarity === 'epic' ? 'shadow-[0_0_20px_rgba(168,85,247,0.2)]' : ''
            }`
          : 'bg-gray-800/50 border-gray-700 opacity-60 hover:opacity-80'
      }`}
      aria-label={`${badge.name} badge, ${badge.rarity} rarity. ${badge.earned ? 'Earned' : 'Locked'}. ${badge.description}`}
    >
      {/* Rarity indicator */}
      <div
        className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${
          rarityColors[badge.rarity]
        }`}
      >
        {badge.rarity}
      </div>

      {/* Badge icon */}
      <div className="text-5xl mb-3 filter drop-shadow-lg">
        {badge.earned ? badge.icon : '🔒'}
      </div>

      {/* Badge info */}
      <h3 className="font-semibold text-white mb-1">{badge.name}</h3>
      <p className="text-gray-400 text-sm mb-3">{badge.description}</p>

      {/* Supply info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 font-medium">
          {isLimited ? (
            <span className={isSoldOut ? 'text-red-400/80' : ''}>
              {badge.mintedCount.toLocaleString()} / {badge.maxSupply.toLocaleString()} minted
            </span>
          ) : (
            <>{badge.mintedCount.toLocaleString()} minted</>
          )}
        </span>
        {badge.earned ? (
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            Earned
          </span>
        ) : isSoldOut ? (
          <span className="text-rose-400 font-medium">Sold out</span>
        ) : (
          <span className="text-gray-500/80">Locked</span>
        )}
      </div>

      {/* Progress bar for limited badges */}
      {isLimited && (
        <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${rarityColors[badge.rarity]}`}
            style={{ width: `${(badge.mintedCount / badge.maxSupply) * 100}%` }}
          />
        </div>
      )}
    </button>
  );
}

interface BadgeShowcaseProps {
  userBadges?: number[];
}

export default function BadgeShowcase({ userBadges = [] }: BadgeShowcaseProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  // Use Set for O(1) lookup
  const userBadgeSet = useMemo(() => new Set(userBadges), [userBadges]);

  // Mark user's badges as earned
  const displayBadges = useMemo(
    () => badges.map(badge => ({ ...badge, earned: userBadgeSet.has(badge.id) })),
    [userBadgeSet]
  );

  const filteredBadges = useMemo(() => displayBadges.filter(badge => {
    if (filter === 'earned') return badge.earned;
    if (filter === 'locked') return !badge.earned;
    return true;
  }), [displayBadges, filter]);

  const earnedCount = useMemo(() => displayBadges.filter(b => b.earned).length, [displayBadges]);

  return (
    <div 
      className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6"
      role="region"
      aria-label="Reputation Badges Collection"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">Reputation Badges</h2>
            <p className="text-gray-400 text-sm">
              {earnedCount} of {badges.length} badges earned
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex bg-gray-800 rounded-lg p-1" role="group" aria-label="Filter badges by status">
          {(['all', 'earned', 'locked'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-3 py-1 rounded-md text-sm capitalize transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                filter === f
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Collection Progress</span>
          <span className="text-purple-400">{Math.round((earnedCount / badges.length) * 100)}%</span>
        </div>
        <div 
          className="h-2 bg-gray-800 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round((earnedCount / badges.length) * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Badge collection progress"
        >
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${(earnedCount / badges.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            onClick={() => setSelectedBadge(badge)}
          />
        ))}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Lock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No badges in this category yet</p>
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedBadge(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="text-7xl mb-4 filter drop-shadow-2xl" aria-hidden="true">
                {selectedBadge.earned ? selectedBadge.icon : '🔒'}
              </div>
              <h3 id="modal-title" className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                {selectedBadge.name}
              </h3>
              <div
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${
                  rarityColors[selectedBadge.rarity]
                } mb-4 shadow-sm`}
              >
                {selectedBadge.rarity}
              </div>
              <p className="text-gray-300 leading-relaxed max-w-sm mx-auto">{selectedBadge.description}</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Status</span>
                <span className={selectedBadge.earned ? 'text-green-400' : 'text-gray-500'}>
                  {selectedBadge.earned ? 'Earned ✓' : 'Locked'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Minted</span>
                <span className="text-white">
                  {selectedBadge.mintedCount}
                  {selectedBadge.maxSupply > 0 && ` / ${selectedBadge.maxSupply}`}
                </span>
              </div>
              {selectedBadge.tokenId && (
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Token ID</span>
                  <span className="text-white">#{selectedBadge.tokenId}</span>
                </div>
              )}
            </div>

            {selectedBadge.earned && selectedBadge.tokenId && (
              <a
                href="https://explorer.hiro.so/address/SP1THTSTZ8RQGD8R3GKPGK3ABQ908BD8X85P3J6X9.reputation-badges-v-j4?chain=mainnet"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="View badge contract on Hiro Explorer (opens in new tab)"
              >
                View on Hiro Explorer
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">(opens in new tab)</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="w-full mt-3 py-3 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Close badge details"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
