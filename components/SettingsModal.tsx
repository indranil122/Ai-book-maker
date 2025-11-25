
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Check, AlertCircle, Save, Loader2 } from 'lucide-react';
import { getApiKey, saveApiKey, clearApiKey } from '../config';
import { geminiService } from '../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const current = getApiKey();
      if (current) setApiKey(current);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
       clearApiKey();
       setStatus('idle');
       return;
    }

    setStatus('testing');
    setErrorMsg('');
    saveApiKey(apiKey); // Save first to test with the new key

    try {
      const isValid = await geminiService.testConnection();
      if (isValid) {
        setStatus('success');
        setTimeout(() => {
           onClose();
           setStatus('idle');
        }, 1000);
      } else {
        setStatus('error');
        setErrorMsg('Invalid API Key or connection failed.');
      }
    } catch (e) {
      setStatus('error');
      setErrorMsg('Connection error.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-black/20">
              <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-white flex items-center gap-2">
                <Key className="text-saffron-500" size={20} />
                API Settings
              </h3>
              <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm p-4 rounded-xl flex gap-3">
                 <AlertCircle className="shrink-0" size={18} />
                 <p>
                   Lumina requires a Google Gemini API Key. If the default key has exceeded its quota, please provide your own free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold">Google AI Studio</a>.
                 </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-2">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-saffron-500 focus:outline-none text-stone-900 dark:text-white font-mono text-sm"
                />
              </div>

              {status === 'error' && (
                <div className="text-red-500 text-sm flex items-center gap-2">
                   <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              {status === 'success' && (
                <div className="text-green-500 text-sm flex items-center gap-2">
                   <Check size={16} /> API Key Verified & Saved!
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleSave}
                  disabled={status === 'testing'}
                  className="w-full py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold rounded-xl hover:bg-saffron-500 dark:hover:bg-saffron-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {status === 'testing' ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                  Save Configuration
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
