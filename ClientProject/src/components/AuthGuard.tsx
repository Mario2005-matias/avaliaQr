import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { User } from "../types/index";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await api.get("/me");
        setUser(data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [location.pathname]); // Re-verifica se a rota mudar

  if (loading) return <div className="p-8 text-center">A carregar...</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}