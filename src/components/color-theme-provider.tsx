"use client";

import * as React from "react";

import {
  applyColorTheme,
  COLOR_THEME_EVENT,
  COLOR_THEME_STORAGE_KEY,
} from "@/lib/color-theme";

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const applySavedTheme = () => {
      applyColorTheme(window.localStorage.getItem(COLOR_THEME_STORAGE_KEY));
    };

    applySavedTheme();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === COLOR_THEME_STORAGE_KEY) {
        applyColorTheme(event.newValue);
      }
    };

    const handleThemeChange = (event: Event) => {
      const theme = (event as CustomEvent<{ theme?: string }>).detail?.theme;
      applyColorTheme(theme);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(COLOR_THEME_EVENT, handleThemeChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(COLOR_THEME_EVENT, handleThemeChange);
    };
  }, []);

  return <>{children}</>;
}
