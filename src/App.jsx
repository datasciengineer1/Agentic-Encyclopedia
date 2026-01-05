import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Sparkles, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

import ChatInterface from './components/ChatInterface';
import VoiceOrb from './components/VoiceOrb';
import MessageInput from './components/MessageInput';
import SettingsModal from './components/SettingsModal';
import ModelProgress from './components/ModelProgress';

import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { AIService } from './services/aiService';
import { LocalAIService } from './services/localAiService';

function App() {
  const [messages, setMessages] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMode, setInputMode] = useState('voice'); // 'voice' | 'text'

  // Settings State
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [provider, setProvider] = useState(localStorage.getItem('ai_provider') || 'gemini');

  // Local AI State
  const [modelProgress, setModelProgress] = useState(null);

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  const { speak, isSpeaking, cancel: stopSpeaking } = useTextToSpeech();

  const aiServiceRef = useRef(null);
  const localServiceRef = useRef(null);

  // Initialize Services
  useEffect(() => {
    // Gemini Service
    if (apiKey) {
      aiServiceRef.current = new AIService(apiKey);
    }

    // Local Service (Single instance needed)
    if (!localServiceRef.current) {
      localServiceRef.current = new LocalAIService((progress) => {
        setModelProgress(progress);
        if (progress.progress === 1 || progress.text.includes("Finish")) {
          setTimeout(() => setModelProgress(null), 1000); // Hide after completion
        }
      });
    }
  }, [apiKey]);

  const handleSaveSettings = (newProvider, newKey) => {
    setProvider(newProvider);
    setApiKey(newKey);
    localStorage.setItem('ai_provider', newProvider);
    localStorage.setItem('gemini_api_key', newKey);
  };

  const handleSendMessage = useCallback(async (text, file = null) => {
    if (!text || !text.trim()) return;

    // Read File
    let fileContext = null;
    if (file) {
      try {
        fileContext = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(e);
          reader.readAsText(file);
        });
      } catch (e) { console.error("File Read Error:", e); }
    }

    // Add User Message
    const userMsg = { role: 'user', text: file ? `[Attached: ${file.name}]\n${text}` : text };
    setMessages(prev => [...prev, userMsg]);
    resetTranscript();

    // Check Configuration
    if (provider === 'gemini' && !aiServiceRef.current) {
      const err = "Please set your Gemini API Key in the settings.";
      setMessages(prev => [...prev, { role: 'model', text: { text: err } }]);
      speak(err);
      return;
    }

    setIsProcessing(true);

    try {
      let responseData;

      if (provider === 'local') {
        // Use Local Service
        responseData = await localServiceRef.current.sendMessage(text, fileContext);
      } else {
        // Use Gemini Service
        responseData = await aiServiceRef.current.sendMessage(text, fileContext, 3, (delay) => {
          console.log(`User notified: Retrying in ${delay}ms`);
        });
      }

      // Handle the object structure
      const aiMsg = { role: 'model', text: responseData };
      setMessages(prev => [...prev, aiMsg]);

      if (inputMode === 'voice' && responseData.text) {
        speak(responseData.text);
      }

    } catch (error) {
      console.error("App Error:", error);
      const errorMessage = error.message || "I'm having trouble connecting right now.";
      setMessages(prev => [...prev, { role: 'model', text: { text: errorMessage } }]);
      if (inputMode === 'voice') speak(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [resetTranscript, speak, inputMode, provider]);

  // Handle Voice Transcript Flow
  useEffect(() => {
    if (transcript && !isListening) {
      handleSendMessage(transcript);
    }
  }, [transcript, isListening, handleSendMessage]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      if (isSpeaking) stopSpeaking();
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-white font-sans overflow-hidden">
      <ModelProgress progress={modelProgress} />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-surface/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            {provider === 'local' ? <Cpu size={20} className="text-secondary" /> : <Sparkles size={20} className="text-primary" />}
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Agentic Encyclopedia</h1>
            {provider === 'local' && <span className="text-[10px] text-secondary font-medium px-2 py-0.5 bg-secondary/10 rounded-full">Llama 3 Local</span>}
          </div>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <Settings size={20} className="text-white/70" />
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <ChatInterface messages={messages} />

        {/* Overlay when listening */}
        {(isListening || interimTranscript) && inputMode === 'voice' && (
          <div className="absolute bottom-40 w-full text-center px-4 pointer-events-none">
            <p className="text-xl font-light text-white/80 animate-pulse">
              {interimTranscript || "Listening..."}
            </p>
          </div>
        )}
      </main>

      {/* Footer / Input Area */}
      <footer className="relative z-10 w-full">
        {inputMode === 'voice' ? (
          <div className="flex flex-col items-center justify-center py-8 bg-gradient-to-t from-background to-transparent">
            <VoiceOrb
              isListening={isListening}
              isSpeaking={isSpeaking}
              isProcessing={isProcessing}
              onClick={toggleListening}
            />
            <button
              onClick={() => {
                stopListening();
                stopSpeaking();
                setInputMode('text');
              }}
              className="mt-4 text-sm text-white/40 hover:text-white/80 transition-colors uppercase tracking-widest font-medium"
            >
              Switch to Text
            </button>
          </div>
        ) : (
          <div className="bg-background border-t border-white/5 pt-4">
            <MessageInput
              onSend={handleSendMessage}
              onSwitchToVoice={() => setInputMode('voice')}
              isProcessing={isProcessing}
            />
          </div>
        )}
      </footer>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        currentApiKey={apiKey}
        currentProvider={provider}
      />
    </div>
  );
}

export default App;
