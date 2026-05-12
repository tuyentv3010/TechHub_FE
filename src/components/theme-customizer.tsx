"use client";

import * as React from "react";
import { Check, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  applyColorTheme,
  COLOR_THEME_EVENT,
  COLOR_THEME_STORAGE_KEY,
  COLOR_THEMES,
  CUSTOM_COLOR_THEME_FIELDS,
  CUSTOM_COLOR_THEME_STORAGE_KEY,
  DEFAULT_CUSTOM_COLOR_THEME,
  getStoredColorTheme,
  getStoredCustomColorTheme,
  persistColorTheme,
  persistCustomColorTheme,
  resetCustomColorTheme,
  type ColorThemeValue,
  type CustomColorTheme,
  type CustomColorThemeKey,
} from "@/lib/color-theme";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function ThemeCustomizer() {
  const t = useTranslations("SettingsPage");
  const [mounted, setMounted] = React.useState(false);
  const [activeTheme, setActiveTheme] =
    React.useState<ColorThemeValue>("default");
  const [customTheme, setCustomTheme] = React.useState<CustomColorTheme>({
    ...DEFAULT_CUSTOM_COLOR_THEME,
  });

  React.useEffect(() => {
    const syncThemeState = () => {
      setActiveTheme(applyColorTheme(getStoredColorTheme()));
      setCustomTheme(getStoredCustomColorTheme());
    };

    setMounted(true);
    syncThemeState();

    const handleColorThemeChange = (event: Event) => {
      const theme = (event as CustomEvent<{ theme?: string }>).detail?.theme;
      setActiveTheme(applyColorTheme(theme ?? getStoredColorTheme()));
      setCustomTheme(getStoredCustomColorTheme());
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === COLOR_THEME_STORAGE_KEY ||
        event.key === CUSTOM_COLOR_THEME_STORAGE_KEY
      ) {
        syncThemeState();
      }
    };

    window.addEventListener(COLOR_THEME_EVENT, handleColorThemeChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(COLOR_THEME_EVENT, handleColorThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleConceptChange = (theme: ColorThemeValue) => {
    if (theme === "custom") {
      setCustomTheme(persistCustomColorTheme(customTheme));
      setActiveTheme("custom");
      return;
    }

    setActiveTheme(persistColorTheme(theme));
  };

  const handleCustomColorChange = (
    key: CustomColorThemeKey,
    value: string
  ) => {
    const nextTheme = {
      ...customTheme,
      [key]: value,
    };

    const normalizedTheme = persistCustomColorTheme(nextTheme);
    setCustomTheme(normalizedTheme);
    setActiveTheme("custom");
  };

  const handleResetCustomTheme = () => {
    setCustomTheme({ ...DEFAULT_CUSTOM_COLOR_THEME });
    setActiveTheme(resetCustomColorTheme());
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">{t("ThemeStudio.conceptTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("ThemeStudio.conceptDescription")}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLOR_THEMES.map((themeOption) => {
            const selected = activeTheme === themeOption.value;

            return (
              <button
                key={themeOption.value}
                type="button"
                disabled={!mounted}
                onClick={() => handleConceptChange(themeOption.value)}
                className={cn(
                  "min-h-24 rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
                  selected && "border-primary bg-accent/50"
                )}
              >
                <span className="mb-3 flex items-center justify-between gap-2">
                  <span className="flex -space-x-1">
                    {themeOption.swatches.map((swatch) => (
                      <span
                        key={swatch}
                        className="h-6 w-6 rounded-full border border-background shadow-sm"
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </span>
                  {selected && <Check className="h-4 w-4 text-primary" />}
                </span>
                <span className="block text-sm font-medium text-foreground">
                  {t(`ThemeStudio.concepts.${themeOption.value}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">{t("ThemeStudio.customTitle")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("ThemeStudio.customDescription")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetCustomTheme}
            disabled={!mounted}
            className="w-fit"
          >
            <RotateCcw className="h-4 w-4" />
            {t("ThemeStudio.reset")}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CUSTOM_COLOR_THEME_FIELDS.map((field) => (
            <label
              key={field.key}
              className="flex min-h-20 items-center gap-3 rounded-lg border bg-background p-3"
            >
              <input
                type="color"
                value={customTheme[field.key]}
                aria-label={t(`ThemeStudio.fields.${field.key}`)}
                disabled={!mounted}
                onChange={(event) =>
                  handleCustomColorChange(field.key, event.target.value)
                }
                className="h-10 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1 disabled:cursor-not-allowed"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {t(`ThemeStudio.fields.${field.key}`)}
                </span>
                <span className="block font-mono text-xs uppercase text-muted-foreground">
                  {customTheme[field.key]}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">
              {t("ThemeStudio.previewTitle")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("ThemeStudio.previewDescription")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm">
              {t("ThemeStudio.previewPrimary")}
            </Button>
            <Button type="button" variant="secondary" size="sm">
              {t("ThemeStudio.previewSecondary")}
            </Button>
            <Button type="button" variant="outline" size="sm">
              {t("ThemeStudio.previewOutline")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
