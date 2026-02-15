'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { api, getUserIdLocal } from '@/lib/api';

interface ChatPanelProps {
  messages: ChatMessage[];
}

export default function ChatPanel({ messages }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUser = getUserIdLocal();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    setError(null);

    const res = await api.sendChat(input.trim());
    setSending(false);

    if (res.ok) {
      setInput('');
    } else {
      setError(res.error || 'Failed to send');
    }
  };

  const handleReport = async (messageId: string) => {
    const res = await api.reportMessage(messageId, 'Inappropriate');
    if (!res.ok) {
      alert(res.error || 'Failed to report');
    }
  };

  const visibleMessages = messages.filter((m) => !m.deleted);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {visibleMessages.length === 0 && (
          <div className="text-gray-500 text-center text-sm mt-8">No messages yet. Say hello!</div>
        )}
        {visibleMessages.map((msg) => {
          const isMe = msg.user_id === currentUser;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  isMe ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100'
                }`}
              >
                {!isMe && (
                  <div className="text-xs text-gray-400 mb-0.5">
                    {msg.user_id.slice(0, 8)}...
                  </div>
                )}
                <div className="break-words">{msg.content}</div>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-gray-500">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
                {!isMe && (
                  <button
                    onClick={() => handleReport(msg.id)}
                    className="text-[10px] text-gray-600 hover:text-red-400"
                    title="Report message"
                  >
                    report
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-3">
        {error && <div className="text-red-400 text-xs mb-1">{error}</div>}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            maxLength={240}
            className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="bg-blue-600 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-blue-500 transition-colors"
          >
            Send
          </button>
        </div>
        <div className="text-[10px] text-gray-600 mt-1">
          {input.length}/240 &middot; Rate limit: 1 msg per 3s
        </div>
      </div>
    </div>
  );
}
