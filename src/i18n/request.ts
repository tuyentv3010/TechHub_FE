import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
const locales = ['en', 'vi', 'ja'] as const;
type Locale = typeof locales[number];

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that the incoming locale is valid
  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'vi'; // fallback to default locale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});