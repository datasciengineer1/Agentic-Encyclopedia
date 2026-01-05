import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, Cloud, Zap } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, onSave, currentProvider, currentApiKey }) => {
    const [apiKey, setApiKey] = useState(currentApiKey || '');
    const [provider, setProvider] = useState(currentProvider || 'gemini');

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setApiKey(currentApiKey);
        setProvider(currentProvider);

        // Simple mobile detection
        const checkMobile = () => {
            const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
            const mobile = Boolean(userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i) || window.innerWidth < 768);
            setIsMobile(mobile);
        };
        checkMobile();
    }, [currentApiKey, currentProvider, isOpen]);

    const handleSave = () => {
        onSave(provider, apiKey);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="w-full max-w-md p-6 bg-surface border border-white/10 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Settings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-white/70" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* AI Provider Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-3">AI Intelligence Source</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setProvider('gemini')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${provider === 'gemini'
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'bg-background border-white/10 text-white/40 hover:border-white/30'
                                    }`}
                            >
                                <Cloud size={24} className="mb-2" />
                                <span className="text-sm font-semibold">Gemini (Cloud)</span>
                                <span className="text-[10px] opacity-70">Fast & Lightweight</span>
                            </button>

                            <button
                                onClick={() => !isMobile && setProvider('local')}
                                disabled={isMobile}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${provider === 'local'
                                    ? 'bg-secondary/20 border-secondary text-secondary'
                                    : isMobile
                                        ? 'bg-white/5 border-transparent text-white/20 cursor-not-allowed'
                                        : 'bg-background border-white/10 text-white/40 hover:border-white/30'
                                    }`}
                            >
                                <Cpu size={24} className="mb-2" />
                                <span className="text-sm font-semibold">Llama 3 (Local)</span>
                                <span className="text-[10px] opacity-70">{isMobile ? "Desktop Only" : "Private & Unlimited"}</span>
                            </button>
                        </div>
                        {provider === 'local' && (
                            <div className="mt-2 flex items-start gap-2 p-2 bg-secondary/10 rounded-lg text-xs text-secondary/80">
                                <Zap size={14} className="shrink-0 mt-0.5" />
                                <p>Requires ~4GB download on first use. Runs entirely on your device GPU.</p>
                            </div>
                        )}
                        {isMobile && (
                            <div className="mt-2 text-xs text-white/30 text-center">
                                Local AI is disabled on mobile due to memory limits.
                            </div>
                        )}
                    </div>

                    {/* API Key Input (Only needed for Gemini) */}
                    {provider === 'gemini' && (
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-2">Gemini API Key</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your API Key"
                                    className="w-full pl-10 pr-4 py-3 bg-background border border-white/10 rounded-xl focus:outline-none focus:border-primary text-white placeholder:text-white/20"
                                />
                            </div>
                            <p className="mt-2 text-xs text-white/40">
                                Key stored locally in browser. Free tier recommended.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        className="w-full py-3 bg-white text-background hover:bg-white/90 font-bold rounded-xl transition-colors"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
