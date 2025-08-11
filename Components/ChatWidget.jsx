'use client'
import { useState } from 'react';

export default function ChatWidget() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const user = { role: 'user', content: input };
    setMessages(prev => [...prev, user]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ question: input }) 
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + err.message }]);
    } finally {
      setLoading(false);
      setInput('');
    }
  }

  return (
    <div className="max-w-xl border border-gray-300 rounded-lg p-3 bg-white shadow-sm">
      <div className="h-80 overflow-y-auto mb-2 space-y-3">
        {messages.map((m, i) => (
          <div 
            key={i} 
            className={`p-2 rounded-lg ${m.role === 'user' ? 'bg-blue-100 text-blue-900 ml-8' : 'bg-gray-100 text-gray-900 mr-8'}`}
          >
            <span className="font-semibold capitalize">{m.role}:</span>{' '}
            <span dangerouslySetInnerHTML={{ __html: escapeHtml(m.content) }} />
          </div>
        ))}
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={3}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Type your message here..."
      />
      <button
        onClick={send}
        disabled={loading}
        className={`mt-2 px-4 py-2 rounded-md text-white font-medium ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}