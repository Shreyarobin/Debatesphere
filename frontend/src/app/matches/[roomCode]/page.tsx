'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/lib/socket';
import api from '@/lib/axios';

interface MatchMessage {
  _id: string;
  senderType: 'for' | 'against' | 'moderator';
  author: { _id: string; username: string } | null;
  content: string;
  roundIndex: number;
  createdAt: string;
}

const ROUND_LABELS: Record<string, string> = {
  opening: 'Opening Statements',
  rebuttal: 'Rebuttal Round',
  closing: 'Closing Statements',
};

export default function MatchRoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [match, setMatch] = useState<any>(null);
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [side, setSide] = useState<'for' | 'against' | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [notification, setNotification] = useState('');
  const [matchResult, setMatchResult] = useState<any>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [matchPopulation, setMatchPopulation] = useState(0);
  const [roleDecided, setRoleDecided] = useState(false);
  const socket = getSocket();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }

    api.get(`/matches/${roomCode}`).then(({ data }) => {
      setMatch(data);
      if (data.participants?.for?._id === user.id) {
        setSide('for');
        setIsSpectator(false);
        setRoleDecided(true);
      } else if (data.participants?.against?._id === user.id) {
        setSide('against');
        setIsSpectator(false);
        setRoleDecided(true);
      } else if (data.participants?.against && data.status !== 'waiting') {
        // AGAINST slot already taken and match isn't waiting anymore — must spectate
        setIsSpectator(true);
        setRoleDecided(true);
      } else {
        // Open slot available — let the user choose
        setRoleDecided(false);
      }
      if (data.currentRoundIndex >= 0) setCurrentRound(data.rounds[data.currentRoundIndex]);
    });

    api.get(`/matches/${roomCode}/messages`).then(({ data }) => setMessages(data));

    socket.connect();

    socket.on('new_match_message', (msg: MatchMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('timer_tick', ({ remaining }) => {
      setTimeRemaining(remaining);
    });

    socket.on('round_started', ({ roundIndex, round }) => {
      setCurrentRound(round);
      setMatch((prev: any) => prev ? { ...prev, status: 'active', currentRoundIndex: roundIndex } : prev);
    });

    socket.on('match_judging_started', () => {
      setMatch((prev: any) => prev ? { ...prev, status: 'judging' } : prev);
      setTimeRemaining(null);
    });

    socket.on('match_completed', ({ result }) => {
      setMatch((prev: any) => prev ? { ...prev, status: 'completed' } : prev);
      setMatchResult(result);
    });

    socket.on('match_user_joined', ({ message }) => {
      setNotification(message);
      setTimeout(() => setNotification(''), 3000);
    });

    socket.on('match_population', ({ count }) => {
      setMatchPopulation(count);
    });

    socket.on('match_error', ({ message }) => alert(message));

    return () => {
      socket.off('new_match_message');
      socket.off('timer_tick');
      socket.off('round_started');
      socket.off('match_judging_started');
      socket.off('match_completed');
      socket.off('match_user_joined');
      socket.off('match_population');
      socket.off('match_error');
      socket.disconnect();
    };
  }, [roomCode, user]);

  useEffect(() => {
    if (roleDecided && user) {
      socket.emit('join_match', { roomCode, username: user.username, isSpectator });
    }
  }, [roleDecided]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startMatch = () => {
    if (!match) return;
    socket.emit('start_match', { roomCode, matchId: match._id });
  };

  const chooseToJoin = async () => {
    try {
      await api.post(`/matches/${roomCode}/join`);
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not join as AGAINST.');
    }
  };

  const chooseToSpectate = () => {
    setIsSpectator(true);
    setRoleDecided(true);
  };

  const sendMessage = () => {
    if (!newMsg.trim() || !match || !user || !side) return;
    socket.emit('send_match_message', {
      roomCode,
      matchId: match._id,
      content: newMsg.trim(),
      userId: user.id,
      username: user.username,
      side,
    });
    setNewMsg('');
  };

  const isHost = match?.creator?._id === user?.id || match?.creator === user?.id;
  const bothJoined = match?.participants?.for && match?.participants?.against;
  const minutes = timeRemaining !== null ? Math.floor(timeRemaining / 60) : null;
  const seconds = timeRemaining !== null ? timeRemaining % 60 : null;

  // Choice screen — shown when the role hasn't been decided yet
  if (match && !roleDecided) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{match.topic}</h1>
          <p className="text-gray-400 text-sm">Match: <span className="font-mono text-purple-400">{roomCode}</span></p>
        </div>
        <p className="text-gray-300">How would you like to join this match?</p>
        <div className="flex gap-4">
          <button
            onClick={chooseToJoin}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            ❌ Join as AGAINST
          </button>
          <button
            onClick={chooseToSpectate}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            👁️ Just Watch
          </button>
        </div>
        <button onClick={() => router.push('/matches')} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
          ← Back to Matches
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex-shrink-0">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">{match?.topic || 'Loading...'}</h1>
            <p className="text-gray-400 text-sm">
              Match: <span className="font-mono text-purple-400">{roomCode}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isSpectator && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-900/50 text-blue-400">
                👁️ Spectating
              </span>
            )}
            {matchPopulation > 0 && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-800 text-gray-400">
                👥 {matchPopulation}
              </span>
            )}
            {timeRemaining !== null && (
              <span className={`px-3 py-1 rounded-lg font-mono font-bold text-lg ${
                timeRemaining <= 10 ? 'bg-red-900/50 text-red-400' : 'bg-purple-900/50 text-purple-400'
              }`}>
                {minutes}:{seconds?.toString().padStart(2, '0')}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              match?.status === 'active' ? 'bg-green-900/50 text-green-400' :
              match?.status === 'waiting' ? 'bg-yellow-900/50 text-yellow-400' :
              match?.status === 'judging' ? 'bg-purple-900/50 text-purple-400' :
              'bg-gray-800 text-gray-400'
            }`}>
              {match?.status?.toUpperCase()}
            </span>
            <button onClick={() => router.push('/matches')} className="text-gray-400 hover:text-white text-sm transition-colors">
              ← Back
            </button>
          </div>
        </div>
        {currentRound && (
          <p className="text-center text-purple-400 text-sm mt-2 font-medium">
            {ROUND_LABELS[currentRound.type]}
          </p>
        )}
      </div>

      {notification && (
        <div className="text-center text-sm text-gray-400 py-2 bg-gray-900/50">{notification}</div>
      )}

      {/* Waiting room state */}
      {match?.status === 'waiting' && (
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <div className="text-center">
            <p className="text-gray-400 mb-2">FOR: {match?.participants?.for?.username || 'empty'}</p>
            <p className="text-gray-400 mb-4">AGAINST: {match?.participants?.against?.username || 'Waiting for opponent...'}</p>
            {!bothJoined && isSpectator && (
              <p className="text-gray-500 text-sm">👁️ Watching this match. Waiting for both sides to join.</p>
            )}
            {bothJoined && isHost && (
              <button
                onClick={startMatch}
                className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-bold text-lg transition-colors"
              >
                Start Match
              </button>
            )}
            {bothJoined && !isHost && !isSpectator && (
              <p className="text-gray-500 text-sm">Waiting for host to start the match...</p>
            )}
            {bothJoined && isSpectator && (
              <p className="text-gray-500 text-sm">👁️ Waiting for host to start the match...</p>
            )}
          </div>
        </div>
      )}

      {/* Judging state */}
      {match?.status === 'judging' && (
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <div className="animate-pulse text-purple-400 text-xl font-bold">⚖️ The AI judge is reviewing the match...</div>
          <p className="text-gray-500 text-sm">This may take a few moments</p>
        </div>
      )}

      {/* Completed state — final verdict */}
      {match?.status === 'completed' && matchResult && (
        <div className="flex-1 max-w-3xl mx-auto w-full p-6 overflow-y-auto">
          <div className="bg-gray-900 border border-purple-700/40 rounded-xl p-8 text-center mb-6">
            <p className="text-purple-400 text-sm font-medium mb-2">⚖️ FINAL VERDICT</p>
            <h2 className="text-3xl font-bold mb-4">
              {matchResult.winner === 'tie' ? (
                <span className="text-yellow-400">It's a Tie!</span>
              ) : (
                <span className={matchResult.winner === 'for' ? 'text-green-400' : 'text-red-400'}>
                  {matchResult.winner === 'for' ? match?.participants?.for?.username : match?.participants?.against?.username} Wins!
                </span>
              )}
            </h2>

            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <p className="text-green-400 text-sm font-medium mb-1">✅ FOR — {match?.participants?.for?.username}</p>
                <p className="text-4xl font-bold text-green-400">{matchResult.forScore}<span className="text-lg text-gray-500">/10</span></p>
              </div>
              <div className="text-center">
                <p className="text-red-400 text-sm font-medium mb-1">❌ AGAINST — {match?.participants?.against?.username}</p>
                <p className="text-4xl font-bold text-red-400">{matchResult.againstScore}<span className="text-lg text-gray-500">/10</span></p>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 text-left">
              <p className="text-gray-400 text-xs font-medium mb-2">JUDGE'S REASONING</p>
              <p className="text-gray-300 text-sm leading-relaxed">{matchResult.reasoning}</p>
            </div>
          </div>

          <div className="flex justify-center gap-3 mb-6">
            <button
              onClick={() => router.push('/matches')}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Matches
            </button>
          </div>

          <h3 className="text-gray-400 text-sm font-medium mb-3">Full Transcript</h3>
          <div className="space-y-3">
            {messages.map((msg) => (
              <MessageBubble key={msg._id} msg={msg} />
            ))}
          </div>
        </div>
      )}

      {/* Active match — chat feed */}
      {(match?.status === 'active' || match?.status === 'judging') && (
        <div className="flex-1 max-w-4xl mx-auto w-full p-6 overflow-y-auto space-y-3">
          {messages.map((msg) => (
            <MessageBubble key={msg._id} msg={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input area — only during active match, hidden for spectators */}
      {match?.status === 'active' && side && !isSpectator && (
        <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-6 py-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
              side === 'for' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
            }`}>
              {side === 'for' ? '✅ FOR' : '❌ AGAINST'}
            </span>
            <input
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={sendMessage}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Spectator footer during active match */}
      {match?.status === 'active' && isSpectator && (
        <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-6 py-4 text-center">
          <p className="text-gray-500 text-sm">👁️ You're watching this match live.</p>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: MatchMessage }) {
  if (msg.senderType === 'moderator') {
    return (
      <div className="flex justify-center">
        <div className="bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-2 text-center max-w-md">
          <p className="text-yellow-400 text-xs font-semibold mb-1">⚖️ MODERATOR</p>
          <p className="text-gray-300 text-sm">{msg.content}</p>
        </div>
      </div>
    );
  }

  const isFor = msg.senderType === 'for';
  return (
    <div className={`flex ${isFor ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-md rounded-lg px-4 py-2 ${
        isFor ? 'bg-green-950/40 border border-green-900/30' : 'bg-red-950/40 border border-red-900/30'
      }`}>
        <p className={`text-xs font-semibold mb-1 ${isFor ? 'text-green-400' : 'text-red-400'}`}>
          {isFor ? '✅' : '❌'} {msg.author?.username}
        </p>
        <p className="text-gray-200 text-sm">{msg.content}</p>
      </div>
    </div>
  );
}