// Sets up translations. Every visible text is looked up by a key in src/locales/<language>.json.
// The language is chosen from what the user picked before (kept in the browser), otherwise from
// the browser's own language setting, otherwise English.
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ru from "./locales/ru.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ru: { translation: ru } },
    supportedLngs: ["en", "ru"],
    // A browser set to "ru-RU" or "en-GB" still gets "ru" or "en".
    nonExplicitSupportedLngs: true,
    // A key missing in one language falls back to English instead of showing a blank.
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
  });

// Tells browsers and screen readers which language the page is in.
function syncHtmlLang(language: string) {
  document.documentElement.lang = language;
}
syncHtmlLang(i18n.resolvedLanguage ?? "en");
i18n.on("languageChanged", syncHtmlLang);

export default i18n;
