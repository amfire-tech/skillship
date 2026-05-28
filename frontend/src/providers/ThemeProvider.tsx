"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
}

// storageKey bumped to v2 so existing users with a stale "light" pref
// from before the unified-theme launch land on the new default (dark)
// on first visit. Bump again any time the default flips.
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="skillship-theme-v2">
      {children}
    </NextThemesProvider>
  );
}
