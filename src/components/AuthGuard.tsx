// src/components/AuthGuard.tsx
// Route guard component — redirects unauthenticated users to sign-in.

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import type { UserRole } from "../lib/types";
import { AuthLoadingScreen } from "./LoadingSpinner";

interface AuthGuardProps {
  children: ReactNode;
  /** If set, user must have this role to access the route */
  requiredRole?: UserRole;
  /** Redirect target if not authenticated (default: current path with ?signin) */
  redirectTo?: string;
}

export function AuthGuard({ children, requiredRole, redirectTo = "/" }: AuthGuardProps) {
  const { user, role, loading } = useAuthStore();

  if (loading) return <AuthLoadingScreen />;

  if (!user) return <Navigate to={redirectTo} replace />;

  if (requiredRole && role !== requiredRole) {
    // Wrong role — redirect to their correct portal
    const roleHome: Record<UserRole, string> = {
      tourist: "/",
      guard: "/scanner",
      authority: "/authority",
    };
    return <Navigate to={roleHome[role ?? "tourist"]} replace />;
  }

  return <>{children}</>;
}

// ─── Sign-In / Sign-Up Form ──────────────────────────────────────────────────
import { useState } from "react";
import { Leaf, Eye, EyeOff, Info } from "lucide-react";
import { IS_DEMO_MODE } from "../lib/env";
import { DEMO_ACCOUNTS } from "../lib/mockData";
import type { UserRole as UR } from "../lib/types";

interface SignInFormProps {
  onSuccess?: () => void;
}

export function SignInForm({ onSuccess }: SignInFormProps) {
  const { signIn, signUp, error, loading } = useAuthStore();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UR>("tourist");
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password, role, fullName);
      }
      onSuccess?.();
    } catch {
      // error state already set by store
    }
  };

  const fillDemo = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword("demo1234");
    setMode("signin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* GoI Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-saffron-900 rounded-full flex items-center justify-center shadow-lg">
              <Leaf className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">EcoSync</h1>
          <p className="text-navy-300 text-sm mt-1">Government of India · Ministry of Environment</p>
          {IS_DEMO_MODE && (
            <span className="inline-block mt-2 bg-saffron-900/80 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Demo Mode — No Supabase Required
            </span>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-gray-200">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  mode === m
                    ? "text-navy-900 border-b-2 border-navy-700 bg-white"
                    : "text-gray-500 hover:text-gray-700 bg-gray-50"
                }`}
              >
                {m === "signin" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none"
                    placeholder="Priya Sharma"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UR)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-navy-500 outline-none"
                  >
                    <option value="tourist">Tourist</option>
                    <option value="guard">Checkpost Guard</option>
                    <option value="authority">Government Authority</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none"
                placeholder="your@email.in"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-navy-900 hover:bg-navy-800 disabled:bg-navy-400 text-white font-bold rounded-xl transition-colors text-sm"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Demo mode quick login */}
          {IS_DEMO_MODE && (
            <div className="border-t border-gray-100 px-6 pb-6 pt-4">
              <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wide">
                Quick Demo Login
              </p>
              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => fillDemo(acc.email)}
                    className="w-full text-left px-3 py-2 rounded-xl border border-gray-200 hover:border-navy-300 hover:bg-navy-50 transition-colors text-xs"
                  >
                    <span className="font-semibold text-navy-700">{acc.email}</span>
                    <span className="text-gray-400 ml-2">/ {acc.password}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
