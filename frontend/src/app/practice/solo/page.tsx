'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

interface SoloMessage {
  sender: 'user' | 'ai';
  content: string;
  createdAt?: string;
}

export default function PracticeSoloPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stage, setStage] = useState<'setup' | 'active' | 'ending' | 'report'>('setup');
  const [topic, setTopic] = useState('');
  const [userSide, setUserSide] = useState<'for' | 'against'>('for');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SoloMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [report, setReport] = useState<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startSession = async () => {
    if (!topic.trim()) return;
    try {
      const { data } = await api.post('/solo', { topic: topic.trim(), userSide });
      setSessionId(data._id);
      setMessages([]);
      setTimeRemaining(180);
      setStage('active');

      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            endSession(data._id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start session.');
    }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !sessionId || sending) return;
    const userContent = newMsg.trim();
    setNewMsg('');
    setSending(true);

    setMessages((prev) => [...prev, { sender: 'user', content: userContent }]);

    try {
      const { data } = await api.post(`/solo/${sessionId}/message`, { content: userContent });
      setMessages((prev) => [...prev, { sender: 'ai', content: data.aiReply }]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to get AI reply.');
    } finally {
      setSending(false);
    }
  };

  const endSession = async (id?: string) => {
    const targetId = id || sessionId;
    if (!targetId) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setStage('ending');

    try {
      const { data } = await api.post(`/solo/${targetId}/end`);
      setReport(data.report);
      setStage('report');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate report.');
      setStage('active');
    }
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  if (authLoading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;
  }

  // Setup screen
  if (stage === 'setup') {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">🤖 Practice Alone vs AI</h1>
            <button onClick={() => router.push('/practice')} className="text-gray-400 hover:text-white text-sm transition-colors">
              ← Back
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-6 mt-10">
          <h2 className="text-2xl font-bold mb-2 text-center">Set up your practice round</h2>
          <p className="text-gray-400 mb-8 text-center">3 minutes, one-on-one against the AI</p>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Debate Topic</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Should social media be regulated by governments?"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Choose your side</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setUserSide('for')}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    userSide === 'for' ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  ✅ FOR
                </button>
                <button
                  onClick={() => setUserSide('against')}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    userSide === 'against' ? 'bg-red-900/50 text-red-400 border border-red-700' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  ❌ AGAINST
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-2">The AI will argue the opposite side.</p>
            </div>

            <button
              onClick={startSession}
              disabled={!topic.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 rounded-lg font-bold transition-colors"
            >
              Start 3-Minute Round
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ending / generating report screen
  if (stage === 'ending') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center flex-col gap-4 text-white">
        <div className="animate-pulse text-orange-400 text-xl font-bold">📋 Analyzing your performance...</div>
        <p className="text-gray-500 text-sm">Generating your strengths and weaknesses report</p>
      </div>
    );
  }

  // Report screen
  if (stage === 'report' && report) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">📋 Your Performance Report</h1>
            <button onClick={() => router.push('/practice')} className="text-gray-400 hover:text-white text-sm transition-colors">
              ← Back to Practice
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto p-6">
          <div className="text-center mb-8">
            <p className="text-gray-400 text-sm">{topic}</p>
            <p className="text-gray-500 text-xs">You argued {userSide.toUpperCase()}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-900 border border-green-900/30 rounded-xl p-6">
              <p className="text-green-400 font-bold text-sm mb-3">💪 STRENGTHS</p>
              <ul className="space-y-2">
                {report.strengths.map((s: string, i: number) => (
                  <li key={i} className="text-gray-300 text-sm flex gap-2">
                    <span className="text-green-400">•</span> {s}
                  </li>
                ))}
                {report.strengths.length === 0 && <li className="text-gray-600 text-sm">None identified.</li>}
              </ul>
            </div>

            <div className="bg-gray-900 border border-orange-900/30 rounded-xl p-6">
              <p className="text-orange-400 font-bold text-sm mb-3">🎯 AREAS TO IMPROVE</p>
              <ul className="space-y-2">
                {report.weaknesses.map((w: string, i: number) => (
                  <li key={i} className="text-gray-300 text-sm flex gap-2">
                    <span className="text-orange-400">•</span> {w}
                  </li>
                ))}
                {report.weaknesses.length === 0 && <li className="text-gray-600 text-sm">None identified.</li>}
              </ul>
            </div>
          </div>

          <div className="bg-gray-900 border border-blue-900/30 rounded-xl p-6 mb-6">
            <p className="text-blue-400 font-bold text-sm mb-3">🧠 OVERALL FEEDBACK</p>
            <p className="text-gray-300 text-sm leading-relaxed">{report.overallFeedback}</p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setStage('setup');
                setTopic('');
                setMessages([]);
                setReport(null);
              }}
              className="bg-orange-600 hover:bg-orange-700 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Practice Again
            </button>
            <button
              onClick={() => router.push('/practice')}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Practice
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active debate screen
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">{topic}</h1>
            <p className="text-gray-400 text-sm">You're arguing {userSide === 'for' ? '✅ FOR' : '❌ AGAINST'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-lg font-mono font-bold text-lg ${
              timeRemaining <= 30 ? 'bg-red-900/50 text-red-400' : 'bg-orange-900/50 text-orange-400'
            }`}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
            <button
              onClick={() => endSession()}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              End Now
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full p-6 overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-600 text-sm text-center mt-8">Make your opening argument to start the round.</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-md rounded-lg px-4 py-2 ${
              msg.sender === 'user'
                ? (userSide === 'for' ? 'bg-green-950/40 border border-green-900/30' : 'bg-red-950/40 border border-red-900/30')
                : 'bg-gray-800/80 border border-gray-700'
            }`}>
              <p className={`text-xs font-semibold mb-1 ${
                msg.sender === 'user' ? (userSide === 'for' ? 'text-green-400' : 'text-red-400') : 'text-gray-400'
              }`}>
                {msg.sender === 'user' ? 'You' : '🤖 AI Opponent'}
              </p>
              <p className="text-gray-200 text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-2">
              <p className="text-gray-500 text-sm italic">AI is thinking...</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !sending && sendMessage()}
            placeholder="Type your argument..."
            disabled={sending}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMsg.trim()}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}