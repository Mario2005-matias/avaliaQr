import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { LanguageToggle } from "../components/LanguageToggle";
import { ThemeToggle } from "../components/ThemeToggle";

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setError(null);
    try {
      await api.post("/logout");
      navigate("/login");
    } catch {
      setError(t("adminLayout.logoutError"));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-300 dark:bg-slate-900">
      <nav className="border-b border-gray-100 bg-white/70 shadow-sm backdrop-blur-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2 font-medium text-gray-600">
            {[
              { to: "/admin/technicians", label: t("navigation.technicians") },
              { to: "/admin/schools", label: t("navigation.schools") },
              { to: "/admin/ratings", label: t("navigation.ratings") },
              { to: "/admin/reports", label: t("navigation.reports") },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`rounded-xl px-3 py-2 transition-colors ${
                  location.pathname === to
                    ? "bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                    : "hover:bg-gray-50 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-1 self-start sm:self-auto">
            <ThemeToggle />
            <LanguageToggle />
            <button onClick={handleLogout} className="self-start rounded-xl px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 sm:self-auto">
              {t("navigation.logout")}
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl space-y-4 p-4 py-8 text-gray-900 dark:text-slate-50">
        {error && <p role="alert" className="rounded-2xl bg-rose-100 p-3 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">{error}</p>}
        <Outlet />
      </main>
    </div>
  );
}
