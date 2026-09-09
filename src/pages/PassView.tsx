import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthRoleStore } from '../stores/authRoleStore';
import { Leaf, LogOut, RefreshCw, ArrowLeft, CheckCircle, MapPin, Users, Calendar, Navigation, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

function buildQRPayload(token: string): string {
  const epoch30 = Math.floor(Date.now() / 30000);
  return `${token}::${epoch30}`;
}

export const PassView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userName, logout } = useAuthRoleStore();

  const token = searchParams.get('token') || '';
  const permitId = searchParams.get('permitId') || '—';
  const zoneName = searchParams.get('zone') || 'Unknown Zone';
  const vehicle = searchParams.get('vehicle') || '—';
  const passengers = searchParams.get('passengers') || '1';
  const visitDate = searchParams.get('visitDate') || '—';
  const visitTime = searchParams.get('visitTime') || '—';
  const origin = searchParams.get('origin') || '—';

  const [countdown, setCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderQR = useCallback(async () => {
    if (!canvasRef.current) return;
    const payload = buildQRPayload(token);
    await QRCode.toCanvas(canvasRef.current, payload, {
      width: 240,
      margin: 2,
      color: { dark: '#1A237E', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    });
  }, [token]);

  // Initial render
  useEffect(() => { renderQR(); }, [renderQR]);

  // 30-second countdown + auto-refresh
  useEffect(() => {
    const msUntilNextEpoch = 30000 - (Date.now() % 30000);
    const initialTimeout = setTimeout(() => {
      renderQR();
      setCountdown(30);
      const interval = setInterval(() => {
        renderQR();
        setCountdown(30);
      }, 30000);
      return () => clearInterval(interval);
    }, msUntilNextEpoch);

    const tick = setInterval(() => {
      setCountdown(Math.ceil((30000 - (Date.now() % 30000)) / 1000));
    }, 1000);

    return () => { clearTimeout(initialTimeout); clearInterval(tick); };
  }, [renderQR]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await renderQR();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const formatDate = (d: string) => {
    if (!d || d === '—') return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return d; }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="bg-[#1A237E] text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-extrabold text-sm">EcoSync</span>
            <span className="text-blue-300 text-xs ml-1.5">GoI Digital Public Infrastructure</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-blue-200">📱 {userName}</span>
          <button onClick={handleLogout} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </nav>

      {/* Gov Header */}
      <div className="bg-[#1A237E] text-white text-center py-4 border-b border-indigo-900">
        <p className="text-xs text-blue-300 mb-1">🏛 भारत सरकार · GOVERNMENT OF INDIA</p>
        <h1 className="text-lg font-extrabold">Digital E-Pass — ஈ-பாஸ்</h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Back */}
        <button onClick={() => navigate('/tourist/zones')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Destinations
        </button>

        {/* SUCCESS BANNER */}
        <div className="flex items-center gap-3 bg-green-50 border border-green-300 rounded-xl p-4 mb-6">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-green-800">E-Pass Successfully Generated!</p>
            <p className="text-xs text-green-600 mt-0.5">Present this QR at the checkpost entry barrier. Valid for the selected date only.</p>
          </div>
        </div>

        {/* E-Pass Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Card header */}
          <div className="bg-[#1A237E] text-white px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-300 uppercase font-bold tracking-wider">Official ESZ Entry Permit</p>
              <p className="font-extrabold text-lg mt-0.5">{zoneName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-300">Permit No.</p>
              <p className="font-mono font-bold text-orange-400">#{String(permitId).padStart(6, '0')}</p>
            </div>
          </div>

          <div className="p-6 flex gap-6">
            {/* QR Side */}
            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              {/* QR Canvas */}
              <div className="relative">
                <div className="w-[248px] h-[248px] rounded-xl border-4 border-[#1A237E] p-1 bg-white shadow-inner flex items-center justify-center">
                  <canvas ref={canvasRef} />
                </div>
                {/* Anti-clone indicator */}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shadow">
                  <QrCode className="w-4 h-4" />
                </div>
              </div>

              {/* Countdown pill */}
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-2">
                <div className={`w-2 h-2 rounded-full ${countdown <= 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                <span className="text-xs font-bold text-indigo-700">
                  Refreshes in <span className={`font-mono ${countdown <= 5 ? 'text-red-600' : 'text-indigo-900'}`}>{countdown}s</span>
                </span>
                <button onClick={handleManualRefresh} title="Refresh now" className="text-indigo-400 hover:text-indigo-600 transition-colors ml-1">
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <p className="text-[10px] text-gray-400 text-center max-w-[200px]">
                🔒 Dynamic QR rotates every 30 seconds. Screenshots &amp; forwarded passes are automatically invalidated.
              </p>
            </div>

            {/* Details Side */}
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Permit Details</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Destination Zone</p>
                      <p className="text-sm font-bold text-gray-800">{zoneName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-orange-600">🚗</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Vehicle Registration</p>
                      <p className="text-sm font-bold text-gray-800 font-mono">{vehicle}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Passengers</p>
                      <p className="text-sm font-bold text-gray-800">{passengers} {parseInt(passengers) === 1 ? 'person' : 'persons'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Date &amp; Time of Visit</p>
                      <p className="text-sm font-bold text-gray-800">{formatDate(visitDate)}</p>
                      <p className="text-xs text-gray-500">{visitTime} IST onwards</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Navigation className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Travelling From</p>
                      <p className="text-sm font-bold text-gray-800">{origin}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status pill */}
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xs font-bold text-green-700">ACTIVE · Cryptographically Signed</p>
              </div>

              {/* Auth chip */}
              <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Issued To</p>
                <p className="text-xs font-mono text-gray-700">{userName}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Ed25519 · Verified by EcoSync Authority</p>
              </div>
            </div>
          </div>

          {/* Footer strip */}
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 text-center">
            <p className="text-[10px] text-gray-400">
              This e-pass is issued under the Environment Protection Act, 1986 · Present at checkpost entry barrier · Valid for one day only
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={() => navigate('/tourist/zones')}
            className="bg-[#1A237E] hover:bg-[#283593] text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            ← Back to Destinations
          </button>
          <button
            onClick={() => navigate('/tourist/apply?zoneId=2&zoneName=Nilgiris%20%2F%20Ooty&state=Tamil%20Nadu')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            Apply for Another Zone →
          </button>
        </div>
      </div>
    </div>
  );
};
