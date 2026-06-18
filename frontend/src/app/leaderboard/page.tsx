'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'practice' | 'competitive'>('practice');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (user) fetchLeaderboard();
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await api.get('/leaderboard');
      setData(data);
    } catch (err) {
      console.error('Failed to load leaderboard');
    } finally {
      setFetching(false);
    }
  };

  if (loading || fetching) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading leaderboard...</div>;
  }

  const practiceLeaderboard = data?.practiceLeaderboard || [];
  const competitiveLeaderboard = data?.competitiveLeaderboard || [];

  const medalFor = (rank: number) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${rank + 1}`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🏆 Leaderboard</h1>
            <p className="text-gray-500 text-sm">Top debaters on DebateSphere</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/debates')} className="text-gray-400 hover:text-white text-sm transition-colors">
              ← Practice Mode
            </button>
            <button onClick={() => router.push('/matches')} className="text-gray-400 hover:text-white text-sm transition-colors">
              Competitive Mode →
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('practice')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'practice' ? 'bg-blue-900/50 text-blue-400 border border-blue-700' : 'bg-gray-800 text-gray-400'
            }`}
          >
            📝 Practice Mode
          </button>
          <button
            onClick={() => setTab('competitive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'competitive' ? 'bg-purple-900/50 text-purple-400 border border-purple-700' : 'bg-gray-800 text-gray-400'
            }`}
          >
            ⚔️ Competitive Mode
          </button>
        </div>

        {/* Practice leaderboard */}
        {tab === 'practice' && (
          practiceLeaderboard.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-12">
              No rankings yet. Submit at least 3 scored arguments to appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {practiceLeaderboard.map((entry: any, i: number) => (
                <div
                  key={i}
                  onClick={() => router.push(`/profile/${entry.username}`)}
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                    entry.username === user?.username ? 'bg-blue-900/20 border border-blue-700/50' : 'bg-gray-900 border border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold w-10 text-center">{medalFor(i)}</span>
                    <span className="font-medium">@{entry.username}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-gray-500">{entry.totalArguments} arguments</span>
                    <span className="text-blue-400 font-bold text-lg">{entry.avgScore}/10</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Competitive leaderboard */}
        {tab === 'competitive' && (
          competitiveLeaderboard.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-12">
              No rankings yet. Complete at least 1 competitive match to appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {competitiveLeaderboard.map((entry: any, i: number) => (
                <div
                  key={i}
                  onClick={() => router.push(`/profile/${entry.username}`)}
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                    entry.username === user?.username ? 'bg-purple-900/20 border border-purple-700/50' : 'bg-gray-900 border border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold w-10 text-center">{medalFor(i)}</span>
                    <span className="font-medium">@{entry.username}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-green-400">{entry.wins}W</span>
                    <span className="text-red-400">{entry.losses}L</span>
                    {entry.ties > 0 && <span className="text-yellow-400">{entry.ties}T</span>}
                    <span className="text-purple-400 font-bold text-lg">{entry.winRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}