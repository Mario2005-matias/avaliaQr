import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../lib/api";

export function AdminLayout() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setError(null);
    try {
      await api.post("/logout");
      navigate("/login");
    } catch {
      setError("Não foi possível terminar a sessão. Tenta novamente.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-medium text-gray-700">
            <Link to="/admin/technicians" className="hover:text-blue-600">Técnicos</Link>
            <Link to="/admin/schools" className="hover:text-blue-600">Colégios</Link>
            <Link to="/admin/ratings" className="hover:text-blue-600">Avaliações</Link>
            <Link to="/admin/reports" className="hover:text-blue-600">Relatórios</Link>
          </div>
          <button onClick={handleLogout} className="self-start text-sm text-gray-500 hover:text-red-600 sm:self-auto">
            Sair
          </button>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl space-y-4 p-4 py-8">
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
        <Outlet />
      </main>
    </div>
  );
}
