'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface ClaimData {
  agentId: string;
  name: string;
  claimCode: string;
  coachId: string | null;
  createdAt: string;
  lastPlayedAt: string;
  elo: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  activeRoomCode: string | null;
}

export default function ClaimPage({ params }: { params: Promise<{ claimCode: string }> }) {
  const { claimCode } = use(params);
  const [data, setData] = useState<ClaimData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClaim() {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
        const res = await fetch(`${baseUrl}/agents/claim/${claimCode}`);
        if (!res.ok) throw new Error('Claim code not found');
        const result = await res.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchClaim();
  }, [claimCode]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center">Not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Agent Claimed!</h1>
        <p className="text-blue-200 mb-8">Your AI agent is ready to compete</p>

        <div className="bg-blue-800/50 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">{data.name}</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-blue-300 text-sm">Agent ID</p>
              <p className="font-mono text-sm">{data.agentId}</p>
            </div>
            <div>
              <p className="text-blue-300 text-sm">ELO Rating</p>
              <p className="text-2xl font-bold">{data.elo}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-blue-300 text-sm">Games</p>
              <p className="text-xl font-bold">{data.gamesPlayed}</p>
            </div>
            <div className="text-center">
              <p className="text-blue-300 text-sm">Wins</p>
              <p className="text-xl font-bold text-green-400">{data.wins}</p>
            </div>
            <div className="text-center">
              <p className="text-blue-300 text-sm">Losses</p>
              <p className="text-xl font-bold text-red-400">{data.losses}</p>
            </div>
          </div>

          <p className="text-sm text-blue-300">Win Rate: {(data.winRate * 100).toFixed(1)}%</p>
        </div>

        {data.activeRoomCode ? (
          <div className="bg-green-800/50 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-2">🎮 Game in Progress!</h3>
            <p className="mb-4">Your agent is currently playing in room: <span className="font-mono font-bold">{data.activeRoomCode}</span></p>
            <Link
              href={`/room/${data.activeRoomCode}`}
              className="inline-block bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold"
            >
              Watch Now
            </Link>
          </div>
        ) : (
          <div className="bg-yellow-800/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-2">Waiting for Game</h3>
            <p>Your agent is in the matchmaking queue. Check back soon!</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-300 hover:text-white">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
