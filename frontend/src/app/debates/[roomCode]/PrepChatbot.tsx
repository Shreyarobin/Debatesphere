'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface PrepChatbotProps {
  topic: string;
  side: 'for' | 'against';
}

export default function PrepChatbot({ topic, side }: PrepChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setInput('');
    setIsStreaming(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/prep-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic, side, message: text }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

          for (const line of lines) {
            const data = line.replace('data: ', '');
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              fullText += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: fullText };
                return updated;
              });
            } catch (e) {
              // skip malformed chunks
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const suggestedPrompts = [
    'Help me open this debate',
    'Give me a strong rebuttal',
    'What fallacy should I avoid',
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-3 shadow-lg font-medium text-sm transition-colors z-50"
      >
        🧠 Prep with AI
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col z-50">
      <div className="bg-gray-800 px-4 py-3 rounded-t-xl flex justify-between items-center border-b border-gray-700">
        <div>
          <h3 className="text-white font-semibold text-sm">Debate Prep Coach</h3>
          <p className="text-gray-400 text-xs">Arguing {side.toUpperCase()}</p>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-gray-500 text-xs">Try asking:</p>
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="block w-full text-left bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-3 py-2 rounded-lg transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm px-3 py-2 rounded-lg max-w-[85%] ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white ml-auto'
                : 'bg-gray-800 text-gray-200'
            }`}
          >
            {msg.content || (isStreaming && i === messages.length - 1 ? '...' : '')}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-gray-700 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ask your debate coach..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isStreaming}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-3 py-2 rounded-lg text-white text-sm transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}