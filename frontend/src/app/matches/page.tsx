'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

interface Match {
  _id: string;
  topic: string;
  roomCode: string;
  status: string;
  creator: { username: string };
  participants: {
    for: { username: string } | null;
    against: { username: string } | null;
  };
  createdAt: string;
}

export default function MatchesPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [topic, setTopic] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (user) fetchMatches();
  }, [user]);

  const fetchMatches = async () => {
    try {
      const { data } = await api.get('/matches');
      setMatches(data);
    } catch (err) {
      console.error('Failed to fetch matches');
    }
  };

  const createMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/matches', { topic });
      setTopic('');
      setShowCreate(false);
      router.push(`/matches/${data.roomCode}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create match');
    }
  };

  const joinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) router.push(`/matches/${roomCode.trim().toUpperCase()}`);
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Competitive Mode</h1>
            <p className="text-gray-500 text-sm">Timed rounds · AI moderator · Final verdict</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/home')} className="text-gray-400 hover:text-white text-sm transition-colors">
              ← Home
            </button>
            <button onClick={() => router.push('/leaderboard')} className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors">
              🏆 Leaderboard
            </button>
            <button onClick={() => router.push(`/profile/${user?.username}`)} className="text-gray-400 hover:text-white transition-colors">
              Hello, {user?.username}
            </button>
            <button onClick={logout} className="text-gray-400 hover:text-white transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Create Match
          </button>

          <form onSubmit={joinByCode} className="flex gap-2">
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter match code..."
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
            <button type="submit" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">
              Join
            </button>
          </form>
        </div>

        {showCreate && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Create New Match</h2>
            {error && <div className="bg-red-900/50 text-red-400 p-3 rounded-lg mb-4">{error}</div>}
            <form onSubmit={createMatch} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Debate Topic</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Should AI be regulated by governments?"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <p className="text-gray-500 text-xs">
                Match structure: Opening Statements (90s) → Rebuttal Round (90s) → Closing Statements (60s), followed by an AI verdict.
              </p>
              <div className="flex gap-3">
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-medium transition-colors">
                  Create
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <h2 className="text-xl font-bold mb-4">Open Matches</h2>
        {matches.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            No matches yet. Create one to get started!
          </div>
        ) : (
          <div className="grid gap-4">
            {matches.map((match) => (
              <div key={match._id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold">{match.topic}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      match.status === 'active' ? 'bg-green-900/50 text-green-400' :
                      match.status === 'waiting' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {match.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs">
                    By {match.creator?.username} · Code: <span className="font-mono text-purple-400">{match.roomCode}</span>
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/matches/${match.roomCode}`)}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-4"
                >
                  Enter
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}