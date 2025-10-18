"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Locale, locales } from "@/config";
import { setUserLocale } from "@/services/locale";
import { SelectGroup } from "@radix-ui/react-select";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function SwitchLanguage() {
  const t = useTranslations("SwitchLanguage");
  const locale = useLocale();
  const router = useRouter();

  const handleLanguageChange = async (value: string) => {
    await setUserLocale(value as Locale);
    router.refresh(); // Refresh to apply the new locale
  };

  return (
    <Select
      value={locale}
      onValueChange={handleLanguageChange}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={t("title")} />
      </SelectTrigger>
      <SelectContent>
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
                  className="w-6 h-4 object-cover"
                />
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
