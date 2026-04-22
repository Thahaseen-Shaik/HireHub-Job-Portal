import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, ThumbsUp, ThumbsDown, MessageSquare, X, Trash2, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChatWidget = () => {
    const { user } = useAuth();
    const role = user?.role || 'visitor';
    const storageKey = `hirehub_chat_${role}`;

    const [isOpen, setIsOpen] = useState(false);
    const welcomeMessage = (r) => ({ sender: 'bot', text: `Hello! I am your ${r} assistant. Ask me anything or upload an image.` });

    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : [welcomeMessage(role)];
    });
    const [input, setInput] = useState('');
    const [file, setFile] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Load history when role changes (e.g., user logs in/out)
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            // Restore existing history — no new welcome message
            setMessages(JSON.parse(saved));
        } else {
            // First time for this role: show exactly one welcome message
            const initial = [welcomeMessage(role)];
            setMessages(initial);
            localStorage.setItem(storageKey, JSON.stringify(initial));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role]);

    // Save history whenever messages change
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(messages));
        scrollToBottom();
    }, [messages, storageKey]);

    const handleClear = () => {
        if (window.confirm('Clear conversation history for this role?')) {
            const initialMsg = [{ sender: 'bot', text: `History cleared. How can I help you as a ${role} today?` }];
            setMessages(initialMsg);
            localStorage.setItem(storageKey, JSON.stringify(initialMsg));
        }
    };

    const handleSend = async () => {
        if (!input.trim() && !file) return;

        // If file is attached, handle Image Classification CNN route
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            if (input.trim()) {
                formData.append('message', input.trim());
            }
            
            const localPreview = URL.createObjectURL(file);
            const userMsg = { 
                sender: 'user', 
                text: input.trim() ? input.trim() : `[Sent Image: ${file.name}]`, 
                imagePreview: localPreview 
            };
            setMessages(prev => [...prev, userMsg]);
            setFile(null);
            setInput('');

            try {
                const res = await fetch('http://localhost:8000/upload-image', {
                    method: 'POST',
                    body: formData,
                });
                const data = await res.json();
                setMessages(prev => [...prev, { 
                    sender: 'bot', 
                    text: data.reply
                }]);
            } catch (err) {
                setMessages(prev => [...prev, { sender: 'bot', text: 'Error processing image.' }]);
            }
            return;
        }

        // Standard text route (NLP Model)
        const text = input;
        setMessages(prev => [...prev, { sender: 'user', text }]);
        setInput('');

        try {
            const res = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, role: role })
            });
            const data = await res.json();
            
            // Dispatch UI Action if present
            if (data.action) {
                if (data.action === 'NAVIGATE_URL' && data.payload?.url) {
                    window.location.href = data.payload.url;
                } else if (data.action === 'CHANGE_THEME' && data.payload?.theme) {
                    window.dispatchEvent(new CustomEvent('hirehub-theme-change', { 
                        detail: { theme: data.payload.theme } 
                    }));
                } else {
                    window.dispatchEvent(new CustomEvent('hirehub-ui-action', { 
                        detail: { 
                            action: data.action, 
                            entities: data.entities,
                            payload: data.payload 
                        } 
                    }));
                }
            }

            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: data.reply, 
                intent: data.intent,
                originalQuery: text, // Store query for RL
                needsFeedback: true 
            }]);
        } catch (err) {
             setMessages(prev => [...prev, { sender: 'bot', text: 'Server is disconnected.' }]);
        }
    };

    const handlePaste = (e) => {
        const item = e.clipboardData.items[0];
        if (item?.type.startsWith('image/')) {
            const blob = item.getAsFile();
            const pastedFile = new File([blob], `pasted_image_${Date.now()}.png`, { type: blob.type });
            setFile(pastedFile);
        }
    };

    const handleFeedback = async (intent, isHelpful, originalQuery) => {
        try {
            let correctionText = null;
            if (!isHelpful) {
                correctionText = window.prompt("Oops! What exact text should I reply with next time someone asks that? (Leave blank to just report error)", "");
                if (correctionText === null) return; // User clicked Cancel
            }

            await fetch('http://localhost:8000/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: originalQuery || "", 
                    intent: intent, 
                    is_helpful: isHelpful,
                    correction: correctionText
                })
            });
            alert(isHelpful ? 'Thank you! The AI rewarded the logic.' : 'Correction sent. The AI has learned what you meant!');
        } catch(e) {
            console.error("Feedback error", e);
        }
    }

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    style={{
                        padding: '15px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', 
                        color: 'white', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow)'
                    }}>
                    <MessageSquare size={24} />
                </button>
            )}

            {isOpen && (
                <div style={{
                    width: '350px', height: '520px', backgroundColor: 'var(--bg-card)', 
                    borderRadius: '16px', display: 'flex', flexDirection: 'column', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-main)', overflow: 'hidden'
                }}>
                    <div style={{ padding: '15px 20px', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <History size={16} />
                             <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', letterSpacing: '0.5px' }}>{role.toUpperCase()} ASSISTANT</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleClear} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }} title="Clear Chat">
                                <Trash2 size={18} />
                            </button>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: 'var(--bg-nav)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    backgroundColor: msg.sender === 'user' ? 'var(--primary-color)' : 'var(--bg-main)',
                                    color: msg.sender === 'user' ? '#fff' : 'var(--text-main)',
                                    border: msg.sender !== 'user' ? '1px solid var(--border-main)' : 'none',
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}>
                                    {msg.imagePreview && (
                                        <div style={{ marginBottom: '8px', cursor: 'pointer' }} onClick={() => window.open(msg.imagePreview)}>
                                            <img src={msg.imagePreview} alt="Shared" style={{ maxWidth: '100%', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                        </div>
                                    )}
                                    {msg.text}
                                </div>
                                
                                {msg.needsFeedback && msg.sender === 'bot' && (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', paddingLeft: '4px' }}>
                                        <button onClick={() => handleFeedback(msg.intent, true, msg.originalQuery)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--success-color, #10b981)', opacity: 0.7 }} title="Helpful"><ThumbsUp size={14}/></button>
                                        <button onClick={() => handleFeedback(msg.intent, false, msg.originalQuery)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--danger-color, #ef4444)', opacity: 0.7 }} title="Not Helpful"><ThumbsDown size={14}/></button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {file && (
                        <div style={{ padding: '8px 15px', backgroundColor: 'var(--bg-main)', fontSize: '11px', color: 'var(--primary-color)', borderTop: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Attached: {file.name}</span>
                            <button onClick={()=>setFile(null)} style={{ color: 'var(--danger-color, red)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold'}}>Remove</button>
                        </div>
                    )}

                    <div style={{ padding: '15px 20px', borderTop: '1px solid var(--border-main)', backgroundColor: 'var(--bg-card)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <label style={{ cursor: 'pointer', color: 'var(--text-dim)', display: 'flex' }}>
                            <Paperclip size={20} />
                            <input 
                                type="file" 
                                onChange={(e) => setFile(e.target.files[0])} 
                                style={{ display: 'none' }} 
                                accept="image/*"
                            />
                        </label>
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            onPaste={handlePaste}
                            placeholder={file ? "Send attached image..." : "Type a message..."}
                            style={{ 
                                flex: 1, 
                                padding: '10px 16px', 
                                borderRadius: '24px', 
                                border: '1px solid var(--border-main)', 
                                outline: 'none', 
                                backgroundColor: 'var(--bg-main)', 
                                color: 'var(--text-main)', 
                                fontSize: '13px',
                                transition: 'border-color 0.2s'
                            }}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() && !file}
                            style={{ 
                                background: 'var(--primary-color)', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '50%', 
                                minWidth: '40px', 
                                height: '40px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: 'pointer',
                                opacity: (!input.trim() && !file) ? 0.6 : 1,
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;

