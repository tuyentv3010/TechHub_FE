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

const themes = [
  { name: "Default", value: "default", color: "bg-blue-500" },
  { name: "Purple", value: "purple", color: "bg-purple-500" },
  { name: "Green", value: "green", color: "bg-green-500" },
  { name: "Orange", value: "orange", color: "bg-orange-500" },
  { name: "Pink", value: "pink", color: "bg-pink-500" },
];

export function ThemeColorToggle() {
  const [colorTheme, setColorTheme] = React.useState("default");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("color-theme") || "default";
    setColorTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeName: string) => {
    const root = document.documentElement;
    
    // Remove all theme classes
    themes.forEach(t => {
      root.classList.remove(`theme-${t.value}`);
    });
    
    // Add new theme class
    if (themeName !== "default") {
      root.classList.add(`theme-${themeName}`);
    }
  };

  const handleThemeChange = (themeName: string) => {
    setColorTheme(themeName);
    localStorage.setItem("color-theme", themeName);
    applyTheme(themeName);
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Palette className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle color theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.value}
            onClick={() => handleThemeChange(themeOption.value)}
            className="flex items-center gap-2"
          >
            <div className={`w-4 h-4 rounded-full ${themeOption.color}`} />
            <span>{themeOption.name}</span>
            {colorTheme === themeOption.value && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}