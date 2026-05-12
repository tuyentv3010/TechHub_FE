export const COLOR_THEME_STORAGE_KEY = "color-theme";
export const CUSTOM_COLOR_THEME_STORAGE_KEY = "custom-color-theme";
export const COLOR_THEME_EVENT = "techhub-color-theme-change";

export const COLOR_THEMES = [
  {
    name: "TechHub Blue",
    value: "default",
    colorClass: "bg-blue-700",
    swatches: ["#2563eb", "#0f766e", "#f8fafc"],
  },
  {
    name: "Learning Teal",
    value: "green",
    colorClass: "bg-teal-700",
    swatches: ["#0f766e", "#0284c7", "#f0fdfa"],
  },
  {
    name: "Business Amber",
    value: "orange",
    colorClass: "bg-amber-600",
    swatches: ["#d97706", "#2563eb", "#fff7ed"],
  },
  {
    name: "Executive Purple",
    value: "purple",
    colorClass: "bg-violet-600",
    swatches: ["#7c3aed", "#0f766e", "#faf5ff"],
  },
  {
    name: "Product Rose",
    value: "pink",
    colorClass: "bg-pink-600",
    swatches: ["#db2777", "#f59e0b", "#fff1f2"],
  },
  {
    name: "Ocean Cyan",
    value: "ocean",
    colorClass: "bg-cyan-600",
    swatches: ["#0284c7", "#059669", "#f0f9ff"],
  },
  {
    name: "Forest Lime",
    value: "forest",
    colorClass: "bg-emerald-700",
    swatches: ["#047857", "#65a30d", "#f7fee7"],
  },
  {
    name: "Slate Coral",
    value: "slate",
    colorClass: "bg-slate-700",
    swatches: ["#334155", "#f97316", "#f8fafc"],
  },
  {
    name: "Custom",
    value: "custom",
    colorClass: "bg-gradient-to-r from-blue-600 via-teal-600 to-rose-600",
    swatches: ["#2563eb", "#0f172a", "#ffffff"],
  },
] as const;

export type ColorThemeValue = (typeof COLOR_THEMES)[number]["value"];
export type CustomColorThemeKey =
  | "primary"
  | "primaryForeground"
  | "background"
  | "foreground"
  | "card"
  | "cardForeground"
  | "secondary"
  | "secondaryForeground"
  | "muted"
  | "mutedForeground"
  | "accent"
  | "accentForeground"
  | "border"
  | "input"
  | "ring";
export type CustomColorTheme = Record<CustomColorThemeKey, string>;

export const DEFAULT_CUSTOM_COLOR_THEME: CustomColorTheme = {
  primary: "#2563eb",
  primaryForeground: "#ffffff",
  background: "#f8fafc",
  foreground: "#0f172a",
  card: "#ffffff",
  cardForeground: "#0f172a",
  secondary: "#e2e8f0",
  secondaryForeground: "#0f172a",
  muted: "#e2e8f0",
  mutedForeground: "#64748b",
  accent: "#ccfbf1",
  accentForeground: "#115e59",
  border: "#cbd5e1",
  input: "#cbd5e1",
  ring: "#2563eb",
};

export const CUSTOM_COLOR_THEME_FIELDS = [
  {
    key: "primary",
    cssVariables: ["--primary", "--learning-accent"],
    defaultValue: DEFAULT_CUSTOM_COLOR_THEME.primary,
  },
  {
    key: "primaryForeground",
    cssVariables: ["--primary-foreground", "--learning-accent-foreground"],
    defaultValue: DEFAULT_CUSTOM_COLOR_THEME.primaryForeground,
  },
  {
    key: "background",
    cssVariables: ["--background", "--app-bg"],
    defaultValue: DEFAULT_CUSTOM_COLOR_THEME.background,
  },
  {
    key: "foreground",
    cssVariables: ["--foreground"],
    defaultValue: DEFAULT_CUSTOM_COLOR_THEME.foreground,
  },
  {
    key: "card",
    cssVariables: ["--card", "--popover", "--app-surface"],
    defaultValue: DEFAULT_CUSTOM_COLOR_THEME.card,
  },
  {
    key: "cardForeground",
    cssVariables: ["--card-foreground", "--popover-foreground"],
    defaultValue: DEFAULT_CUSTOM_COLOR_THEME.cardForeground,
  },
  {
    key: "secondary",
    cssVariables: ["--secondary", "--app-surface-subtle"],
    defaultValue: DEFAULT_CUSTOM_COLOR_THEME.secondary,
  },
  {
    key: "secondaryForeground",
    cssVariables: ["--secondary-foreground"],
    defaultValue: DEFAULT_CUSTOM_COLOR_THEME.secondaryForeground,
  },
  {
    key: "muted",
    cssVariables: ["--muted"],
    defaultValue: DEFAULT_CUSTOM_COLOR_THEME.muted,
  },
  {
    key: "mutedForeground",
    cssVariables: ["--muted-foreground"],
    defaultValue: DEFAULT_CUSTOM_COLOR_THEME.mutedForeground,
  },
  {
    key: "accent",
    cssVariables: ["--accent"],
    defaultValue: DEFAULT_CUSTOM_COLOR_THEME.accent,
  },
  {
    key: "accentForeground",
    cssVariables: ["--accent-foreground"],
    defaultValue: DEFAULT_CUSTOM_COLOR_THEME.accentForeground,
  },
  {
    key: "border",
    cssVariables: ["--border", "--app-border"],
    defaultValue: DEFAULT_CUSTOM_COLOR_THEME.border,
  },
  {
    key: "input",
    cssVariables: ["--input"],
    defaultValue: DEFAULT_CUSTOM_COLOR_THEME.input,
  },
  {
    key: "ring",
    cssVariables: ["--ring"],
    defaultValue: DEFAULT_CUSTOM_COLOR_THEME.ring,
  },
] as const satisfies readonly {
  key: CustomColorThemeKey;
  cssVariables: readonly string[];
  defaultValue: string;
}[];

