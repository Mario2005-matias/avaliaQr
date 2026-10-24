import { useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { api, ensureCsrf } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await ensureCsrf();
      const { data } = await api.post("/login", { email, password });
      if (data.user.role === "admin") {
        navigate("/admin/ratings");
      } else {
        navigate("/technician/today");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError<{ errors?: { email?: string[] } }>(error) && error.response?.status === 422) {
        setError(
          error.response.data.errors?.email?.[0] || "Credenciais inválidas.",
        );
      } else {
        setError("Erro de ligação ao servidor. Tenta novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-8 rounded shadow-md space-y-6"
      >
        <h1 className="text-2xl font-bold text-center text-gray-800 ">Entrar</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            E-mail
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Palavra-passe
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "A entrar..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
