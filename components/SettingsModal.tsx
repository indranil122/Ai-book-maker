
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Check, AlertCircle, Save, Loader2, ExternalLink, HelpCircle } from 'lucide-react';
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

            <div className="p-6 space-y-6">
              
              {/* Help Guide */}
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full shrink-0">
                        <HelpCircle size={16} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">How to get your API Key</h4>
                        <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-2 mb-3">
                            <li className="flex gap-2">
                                <span className="font-bold opacity-70">1.</span>
                                <span>Go to Google AI Studio (it's free).</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold opacity-70">2.</span>
                                <span>Click <strong>"Get API key"</strong> and create a key in a new project.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold opacity-70">3.</span>
                                <span>Copy the key string and paste it below.</span>
                            </li>
                        </ul>
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                        >
                            Get API Key <ExternalLink size={12} />
                        </a>
                    </div>
                </div>
              </div>

              {/* Input Section */}
              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-2">
                  Enter Key
                </label>
                <div className="relative">
                    <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-saffron-500 focus:outline-none text-stone-900 dark:text-white font-mono text-sm pr-10"
                    />
                    {apiKey && (
                        <button 
                            onClick={() => setApiKey('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
              </div>

              {/* Status Messages */}
              {status === 'error' && (
                <div className="text-red-500 text-sm flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                   <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              {status === 'success' && (
                <div className="text-green-600 text-sm flex items-center gap-2 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg font-medium">
                   <Check size={16} /> API Key Verified & Saved!
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleSave}
                  disabled={status === 'testing' || !apiKey.trim()}
                  className="w-full py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold rounded-xl hover:bg-saffron-500 dark:hover:bg-saffron-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-saffron-500/25"
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
