import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Sparkles, AlertCircle, ThumbsUp, ThumbsDown, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

const ChatInterface = ({ messages }) => {
    const bottomRef = useRef(null);
    const [expandedAnalysis, setExpandedAnalysis] = useState({});

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleAnalysis = (idx) => {
        setExpandedAnalysis(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const handleFeedback = (idx, type) => {
        console.log(`User feedback for message ${idx}: ${type}`);
        // Ideally send to backend
    };

    return (
        <div className="flex-1 w-full max-w-3xl mx-auto p-4 overflow-y-auto space-y-6">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-white/30 mt-20">
                    <Sparkles size={48} className="mb-4 opacity-50" />
                    <p className="text-lg">Ask me anything...</p>
                </div>
            )}

            {messages.map((msg, idx) => {
                // Handle both simple string (legacy/user) and object (new AI) formats
                const textContent = typeof msg.text === 'string' ? msg.text : msg.text?.text || "Error parsing response";
                const meta = typeof msg.text === 'object' ? msg.text : null;

                return (
                    <div
                        key={idx}
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        {/* Avatar */}
                        <div className={`
              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
              ${msg.role === 'user' ? 'bg-white/10' : 'bg-primary/20 text-primary'}
            `}>
                            {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                        </div>

                        {/* Bubble Container */}
                        <div className="flex flex-col gap-2 max-w-[85%]">

                            {/* Message Bubble */}
                            <div className={`
                rounded-2xl px-5 py-4 text-sm leading-relaxed
                ${msg.role === 'user'
                                    ? 'bg-white/10 text-white rounded-tr-none'
                                    : 'bg-surface border border-white/5 text-gray-200 rounded-tl-none shadow-sm'}
              `}>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown>{textContent}</ReactMarkdown>
                                </div>
                            </div>

                            {/* Metadata & Analysis (AI Only) */}
                            {msg.role === 'model' && meta && (
                                <div className="space-y-2">
                                    {/* Top Row: Confidence + Sources Toggle */}
                                    <div className="flex items-center gap-2 text-xs text-white/40 ml-2">
                                        {meta.confidence_score !== undefined && (
                                            <span className={`px-2 py-0.5 rounded-full border ${meta.confidence_score > 80 ? 'border-green-500/30 text-green-400' :
                                                    meta.confidence_score > 50 ? 'border-yellow-500/30 text-yellow-400' : 'border-red-500/30 text-red-400'
                                                }`}>
                                                {meta.confidence_score}% Confidence
                                            </span>
                                        )}

                                        {meta.sources && meta.sources.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <BookOpen size={12} />
                                                <span>{meta.sources.join(', ')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Analysis Section (Expandable) */}
                                    {meta.analysis && (
                                        <div className="bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                                            <button
                                                onClick={() => toggleAnalysis(idx)}
                                                className="w-full flex items-center justify-between px-3 py-2 text-xs text-white/50 hover:bg-white/5 transition-colors"
                                            >
                                                <span className="uppercase tracking-wider font-semibold">AI Analysis</span>
                                                {expandedAnalysis[idx] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                            </button>

                                            {expandedAnalysis[idx] && (
                                                <div className="px-3 pb-3 pt-1 text-xs text-white/70 space-y-2 border-t border-white/5">
                                                    <div><strong className="text-secondary">Intent:</strong> {meta.analysis.intent}</div>
                                                    <div><strong className="text-secondary">Context:</strong> {meta.analysis.context}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Recommendations Cards */}
                                    {meta.recommendations && meta.recommendations.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                            {meta.recommendations.map((rec, rIdx) => (
                                                <div key={rIdx} className="bg-primary/5 border border-primary/20 rounded-lg p-3 hover:bg-primary/10 transition-colors cursor-pointer group">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-medium text-primary group-hover:underline">{rec.label}</span>
                                                        <span className="text-[10px] bg-primary/20 px-1 rounded text-primary/80">{rec.score}% match</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Feedback Actions */}
                                    <div className="flex justify-end gap-2 pt-1 opacity-50 hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleFeedback(idx, 'up')} className="p-1 hover:text-green-400 hover:bg-white/5 rounded"><ThumbsUp size={14} /></button>
                                        <button onClick={() => handleFeedback(idx, 'down')} className="p-1 hover:text-red-400 hover:bg-white/5 rounded"><ThumbsDown size={14} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
};

export default ChatInterface;
