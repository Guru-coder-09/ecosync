import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, AlertCircle, Sparkles, Clipboard } from 'lucide-react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { IS_DEMO_MODE } from '../../lib/env';

interface QRScannerProps {
  onScan: (text: string) => void;
  active: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, active }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingCamera, setLoadingCamera] = useState<boolean>(true);
  const [demoInput, setDemoInput] = useState<string>('');

  const lastScannedText = useRef<string>('');
  const lastScannedTime = useRef<number>(0);

  // Audio feedback via Web Audio API (tactile high-frequency beep)
  const playBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }, []);

  const handleDecoded = useCallback(
    (text: string) => {
      const now = Date.now();
      // Debounce duplicate scans within 2.5 seconds
      if (text === lastScannedText.current && now - lastScannedTime.current < 2500) {
        return;
      }
      lastScannedText.current = text;
      lastScannedTime.current = now;

      playBeep();
      onScan(text);
    },
    [onScan, playBeep]
  );

  const startCamera = useCallback(async () => {
    if (!videoRef.current || !active) return;
    setLoadingCamera(true);
    setErrorMessage(null);

    try {
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromVideoDevice(
        undefined, // default camera (environment/back camera preferred by browser)
        videoRef.current,
        (result, error) => {
          if (result) {
            handleDecoded(result.getText());
          }
        }
      );
      controlsRef.current = controls;
      setHasPermission(true);
      setLoadingCamera(false);
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      setLoadingCamera(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setHasPermission(false);
        setErrorMessage('Camera access was denied. Please grant permission in your browser bar.');
      } else {
        setErrorMessage(err.message || 'Unable to access device camera.');
      }
    }
  }, [active, handleDecoded]);

  useEffect(() => {
    if (active) {
      startCamera();
    } else {
      controlsRef.current?.stop();
      controlsRef.current = null;
    }

    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [active, startCamera]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden rounded-2xl">
      {/* Video Viewport */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Crosshair Viewfinder Overlay */}
      {active && !errorMessage && !loadingCamera && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

            {/* Scanning radar line */}
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse" />

            <div className="absolute -bottom-8 left-0 right-0 text-center">
              <span className="text-[11px] font-bold tracking-widest text-emerald-300 uppercase bg-black/60 px-3 py-1 rounded-full border border-emerald-500/30 shadow-lg">
                Align QR inside frame
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loadingCamera && (
        <div className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center gap-3 text-white p-4">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm font-semibold text-slate-200">Initializing checkpost optical scanner...</p>
          <span className="text-xs text-slate-400">Requesting hardware sensor clearance</span>
        </div>
      )}

      {/* Permission Denied or Camera Error State */}
      {errorMessage && (
        <div className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center gap-4 text-white p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-900/40 border border-red-700/50 flex items-center justify-center text-red-400">
            <CameraOff className="w-7 h-7" />
          </div>
          <div className="max-w-xs space-y-1">
            <h3 className="font-bold text-base text-white">Camera Unavailable</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
          </div>
          <button
            onClick={startCamera}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Optical Sensor
          </button>
        </div>
      )}

      {/* DEV / DEMO Simulator Overlay for Testing Without Camera */}
      {IS_DEMO_MODE && (
        <div className="absolute top-3 left-3 right-3 bg-black/80 backdrop-blur-md border border-slate-700 rounded-xl p-2.5 flex flex-col gap-2 z-20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-saffron-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Demo Optical Input Bypass
            </span>
            <span className="text-[10px] text-slate-400">Camera optional in demo</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={demoInput}
              onChange={(e) => setDemoInput(e.target.value)}
              placeholder="Paste raw JWT or demo token here..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => {
                if (demoInput.trim()) {
                  handleDecoded(demoInput.trim());
                  setDemoInput('');
                }
              }}
              disabled={!demoInput.trim()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
            >
              <Clipboard className="w-3 h-3" />
              Test
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
