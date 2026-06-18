'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function PracticeChoicePage() {
  const { user, loading } = useAuth();
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
          <div>
            <h1 className="text-xl font-bold">📝 Practice Mode</h1>
          </div>
          <button onClick={() => router.push('/home')} className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Back
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <h2 className="text-2xl font-bold mb-2 text-center">How do you want to practice?</h2>
        <p className="text-gray-400 mb-10 text-center">Pick the style that fits what you need right now</p>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
          <button
            onClick={() => router.push('/practice/solo')}
            className="bg-gray-900 border border-orange-900/30 hover:border-orange-700 rounded-2xl p-8 text-left transition-colors group"
          >
            <p className="text-4xl mb-4">🤖</p>
            <h3 className="text-xl font-bold mb-2 text-orange-400 group-hover:text-orange-300">Practice Alone vs AI</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Pick a side and a topic, then debate an AI opponent for 3 minutes. No prep assistance here — just you against the AI's rebuttals. When time's up, get a report on your strengths and weaknesses.
            </p>
          </button>

          <button
            onClick={() => router.push('/debates')}
            className="bg-gray-900 border border-blue-900/30 hover:border-blue-700 rounded-2xl p-8 text-left transition-colors group"
          >
            <p className="text-4xl mb-4">🧑‍🤝‍🧑</p>
            <h3 className="text-xl font-bold mb-2 text-blue-400 group-hover:text-blue-300">Practice with a Competitor</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Free-form debate against another real person. Every argument gets scored by AI in real time, and you can use the AI prep coach for tactical advice while you debate.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}