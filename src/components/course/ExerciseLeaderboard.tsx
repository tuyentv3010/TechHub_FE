"use client";

import { Share2 } from "lucide-react";
import Image from "next/image";

// Types
interface LeaderboardPlayer {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  score: number;
  totalQuestions: number;
}

interface ExerciseLeaderboardProps {
  players?: LeaderboardPlayer[];
  totalQuestions?: number;
  onShare?: () => void;
  onViewTests?: () => void;
}

// Mock data - replace with API call later
const mockData: LeaderboardPlayer[] = [
  { id: "1", rank: 1, name: "Maryam1", avatar: "/exercise/exercise-1.png", score: 20, totalQuestions: 20 },
  { id: "2", rank: 2, name: "Amina", avatar: "/exercise/exercise-2.png", score: 19, totalQuestions: 20 },
  { id: "3", rank: 3, name: "Areej", avatar: "/exercise/exercise-3.png", score: 18, totalQuestions: 20 },
  { id: "4", rank: 4, name: "Mohammed Ali", avatar: "/exercise/exercise-4.png", score: 17, totalQuestions: 20 },
  { id: "5", rank: 5, name: "Salwa", avatar: "/exercise/exercise-5.png", score: 15, totalQuestions: 20 },
  { id: "6", rank: 6, name: "Karima", avatar: "/exercise/exercise-6.png", score: 15, totalQuestions: 20 },
];

// Medal images for top 3
const MEDAL_IMAGES = {
  1: "/leaderboard/medal-gold.png",
  2: "/leaderboard/medal-silver.png", 
  3: "/leaderboard/medal-bronze.png",
};

// Rank images for all positions
const RANK_IMAGES = {
  1: "/leaderboard/rank-1.png",
  2: "/leaderboard/rank-2.png",
  3: "/leaderboard/rank-3.png",
  4: "/leaderboard/rank-4.png",
  5: "/leaderboard/rank-5.png",
  6: "/leaderboard/rank-6.png",
};

// Rank badge colors
const RANK_BADGE_COLORS = {
  1: "bg-yellow-400 text-yellow-900",
  2: "bg-gray-300 text-gray-700",
  3: "bg-orange-400 text-orange-900",
};

// Decorative flower/star component
function DecorativeFlower({ color, className }: { color: string; className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 40 40" className="w-full h-full" fill={color}>
        <ellipse cx="20" cy="10" rx="6" ry="10" />
        <ellipse cx="20" cy="30" rx="6" ry="10" />
        <ellipse cx="10" cy="20" rx="10" ry="6" />
        <ellipse cx="30" cy="20" rx="10" ry="6" />
      </svg>
    </div>
  );
}

