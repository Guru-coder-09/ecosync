import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthRoleStore } from '../stores/authRoleStore';
import { Eye, EyeOff, Leaf, Phone, ShieldCheck, KeyRound } from 'lucide-react';

const STAFF_ACCOUNTS = [
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

  // Which login panel: 'tourist' | 'staff'
  const [panel, setPanel] = useState<'tourist' | 'staff'>('tourist');

  // Tourist OTP flow state
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');

  // Staff login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [staffError, setStaffError] = useState('');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setPhoneError('Enter a valid 10-digit mobile number.');
      return;
    }
    setPhoneError('');
    setOtpSent(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: any 6-digit OTP works
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setOtpError('Enter the 6-digit OTP sent to your phone.');
      return;
    }
    setOtpError('');
    const cleaned = phone.replace(/\D/g, '');
    const displayPhone = `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    login('tourist', displayPhone, '');
    navigate('/tourist/zones');
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = STAFF_ACCOUNTS.find((a) => a.email === email && a.password === password);
    if (!found) {
      setStaffError('Invalid credentials. Use one of the demo accounts below.');
      return;
    }
    setStaffError('');
    login(found.role, found.name, found.badge);
    const routes = { guard: '/checkpost', authority: '/authority', tourist: '/tourist/zones' };
    navigate(routes[found.role]);
  };

  const handleQuickStaffLogin = (acc: typeof STAFF_ACCOUNTS[0]) => {
    login(acc.role, acc.name, acc.badge);
    const routes = { guard: '/checkpost', authority: '/authority', tourist: '/tourist/zones' };
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
          DEMO MODE — PHONE OTP LOGIN
        </span>
      </div>

      {/* Panel Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setPanel('tourist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all ${
            panel === 'tourist'
              ? 'bg-orange-500 text-white border-orange-500 shadow-lg'
              : 'bg-white/10 text-blue-200 border-white/20 hover:bg-white/20'
          }`}
        >
          <Phone className="w-3.5 h-3.5" /> Tourist / Citizen
        </button>
        <button
          onClick={() => setPanel('staff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all ${
            panel === 'staff'
              ? 'bg-[#1A237E] text-white border-[#1A237E] shadow-lg'
              : 'bg-white/10 text-blue-200 border-white/20 hover:bg-white/20'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Staff / Authority
        </button>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* ── TOURIST PANEL ── */}
        {panel === 'tourist' && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Phone className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Citizen Login</p>
                <p className="text-[11px] text-gray-500">Mobile OTP Verification</p>
              </div>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Mobile Number *
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-600 font-semibold whitespace-nowrap">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
                      placeholder="98765 43210"
                      maxLength={10}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-gray-300"
                    />
                  </div>
                  {phoneError && <p className="text-xs text-red-600 mt-1">{phoneError}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg text-sm transition-colors shadow"
                >
                  Send OTP →
                </button>

                <div className="pt-1">
                  <p className="text-[10px] text-gray-400 text-center">
                    Demo: Enter any 10-digit number. Any 6-digit OTP will be accepted.
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 font-semibold flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5" />
                  OTP sent to +91 {phone.replace(/\D/g, '').replace(/(\d{5})(\d{5})/, '$1 $2')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Enter OTP *
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
                    placeholder="6-digit OTP"
                    maxLength={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 tracking-widest text-center text-lg font-bold placeholder:text-gray-300 placeholder:text-sm placeholder:tracking-normal placeholder:font-normal"
                    autoFocus
                  />
                  {otpError && <p className="text-xs text-red-600 mt-1">{otpError}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg text-sm transition-colors shadow"
                >
                  Verify & Login →
                </button>

                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(''); }}
                  className="w-full text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  ← Change number
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── STAFF PANEL ── */}
        {panel === 'staff' && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Staff / Authority Login</p>
                <p className="text-[11px] text-gray-500">Guards & Authority Officers</p>
              </div>
            </div>

            <form onSubmit={handleStaffLogin} className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setStaffError(''); }}
                  placeholder="your@email.in"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setStaffError(''); }}
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {staffError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{staffError}</p>}
              <button type="submit" className="w-full bg-[#1A237E] hover:bg-[#283593] text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
                Sign In
              </button>
            </form>

            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Quick Demo Login</p>
              <div className="space-y-1.5">
                {STAFF_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickStaffLogin(acc)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-left group"
                  >
                    <span className="text-xs font-semibold text-indigo-700 group-hover:text-indigo-900">{acc.email}</span>
                    <span className="text-[10px] text-gray-400 font-mono ml-2">/ {acc.password}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-blue-300 text-center">
        © 2026 Ministry of Environment, Forest &amp; Climate Change, Government of India
      </p>
    </div>
  );
};
