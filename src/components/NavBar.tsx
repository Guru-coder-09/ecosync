// src/components/NavBar.tsx
import { Link, useLocation } from "react-router-dom";
import { Leaf, LayoutDashboard, ScanLine, LogOut, User, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useScanStore } from "../stores/scanStore";
import { IS_DEMO_MODE } from "../lib/env";
import { cn } from "../lib/utils";

export function NavBar() {
  const { pathname } = useLocation();
  const { profile, role, signOut } = useAuthStore();
  const { isOffline, pendingCount } = useScanStore();

  const links = [
    {
      to: "/",
      label: "Tourist Portal",
      icon: <Leaf className="w-4 h-4" />,
      roles: ["tourist"],
    },
    {
      to: "/authority",
      label: "Command Dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ["authority"],
    },
    {
      to: "/scanner",
      label: "Checkpost Scanner",
      icon: <ScanLine className="w-4 h-4" />,
      roles: ["guard"],
    },
  ];

  const allowedLinks = links.filter((l) => !role || l.roles.includes(role));

  return (
    <nav className="bg-navy-900 text-white shadow-lg print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-saffron-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-sm tracking-wide">EcoSync</span>
              <span className="hidden sm:block text-[10px] text-navy-200 leading-none">
                GoI Digital Public Infrastructure
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <div className="flex items-center gap-1">
            {allowedLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  pathname === l.to
                    ? "bg-white/20 text-white"
                    : "text-navy-200 hover:bg-white/10 hover:text-white"
                )}
              >
                {l.icon}
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            ))}
          </div>

          {/* Right side: status + user */}
          <div className="flex items-center gap-2">
            {/* Demo badge */}
            {IS_DEMO_MODE && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] bg-saffron-900/80 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                <AlertTriangle className="w-3 h-3" /> Demo
              </span>
            )}

            {/* Offline indicator */}
            {isOffline ? (
              <span className="flex items-center gap-1 text-xs text-amber-300 font-medium">
                <WifiOff className="w-3.5 h-3.5" />
                {pendingCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {pendingCount}
                  </span>
                )}
              </span>
            ) : (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            )}

            {/* User */}
            {profile && (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-1.5 text-xs">
                  <User className="w-3.5 h-3.5 text-navy-300" />
                  <span className="text-navy-200 max-w-[120px] truncate">
                    {profile.full_name}
                  </span>
                  <span className="capitalize bg-navy-700 text-navy-200 px-1.5 py-0.5 rounded text-[10px]">
                    {profile.role}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-navy-300 hover:text-white transition-colors"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
