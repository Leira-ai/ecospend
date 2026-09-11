"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useDemoStore } from "./demo-store";

export function ThemeControl({ compact = false }: { compact?: boolean }) {
  const { preferences, setPreferences } = useDemoStore();
  const { setTheme } = useTheme();

  const cycle = () => {
    const theme = preferences.theme === "system" ? "light" : preferences.theme === "light" ? "dark" : "system";
    setPreferences({ ...preferences, theme });
    setTheme(theme);
  };
  const Icon = preferences.theme === "system" ? Monitor : preferences.theme === "light" ? Sun : Moon;
  const label = `Tema dasbor: ${preferences.theme === "system" ? "sistem" : preferences.theme === "light" ? "terang" : "gelap"}`;

  return (
    <button type="button" onClick={cycle} aria-label={`${label}. Klik untuk mengganti tema`}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <Icon aria-hidden="true" className="size-4" />
      {!compact && <span>{label}</span>}
    </button>
  );
}
