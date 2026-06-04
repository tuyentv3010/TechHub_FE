type TranslationValues = Record<string, string | number | Date>;
type Translator = {
  (key: string, values?: TranslationValues): string;
};

export function tFallback(
  t: Translator,
  namespace: string,
  key: string,
  fallback: string,
  values?: TranslationValues,
) {
  try {
    const value = t(key, values);
    return value === key || value === `${namespace}.${key}` ? fallback : value;
  } catch {
    return fallback;
  }
}
