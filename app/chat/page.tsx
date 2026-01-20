
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

type Message = {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: number
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hello. I am the OSINT coordinator agent. How can I assist you with your investigation today?',
            timestamp: Date.now()
        }
    ])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!inputValue.trim()) return

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: Date.now()
        }

        setMessages(prev => [...prev, newMessage])
        setInputValue('')
        setIsTyping(true)

        // Simulate Agent Delay
        setTimeout(() => {
            setIsTyping(false)
            const responseMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `I received your request: "${newMessage.content}". I am currently a mockup agent, but I will be connected to the OSINT skills soon.`,
                timestamp: Date.now()
            }
            setMessages(prev => [...prev, responseMessage])
        }, 1500)
    }

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/10 flex flex-col bg-black/50 backdrop-blur-sm hidden md:flex">
                <div className="p-4 border-b border-white/10">
                    <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="font-semibold">Back to Map</span>
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Active Agents
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 p-2 rounded bg-white/10 border border-white/10">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span className="text-sm">Coordinator</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded hover:bg-white/5 transition-colors cursor-not-allowed opacity-50">
                            <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                            <span className="text-sm">Geolocation</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded hover:bg-white/5 transition-colors cursor-not-allowed opacity-50">
                            <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                            <span className="text-sm">Preservation</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/10">
                    <div className="text-xs text-gray-500">v0.1.0 Beta</div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative">
                {/* Mobile Header */}
                <div className="md:hidden p-4 border-b border-white/10 flex items-center justify-between">
                    <Link href="/" className="text-white/80">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <span className="font-semibold">OSINT Assistant</span>
                    <div className="w-6"></div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex items-start gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto' : ''
                                }`}
                        >
                            <div
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'
                                    } w-full`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-gray-400 font-medium">
                                        {msg.role === 'user' ? 'You' : 'Agent'}
                                    </span>
                                    <span className="text-[10px] text-gray-600">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div
                                    className={`px-4 py-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white/10 text-gray-200 border border-white/10 rounded-bl-none'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex items-start gap-4 max-w-3xl">
                            <div className="flex flex-col items-start">
                                <div className="text-xs text-gray-400 font-medium mb-1">Agent</div>
                                <div className="px-4 py-3 rounded-lg bg-white/10 border border-white/10 rounded-bl-none flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 border-t border-white/10 bg-black/80 backdrop-blur">
                    <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask the agents to investigate..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-light"
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-900/20"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9-2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </form>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-gray-600">
                            AI agents may produce inaccurate results. Always verify critical information.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
