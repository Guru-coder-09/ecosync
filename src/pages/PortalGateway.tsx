import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthRoleStore } from '../stores/authRoleStore';
import { 
  Shield, Compass, Radio, ArrowRight, ShieldCheck, 
  Lock, User, CheckCircle2, ChevronRight, Sparkles, Building2, Trees
} from 'lucide-react';

export const PortalGateway = () => {
  const navigate = useNavigate();
  const { login } = useAuthRoleStore();

  // Selected tab or card form states
  const [touristName, setTouristName] = useState('Rahul Sharma');
  const [officerId, setOfficerId] = useState('MOEFCC-OFFICER-701');
  const [officerKey, setOfficerKey] = useState('••••••••••••');
  const [guardBadge, setGuardBadge] = useState('CHECKPOST-GUARD-04');
  const [selectedGate, setSelectedGate] = useState('Khandala Ghat FASTag Toll');

  const handleTouristLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login('tourist', touristName || 'Citizen Tourist');
    navigate('/tourist');
  };

  const handleAuthorityLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login('authority', 'Officer R. K. Varma', officerId);
    navigate('/authority');
  };

  const handleGuardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login('guard', 'Guard S. Patil', `${guardBadge} [${selectedGate}]`);
    navigate('/checkpost');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* DPI Tri-color Accent Bar */}
      <div className="h-1.5 w-full flex">
        <div className="h-full w-1/3 bg-[#FF6F00]"></div>
        <div className="h-full w-1/3 bg-white"></div>
        <div className="h-full w-1/3 bg-[#00695C]"></div>
      </div>

      {/* Top Header */}
      <header className="bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-extrabold text-slate-950 text-sm shadow-md">
              In
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">EcoSync</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  National DPI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Digital Public Infrastructure for Ecological Governance</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-300">Government of India</p>
            <p className="text-[10px] text-slate-500">Ministry of Environment, Forest &amp; Climate Change</p>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="max-w-4xl mx-auto text-center pt-10 pb-6 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Autonomous Carrying Capacity &amp; Inflow Control Gateway
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Select Your Access Portal
        </h1>
        <p className="text-sm text-slate-400 mt-2.5 max-w-2xl mx-auto">
          Secure, role-based gateways for travelers, environmental enforcement authorities, and checkpost guards operating under national ecological protection mandates.
        </p>
      </div>

      {/* 3 Portal Cards Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 1. CITIZEN / TOURIST PORTAL */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/50 transition-all shadow-xl hover:shadow-emerald-950/20">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
                <Trees className="w-6 h-6" />
              </div>
              
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Public Access</span>
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">Tier 1</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Tourist &amp; Citizen Portal</h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Explore Hill Stations, High-Altitude Passes, and Biospheres. Check live safe capacity quotas, mountain weather advisories, and generate 30-second rotating Ed25519 E-Permits.
              </p>

              <form onSubmit={handleTouristLogin} className="space-y-4 pt-2 border-t border-slate-700/60">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" /> Full Name / Lead Traveler
                  </label>
                  <input
                    type="text"
                    value={touristName}
                    onChange={(e) => setTouristName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                    required
                  />
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> No pre-registration required
                  </div>
                  <p>Direct citizen access with dynamic permit generation.</p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
                >
                  Enter Tourist Portal <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/40 text-[11px] text-slate-500 text-center">
              Routes directly to <code className="text-emerald-400">/tourist</code>
            </div>
          </div>

          {/* 2. AUTHORITY COMMAND DASHBOARD */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 flex flex-col justify-between hover:border-blue-500/50 transition-all shadow-xl hover:shadow-blue-950/20 relative">
            <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30 uppercase tracking-wide">
              Official Use
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-5">
                <Building2 className="w-6 h-6" />
              </div>
              
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Command Center</span>
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">Tier 2</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Authority Command Matrix</h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                For MoEFCC Officers, District Collectors, and State Tourism Boards. Monitor multimodal rail/bus flows, audit passenger manifests, and execute emergency hazard lockdowns.
              </p>

              <form onSubmit={handleAuthorityLogin} className="space-y-4 pt-2 border-t border-slate-700/60">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-400" /> Environmental Officer ID
                  </label>
                  <input
                    type="text"
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-400" /> Security Access Key
                  </label>
                  <input
                    type="password"
                    value={officerKey}
                    onChange={(e) => setOfficerKey(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50"
                >
                  Access Command Dashboard <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/40 text-[11px] text-slate-500 text-center">
              Routes to protected <code className="text-blue-400">/authority</code>
            </div>
          </div>

          {/* 3. CHECKPOST & FASTAG EDGE NODE */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/50 transition-all shadow-xl hover:shadow-amber-950/20">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
                <Radio className="w-6 h-6" />
              </div>
              
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Enforcement Node</span>
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">Tier 3</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Checkpost &amp; FASTag Node</h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                For physical Checkpost Guards and Toll Plaza Operators. High-speed optical camera QR scanner with Ed25519 signature checks and automated FASTag RFID barrier lifts.
              </p>

              <form onSubmit={handleGuardLogin} className="space-y-4 pt-2 border-t border-slate-700/60">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Guard Badge ID
                  </label>
                  <input
                    type="text"
                    value={guardBadge}
                    onChange={(e) => setGuardBadge(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Assigned Gateway / Barrier
                  </label>
                  <select
                    value={selectedGate}
                    onChange={(e) => setSelectedGate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Khandala Ghat FASTag Toll">Khandala Ghat FASTag Toll (Lonavala)</option>
                    <option value="Tiger Point Barrier">Tiger Point Barrier (Lonavala)</option>
                    <option value="Ooty Main Toll">Ooty Main Toll (Tamil Nadu)</option>
                    <option value="Gulaba Checkpost">Gulaba Checkpost (Rohtang Pass)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50"
                >
                  Launch Guard Edge Node <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/40 text-[11px] text-slate-500 text-center">
              Routes to scanner node <code className="text-amber-400">/checkpost</code>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>EcoSync Production Node (v2.4.0) • Connected to National Ledger</span>
          </div>
          <p>© 2026 Ministry of Environment, Forest &amp; Climate Change, Government of India</p>
        </div>
      </footer>
    </div>
  );
};
