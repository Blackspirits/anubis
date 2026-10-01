import { fetchWithBackoff } from "./backoff";
import { j } from "./xeact.mjs";

export type Translator = (key: string) => string;

// Load translations from JSON files.
//
// This runs before challenge and benchmark UI initialization, so it must never
// throw. If the requested locale cannot be loaded, fall back to English.
const loadTranslations = async (
  lang: string,
): Promise<Record<string, string>> => {
  const basePrefix = j("anubis_base_prefix");
  if (basePrefix === null) {
    return {};
  }

  try {
    const response = await fetchWithBackoff(
      `${basePrefix}/.within.website/x/cmd/anubis/static/locales/${lang}.json`,
    );
    return (await response.json()) as Record<string, string>;
  } catch (error) {
    console.warn(`Failed to load translations for ${lang}`, error);
    if (lang !== "en") {
      return await loadTranslations("en");
    }
    return {};
  }
};

export const loadTranslator = async (
  defaults: Record<string, string> = {},
): Promise<Translator> => {
  const lang = document.documentElement.lang || "en";
  const translations = await loadTranslations(lang);
  const fallback = lang === "en" ? translations : await loadTranslations("en");

  return (key: string): string =>
    translations[`js_${key}`] ||
    translations[key] ||
    fallback[`js_${key}`] ||
    fallback[key] ||
    defaults[`js_${key}`] ||
    defaults[key] ||
    `unknown translatable string: ${key}`;
};