// Top 3 Podium Component
function TopThreePodium({ 
  players 
}: { 
  players: LeaderboardPlayer[] 
}) {
  const top3 = players.slice(0, 3);
  const player1 = top3.find(p => p.rank === 1);
  const player2 = top3.find(p => p.rank === 2);
  const player3 = top3.find(p => p.rank === 3);

  const renderTopPlayer = (player: LeaderboardPlayer | undefined, position: 'first' | 'second' | 'third') => {
    if (!player) return null;

    const sizes = {
      first: { avatar: 'w-20 h-20', badge: 'w-6 h-6', text: 'text-lg' },
      second: { avatar: 'w-16 h-16', badge: 'w-5 h-5', text: 'text-base' },
      third: { avatar: 'w-16 h-16', badge: 'w-5 h-5', text: 'text-base' },
    };

    const size = sizes[position];
    const rankColor = RANK_BADGE_COLORS[player.rank as 1 | 2 | 3];

    return (
      <div className="flex flex-col items-center">
        {/* Avatar with medal */}
        <div className="relative">
          <div className={`${size.avatar} rounded-full overflow-hidden border-4 border-white shadow-lg`}>
            <Image
              src={player.avatar}
              alt={player.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/avatars/default.png';
              }}
            />
          </div>
          {/* Rank image */}
          <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 ${size.badge} rounded-full overflow-hidden border-2 border-white shadow`}>
            <Image
              src={RANK_IMAGES[player.rank as keyof typeof RANK_IMAGES] || `/leaderboard/rank-${player.rank}.png`}
              alt={`Rank ${player.rank}`}
              width={24}
              height={24}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/leaderboard/rank-default.png';
              }}
            />
          </div>
          {/* Medal emoji for top 3 */}
          {player.rank <= 3 && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-2xl">
                {player.rank === 1 ? '🏆' : player.rank === 2 ? '🥈' : '🥉'}
              </span>
            </div>
          )}
        </div>
        {/* Name */}
        <p className={`mt-2 font-bold text-gray-800 ${size.text}`}>{player.name}</p>
        {/* Score badge */}
        <div className="mt-1 px-3 py-0.5 bg-[#8B7355] text-white text-sm font-medium rounded-full">
          {player.score}
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex items-end justify-center gap-2 mb-4">
      {/* Second place - left */}
      <div className="flex flex-col items-center pb-8">
        {renderTopPlayer(player2, 'second')}
      </div>

      {/* First place - center (highest) */}
      <div className="flex flex-col items-center pb-16 -mx-4 z-10">
        {renderTopPlayer(player1, 'first')}
      </div>

      {/* Third place - right */}
      <div className="flex flex-col items-center">
        {renderTopPlayer(player3, 'third')}
      </div>
    </div>
  );
}

// Podium/Stage Component
function PodiumStage() {
  return (
    <div className="relative flex items-end justify-center h-28 gap-4">
      {/* Second place podium - left */}
      <div className="relative z-10 flex items-end justify-center h-2">
        <div className="w-16 h-16">
          <Image
            src={MEDAL_IMAGES[2]}
            alt="Silver Medal"
            width={64}
            height={64}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '🥈';
                parent.className = 'text-4xl';
              }
            }}
          />
        </div>
      </div>

      {/* First place podium - center (tallest) */}
      <div className="relative z-20 flex items-end justify-center h-28">
        <div className="w-20 h-20">
          <Image
            src={MEDAL_IMAGES[1]}
            alt="Gold Medal"
            width={80}
            height={80}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '🏆';
                parent.className = 'text-5xl';
              }
            }}
          />
        </div>
      </div>

      {/* Third place podium - right */}
      <div className="relative z-10 flex items-end justify-center h-16">
        <div className="w-14 h-14">
          <Image
            src={MEDAL_IMAGES[3]}
            alt="Bronze Medal"
            width={56}
            height={56}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '🥉';
                parent.className = 'text-3xl';
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Leaderboard List Item
function LeaderboardItem({ player }: { player: LeaderboardPlayer }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
      {/* Left side - Score */}
      <div className="flex items-center gap-2">
        <span className="text-gray-600 font-medium">{player.score}/{player.totalQuestions}</span>
      </div>

      {/* Center - Name */}
      <div className="flex-1 text-center">
        <span className="font-bold text-gray-800">{player.name}</span>
      </div>

      {/* Right side - Avatar and Rank */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
          <Image
            src={player.avatar}
            alt={player.name}
            width={40}
            height={40}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/avatars/default.png';
            }}
          />
        </div>
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-300 shadow-sm">
          <Image
            src={RANK_IMAGES[player.rank as keyof typeof RANK_IMAGES] || `/leaderboard/rank-${player.rank}.png`}
            alt={`Rank ${player.rank}`}
            width={32}
            height={32}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/leaderboard/rank-default.png';
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Main Leaderboard Component
export default function ExerciseLeaderboard({
  players = mockData,
  totalQuestions = 20,
  onShare,
  onViewTests,
}: ExerciseLeaderboardProps) {
  const top3 = players.slice(0, 3);
  const restPlayers = players.slice(3);

  return (
    <div 
      className="relative w-full min-h-[600px] rounded-2xl overflow-hidden p-6"
      style={{ backgroundColor: '#FFF8DD' }}
    >
      {/* Decorative flowers/stars */}
      <DecorativeFlower color="#FF6B35" className="absolute top-8 left-8 w-10 h-10" />
      <DecorativeFlower color="#F7B731" className="absolute top-20 right-16 w-8 h-8" />
      <DecorativeFlower color="#7BC74D" className="absolute top-1/3 left-4 w-8 h-8" />
      <DecorativeFlower color="#4ECDC4" className="absolute bottom-20 left-12 w-10 h-10" />
      <DecorativeFlower color="#F7B731" className="absolute bottom-8 left-1/3 w-6 h-6" />
      <DecorativeFlower color="#4ECDC4" className="absolute bottom-12 right-8 w-10 h-10" />

      {/* Main content container */}
      <div className="relative z-10 max-w-md mx-auto">
        {/* Top 3 players with avatars */}
        <TopThreePodium players={top3} />

        {/* Podium stage */}
        <PodiumStage />

        {/* Leaderboard list */}
        <div className="mt-4 space-y-2">
          {restPlayers.map((player) => (
            <LeaderboardItem key={player.id} player={player} />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onViewTests}
            className="px-6 py-3 bg-white border-2 border-[#8B7355] text-[#8B7355] font-semibold rounded-lg hover:bg-[#8B7355] hover:text-white transition-colors"
          >
            الإختبارات
          </button>
          <button
            onClick={onShare}
            className="px-6 py-3 bg-[#8B7355] text-white font-semibold rounded-lg hover:bg-[#7A6548] transition-colors flex items-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            شارك
          </button>
        </div>
      </div>
    </div>
  );
}
