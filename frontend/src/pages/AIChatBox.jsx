import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

export default function AIChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Xin chào! Tôi là trợ lý AI của ITSurv. Bạn cần tư vấn về linh kiện hay cấu hình PC nào không?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Lỗi từ máy chủ AI');
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.reply || 'AI không có phản hồi.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: `⚠️ ${err.message}. Hãy kiểm tra API Key hoặc kết nối mạng.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '100px', right: '25px', zIndex: 1000 }}>
      <style>
        {`
          .animate-chat-window {
            animation: chatWindowPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            transform-origin: bottom right;
          }
          @keyframes chatWindowPop {
            0% { opacity: 0; transform: scale(0.5) translateY(30px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          .animate-chat-btn {
            animation: chatBtnPop 0.3s ease-out forwards;
          }
          @keyframes chatBtnPop {
            0% { transform: scale(0); }
            100% { transform: scale(1); }
          }
          .animate-msg {
            animation: msgSlideUp 0.3s ease-out forwards;
          }
          @keyframes msgSlideUp {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      {!isOpen ? (
        <button 
          className="animate-chat-btn"
          onClick={() => setIsOpen(true)}
          style={{ 
            width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)', transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Bot size={30} />
        </button>
      ) : (
        <div className="glass-card animate-chat-window" style={{ width: '350px', height: '450px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', padding: '1rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={20} />
              <span style={{ fontWeight: 600 }}>Hỗ Trợ AI Trực Tuyến</span>
            </div>
            <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
          </div>

          {/* Messages area */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((m, i) => (
              <div key={i} className="animate-msg" style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ 
                  padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem',
                  background: m.role === 'user' ? 'var(--primary)' : 'rgba(99, 102, 241, 0.2)',
                  color: m.role === 'user' ? 'white' : '#1e3a8a', 
                  border: m.role === 'ai' ? '1px solid rgba(99, 102, 241, 0.4)' : 'none',
                  fontWeight: m.role === 'ai' ? '600' : '400'
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="animate-msg" style={{ alignSelf: 'flex-start', padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                AI đang gõ...
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: '0.75rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Hỏi về linh kiện, giá cả..." 
              style={{ flex: 1, padding: '0.5rem' }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem' }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}