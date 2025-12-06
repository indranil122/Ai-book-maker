
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { User, ViewState } from '../types';

interface AuthProps {
  view: ViewState.LOGIN | ViewState.SIGNUP;
  onAuthSuccess: (user: User) => void;
  onSwitchView: (view: ViewState) => void;
}

export const Auth: React.FC<AuthProps> = ({ view, onAuthSuccess, onSwitchView }) => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const isLogin = view === ViewState.LOGIN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user: User;
      if (isLogin) {
        user = await authService.login(formData.email, formData.password);
      } else {
        user = await authService.signup(formData.name, formData.email, formData.password);
      }
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const user = await authService.loginWithGoogle();
      onAuthSuccess(user);
    } catch (err: any) {
      setError('Google sign in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden"
      >
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl font-bold text-stone-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Join Lumina'}
            </h2>
            <p className="text-stone-500">
              {isLogin 
                ? 'Sign in to continue writing your masterpiece.' 
                : 'Start your journey as an AI-assisted author.'}
            </p>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full py-3 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-medium rounded-xl transition-all mb-6 flex items-center justify-center gap-3 shadow-sm hover:shadow-md relative overflow-hidden group"
          >
            {googleLoading ? (
               <Loader2 className="animate-spin text-stone-400" size={20} />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-stone-400 font-medium">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input
                    type="text"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 transition-all"
                    placeholder="J.R.R. Tolkien"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 transition-all"
                  placeholder="author@example.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Password</label>
               <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="password"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-4 bg-stone-900 hover:bg-saffron-500 text-white font-bold rounded-xl shadow-lg hover:shadow-saffron-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-stone-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => onSwitchView(isLogin ? ViewState.SIGNUP : ViewState.LOGIN)}
              className="font-bold text-stone-900 hover:text-saffron-600 underline decoration-2 decoration-saffron-200 hover:decoration-saffron-500 transition-all"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};