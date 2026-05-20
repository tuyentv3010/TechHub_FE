import {
  COLOR_THEMES,
  COLOR_THEME_STORAGE_KEY,
  CUSTOM_COLOR_THEME_FIELDS,
  CUSTOM_COLOR_THEME_STORAGE_KEY,
  CUSTOM_THEME_STYLE_ID,
} from "@/lib/color-theme";
import { buildNamedThemeStylesheet } from "@/lib/theme-palettes";

const activeThemeValues = COLOR_THEMES.map((theme) => theme.value);
const removableThemeValues = [...activeThemeValues, "red"];

/**
 * Blocking inline script that runs before hydration. Restores the
 * user's saved theme (named or custom) so the first paint already
 * has the right colours — no flash of default theme.
 *
 * Key invariant: for the custom theme it writes a `<style>` element
 * (NOT inline `style` props on <html>/<body>). Inline styles beat
 * the `.dark` class selector, which is why the previous version
 * blocked the light/dark toggle whenever the custom palette was on.
 */
const colorThemeScript = `
(() => {
  const COLOR_THEME_STORAGE_KEY = ${JSON.stringify(COLOR_THEME_STORAGE_KEY)};
  const CUSTOM_COLOR_THEME_STORAGE_KEY = ${JSON.stringify(CUSTOM_COLOR_THEME_STORAGE_KEY)};
  const CUSTOM_THEME_STYLE_ID = ${JSON.stringify(CUSTOM_THEME_STYLE_ID)};
  const ACTIVE_THEME_VALUES = ${JSON.stringify(activeThemeValues)};
  const REMOVABLE_THEME_VALUES = ${JSON.stringify(removableThemeValues)};
  const CUSTOM_COLOR_THEME_FIELDS = ${JSON.stringify(CUSTOM_COLOR_THEME_FIELDS)};
  const DARK_OVERRIDE_KEYS = ["primary", "primaryForeground", "ring"];

  const isHexColor = (value) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

  const hexToHsl = (value) => {
    const red = parseInt(value.slice(1, 3), 16) / 255;
    const green = parseInt(value.slice(3, 5), 16) / 255;
    const blue = parseInt(value.slice(5, 7), 16) / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const lightness = (max + min) / 2;
    if (max === min) {
      return "0 0% " + Math.round(lightness * 100) + "%";
    }
    const delta = max - min;
    const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    let hue = 0;
    if (max === red) {
      hue = (green - blue) / delta + (green < blue ? 6 : 0);
    } else if (max === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }
    return Math.round(hue * 60) + " " + Math.round(saturation * 100) + "% " + Math.round(lightness * 100) + "%";
  };

  const normalizeTheme = (value) => ACTIVE_THEME_VALUES.includes(value) ? value : "default";
  const getCustomTheme = () => {
    try {
      return JSON.parse(window.localStorage.getItem(CUSTOM_COLOR_THEME_STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  };

  const buildCustomCss = (customTheme) => {
    const lightDecls = [];
    const darkDecls = [];
    CUSTOM_COLOR_THEME_FIELDS.forEach((field) => {
      const raw = customTheme[field.key];
      const color = isHexColor(raw) ? raw : field.defaultValue;
      const hsl = hexToHsl(color);
      field.cssVariables.forEach((cssVar) => {
        lightDecls.push("  " + cssVar + ": " + hsl + ";");
        if (DARK_OVERRIDE_KEYS.indexOf(field.key) !== -1) {
          darkDecls.push("  " + cssVar + ": " + hsl + ";");
        }
      });
    });
    // Scope light values to html:not(.dark) so they don't beat the
    // .dark { ... } block via attribute-selector specificity when
    // dark mode is toggled on. See theme-palettes.ts for the matching
    // runtime implementation.
    return 'html:not(.dark)[data-color-theme="custom"] {\\n' + lightDecls.join("\\n") + "\\n}\\n" +
           'html.dark[data-color-theme="custom"] {\\n' + darkDecls.join("\\n") + "\\n}";
  };

  try {
    const theme = normalizeTheme(window.localStorage.getItem(COLOR_THEME_STORAGE_KEY));
    const root = document.documentElement;

    // Clean up any previous theme state
    REMOVABLE_THEME_VALUES.forEach((themeValue) => {
      root.classList.remove("theme-" + themeValue);
    });
    const existing = document.getElementById(CUSTOM_THEME_STYLE_ID);
    if (existing) existing.remove();

    if (theme === "custom") {
      const customTheme = getCustomTheme();
      const styleEl = document.createElement("style");
      styleEl.id = CUSTOM_THEME_STYLE_ID;
      styleEl.textContent = buildCustomCss(customTheme);
      document.head.appendChild(styleEl);
      root.dataset.customColorTheme = "true";
    } else {
      delete root.dataset.customColorTheme;
      if (theme !== "default") {
        root.classList.add("theme-" + theme);
      }
    }

    root.dataset.colorTheme = theme;
  } catch {
  }
})();
`;

/**
 * Static <style> block containing every named theme's palette. Runs
 * once at server-render time so adding a new theme requires only an
 * entry in NAMED_THEME_PALETTES — no globals.css edit.
 */
function ThemeBaseStyles() {
  const css = buildNamedThemeStylesheet();
  return (
    <style
      id="techhub-named-theme-palettes"
      // Static, generated from data — safe to inject.
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
}

export function ColorThemeScript() {
  return (
    <>
      <ThemeBaseStyles />
      <script
        id="techhub-color-theme-script"
        dangerouslySetInnerHTML={{ __html: colorThemeScript }}
      />
    </>
  );
}
