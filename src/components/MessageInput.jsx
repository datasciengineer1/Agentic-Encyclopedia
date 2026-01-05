import React, { useState, useRef } from 'react';
import { Send, Paperclip, Mic, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MessageInput = ({ onSend, onSwitchToVoice, isProcessing }) => {
    const [text, setText] = useState('');
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleSend = () => {
        if ((!text.trim() && !file) || isProcessing) return;

        onSend(text, file);
        setText('');
        setFile(null);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const removeFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="w-full max-w-3xl mx-auto px-4 pb-4">
            {/* File Preview */}
            <AnimatePresence>
                {file && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-center gap-2 mb-2 p-2 bg-surface border border-white/10 rounded-lg w-fit"
                    >
                        {file.type.startsWith('image/') ? (
                            <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <Paperclip size={14} className="text-secondary shrink-0" />
                        )}
                        <span className="text-xs text-white/80 max-w-[200px] truncate">{file.name}</span>
                        <button onClick={removeFile} className="p-1 hover:bg-white/10 rounded-full">
                            <X size={12} className="text-white/60" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-end gap-2 bg-surface border border-white/10 rounded-2xl p-2 shadow-lg focus-within:border-primary/50 transition-colors">
                {/* Switch to Voice Button */}
                <button
                    onClick={onSwitchToVoice}
                    className="p-3 text-white/50 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors shrink-0"
                    title="Switch to Voice Mode"
                >
                    <Mic size={20} />
                </button>

                {/* File Upload Button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-white/50 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-colors shrink-0"
                    title="Attach File (Text, Image, PDF)"
                >
                    <Paperclip size={20} />
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".txt,.csv,.json,.md,.jpg,.jpeg,.png,.webp,.pdf"
                        className="hidden"
                    />
                </button>

                {/* Text Area */}
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question or upload data..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 resize-none py-3 max-h-32 min-h-[44px]"
                    rows={1}
                    style={{ height: 'auto' }}
                />

                {/* Send Button */}
                <button
                    onClick={handleSend}
                    disabled={(!text.trim() && !file) || isProcessing}
                    className={`p-3 rounded-xl transition-all duration-300 shrink-0
            ${(!text.trim() && !file) || isProcessing
                            ? 'text-white/20 bg-transparent'
                            : 'text-background bg-primary hover:bg-primary/90'}
          `}
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

export default MessageInput;
