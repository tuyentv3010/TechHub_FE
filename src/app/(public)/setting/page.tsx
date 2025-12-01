"use client";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeColorToggle } from "@/components/theme-color-toggle";
import { SwitchLanguage } from "@/components/switch-language";
import { Globe, Palette, Sun } from "lucide-react";

export default function SettingPage() {
  const t = useTranslations("SettingsPage");
  
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="space-y-6">
        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t("language")}
            </CardTitle>
            <CardDescription>{t("languageDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("displayLanguage")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("displayLanguageDescription")}
                </p>
              </div>
              <SwitchLanguage />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              {t("appearance")}
            </CardTitle>
            <CardDescription>{t("appearanceDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("themeMode")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("themeModeDescription")}
                </p>
              </div>
              <ThemeToggle />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("colorTheme")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("colorThemeDescription")}
                </p>
              </div>
              <ThemeColorToggle />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}