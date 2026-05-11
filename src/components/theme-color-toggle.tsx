"use client";

import * as React from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  applyColorTheme,
  COLOR_THEME_EVENT,
  COLOR_THEME_STORAGE_KEY,
  COLOR_THEMES,
  persistColorTheme,
} from "@/lib/color-theme";

export function ThemeColorToggle() {
  const [colorTheme, setColorTheme] = React.useState("default");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setColorTheme(applyColorTheme(localStorage.getItem(COLOR_THEME_STORAGE_KEY)));

    const handleColorThemeChange = (event: Event) => {
      const theme = (event as CustomEvent<{ theme?: string }>).detail?.theme;
      setColorTheme(applyColorTheme(theme));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === COLOR_THEME_STORAGE_KEY) {
        setColorTheme(applyColorTheme(event.newValue));
      }
    };

    window.addEventListener(COLOR_THEME_EVENT, handleColorThemeChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(COLOR_THEME_EVENT, handleColorThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleThemeChange = (themeName: string) => {
    setColorTheme(persistColorTheme(themeName));
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="app-control app-control-icon" disabled>
        <Palette className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="app-control app-control-icon">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle color theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="app-control-menu">
        {COLOR_THEMES.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.value}
            onClick={() => handleThemeChange(themeOption.value)}
            className="flex items-center gap-2"
          >
            <div className={`h-4 w-4 rounded-full ${themeOption.colorClass}`} />
            <span>{themeOption.name}</span>
            {colorTheme === themeOption.value && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
