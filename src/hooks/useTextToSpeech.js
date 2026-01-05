import { useState, useCallback, useEffect } from 'react';

export const useTextToSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const synth = window.speechSynthesis;

    const speak = useCallback((text) => {
        if (!synth) return;

        // Cancel existing speech
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Attempt to select a better voice
        const voices = synth.getVoices();
        // Prefer: Google US English, or a natural sounding voice
        const preferredVoice = voices.find(v => v.name.includes('Google US English')) ||
            voices.find(v => v.name.includes('Samantha')) ||
            voices[0];

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error('TTS Error:', e);
            setIsSpeaking(false);
        };

        synth.speak(utterance);
    }, [synth]);

    const cancel = useCallback(() => {
        if (synth) {
            synth.cancel();
            setIsSpeaking(false);
        }
    }, [synth]);

    // Handle voices loaded async
    useEffect(() => {
        if (synth && synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = () => {
                // Just trigger re-render or re-fetch voices if needed
            };
        }
    }, [synth]);

    return {
        speak,
        cancel,
        isSpeaking
    };
};
