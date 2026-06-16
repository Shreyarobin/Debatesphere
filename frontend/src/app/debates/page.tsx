'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

interface Debate {
  _id: string;
  title: string;
  description: string;
  roomCode: string;
  status: string;
  creator: { username: string };
  participants: {
    for: { username: string } | null;
    against: { username: string } | null;
  };
  createdAt: string;
}

export default function DebatesPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (user) fetchDebates();
  }, [user]);

  const fetchDebates = async () => {
    try {
      const { data } = await api.get('/debates');
      setDebates(data);
    } catch (err) {
      console.error('Failed to fetch debates');
    }
  };

  const createDebate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/debates', { title, description });
      setTitle('');
      setDescription('');
      setShowCreate(false);
      fetchDebates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create debate');
    }
  };

  const joinRoom = (code: string) => {
    router.push(`/debates/${code}`);
  };

  const joinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) router.push(`/debates/${roomCode.trim().toUpperCase()}`);
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">DebateSphere</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Hello, {user?.username}</span>
            <button onClick={logout} className="text-gray-400 hover:text-white transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Actions row */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Create Debate
          </button>

          <form onSubmit={joinByCode} className="flex gap-2">
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter room code..."
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
            >
              Join
            </button>
          </form>
        </div>

        {/* Create debate form */}
        {showCreate && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Create New Debate</h2>
            {error && <div className="bg-red-900/50 text-red-400 p-3 rounded-lg mb-4">{error}</div>}
            <form onSubmit={createDebate} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Debate Topic</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI will replace human jobs within 10 years"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add context for the debate..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 h-24 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors">
                  Create
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Debates list */}
        <h2 className="text-xl font-bold mb-4">Active Debates</h2>
        {debates.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            No debates yet. Create one to get started!
          </div>
        ) : (
          <div className="grid gap-4">
            {debates.map((debate) => (
              <div key={debate._id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold">{debate.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      debate.status === 'active' ? 'bg-green-900/50 text-green-400' :
                      debate.status === 'waiting' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {debate.status}
                    </span>
                  </div>
                  {debate.description && <p className="text-gray-400 text-sm mb-2">{debate.description}</p>}
                  <p className="text-gray-500 text-xs">
                    By {debate.creator?.username} · Room: <span className="font-mono text-blue-400">{debate.roomCode}</span>
                  </p>
                </div>
                <button
                  onClick={() => joinRoom(debate.roomCode)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-4"
                >
                  Enter Room
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}