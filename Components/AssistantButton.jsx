'use client'
import { useState, useEffect, useRef } from 'react';
import { FiMessageSquare, FiX, FiSend, FiUser } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';

export default function AssistantButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setTimeout(scrollToBottom, 300); // Scroll after animation completes
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    async function send() {
        if (!input.trim() || loading) return;

        const userMessage = {
            role: 'user',
            content: input,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: input })
            });
            const data = await res.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.answer,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Error: ' + (err.message || 'Failed to process your request'),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Floating Button */}
            <button
                onClick={toggleChat}
                className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${isOpen ? 'scale-0' : 'scale-100'} bg-blue-600 hover:bg-blue-700 text-white fixed bottom-6 right-6`}
                aria-label="Open chat"
            >
                <FiMessageSquare size={24} />
            </button>

            {/* Chat Window */}
            <div
                className={`transition-all duration-300 transform ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'} w-80 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col`}
                style={{ height: '500px' }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <RiRobot2Line size={20} />
                        <h3 className="font-semibold text-lg">AI Assistant</h3>
                    </div>
                    <button
                        onClick={toggleChat}
                        className="p-1 rounded-full hover:bg-blue-700 transition-colors"
                        aria-label="Close chat"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <RiRobot2Line size={48} className="text-blue-400 mb-3" />
                            <p className="text-lg font-medium">How can I help you today?</p>
                            <p className="text-sm mt-1">Ask me anything!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-xs p-3 rounded-lg relative ${message.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}
                                    >
                                        <div className="flex items-center mb-1">
                                            {message.role === 'user' ? (
                                                <FiUser className="mr-2" size={14} />
                                            ) : (
                                                <RiRobot2Line className="mr-2" size={14} />
                                            )}
                                            <span className="text-xs opacity-80">{message.timestamp}</span>
                                        </div>
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-200 text-gray-800 p-3 rounded-lg rounded-bl-none max-w-xs">
                                        <div className="flex space-x-2 items-center">
                                            <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
                                            <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                            <span className="text-xs ml-2">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-gray-200 bg-white">
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows={1}
                            disabled={loading}
                            aria-label="Type your message"
                        />
                        <button
                            onClick={send}
                            disabled={loading || !input.trim()}
                            className={`absolute right-2 bottom-2 p-2 rounded-full ${loading || !input.trim()
                                ? 'text-gray-400'
                                : 'text-blue-600 hover:bg-blue-100'}`}
                            aria-label="Send message"
                        >
                            <FiSend size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}