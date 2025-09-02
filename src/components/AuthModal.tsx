import React, { useState } from 'react';
import { X, Mail, Lock, User, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (username: string, email: string, password: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function AuthModal({ isOpen, onClose, onLogin, onRegister, onResetPassword, loading, error }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showForgotPassword) {
      try {
        await onResetPassword(formData.email);
        setResetEmailSent(true);
      } catch (error) {
        
      }
      return;
    }
    
    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        return;
      }
      
      if (formData.password.length < 6) {
        return;
      }
    }
    
    if (isLogin) {
      await onLogin(formData.email, formData.password);
    } else {
      try {
        await onRegister(formData.username, formData.email, formData.password);
        setRegistrationSuccess(true);
      } catch (error) {
        
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4">
        <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">
              {showForgotPassword 
                ? 'Reset Password' 
                : isLogin 
                  ? 'Welcome Back' 
                  : 'Join MovieWatch'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {resetEmailSent ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Check Your Email</h3>
              <p className="text-slate-400 mb-4">
                We've sent a password reset link to <span className="text-white">{formData.email}</span>
              </p>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmailSent(false);
                  setFormData({ username: '', email: '', password: '', confirmPassword: '' });
                }}
                className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          ) : registrationSuccess ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Account Created!</h3>
              <p className="text-slate-400 mb-4">
                Your account has been successfully created. You can now sign in with your credentials.
              </p>
              <button
                onClick={() => {
                  setRegistrationSuccess(false);
                  setIsLogin(true);
                  setFormData({ username: '', email: '', password: '', confirmPassword: '' });
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-200"
              >
                Continue to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!isLogin && !showForgotPassword && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {!showForgotPassword && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  {!isLogin && formData.password && formData.password.length < 6 && (
                    <p className="text-red-400 text-xs">Password must be at least 6 characters long</p>
                  )}
                </div>
              )}

              {!isLogin && !showForgotPassword && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-red-400 text-xs">Passwords do not match</p>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!showForgotPassword && !isLogin && (
                  formData.password.length < 6 || 
                  formData.password !== formData.confirmPassword ||
                  !formData.username.trim()
                ))}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading 
                  ? 'Please wait...' 
                  : showForgotPassword 
                    ? 'Send Reset Email' 
                    : isLogin 
                      ? 'Sign In' 
                      : 'Create Account'}
              </button>

              <div className="text-center space-y-2">
                {isLogin && !showForgotPassword && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-purple-400 hover:text-purple-300 text-sm transition-colors block w-full"
                  >
                    Forgot your password?
                  </button>
                )}
                
                {showForgotPassword ? (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                  >
                    Back to Sign In
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                  >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}