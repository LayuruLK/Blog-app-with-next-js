'use client'
import { useState } from 'react';

export default function ChatWidget(){
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function send(){
    if (!input.trim()) return;
    const user = { role: 'user', content: input };
    setMessages(prev => [...prev, user]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: input }) });
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
    <div style={{ maxWidth: 640, border: '1px solid #ddd', padding: 12 }}>
      <div style={{ height: 300, overflowY: 'auto', marginBottom: 8 }}>
        {messages.map((m,i)=> (
          <div key={i} style={{ margin: 8 }}><b>{m.role}:</b> <span dangerouslySetInnerHTML={{ __html: escapeHtml(m.content) }} /></div>
        ))}
      </div>
      <textarea value={input} onChange={e=>setInput(e.target.value)} rows={3} style={{ width: '100%' }} />
      <button onClick={send} disabled={loading} style={{ marginTop: 8 }}>{loading ? '...' : 'Send'}</button>
    </div>
  );
}

function escapeHtml(str){
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}