import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const language = i18n.resolvedLanguage?.startsWith("en") ? "en" : "pt";
  const nextLanguage = language === "pt" ? "en" : "pt";

  return (
    <motion.button
      type="button"
      onClick={() => void i18n.changeLanguage(nextLanguage)}
      whileHover={reduceMotion ? undefined : { scale: 1.06 }}
      whileTap={reduceMotion ? undefined : { scale: 0.92 }}
      aria-label={language === "pt" ? t("preferences.switchToEnglish") : t("preferences.switchToPortuguese")}
      title={language === "pt" ? t("preferences.switchToEnglish") : t("preferences.switchToPortuguese")}
      className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
    >
      <motion.span key={language} initial={reduceMotion ? false : { y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.18 }}>
        {language.toUpperCase()}
      </motion.span>
    </motion.button>
  );
}
