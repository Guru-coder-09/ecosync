import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthRoleStore } from '../stores/authRoleStore';
import { Eye, EyeOff, Leaf } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    email: 'tourist@demo.ecosync.in',
    password: 'demo1234',
    role: 'tourist' as const,
    name: 'Priya Sharma',
    badge: '',
    label: 'Tourist',
  },
  {
    email: 'guard@demo.ecosync.in',
    password: 'demo1234',
    role: 'guard' as const,
    name: 'Guard S. Patil',
    badge: 'CHECKPOST-GUARD-04 [Khandala Ghat FASTag Toll]',
    label: 'Security Guard',
  },
  {
    email: 'authority@demo.ecosync.in',
    password: 'demo1234',
    role: 'authority' as const,
    name: 'Dr. Ananya Nair',
    badge: 'MOEFCC-OFFICER-701',
    label: 'Authority Officer',
  },
];

export const PortalGateway = () => {
  const navigate = useNavigate();
  const { login } = useAuthRoleStore();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const found = DEMO_ACCOUNTS.find(
      (a) => a.email === email && a.password === password
    );
    if (!found) {
      setError('Invalid credentials. Use one of the demo accounts below.');
      return;
    }
    setError('');
    login(found.role, found.name, found.badge);
    const routes = { tourist: '/tourist', guard: '/checkpost', authority: '/authority' };
    navigate(routes[found.role]);
  };

  const handleQuickLogin = (acc: typeof DEMO_ACCOUNTS[0]) => {
    login(acc.role, acc.name, acc.badge);
    const routes = { tourist: '/tourist', guard: '/checkpost', authority: '/authority' };
    navigate(routes[acc.role]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1A1F6E] px-4 py-10 font-sans">
      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center shadow-xl mb-3">
          <Leaf className="w-8 h-8 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">EcoSync</h1>
        <p className="text-sm text-blue-200 mt-0.5">Government of India · Ministry of Environment</p>
        <span className="mt-3 px-3 py-1 rounded-full bg-orange-500 text-white text-[11px] font-bold uppercase tracking-wider shadow">
          DEMO MODE — NO SUPABASE REQUIRED
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
              activeTab === 'signin'
                ? 'text-[#1A237E] border-b-2 border-[#1A237E] bg-white'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
              activeTab === 'register'
                ? 'text-[#1A237E] border-b-2 border-[#1A237E] bg-white'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Register
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="your@email.in"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                className="w-full bg-[#1A237E] hover:bg-[#283593] text-white font-bold py-3 rounded-lg text-sm transition-colors shadow"
              >
                Sign In
              </button>

              {/* Quick Demo Login */}
              <div className="pt-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Quick Demo Login</p>
                <div className="space-y-1.5">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleQuickLogin(acc)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-left group"
                    >
                      <span className="text-xs font-semibold text-indigo-700 group-hover:text-indigo-900">
                        {acc.email}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono ml-2">/ {acc.password}</span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <Leaf className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 font-medium">
                Registration is managed by the Ministry of Environment.
              </p>
              <p className="text-xs text-gray-400">
                For demo purposes, use the <strong>Quick Demo Login</strong> on the Sign In tab to access any portal.
              </p>
              <button
                onClick={() => setActiveTab('signin')}
                className="w-full mt-2 bg-[#1A237E] text-white font-bold py-2.5 rounded-lg text-sm hover:bg-[#283593] transition-colors"
              >
                Go to Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-blue-300 text-center">
        © 2026 Ministry of Environment, Forest &amp; Climate Change, Government of India
      </p>
    </div>
  );
};
