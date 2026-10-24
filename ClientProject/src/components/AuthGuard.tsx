import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import type { User } from "../types/index";
import { useTranslation } from "react-i18next";

export function AuthGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: User["role"];
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await api.get("/me");
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [location.pathname]); // Re-verifica se a rota mudar

  if (loading) return <div className="flex min-h-40 items-center justify-center gap-3 text-gray-500 dark:text-slate-400"><span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" aria-hidden="true" />{t("common.loading")}</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <Navigate
        to={user.role === "admin" ? "/admin/ratings" : "/technician/today"}
        replace
      />
    );
  }

  return <>{children}</>;
}