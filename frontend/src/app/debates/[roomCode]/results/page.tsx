'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

export default function DebateResultsPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get(`/debates/${roomCode}/stats`);
      setData(data);
    } catch (err) {
      console.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  // Poll for the AI summary if it hasn't generated yet
  useEffect(() => {
    if (data && !data.aiSummary) {
      const interval = setInterval(fetchStats, 3000);
      return () => clearInterval(interval);
    }
  }, [data]);

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading results...</div>;
  }

  if (!data) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Could not load debate results.</div>;
  }

  const { debate, stats, aiSummary } = data;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{debate.title}</h1>
            <p className="text-gray-400 text-sm">Room: <span className="font-mono text-blue-400">{roomCode}</span></p>
          </div>
          <button onClick={() => router.push('/debates')} className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Back to Debates
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <p className="text-blue-400 text-sm font-medium mb-1">📊 DEBATE RESULTS</p>
          <p className="text-gray-500 text-sm">Closed on {new Date(debate.closedAt).toLocaleString()}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900 border border-green-900/30 rounded-xl p-6 text-center">
            <p className="text-green-400 font-bold text-lg mb-1">✅ FOR — {debate.participants?.for?.username}</p>
            <p className="text-3xl font-bold text-white mb-1">{stats.forCount}</p>
            <p className="text-gray-500 text-xs mb-3">arguments submitted</p>
            <p className="text-2xl font-bold text-green-400">
              {stats.forAvgScore !== null ? `${stats.forAvgScore}/10` : 'N/A'}
            </p>
            <p className="text-gray-500 text-xs">average AI score</p>
          </div>

          <div className="bg-gray-900 border border-red-900/30 rounded-xl p-6 text-center">
            <p className="text-red-400 font-bold text-lg mb-1">❌ AGAINST — {debate.participants?.against?.username || 'N/A'}</p>
            <p className="text-3xl font-bold text-white mb-1">{stats.againstCount}</p>
            <p className="text-gray-500 text-xs mb-3">arguments submitted</p>
            <p className="text-2xl font-bold text-red-400">
              {stats.againstAvgScore !== null ? `${stats.againstAvgScore}/10` : 'N/A'}
            </p>
            <p className="text-gray-500 text-xs">average AI score</p>
          </div>
        </div>

        {/* Most upvoted argument */}
        {stats.mostUpvoted && (
          <div className="bg-gray-900 border border-yellow-900/30 rounded-xl p-6 mb-6">
            <p className="text-yellow-400 text-sm font-medium mb-3">🏆 MOST UPVOTED ARGUMENT</p>
            <p className="text-gray-200 mb-2">{stats.mostUpvoted.content}</p>
            <p className="text-gray-500 text-xs">
              @{stats.mostUpvoted.author} ({stats.mostUpvoted.side === 'for' ? 'FOR' : 'AGAINST'}) · 👍 {stats.mostUpvoted.voteCount} votes
            </p>
          </div>
        )}

        {/* AI summary */}
        <div className="bg-gray-900 border border-blue-900/30 rounded-xl p-6">
          <p className="text-blue-400 text-sm font-medium mb-3">🧠 AI DEBATE SUMMARY</p>
          {aiSummary ? (
            <p className="text-gray-300 text-sm leading-relaxed">{aiSummary}</p>
          ) : (
            <p className="text-gray-500 text-sm italic animate-pulse">Generating summary...</p>
          )}
        </div>
      </div>
    </div>
  );
}