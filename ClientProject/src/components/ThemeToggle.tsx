import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem("avaliaqr-theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("avaliaqr-theme", theme);
  }, [isDark, theme]);

  function toggleTheme() {
    setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark");
  }

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={reduceMotion ? undefined : { rotate: 12, scale: 1.08 }}
      whileTap={reduceMotion ? undefined : { scale: 0.9 }}
      aria-label={isDark ? t("preferences.lightTheme") : t("preferences.darkTheme")}
      title={isDark ? t("preferences.lightTheme") : t("preferences.darkTheme")}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
    >
      <motion.span key={theme} initial={reduceMotion ? false : { rotate: -35, scale: 0.7, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={{ duration: 0.22 }}>
        {isDark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
      </motion.span>
    </motion.button>
  );
}
