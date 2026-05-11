import { getRequestConfig } from 'next-intl/server';
import { getUserLocale } from '@/services/locale';

type Messages = Record<string, unknown>;

function mergeMessages(base: Messages, override: Messages): Messages {
  const merged: Messages = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const baseValue = merged[key];

    if (
      value &&
      baseValue &&
      typeof value === 'object' &&
      typeof baseValue === 'object' &&
      !Array.isArray(value) &&
      !Array.isArray(baseValue)
    ) {
      merged[key] = mergeMessages(baseValue as Messages, value as Messages);
      continue;
    }

    merged[key] = value;
  }

  return merged;
}

export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  const locale = await getUserLocale();
  const defaultMessages = (await import(`../../messages/en.json`)).default;
  const localeMessages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages:
      locale === 'en'
        ? defaultMessages
        : mergeMessages(defaultMessages, localeMessages)
  };
});
