'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">DebateSphere</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/leaderboard')} className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors">
              🏆 Leaderboard
            </button>
            <button onClick={() => router.push(`/profile/${user?.username}`)} className="text-gray-400 hover:text-white text-sm transition-colors">
              Hello, {user?.username}
            </button>
            <button onClick={logout} className="text-gray-400 hover:text-white transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <h2 className="text-3xl font-bold mb-2 text-center">Choose Your Mode</h2>
        <p className="text-gray-400 mb-10 text-center">How would you like to debate today?</p>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
          <button
            onClick={() => router.push('/practice')}
            className="bg-gray-900 border border-blue-900/30 hover:border-blue-700 rounded-2xl p-8 text-left transition-colors group"
          >
            <p className="text-4xl mb-4">📝</p>
            <h3 className="text-xl font-bold mb-2 text-blue-400 group-hover:text-blue-300">Practice Mode</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Sharpen your skills without the pressure of a verdict. Practice solo against an AI opponent, or go free-form with another debater — either way, you'll get instant AI feedback on every argument.
            </p>
          </button>

          <button
            onClick={() => router.push('/matches')}
            className="bg-gray-900 border border-purple-900/30 hover:border-purple-700 rounded-2xl p-8 text-left transition-colors group"
          >
            <p className="text-4xl mb-4">⚔️</p>
            <h3 className="text-xl font-bold mb-2 text-purple-400 group-hover:text-purple-300">Competitive Mode</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Go head-to-head in a structured, timed Oxford-style match. An AI moderator runs the rounds, and an AI judge delivers a final verdict with scores and reasoning for both sides.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}