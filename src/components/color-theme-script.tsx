import {
  COLOR_THEMES,
  COLOR_THEME_STORAGE_KEY,
  CUSTOM_COLOR_THEME_FIELDS,
  CUSTOM_COLOR_THEME_STORAGE_KEY,
} from "@/lib/color-theme";

const activeThemeValues = COLOR_THEMES.map((theme) => theme.value);
const removableThemeValues = [...activeThemeValues, "red"];

const colorThemeScript = `
(() => {
  const COLOR_THEME_STORAGE_KEY = ${JSON.stringify(COLOR_THEME_STORAGE_KEY)};
  const CUSTOM_COLOR_THEME_STORAGE_KEY = ${JSON.stringify(CUSTOM_COLOR_THEME_STORAGE_KEY)};
  const ACTIVE_THEME_VALUES = ${JSON.stringify(activeThemeValues)};
  const REMOVABLE_THEME_VALUES = ${JSON.stringify(removableThemeValues)};
  const CUSTOM_COLOR_THEME_FIELDS = ${JSON.stringify(CUSTOM_COLOR_THEME_FIELDS)};

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

  const getTargets = () => [document.documentElement, document.body].filter(Boolean);
  const normalizeTheme = (value) => ACTIVE_THEME_VALUES.includes(value) ? value : "default";
  const getCustomTheme = () => {
    try {
      return JSON.parse(window.localStorage.getItem(CUSTOM_COLOR_THEME_STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  };

  try {
    const theme = normalizeTheme(window.localStorage.getItem(COLOR_THEME_STORAGE_KEY));
    const root = document.documentElement;

    REMOVABLE_THEME_VALUES.forEach((themeValue) => {
      root.classList.remove("theme-" + themeValue);
    });

    if (theme === "custom") {
      const customTheme = getCustomTheme();
      getTargets().forEach((target) => {
        CUSTOM_COLOR_THEME_FIELDS.forEach((field) => {
          const color = isHexColor(customTheme[field.key]) ? customTheme[field.key] : field.defaultValue;
          const hslValue = hexToHsl(color);
          field.cssVariables.forEach((variable) => {
            target.style.setProperty(variable, hslValue);
          });
        });
        target.dataset.customColorTheme = "true";
      });
    } else if (theme !== "default") {
      root.classList.add("theme-" + theme);
    }

    root.dataset.colorTheme = theme;
  } catch {
  }
})();
`;

export function ColorThemeScript() {
  return (
    <script
      id="techhub-color-theme-script"
      dangerouslySetInnerHTML={{ __html: colorThemeScript }}
    />
  );
}
