import React, { useState } from 'react';
import { Box, Lock, User, AlertCircle, ArrowRight, ShieldCheck, Truck } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
  loading: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, loading }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setError(null);
    try {
      await onLogin(username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password.');
    }
  };

  const handleQuickLogin = async (user: string) => {
    setUsername(user);
    setPassword('password123');
    setError(null);
    try {
      await onLogin(user, 'password123');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm mx-auto mb-3">
          <Box className="w-6 h-6 text-slate-100" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Warehouse Receiving System
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Inbound manifest tracking and inventory intake terminal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 border border-slate-200 rounded-xl shadow-sm sm:px-8 space-y-5">
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. supervisor or operator"
                  className="enterprise-input w-full pl-9 pr-3 py-2 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="enterprise-input w-full pl-9 pr-3 py-2 text-xs text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Terminal'}
              {!loading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Quick Demo Access Credentials */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Quick Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('supervisor')}
                className="btn-secondary px-3 py-2 rounded text-left text-xs flex flex-col gap-0.5 hover:border-slate-400"
              >
                <div className="flex items-center gap-1 font-semibold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Supervisor</span>
                </div>
                <span className="text-[10px] text-slate-400">Full manifest & catalog permissions</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('operator')}
                className="btn-secondary px-3 py-2 rounded text-left text-xs flex flex-col gap-0.5 hover:border-slate-400"
              >
                <div className="flex items-center gap-1 font-semibold text-slate-800">
                  <Truck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Operator</span>
                </div>
                <span className="text-[10px] text-slate-400">Dock receiving & counts verification</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
