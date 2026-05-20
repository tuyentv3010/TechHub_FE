/**
 * Data-driven theme palettes.
 *
 * Each named theme defines a `light` palette (the values applied
 * when only `.theme-X` is on <html>) and a `dark` palette (applied
 * when both `.dark` and `.theme-X` are on <html>). Values are HSL
 * triplets without the surrounding `hsl()` because globals.css uses
 * the `hsl(var(--token))` wrap pattern.
 *
 * To add a new theme, add an entry to NAMED_THEME_PALETTES below
 * AND a corresponding row to COLOR_THEMES in `color-theme.ts`. No
 * globals.css edit needed — the stylesheet is generated at build
 * time and rendered via <ThemeBaseStyles /> in the root layout.
 */

/** A palette is just a CSS variable name → HSL triplet map. */
export type ThemePalette = Record<string, string>;

export interface NamedThemePaletteDefinition {
  /** Slug matching the value in COLOR_THEMES (e.g. "green"). */
  value: string;
  light: ThemePalette;
  dark: ThemePalette;
}

/* ─────────────────────────────────────────────
   Named theme palettes
   ───────────────────────────────────────────── */

export const NAMED_THEME_PALETTES: NamedThemePaletteDefinition[] = [
  {
    value: "green",
    light: {
      "--background": "180 47% 98%",
      "--app-bg": "180 47% 98%",
      "--app-surface": "0 0% 100%",
      "--app-surface-subtle": "174 40% 94%",
      "--app-border": "174 35% 84%",
      "--foreground": "184 61% 10%",
      "--card": "0 0% 100%",
      "--card-foreground": "184 61% 10%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "184 61% 10%",
      "--primary": "176 77% 26%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "173 58% 94%",
      "--secondary-foreground": "184 61% 10%",
      "--muted": "174 40% 94%",
      "--muted-foreground": "184 20% 36%",
      "--accent": "199 95% 93%",
      "--accent-foreground": "199 89% 28%",
      "--border": "174 35% 84%",
      "--input": "174 35% 84%",
      "--learning-accent": "176 77% 26%",
      "--ring": "176 77% 26%",
    },
    dark: {
      "--background": "184 40% 8%",
      "--app-bg": "184 40% 8%",
      "--app-surface": "182 30% 12%",
      "--app-surface-subtle": "180 32% 15%",
      "--app-border": "180 23% 24%",
      "--foreground": "172 65% 92%",
      "--card": "182 30% 12%",
      "--card-foreground": "172 65% 92%",
      "--popover": "182 30% 12%",
      "--popover-foreground": "172 65% 92%",
      "--primary": "173 58% 42%",
      "--primary-foreground": "222 47% 8%",
      "--secondary": "180 32% 15%",
      "--secondary-foreground": "172 65% 92%",
      "--muted": "180 32% 15%",
      "--muted-foreground": "174 22% 68%",
      "--accent": "199 46% 18%",
      "--accent-foreground": "199 82% 86%",
      "--border": "180 23% 24%",
      "--input": "180 23% 24%",
      "--learning-accent": "173 58% 42%",
      "--ring": "173 58% 42%",
    },
  },
  {
    value: "orange",
    light: {
      "--background": "45 60% 98%",
      "--app-bg": "45 60% 98%",
      "--app-surface": "0 0% 100%",
      "--app-surface-subtle": "43 74% 92%",
      "--app-border": "36 55% 84%",
      "--foreground": "224 43% 11%",
      "--card": "0 0% 100%",
      "--card-foreground": "224 43% 11%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "224 43% 11%",
      "--primary": "32 95% 44%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "214 100% 96%",
      "--secondary-foreground": "224 43% 11%",
      "--muted": "43 74% 92%",
      "--muted-foreground": "28 23% 38%",
      "--accent": "216 100% 94%",
      "--accent-foreground": "224 76% 34%",
      "--border": "36 55% 84%",
      "--input": "36 55% 84%",
      "--learning-accent": "32 95% 44%",
      "--ring": "32 95% 44%",
    },
    dark: {
      "--background": "230 35% 9%",
      "--app-bg": "230 35% 9%",
      "--app-surface": "228 30% 13%",
      "--app-surface-subtle": "35 34% 16%",
      "--app-border": "35 28% 25%",
      "--foreground": "38 92% 92%",
      "--card": "228 30% 13%",
      "--card-foreground": "38 92% 92%",
      "--popover": "228 30% 13%",
      "--popover-foreground": "38 92% 92%",
      "--primary": "35 92% 58%",
      "--primary-foreground": "222 47% 8%",
      "--secondary": "220 34% 17%",
      "--secondary-foreground": "38 92% 92%",
      "--muted": "35 34% 16%",
      "--muted-foreground": "36 28% 70%",
      "--accent": "216 40% 20%",
      "--accent-foreground": "216 92% 88%",
      "--border": "35 28% 25%",
      "--input": "35 28% 25%",
      "--learning-accent": "35 92% 58%",
      "--ring": "35 92% 58%",
    },
  },
  {
    value: "purple",
    light: {
      "--background": "270 60% 99%",
      "--app-bg": "270 60% 99%",
      "--app-surface": "0 0% 100%",
      "--app-surface-subtle": "270 95% 96%",
      "--app-border": "267 43% 86%",
      "--foreground": "260 43% 12%",
      "--card": "0 0% 100%",
      "--card-foreground": "260 43% 12%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "260 43% 12%",
      "--primary": "262.1 83.3% 57.8%",
      "--primary-foreground": "210 40% 98%",
      "--secondary": "187 65% 92%",
      "--secondary-foreground": "260 43% 12%",
      "--muted": "270 95% 96%",
      "--muted-foreground": "259 18% 42%",
      "--accent": "270 95% 96%",
      "--accent-foreground": "262.1 83.3% 40%",
      "--border": "267 43% 86%",
      "--input": "267 43% 86%",
      "--learning-accent": "262.1 83.3% 57.8%",
      "--ring": "262.1 83.3% 57.8%",
    },
    dark: {
      "--background": "263 42% 9%",
      "--app-bg": "263 42% 9%",
      "--app-surface": "263 34% 13%",
      "--app-surface-subtle": "263 44% 18%",
      "--app-border": "263 25% 26%",
      "--foreground": "263 92% 92%",
      "--card": "263 34% 13%",
      "--card-foreground": "263 92% 92%",
      "--popover": "263 34% 13%",
      "--popover-foreground": "263 92% 92%",
      "--primary": "263.4 70% 50.4%",
      "--primary-foreground": "210 40% 98%",
      "--secondary": "188 30% 18%",
      "--secondary-foreground": "263 92% 92%",
      "--muted": "263 44% 18%",
      "--muted-foreground": "263 18% 70%",
      "--accent": "263 44% 18%",
      "--accent-foreground": "263 92% 92%",
      "--border": "263 25% 26%",
      "--input": "263 25% 26%",
      "--learning-accent": "263.4 70% 50.4%",
      "--ring": "263.4 70% 50.4%",
    },
  },
  {
    value: "pink",
    light: {
      "--background": "355 80% 99%",
      "--app-bg": "355 80% 99%",
      "--app-surface": "0 0% 100%",
      "--app-surface-subtle": "327 73% 97%",
      "--app-border": "340 45% 86%",
      "--foreground": "336 48% 12%",
      "--card": "0 0% 100%",
      "--card-foreground": "336 48% 12%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "336 48% 12%",
      "--primary": "322.2 84% 60.5%",
      "--primary-foreground": "210 40% 98%",
      "--secondary": "43 90% 94%",
      "--secondary-foreground": "336 48% 12%",
      "--muted": "327 73% 97%",
      "--muted-foreground": "335 20% 42%",
      "--accent": "327 73% 97%",
      "--accent-foreground": "322.2 84% 40%",
      "--border": "340 45% 86%",
      "--input": "340 45% 86%",
      "--learning-accent": "322.2 84% 60.5%",
      "--ring": "322.2 84% 60.5%",
    },
    dark: {
      "--background": "336 40% 9%",
      "--app-bg": "336 40% 9%",
      "--app-surface": "336 32% 13%",
      "--app-surface-subtle": "322 44% 18%",
      "--app-border": "322 25% 27%",
      "--foreground": "322 92% 92%",
      "--card": "336 32% 13%",
      "--card-foreground": "322 92% 92%",
      "--popover": "336 32% 13%",
      "--popover-foreground": "322 92% 92%",
      "--primary": "322.2 84% 60.5%",
      "--primary-foreground": "210 40% 98%",
      "--secondary": "37 36% 17%",
      "--secondary-foreground": "322 92% 92%",
      "--muted": "322 44% 18%",
      "--muted-foreground": "325 20% 70%",
      "--accent": "322 44% 18%",
      "--accent-foreground": "322 92% 92%",
      "--border": "322 25% 27%",
      "--input": "322 25% 27%",
      "--learning-accent": "322.2 84% 60.5%",
      "--ring": "322.2 84% 60.5%",
    },
  },
  {
    value: "ocean",
    light: {
      "--background": "204 100% 98%",
      "--app-bg": "204 100% 98%",
      "--app-surface": "0 0% 100%",
      "--app-surface-subtle": "199 95% 93%",
      "--app-border": "199 42% 84%",
      "--foreground": "205 80% 12%",
      "--card": "0 0% 100%",
      "--card-foreground": "205 80% 12%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "205 80% 12%",
      "--primary": "199 89% 48%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "160 84% 93%",
      "--secondary-foreground": "205 80% 12%",
      "--muted": "199 95% 93%",
      "--muted-foreground": "205 25% 38%",
      "--accent": "160 84% 92%",
      "--accent-foreground": "161 94% 24%",
      "--border": "199 42% 84%",
      "--input": "199 42% 84%",
      "--learning-accent": "199 89% 48%",
      "--ring": "199 89% 48%",
    },
    dark: {
      "--background": "205 45% 8%",
      "--app-bg": "205 45% 8%",
      "--app-surface": "204 38% 12%",
      "--app-surface-subtle": "200 40% 16%",
      "--app-border": "200 28% 25%",
      "--foreground": "199 95% 92%",
      "--card": "204 38% 12%",
      "--card-foreground": "199 95% 92%",
      "--popover": "204 38% 12%",
      "--popover-foreground": "199 95% 92%",
      "--primary": "199 89% 55%",
      "--primary-foreground": "205 45% 8%",
      "--secondary": "160 34% 18%",
      "--secondary-foreground": "199 95% 92%",
      "--muted": "200 40% 16%",
      "--muted-foreground": "199 30% 70%",
      "--accent": "160 34% 18%",
      "--accent-foreground": "160 84% 86%",
      "--border": "200 28% 25%",
      "--input": "200 28% 25%",
      "--learning-accent": "199 89% 55%",
      "--ring": "199 89% 55%",
    },
  },
  {
    value: "forest",
    light: {
      "--background": "84 55% 98%",
      "--app-bg": "84 55% 98%",
      "--app-surface": "0 0% 100%",
      "--app-surface-subtle": "84 58% 92%",
      "--app-border": "125 28% 82%",
      "--foreground": "151 68% 9%",
      "--card": "0 0% 100%",
      "--card-foreground": "151 68% 9%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "151 68% 9%",
      "--primary": "152 69% 31%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "84 58% 92%",
      "--secondary-foreground": "151 68% 9%",
      "--muted": "82 45% 92%",
      "--muted-foreground": "142 20% 34%",
      "--accent": "83 78% 90%",
      "--accent-foreground": "142 76% 25%",
      "--border": "125 28% 82%",
      "--input": "125 28% 82%",
      "--learning-accent": "152 69% 31%",
      "--ring": "152 69% 31%",
    },
    dark: {
      "--background": "151 35% 8%",
      "--app-bg": "151 35% 8%",
      "--app-surface": "151 28% 12%",
      "--app-surface-subtle": "142 28% 16%",
      "--app-border": "142 22% 25%",
      "--foreground": "142 68% 91%",
      "--card": "151 28% 12%",
      "--card-foreground": "142 68% 91%",
      "--popover": "151 28% 12%",
      "--popover-foreground": "142 68% 91%",
      "--primary": "142 69% 45%",
      "--primary-foreground": "151 35% 8%",
      "--secondary": "84 26% 17%",
      "--secondary-foreground": "142 68% 91%",
      "--muted": "142 28% 16%",
      "--muted-foreground": "142 22% 70%",
      "--accent": "84 26% 17%",
      "--accent-foreground": "84 78% 84%",
      "--border": "142 22% 25%",
      "--input": "142 22% 25%",
      "--learning-accent": "142 69% 45%",
      "--ring": "142 69% 45%",
    },
  },
  {
    value: "slate",
    light: {
      "--background": "210 40% 98%",
      "--app-bg": "210 40% 98%",
      "--app-surface": "0 0% 100%",
      "--app-surface-subtle": "18 100% 94%",
      "--app-border": "214.3 31.8% 87%",
      "--foreground": "222 47% 11%",
      "--card": "0 0% 100%",
      "--card-foreground": "222 47% 11%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "222 47% 11%",
      "--primary": "215 25% 27%",
      "--primary-foreground": "210 40% 98%",
      "--secondary": "18 100% 94%",
      "--secondary-foreground": "222 47% 11%",
      "--muted": "210 40% 94%",
      "--muted-foreground": "215 18% 38%",
      "--accent": "20 96% 90%",
      "--accent-foreground": "15 80% 30%",
      "--border": "214.3 31.8% 87%",
      "--input": "214.3 31.8% 87%",
      "--learning-accent": "215 25% 27%",
      "--ring": "215 25% 27%",
    },
    dark: {
      "--background": "222 27% 8%",
      "--app-bg": "222 27% 8%",
      "--app-surface": "222 23% 12%",
      "--app-surface-subtle": "217 23% 17%",
      "--app-border": "215 18% 25%",
      "--foreground": "210 40% 96%",
      "--card": "222 23% 12%",
      "--card-foreground": "210 40% 96%",
      "--popover": "222 23% 12%",
      "--popover-foreground": "210 40% 96%",
      "--primary": "210 16% 76%",
      "--primary-foreground": "222 47% 8%",
      "--secondary": "17 34% 18%",
      "--secondary-foreground": "210 40% 96%",
      "--muted": "217 23% 17%",
      "--muted-foreground": "215 20% 68%",
      "--accent": "17 40% 20%",
      "--accent-foreground": "20 96% 86%",
      "--border": "215 18% 25%",
      "--input": "215 18% 25%",
      "--learning-accent": "210 16% 76%",
      "--ring": "210 16% 76%",
    },
  },
];

