'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/lib/socket';
import api from '@/lib/axios';
import PrepChatbot from './PrepChatbot';

interface ArgumentItem {
  _id: string;
  content: string;
  side: 'for' | 'against';
  author: { _id: string; username: string };
  aiScore: number | null;
  fallacyDetected?: string | null;
  scoringExplanation?: string | null;
  stanceMismatch?: boolean;
  voteCount?: number;
  createdAt: string;
}

export default function DebateRoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [debate, setDebate] = useState<any>(null);
  const [arguments_, setArguments] = useState<ArgumentItem[]>([]);
  const [newArg, setNewArg] = useState('');
  const [side, setSide] = useState<'for' | 'against'>('for');
  const [notification, setNotification] = useState('');
  const [isSpectator, setIsSpectator] = useState(false);
  const [roomPopulation, setRoomPopulation] = useState(0);
  const socket = getSocket();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }

    api.get(`/debates/${roomCode}`).then(({ data }) => {
      setDebate(data);
      if (data.participants?.for?._id === user.id) {
        setSide('for');
        setIsSpectator(false);
      } else if (data.participants?.against?._id === user.id) {
        setSide('against');
        setIsSpectator(false);
      } else {
        setIsSpectator(true);
      }
    });

    api.get(`/debates/${roomCode}/arguments`).then(({ data }) => setArguments(data));

    socket.connect();
    socket.emit('join_room', { roomCode, username: user.username, isSpectator });

    socket.on('new_argument', (arg: ArgumentItem) => {
      setArguments((prev) => [...prev, { ...arg, voteCount: 0 }]);
    });

    socket.on('argument_scored', ({ argumentId, score, fallacy, explanation, stanceMismatch }) => {
      setArguments((prev) =>
        prev.map((a) => a._id === argumentId ? { ...a, aiScore: score, fallacyDetected: fallacy, scoringExplanation: explanation, stanceMismatch } : a)
      );
    });

    socket.on('vote_updated', ({ argumentId, voteCount }) => {
      setArguments((prev) =>
        prev.map((a) => a._id === argumentId ? { ...a, voteCount } : a)
      );
    });

    socket.on('user_joined', ({ message }) => {
      setNotification(message);
      setTimeout(() => setNotification(''), 3000);
    });

    socket.on('room_population', ({ count }) => {
      setRoomPopulation(count);
    });

    socket.on('error', ({ message }) => alert(message));

    return () => {
      socket.off('new_argument');
      socket.off('argument_scored');
      socket.off('vote_updated');
      socket.off('user_joined');
      socket.off('room_population');
      socket.off('error');
      socket.disconnect();
    };
  }, [roomCode, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [arguments_]);

  const submitArgument = () => {
    if (!newArg.trim() || !debate || !user) return;
    socket.emit('submit_argument', {
      roomCode,
      content: newArg.trim(),
      side,
      userId: user.id,
      debateId: debate._id,
      username: user.username,
    });
    setNewArg('');
  };

  const vote = (argumentId: string) => {
    if (!user) return;
    socket.emit('vote', { roomCode, argumentId, userId: user.id });
  };

  const endDebate = async () => {
    if (!confirm('Are you sure you want to end this debate? This cannot be undone.')) return;
    try {
      await api.post(`/debates/${roomCode}/close`);
      router.push(`/debates/${roomCode}/results`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to end debate.');
    }
  };

  const forArgs = arguments_.filter((a) => a.side === 'for');
  const againstArgs = arguments_.filter((a) => a.side === 'against');

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex-shrink-0">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">{debate?.title || 'Loading...'}</h1>
            <p className="text-gray-400 text-sm">
              Room: <span className="font-mono text-blue-400">{roomCode}</span>
              {debate?.description && <span className="ml-3 text-gray-500">{debate.description}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isSpectator && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-900/50 text-blue-400">
                👁️ Spectating
              </span>
            )}
            {roomPopulation > 0 && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-800 text-gray-400">
                👥 {roomPopulation}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              debate?.status === 'active' ? 'bg-green-900/50 text-green-400' :
              debate?.status === 'waiting' ? 'bg-yellow-900/50 text-yellow-400' :
              'bg-gray-800 text-gray-400'
            }`}>
              {debate?.status?.toUpperCase()}
            </span>
            {!isSpectator && debate?.creator?._id === user?.id && debate?.status !== 'closed' && (
              <button
                onClick={endDebate}
                className="bg-red-900/50 hover:bg-red-900/80 text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                End Debate
              </button>
            )}
            <button onClick={() => router.push('/debates')} className="text-gray-400 hover:text-white text-sm transition-colors">
              ← Back
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div className="text-center text-sm text-gray-400 py-2 bg-gray-900/50">{notification}</div>
      )}

      {/* Two-column debate layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-2 gap-6 overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        {/* FOR column */}
        <div className="bg-gray-900/50 border border-green-900/30 rounded-xl flex flex-col overflow-hidden">
          <div className="bg-green-900/20 px-4 py-3 border-b border-green-900/30 flex-shrink-0">
            <h2 className="text-green-400 font-bold text-lg">✅ FOR</h2>
            <p className="text-gray-400 text-xs">{debate?.participants?.for?.username || 'Waiting for participant...'}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {forArgs.map((arg) => (
              <ArgumentCard key={arg._id} arg={arg} onVote={vote} />
            ))}
            {forArgs.length === 0 && (
              <p className="text-gray-600 text-sm text-center mt-8">No arguments yet</p>
            )}
          </div>
        </div>

        {/* AGAINST column */}
        <div className="bg-gray-900/50 border border-red-900/30 rounded-xl flex flex-col overflow-hidden">
          <div className="bg-red-900/20 px-4 py-3 border-b border-red-900/30 flex-shrink-0">
            <h2 className="text-red-400 font-bold text-lg">❌ AGAINST</h2>
            <p className="text-gray-400 text-xs">{debate?.participants?.against?.username || 'Waiting for participant...'}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {againstArgs.map((arg) => (
              <ArgumentCard key={arg._id} arg={arg} onVote={vote} />
            ))}
            {againstArgs.length === 0 && (
              <p className="text-gray-600 text-sm text-center mt-8">No arguments yet</p>
            )}
          </div>
        </div>
      </div>

      <div ref={bottomRef} />

      {/* Input area — hidden for spectators */}
      {!isSpectator && (
        <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-6 py-4">
          <div className="max-w-7xl mx-auto flex gap-3 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setSide('for')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  side === 'for' ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-gray-800 text-gray-400'
                }`}
              >
                ✅ FOR
              </button>
              <button
                onClick={() => setSide('against')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  side === 'against' ? 'bg-red-900/50 text-red-400 border border-red-700' : 'bg-gray-800 text-gray-400'
                }`}
              >
                ❌ AGAINST
              </button>
            </div>
            <input
              value={newArg}
              onChange={(e) => setNewArg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitArgument()}
              placeholder="Type your argument and press Enter..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={submitArgument}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Spectator footer — shown instead of input */}
      {isSpectator && (
        <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-6 py-4 text-center">
          <p className="text-gray-500 text-sm">👁️ You're watching this debate. Vote on arguments using the 👍 button.</p>
        </div>
      )}

      {debate && !isSpectator && <PrepChatbot topic={debate.title} side={side} />}
    </div>
  );
}

function ArgumentCard({ arg, onVote }: { arg: ArgumentItem; onVote: (id: string) => void }) {
  return (
    <div className={`rounded-lg p-3 border ${
      arg.stanceMismatch
        ? 'bg-purple-950/30 border-purple-700/40'
        : arg.side === 'for'
        ? 'bg-green-950/30 border-green-900/20'
        : 'bg-red-950/30 border-red-900/20'
    }`}>
      {arg.stanceMismatch && (
        <div className="flex items-center gap-1 mb-2 text-purple-400 text-xs font-medium">
          🚫 Wrong side — this argues the opposite position
        </div>
      )}
      <p className="text-gray-200 text-sm mb-2">{arg.content}</p>
      <div className="flex justify-between items-center flex-wrap gap-2">
        <span className="text-gray-500 text-xs">@{arg.author?.username}</span>
        <div className="flex items-center gap-2 flex-wrap">
          {arg.aiScore !== null && arg.aiScore !== undefined ? (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              arg.stanceMismatch ? 'bg-purple-900/50 text-purple-400' :
              arg.aiScore >= 7 ? 'bg-green-900/50 text-green-400' :
              arg.aiScore >= 4 ? 'bg-yellow-900/50 text-yellow-400' :
              'bg-red-900/50 text-red-400'
            }`}>
              AI: {arg.aiScore}/10
            </span>
          ) : (
            <span className="text-xs text-gray-600 italic">Scoring...</span>
          )}
          {arg.fallacyDetected && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/50 text-orange-400">
              ⚠️ {arg.fallacyDetected}
            </span>
          )}
          <button
            onClick={() => onVote(arg._id)}
            className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
          >
            👍 {arg.voteCount || 0}
          </button>
        </div>
      </div>
      {arg.scoringExplanation && (
        <p className="text-gray-500 text-xs mt-2 italic">{arg.scoringExplanation}</p>
      )}
    </div>
  );
}