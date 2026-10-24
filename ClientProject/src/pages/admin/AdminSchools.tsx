import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../lib/api";
import type { AdminSchool } from "../../types/index";

export default function AdminSchools() {
  const [schools, setSchools] = useState<AdminSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSchools() {
    setLoading(true);
    try {
      const { data } = await api.get<AdminSchool[]>("/admin/schools");
      setSchools(data);
    } catch {
      setError("Não foi possível carregar os colégios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get<AdminSchool[]>("/admin/schools")
      .then(({ data }) => setSchools(data))
      .catch(() => setError("Não foi possível carregar os colégios."))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setError(null);
    try {
      await api.post("/admin/schools", new FormData(form));
      setModalOpen(false);
      form.reset();
      await loadSchools();
    } catch {
      setError("Não foi possível criar o colégio. Confirma se o nome já está registado.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Colégios</h1>
        <button onClick={() => setModalOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          Adicionar colégio
        </button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        {loading ? <p className="p-6 text-center text-gray-600">A carregar colégios...</p> : schools.length ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3">Colégio</th><th className="px-4 py-3">Estado</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {schools.map((school) => <tr key={school.id}><td className="px-4 py-3">{school.name}</td><td className="px-4 py-3">{school.active ? "Activo" : "Inactivo"}</td></tr>)}
            </tbody>
          </table>
        ) : <p className="p-8 text-center text-gray-500">Ainda não existem colégios.</p>}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="school-title" className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 id="school-title" className="text-xl font-bold">Adicionar colégio</h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-gray-700">Nome<input name="name" required maxLength={255} className="mt-1 w-full rounded border border-gray-300 p-2" /></label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50">{saving ? "A guardar..." : "Criar colégio"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
