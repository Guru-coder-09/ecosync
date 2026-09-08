// src/components/LoadingSpinner.tsx
import { Leaf } from "lucide-react";
import { cn } from "../lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = "md", label, fullScreen = false }: LoadingSpinnerProps) {
  const sizeClass = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" }[size];
  const textClass = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];

  const inner = (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div
          className={cn(
            "rounded-full border-4 border-navy-200 border-t-navy-700 animate-spin",
            sizeClass
          )}
        />
        <Leaf
          className={cn(
            "absolute inset-0 m-auto text-navy-700",
            size === "sm" ? "w-2.5 h-2.5" : size === "md" ? "w-4 h-4" : "w-6 h-6"
          )}
        />
      </div>
      {label && (
        <p className={cn("text-navy-600 font-medium", textClass)}>{label}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {inner}
      </div>
    );
  }

  return inner;
}

// ─── Auth Loading Screen ─────────────────────────────────────────────────────
export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 flex flex-col items-center justify-center gap-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-saffron-900 rounded-full flex items-center justify-center">
          <Leaf className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">EcoSync</h1>
          <p className="text-navy-300 text-xs">GoI Digital Public Infrastructure</p>
        </div>
      </div>
      <LoadingSpinner size="md" label="Initialising…" />
    </div>
  );
}
