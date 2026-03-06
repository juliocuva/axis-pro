'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function AxisNexusWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ sender: 'anexo' | 'user', text: string, type?: 'text' | 'widget' }[]>([
        {
            sender: 'anexo',
            text: 'Auditoría Legal en Línea (ANEXO). ¿Desear iniciar escaneo de cumplimiento EUDR/FDA sobre lotes de exportación?'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const quickPrompts = [
        "Escanear polígonos EUDR faltantes",
        "Auditar bioseguridad lotes marítimos",
        "Status de Eventos de Custodia (FDA)",
        "Generar acta de inspección WGS84"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isOpen]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        // User message
        setMessages(prev => [...prev, { sender: 'user', text }]);
        setInputValue('');
        setIsTyping(true);

        try {
            // Conversión del historial local al formato esperado por el backend ([{ sender: 'user', text: '...' }])
            const apiMessages = [...messages, { sender: 'user', text }].map(m => ({
                sender: m.sender,
                text: m.text
            }));

            // Llamada al backend "RAG" inteligente que acabamos de crear
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: apiMessages })
            });

            const data = await response.json();

            setIsTyping(false);

            if (data.answer) {
                setMessages(prev => [...prev, { sender: 'anexo', text: data.answer }]);
            } else if (data.error) {
                setMessages(prev => [...prev, { sender: 'anexo', text: `ERROR ANEXO SERVER: ${data.error}` }]);
            } else {
                setMessages(prev => [...prev, { sender: 'anexo', text: 'Respuesta en blanco de central.' }]);
            }
        } catch (error) {
            console.error("Error contactando a la IA:", error);
            setIsTyping(false);
            setMessages(prev => [...prev, { sender: 'anexo', text: "Error de red: No se pudo conectar con el motor de auditoría inteligente (/api/ai/chat)." }]);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-sans">
            {/* Fila del Botón y Etiqueta (Cerrado) */}
            {!isOpen && (
                <div className="flex flex-col items-end gap-2 animate-in slide-in-from-bottom-5 duration-500 fade-in">
                    <div className="bg-bg-card border border-white/10 px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 relative mr-2 mb-2">
                        <div className="absolute right-0 -mr-2 w-3 h-3 bg-brand-green rounded-full animate-ping"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white">Auditor <span className="text-brand-green">Anexo</span> Activo</p>
                    </div>

                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-16 h-16 bg-bg-card rounded-full border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(0,223,154,0.15)] hover:shadow-[0_0_40px_rgba(0,223,154,0.3)] hover:scale-105 transition-all group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-brand-green opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-green group-hover:scale-110 transition-transform duration-300">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                    </button>
                </div>
            )}

            {/* Ventana de Chat Expandida (NEXUS) */}
            {isOpen && (
                <div className="w-[380px] sm:w-[420px] h-[600px] max-h-[85vh] bg-bg-card border border-white/10 rounded-industrial shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300 fade-in">
                    {/* Header Premium AI */}
                    <div className="p-5 border-b border-white/5 bg-bg-main relative overflow-hidden flex justify-between items-center group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl pointer-events-none transition-all group-hover:bg-brand-green/10"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(0,223,154,0.1)]">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-green">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-black uppercase tracking-tighter text-lg leading-tight">ANEXO</h3>
                                <p className="text-[9px] text-brand-green-bright font-mono uppercase tracking-[0.2em]">Auditor Bot Inmutable</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors relative z-10">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    {/* Chat Body */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-bg-main to-bg-card font-sans">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[90%]`}>
                                {msg.sender === 'anexo' && (
                                    <div className="flex items-center gap-2 mb-1.5 ml-1">
                                        <div className="w-4 h-4 rounded-full bg-brand-green/20 flex items-center justify-center border border-brand-green/30">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>
                                        </div>
                                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Protocolo Anexo</span>
                                    </div>
                                )}
                                <div
                                    className={`
                                        p-4 rounded-2xl text-sm leading-relaxed
                                        ${msg.sender === 'user'
                                            ? 'bg-brand-green text-black border border-brand-green-bright rounded-tr-sm ml-auto font-medium shadow-[0_5px_15px_rgba(0,223,154,0.15)]'
                                            : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm shadow-xl'
                                        }
                                    `}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-start max-w-[85%] animate-in fade-in duration-300">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm flex gap-1.5 items-center shadow-xl">
                                    <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    <span className="text-[10px] text-gray-500 uppercase ml-2 font-mono tracking-widest">Verificando Normativa...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Prompts */}
                    {messages.length === 1 && (
                        <div className="px-4 pb-2 flex flex-wrap gap-2">
                            {quickPrompts.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(prompt)}
                                    className="text-[9px] font-bold uppercase tracking-wider text-gray-400 border border-white/10 hover:border-brand-green/40 hover:text-brand-green bg-white/5 px-3 py-2 rounded-full transition-all text-left"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 border-t border-white/5 bg-bg-card relative z-10">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend(inputValue);
                            }}
                            className="bg-bg-main border border-white/10 rounded-industrial-sm flex items-center p-1.5 transition-colors focus-within:border-brand-green/40 shadow-inner overflow-hidden"
                        >
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Instruye al Auditor Anexo..."
                                className="flex-1 bg-transparent border-none text-xs text-white px-3 py-3 outline-none placeholder:text-gray-600 font-medium"
                                disabled={isTyping}
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isTyping}
                                className="p-3 bg-brand-green text-black rounded font-bold hover:bg-brand-green-bright disabled:opacity-30 transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
