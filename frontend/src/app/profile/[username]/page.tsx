'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchProfile();
  }, [user, username]);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get(`/profile/${username}`);
      setData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading profile...</div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white flex-col gap-4">
        <p className="text-gray-400">{error}</p>
        <button onClick={() => router.push('/debates')} className="text-blue-400 hover:text-blue-300 text-sm">
          ← Back to Debates
        </button>
      </div>
    );
  }

  const { practiceStats, competitiveStats, debateHistory, matchHistory } = data;
  const isOwnProfile = user?.username === username;
  const totalCompetitive = competitiveStats.wins + competitiveStats.losses + competitiveStats.ties;
  const winRate = totalCompetitive > 0 ? Math.round((competitiveStats.wins / totalCompetitive) * 100) : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">@{data.user.username}</h1>
            <p className="text-gray-500 text-sm">Joined {new Date(data.user.createdAt).toLocaleDateString()}</p>
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
        {/* Stats overview */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-900 border border-blue-900/30 rounded-xl p-6">
            <p className="text-blue-400 font-bold text-sm mb-3">📝 PRACTICE MODE</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold">{practiceStats.totalDebates}</p>
                <p className="text-gray-500 text-xs">debates</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{practiceStats.totalArguments}</p>
                <p className="text-gray-500 text-xs">arguments</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{practiceStats.avgScore ?? 'N/A'}</p>
                <p className="text-gray-500 text-xs">avg AI score</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-purple-900/30 rounded-xl p-6">
            <p className="text-purple-400 font-bold text-sm mb-3">⚔️ COMPETITIVE MODE</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-2xl font-bold">{competitiveStats.totalMatches}</p>
                <p className="text-gray-500 text-xs">matches</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{competitiveStats.wins}</p>
                <p className="text-gray-500 text-xs">wins</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{competitiveStats.losses}</p>
                <p className="text-gray-500 text-xs">losses</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{winRate !== null ? `${winRate}%` : 'N/A'}</p>
                <p className="text-gray-500 text-xs">win rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Match history */}
        <h2 className="text-lg font-bold mb-3">Competitive Match History</h2>
        {matchHistory.length === 0 ? (
          <p className="text-gray-600 text-sm mb-8">No completed matches yet.</p>
        ) : (
          <div className="space-y-2 mb-8">
            {matchHistory.map((m: any, i: number) => {
              const userWon = m.winner === m.userSide;
              const isTie = m.winner === 'tie';
              return (
                <div
                  key={i}
                  onClick={() => router.push(`/matches/${m.roomCode}`)}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex justify-between items-center cursor-pointer hover:border-gray-700 transition-colors"
                >
                  <div>
                    <p className="text-gray-200 text-sm">{m.topic}</p>
                    <p className="text-gray-500 text-xs">{new Date(m.completedAt).toLocaleDateString()} · Played as {m.userSide.toUpperCase()}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isTie ? 'bg-yellow-900/50 text-yellow-400' :
                    userWon ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {isTie ? 'TIE' : userWon ? 'WIN' : 'LOSS'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Debate history */}
        <h2 className="text-lg font-bold mb-3">Practice Debate History</h2>
        {debateHistory.length === 0 ? (
          <p className="text-gray-600 text-sm">No closed debates yet.</p>
        ) : (
          <div className="space-y-2">
            {debateHistory.map((d: any, i: number) => (
              <div
                key={i}
                onClick={() => router.push(`/debates/${d.roomCode}/results`)}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex justify-between items-center cursor-pointer hover:border-gray-700 transition-colors"
              >
                <p className="text-gray-200 text-sm">{d.title}</p>
                <p className="text-gray-500 text-xs">{new Date(d.closedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}