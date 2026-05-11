export const COLOR_THEME_STORAGE_KEY = "color-theme";
export const COLOR_THEME_EVENT = "techhub-color-theme-change";

export const COLOR_THEMES = [
  { name: "TechHub Blue", value: "default", colorClass: "bg-blue-700" },
  { name: "Learning Teal", value: "green", colorClass: "bg-teal-700" },
  { name: "Business Amber", value: "orange", colorClass: "bg-amber-600" },
] as const;

export type ColorThemeValue = (typeof COLOR_THEMES)[number]["value"];

const activeThemeValues = COLOR_THEMES.map((theme) => theme.value);
const legacyThemeValues = ["purple", "pink"];
const removableThemeValues = [...activeThemeValues, ...legacyThemeValues];

export function normalizeColorTheme(value: string | null | undefined): ColorThemeValue {
  return activeThemeValues.includes(value as ColorThemeValue)
    ? (value as ColorThemeValue)
    : "default";
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

  if (normalizedTheme !== "default") {
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
