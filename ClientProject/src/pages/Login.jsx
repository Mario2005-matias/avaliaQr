import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ensureCsrf } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await ensureCsrf();
      const { data } = await api.post("/login", { email, password });
      navigate(data.user.role === "admin" ? "/admin/ratings" : "/hoje");
    } catch (err: any) {
      const msg =
        err.response?.data?.errors?.email?.[0] ??
        err.response?.data?.message ??
        "Sem ligação. Verifica a rede e tenta novamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto mt-24 p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Entrar</h1>

      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}

      <label className="block">
        <span className="text-sm">E-mail</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="text-sm">Palavra-passe</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
      >
        {loading ? "A entrar…" : "Entrar"}
      </button>
    </form>
  );
}