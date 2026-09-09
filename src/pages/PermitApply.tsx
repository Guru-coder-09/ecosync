import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthRoleStore } from '../stores/authRoleStore';
import { Leaf, LogOut, ArrowLeft, MapPin, Users, Car, Calendar, Clock, Navigation } from 'lucide-react';
import { api } from '../lib/api';

const ORIGIN_SUGGESTIONS = [
  'Chennai', 'Bengaluru', 'Coimbatore', 'Madurai', 'Mumbai',
  'Delhi', 'Hyderabad', 'Pune', 'Kolkata', 'Tiruchirappalli',
  'Salem', 'Erode', 'Tiruppur', 'Vellore', 'Ahmedabad',
];

export const PermitApply = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userName, logout } = useAuthRoleStore();

  const zoneId = parseInt(searchParams.get('zoneId') || '2');
  const zoneName = searchParams.get('zoneName') || 'Nilgiris / Ooty';
  const zoneState = searchParams.get('state') || 'Tamil Nadu';

  // Form state — simplified per requirement
  const [vehicleReg, setVehicleReg] = useState('');
  const [passengers, setPassengers] = useState(2);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('09:00');
  const [originFrom, setOriginFrom] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogout = () => { logout(); navigate('/'); };

  // Tomorrow as default min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const validate = () => {
    const errs: Record<string, string> = {};
    const regPattern = /^[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,3}[\s-]?\d{4}$/i;
    if (!vehicleReg.trim()) errs.vehicleReg = 'Vehicle registration number is required.';
    else if (!regPattern.test(vehicleReg.trim().replace(/\s+/g, ' '))) errs.vehicleReg = 'Enter a valid Indian vehicle reg. number (e.g. TN 38 AB 1234).';
    if (!visitDate) errs.visitDate = 'Please select your date of visit.';
    if (!originFrom.trim()) errs.originFrom = 'Please enter your place of origin.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setIsSubmitting(true);
    try {
      const result = await api.signPermit(
        zoneId,
        vehicleReg.trim().toUpperCase(),
        passengers,
        'Tourist Vehicle',
        originFrom.trim(),
        `${visitDate}T${visitTime}:00`
      );
      navigate(`/tourist/pass?permitId=${result.permit_id}&token=${encodeURIComponent(result.token)}&zone=${encodeURIComponent(zoneName)}&vehicle=${encodeURIComponent(vehicleReg.toUpperCase())}&passengers=${passengers}&visitDate=${visitDate}&visitTime=${visitTime}&origin=${encodeURIComponent(originFrom)}`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const filteredSuggestions = ORIGIN_SUGGESTIONS.filter(
    (s) => s.toLowerCase().startsWith(originFrom.toLowerCase()) && s.toLowerCase() !== originFrom.toLowerCase()
  );

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
        <h1 className="text-lg font-extrabold">ESZ Entry Permit Application</h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/tourist/zones')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Destinations
        </button>

        {/* Zone Info Banner */}
        <div className="bg-[#1A237E] text-white rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="font-extrabold text-base">{zoneName}</p>
            <p className="text-sm text-blue-300">{zoneState} · Ecologically Sensitive Zone</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-blue-300">Permit Type</p>
            <p className="text-sm font-bold text-orange-400">Day Visit E-Pass</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-4">
            <h2 className="font-extrabold text-gray-800">Applicant &amp; Vehicle Details</h2>
            <p className="text-xs text-gray-500 mt-0.5">Fields marked <span className="text-red-500">*</span> are mandatory</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Vehicle Reg */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5" /> Vehicle Registration Number <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                value={vehicleReg}
                onChange={(e) => { setVehicleReg(e.target.value.toUpperCase()); setErrors((p) => ({ ...p, vehicleReg: '' })); }}
                placeholder="TN 38 AB 1234"
                className={`w-full border rounded-lg px-4 py-3 text-sm font-mono font-bold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.vehicleReg ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.vehicleReg && <p className="text-xs text-red-600 mt-1">{errors.vehicleReg}</p>}
            </div>

            {/* Passengers */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Number of Passengers <span className="text-red-500">*</span></span>
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg transition-colors flex items-center justify-center"
                >−</button>
                <span className="text-2xl font-extrabold text-gray-800 w-12 text-center">{passengers}</span>
                <button
                  type="button"
                  onClick={() => setPassengers((p) => Math.min(8, p + 1))}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg transition-colors flex items-center justify-center"
                >+</button>
                <span className="text-xs text-gray-400 ml-2">Maximum 8 per permit</span>
              </div>
            </div>

            {/* Date + Time of Visit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date of Entry <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="date"
                  value={visitDate}
                  min={minDate}
                  onChange={(e) => { setVisitDate(e.target.value); setErrors((p) => ({ ...p, visitDate: '' })); }}
                  className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.visitDate ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.visitDate && <p className="text-xs text-red-600 mt-1">{errors.visitDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Entry Time</span>
                </label>
                <select
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                >
                  {['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'].map((t) => (
                    <option key={t} value={t}>{t} IST</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Origin — From where */}
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5" /> Travelling From (City / State) <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                value={originFrom}
                onChange={(e) => { setOriginFrom(e.target.value); setShowSuggestions(true); setErrors((p) => ({ ...p, originFrom: '' })); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="e.g. Chennai, Bengaluru, Mumbai…"
                className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.originFrom ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.originFrom && <p className="text-xs text-red-600 mt-1">{errors.originFrom}</p>}
              {showSuggestions && originFrom.length > 0 && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {filteredSuggestions.slice(0, 5).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={() => { setOriginFrom(s); setShowSuggestions(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-700 transition-colors"
                    >
                      📍 {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Applicant Phone (auto-filled from login) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <span className="text-blue-500">📱</span>
              <div>
                <p className="text-xs font-bold text-blue-700">Applicant Mobile (Verified)</p>
                <p className="text-sm font-mono font-bold text-blue-800">{userName}</p>
              </div>
              <span className="ml-auto text-green-600 text-xs font-bold bg-green-100 px-2 py-0.5 rounded-full">✓ OTP Verified</span>
            </div>

            {/* Legal Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
              <strong>⚠ Declaration:</strong> I confirm that this application is true and accurate. Misuse of the e-pass or exceeding the permitted passenger count is a punishable offence under the Environment Protection Act, 1986.
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-4 rounded-xl text-base transition-colors shadow-lg"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  Generating Digital E-Pass…
                </span>
              ) : 'Submit Application & Generate E-Pass →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
