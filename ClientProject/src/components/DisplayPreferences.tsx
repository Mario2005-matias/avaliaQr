import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";

export function DisplayPreferences() {
  return (
    <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-2xl border border-white/70 bg-white/70 p-1 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/70">
      <ThemeToggle />
      <LanguageToggle />
    </div>
  );
}