const activeThemeValues = COLOR_THEMES.map((theme) => theme.value);
const legacyThemeValues = ["red"];
const removableThemeValues = [...activeThemeValues, ...legacyThemeValues];
const customThemeVariables = Array.from(
  new Set(CUSTOM_COLOR_THEME_FIELDS.flatMap((field) => field.cssVariables))
);

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function hexToHsl(value: string) {
  const red = parseInt(value.slice(1, 3), 16) / 255;
  const green = parseInt(value.slice(3, 5), 16) / 255;
  const blue = parseInt(value.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) {
    return `0 0% ${Math.round(lightness * 100)}%`;
  }

  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;

  if (max === red) {
    hue = (green - blue) / delta + (green < blue ? 6 : 0);
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return `${Math.round(hue * 60)} ${Math.round(saturation * 100)}% ${Math.round(
    lightness * 100
  )}%`;
}

function getThemeTargets() {
  if (typeof document === "undefined") {
    return [];
  }

  return [document.documentElement, document.body].filter(Boolean);
}

function clearCustomThemeStyles() {
  getThemeTargets().forEach((target) => {
    customThemeVariables.forEach((variable) => {
      target.style.removeProperty(variable);
    });
    delete target.dataset.customColorTheme;
  });
}

export function normalizeCustomColorTheme(
  value: Partial<CustomColorTheme> | null | undefined
): CustomColorTheme {
  return CUSTOM_COLOR_THEME_FIELDS.reduce((theme, field) => {
    const color = value?.[field.key];
    theme[field.key] = isHexColor(color) ? color : field.defaultValue;
    return theme;
  }, {} as CustomColorTheme);
}

export function normalizeColorTheme(value: string | null | undefined): ColorThemeValue {
  return activeThemeValues.includes(value as ColorThemeValue)
    ? (value as ColorThemeValue)
    : "default";
}

export function getStoredColorTheme(): ColorThemeValue {
  if (typeof window === "undefined") {
    return "default";
  }

  return normalizeColorTheme(window.localStorage.getItem(COLOR_THEME_STORAGE_KEY));
}

export function getStoredCustomColorTheme(): CustomColorTheme {
  if (typeof window === "undefined") {
    return DEFAULT_CUSTOM_COLOR_THEME;
  }

  const storedTheme = window.localStorage.getItem(CUSTOM_COLOR_THEME_STORAGE_KEY);
  if (!storedTheme) {
    return DEFAULT_CUSTOM_COLOR_THEME;
  }

  try {
    return normalizeCustomColorTheme(JSON.parse(storedTheme));
  } catch {
    return DEFAULT_CUSTOM_COLOR_THEME;
  }
}

export function applyCustomColorTheme(value: Partial<CustomColorTheme>): CustomColorTheme {
  const normalizedTheme = normalizeCustomColorTheme(value);

  getThemeTargets().forEach((target) => {
    CUSTOM_COLOR_THEME_FIELDS.forEach((field) => {
      const hslValue = hexToHsl(normalizedTheme[field.key]);
      field.cssVariables.forEach((variable) => {
        target.style.setProperty(variable, hslValue);
      });
    });
    target.dataset.customColorTheme = "true";
  });

  return normalizedTheme;
}

export function applyColorTheme(value: string | null | undefined): ColorThemeValue {
  const normalizedTheme = normalizeColorTheme(value);

  if (typeof document === "undefined") {
    return normalizedTheme;
  }

  const root = document.documentElement;
  removableThemeValues.forEach((themeValue) => {
    root.classList.remove(`theme-${themeValue}`);
  });
  clearCustomThemeStyles();

  if (normalizedTheme === "custom") {
    applyCustomColorTheme(getStoredCustomColorTheme());
  } else if (normalizedTheme !== "default") {
    root.classList.add(`theme-${normalizedTheme}`);
  }

  root.dataset.colorTheme = normalizedTheme;
  return normalizedTheme;
}

export function persistColorTheme(value: string): ColorThemeValue {
  const normalizedTheme = applyColorTheme(value);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, normalizedTheme);
    window.dispatchEvent(
      new CustomEvent(COLOR_THEME_EVENT, {
        detail: { theme: normalizedTheme },
      })
    );
  }

  return normalizedTheme;
}

export function persistCustomColorTheme(value: Partial<CustomColorTheme>): CustomColorTheme {
  const normalizedTheme = normalizeCustomColorTheme(value);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      CUSTOM_COLOR_THEME_STORAGE_KEY,
      JSON.stringify(normalizedTheme)
    );
    window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, "custom");
  }

  applyColorTheme("custom");

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(COLOR_THEME_EVENT, {
        detail: { theme: "custom" },
      })
    );
  }

  return normalizedTheme;
}

export function resetCustomColorTheme() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CUSTOM_COLOR_THEME_STORAGE_KEY);
  }

  return persistColorTheme("default");
}