/* ─────────────────────────────────────────────
   CSS generation helpers
   ───────────────────────────────────────────── */

function paletteToDeclarations(palette: ThemePalette): string {
  return Object.entries(palette)
    .map(([cssVar, value]) => `  ${cssVar}: ${value};`)
    .join("\n");
}

/**
 * Returns the full CSS string for every named theme palette.
 * Use this once at server-render time to inject a static <style>
 * block — clients then only need to toggle `theme-X` and `.dark`
 * classes to switch palettes.
 */
export function buildNamedThemeStylesheet(): string {
  return NAMED_THEME_PALETTES.map((theme) => {
    const lightBlock = `.theme-${theme.value} {\n${paletteToDeclarations(
      theme.light
    )}\n}`;
    const darkBlock = `.dark.theme-${theme.value} {\n${paletteToDeclarations(
      theme.dark
    )}\n}`;
    return `${lightBlock}\n${darkBlock}`;
  }).join("\n\n");
}

/**
 * Build the CSS string for a *custom* palette.
 *
 * The light block uses `html:not(.dark)[data-color-theme="custom"]`
 * so it ONLY matches when dark mode is OFF — without this guard the
 * light values would override `.dark { ... }` from globals.css
 * because the attribute selector has higher specificity than `.dark`
 * and the light-mode toggle would appear broken.
 *
 * The dark block uses `html.dark[data-color-theme="custom"]` and
 * only pins the brand accent (primary / ring / primary-foreground)
 * so the rest of the palette (background, card, foreground…) falls
 * back to the standard `.dark { … }` block. That keeps the
 * light/dark toggle working while still persisting the user's brand
 * colour in both modes.
 */
export function buildCustomThemeStylesheet(
  lightPalette: ThemePalette,
  darkPalette: ThemePalette
): string {
  const lightBlock = `html:not(.dark)[data-color-theme="custom"] {\n${paletteToDeclarations(
    lightPalette
  )}\n}`;
  const darkBlock = `html.dark[data-color-theme="custom"] {\n${paletteToDeclarations(
    darkPalette
  )}\n}`;
  return `${lightBlock}\n${darkBlock}`;
}
