import React from 'react';
import { motion } from 'framer-motion';

const ModelProgress = ({ progress }) => {
    if (!progress) return null;

    // WebLLM progress object: { text: string, progress: number }
    const percent = Math.round(progress.progress * 100);

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-md p-8 bg-surface border border-white/10 rounded-2xl shadow-2xl text-center">
                <h3 className="text-xl font-bold text-white mb-2">Downloading AI Brain</h3>
                <p className="text-sm text-white/60 mb-6">
                    This happens only once. We are downloading a powerful Llama-3 model directly to your device so you can chat privately and for free forever.
                </p>

                <div className="mb-2 flex justify-between text-xs font-semibold text-primary">
                    <span>{progress.text || "Initializing..."}</span>
                    <span>{percent}%</span>
                </div>

                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.2 }}
                        className="h-full bg-primary"
                    />
                </div>

                <p className="mt-4 text-xs text-white/30 italic">
                    Speed depends on your internet. Please don't close this tab.
                </p>
            </div>
        </div>
    );
};

export default ModelProgress;
