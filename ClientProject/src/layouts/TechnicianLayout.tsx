import { Link, Outlet, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export function TechnicianLayout() {
  const navigate = useNavigate();

  async function handleLogout() {
    await api.post("/logout");
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex space-x-4 font-medium text-gray-700">
            <Link to="/technician/today" className="hover:text-blue-600">Hoje</Link>
            <Link to="/technician/ratings" className="hover:text-blue-600">As minhas avaliações</Link>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600">
            Sair
          </button>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto p-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}