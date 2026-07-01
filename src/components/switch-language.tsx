"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Locale, locales } from "@/config";
import { setUserLocale } from "@/services/locale";
import { SelectGroup } from "@radix-ui/react-select";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type SwitchLanguageProps = {
  className?: string;
  compactOnMobile?: boolean;
};

export function SwitchLanguage({
  className,
  compactOnMobile = false,
}: SwitchLanguageProps) {
  const t = useTranslations("SwitchLanguage");
  const locale = useLocale();
  const router = useRouter();
  const selectedLocale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : locales[0];

  const handleLanguageChange = async (value: string) => {
    await setUserLocale(value as Locale);
    router.refresh(); // Refresh to apply the new locale
  };

  return (
    <Select
      value={locale}
      onValueChange={handleLanguageChange}
    >
      <SelectTrigger
        aria-label={t("title")}
        className={cn(
          "app-control app-control-select",
          compactOnMobile && "app-control-select-compact-mobile",
          className
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "truncate",
              compactOnMobile && "hidden sm:inline"
            )}
          >
            {t(selectedLocale)}
          </span>
          <Image
            src={`/flags/flags-${selectedLocale}.png`}
            width={30}
            height={20}
            quality={100}
            alt={`${selectedLocale} Flag`}
            className="h-4 w-6 rounded-sm object-cover"
          />
        </div>
      </SelectTrigger>
      <SelectContent className="app-control-menu">
        <SelectGroup>
          {locales.map((locale) => (
            <SelectItem value={locale} key={locale}>
              <div className="flex items-center gap-2">
                {t(locale)}
                <Image
                  src={`/flags/flags-${locale}.png`}
                  width={30}
                  height={20}
                  quality={100}
                  alt={`${locale} Flag`}
                  className="h-4 w-6 rounded-sm object-cover"
                />
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
