import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { LanguageToggle } from "../components/LanguageToggle";
import { ThemeToggle } from "../components/ThemeToggle";

export function TechnicianLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setError(null);
    try {
      await api.post("/logout");
      navigate("/login");
    } catch {
      setError(t("technicianLayout.logoutError"));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-300 dark:bg-slate-900">
      <nav className="border-b border-gray-100 bg-white/70 shadow-sm backdrop-blur-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/70">
        <div className="mx-auto flex min-h-16 max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap gap-2 font-medium text-gray-600">
            <Link to="/technician/today" className="rounded-xl px-3 py-2 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-300">{t("navigation.today")}</Link>
            <Link to="/technician/ratings" className="rounded-xl px-3 py-2 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-300">{t("navigation.myRatings")}</Link>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageToggle />
            <button onClick={handleLogout} className="rounded-xl px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300">
              {t("navigation.logout")}
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl p-4 py-8 text-gray-900 dark:text-slate-50">
        <Outlet />
      </main>
      {error && <p role="alert" className="fixed bottom-4 right-4 z-30 max-w-sm rounded-2xl bg-rose-100 p-4 text-rose-700 shadow-lg dark:bg-rose-950/80 dark:text-rose-200">{error}</p>}
    </div>
  );
}