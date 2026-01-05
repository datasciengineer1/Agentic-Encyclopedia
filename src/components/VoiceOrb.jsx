import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VoiceOrb = ({ isListening, isSpeaking, isProcessing, onClick }) => {
    return (
        <div className="flex flex-col items-center gap-8 cursor-pointer" onClick={onClick}>
            <div className="relative flex items-center justify-center w-32 h-32">
                {/* Background Glow */}
                <div className={`absolute inset-0 rounded-full blur-xl opacity-50 transition-colors duration-500
            ${isListening ? 'bg-primary' : isSpeaking ? 'bg-secondary' : isProcessing ? 'bg-accent' : 'bg-surface'}
          `} />

                {/* Main Orb */}
                <motion.div
                    className={`relative z-10 w-20 h-20 rounded-full shadow-lg border-2 border-white/10 flex items-center justify-center
              ${isListening ? 'bg-primary/20' : isSpeaking ? 'bg-secondary/20' : isProcessing ? 'bg-accent/20' : 'bg-surface'}
            `}
                    animate={
                        isListening ? { scale: [1, 1.1, 1] } :
                            isSpeaking ? { scale: [1, 1.2, 1] } :
                                isProcessing ? { rotate: 360 } :
                                    { scale: 1 }
                    }
                    transition={
                        isProcessing ? { duration: 2, repeat: Infinity, ease: "linear" } :
                            { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }
                >
                    <div className={`w-12 h-12 rounded-full opacity-80
              ${isListening ? 'bg-primary' : isSpeaking ? 'bg-secondary' : isProcessing ? 'bg-accent' : 'bg-white/20'}
            `} />
                </motion.div>
            </div>

            {/* Status Text - Now relative in flex flow */}
            <div className="whitespace-nowrap text-sm font-medium text-white/50 tracking-wider">
                {isListening ? 'Listening...' :
                    isSpeaking ? 'Speaking...' :
                        isProcessing ? 'Thinking...' :
                            'Tap to Speak'}
            </div>
        </div>
    );
};

export default VoiceOrb;
