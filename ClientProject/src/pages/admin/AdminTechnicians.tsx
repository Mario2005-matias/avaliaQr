import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../lib/api";
import type { AdminTechnician } from "../../types/index";

export default function AdminTechnicians() {
  const [technicians, setTechnicians] = useState<AdminTechnician[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTechnicians() {
    setLoading(true);
    try {
      const { data } = await api.get<AdminTechnician[]>("/admin/technicians");
      setTechnicians(data);
    } catch {
      setError("Não foi possível carregar os técnicos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get<AdminTechnician[]>("/admin/technicians")
      .then(({ data }) => setTechnicians(data))
      .catch(() => setError("Não foi possível carregar os técnicos."))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setError(null);
    try {
      await api.post("/admin/technicians", new FormData(form));
      setModalOpen(false);
      form.reset();
      await loadTechnicians();
    } catch {
      setError("Não foi possível criar o técnico. Verifica os dados, incluindo a fotografia.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Técnicos</h1>
        <button onClick={() => setModalOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          Adicionar técnico
        </button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        {loading ? <p className="p-6 text-center text-gray-600">A carregar técnicos...</p> : technicians.length ? (
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3">Técnico</th><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Estado</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {technicians.map((technician) => (
                <tr key={technician.id}>
                  <td className="flex items-center gap-3 px-4 py-3">
                    {technician.photo_url && <img src={technician.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />}
                    <span>{technician.name}</span>
                  </td>
                  <td className="px-4 py-3">{technician.email}</td>
                  <td className="px-4 py-3">{technician.active ? "Activo" : "Inactivo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="p-8 text-center text-gray-500">Ainda não existem técnicos.</p>}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="technician-title" className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 id="technician-title" className="text-xl font-bold">Adicionar técnico</h2>
            <form onSubmit={handleCreate} encType="multipart/form-data" className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-gray-700">Nome<input name="name" required maxLength={255} className="mt-1 w-full rounded border border-gray-300 p-2" /></label>
              <label className="block text-sm font-medium text-gray-700">E-mail<input name="email" type="email" required className="mt-1 w-full rounded border border-gray-300 p-2" /></label>
              <label className="block text-sm font-medium text-gray-700">Palavra-passe inicial<input name="password" type="password" minLength={8} required className="mt-1 w-full rounded border border-gray-300 p-2" /></label>
              <label className="block text-sm font-medium text-gray-700">Fotografia<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-1 w-full rounded border border-gray-300 p-2" /></label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50">{saving ? "A guardar..." : "Criar técnico"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
