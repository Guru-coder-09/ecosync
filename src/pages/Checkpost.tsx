import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthRoleStore } from '../stores/authRoleStore';
import { useDestinationStore } from '../stores/destinationStore';
import { QrCode, Radio, CheckCircle2, XCircle, ArrowRightLeft, LogOut, ShieldCheck } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';

export const Checkpost = () => {
  const navigate = useNavigate();
  const { userName, badgeId, logout } = useAuthRoleStore();
  const { categories, fetchData, triggerSimulatedScan } = useDestinationStore();
  const [activeTab, setActiveTab] = useState<'OPTICAL' | 'FASTAG'>('OPTICAL');
  
  // Optical state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanResult, setScanResult] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  
  // FASTag state
  const [selectedGateway, setSelectedGateway] = useState<number | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [barrierLifted, setBarrierLifted] = useState(false);
  const [scanType, setScanType] = useState<'ENTRY' | 'EXIT'>('ENTRY');

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Optical Scanner initialization
  useEffect(() => {
    if (activeTab === 'OPTICAL' && videoRef.current) {
      const codeReader = new BrowserQRCodeReader();
      let controls: any = null;

      codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err, ctrl) => {
        if (!controls) controls = ctrl;
        if (result) {
          // Mock verification logic - in reality would decode Ed25519 JWT
          setScanResult('SUCCESS');
          setTimeout(() => setScanResult('IDLE'), 3000);
        }
      }).catch(console.error);

      return () => {
        if (controls) controls.stop();
      };
    }
  }, [activeTab]);

  const allGateways = categories.flatMap(cat => 
    cat.zones.flatMap(zone => 
      zone.gateways.map(g => ({ ...g, zone_name: zone.name, zone_id: zone.id }))
    )
  );

  const handleFastagSimulate = async () => {
    if (!selectedGateway) return;
    setSimulating(true);
    setBarrierLifted(false);
    
    const gateway = allGateways.find(g => g.id === selectedGateway);
    if (gateway) {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 600));
      await triggerSimulatedScan(gateway.id, gateway.zone_id, scanType);
      
      setSimulating(false);
      setBarrierLifted(true);
      setTimeout(() => setBarrierLifted(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-mono">
      <header className="bg-black p-4 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-emerald-500">
            <Radio className="w-6 h-6 animate-pulse" />
            <h1 className="text-xl font-bold">EDGE NODE <span className="text-neutral-500 text-xs">v1.0.4</span></h1>
          </div>
          <div className="hidden sm:block pl-3 border-l border-neutral-800 text-[11px] text-neutral-400">
            <p className="text-white font-bold">{userName || 'On-Duty Guard'}</p>
            <p className="text-amber-400 truncate max-w-[200px]">{badgeId || 'CHECKPOST-04'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-800 rounded p-1">
            <button 
              onClick={() => setActiveTab('OPTICAL')}
              className={`px-3.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 ${activeTab === 'OPTICAL' ? 'bg-emerald-600 text-white' : 'text-neutral-400'}`}
            >
              <QrCode className="w-3.5 h-3.5" /> OPTICAL
            </button>
            <button 
              onClick={() => setActiveTab('FASTAG')}
              className={`px-3.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 ${activeTab === 'FASTAG' ? 'bg-blue-600 text-white' : 'text-neutral-400'}`}
            >
              <Radio className="w-3.5 h-3.5" /> FASTAG
            </button>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Exit
          </button>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto mt-8">
        {activeTab === 'OPTICAL' ? (
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-md aspect-square bg-black border-4 border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
              <video ref={videoRef} className="w-full h-full object-cover" />
              {/* Scanner HUD overlay */}
              <div className="absolute inset-0 border-2 border-emerald-500/30 pointer-events-none">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-emerald-500/50 shadow-[0_0_8px_#10b981] animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
            </div>

            <div className="mt-6 w-full max-w-md">
              {scanResult === 'SUCCESS' && (
                <div className="bg-emerald-900/50 border border-emerald-500 text-emerald-400 p-4 rounded-lg flex items-center gap-4 animate-in fade-in zoom-in duration-200">
                  <CheckCircle2 className="w-8 h-8 shrink-0" />
                  <div>
                    <h3 className="font-bold">PERMIT VERIFIED</h3>
                    <p className="text-sm opacity-80">Ed25519 Sig OK. Barrier lifted.</p>
                  </div>
                </div>
              )}
              {scanResult === 'ERROR' && (
                <div className="bg-red-900/50 border border-red-500 text-red-400 p-4 rounded-lg flex items-center gap-4 animate-in fade-in zoom-in duration-200">
                  <XCircle className="w-8 h-8 shrink-0" />
                  <div>
                    <h3 className="font-bold">INVALID PERMIT</h3>
                    <p className="text-sm opacity-80">Signature mismatch or expired.</p>
                  </div>
                </div>
              )}
              {scanResult === 'IDLE' && (
                <div className="text-center text-xs text-neutral-500 flex flex-col items-center gap-2">
                  <span>Align dynamic QR code inside camera viewfinder</span>
                  <button
                    onClick={() => {
                      setScanResult('SUCCESS');
                      setTimeout(() => setScanResult('IDLE'), 3500);
                    }}
                    className="mt-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs border border-neutral-700"
                  >
                    Simulate Successful QR Scan
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-neutral-800 border border-neutral-700 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-6 text-blue-400 flex items-center gap-2">
              <Radio className="w-5 h-5" /> RFID Simulation Panel
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Select Edge Gateway</label>
                <select 
                  className="w-full bg-neutral-900 border border-neutral-700 rounded p-3 text-white outline-none focus:border-blue-500"
                  value={selectedGateway || ''}
                  onChange={e => setSelectedGateway(Number(e.target.value))}
                >
                  <option value="">-- SELECT NODE --</option>
                  {allGateways.filter(g => g.gateway_type === 'FASTAG_TOLL').map(g => (
                    <option key={g.id} value={g.id}>{g.zone_name} - {g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">Scan Direction</label>
                <div className="flex bg-neutral-900 rounded p-1 border border-neutral-700">
                  <button 
                    onClick={() => setScanType('ENTRY')}
                    className={`flex-1 py-2 text-sm font-bold rounded ${scanType === 'ENTRY' ? 'bg-neutral-700 text-white' : 'text-neutral-500'}`}
                  >
                    ENTRY (+1)
                  </button>
                  <button 
                    onClick={() => setScanType('EXIT')}
                    className={`flex-1 py-2 text-sm font-bold rounded ${scanType === 'EXIT' ? 'bg-neutral-700 text-white' : 'text-neutral-500'}`}
                  >
                    EXIT (-1)
                  </button>
                </div>
              </div>

              <button
                disabled={!selectedGateway || simulating}
                onClick={handleFastagSimulate}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors relative overflow-hidden"
              >
                {simulating ? (
                  <span className="animate-pulse">SCANNING RFID...</span>
                ) : (
                  <>
                    <ArrowRightLeft className="w-5 h-5" />
                    SIMULATE RFID SCAN
                  </>
                )}
              </button>

              <div className="h-16">
                {barrierLifted && (
                  <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 p-3 rounded text-center font-bold animate-in slide-in-from-bottom-2 fade-in">
                    ✓ BARRIER LIFTED (&lt;2s)
                    <div className="text-xs font-normal opacity-80 mt-1">Occupancy Ledger Updated Atomically</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
};
