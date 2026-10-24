import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../lib/api";
import type {
  AdminRating,
  AdminSchool,
  AdminTechnician,
  PaginatedResponse,
} from "../../types/index";

export default function AdminRatings() {
  const [ratings, setRatings] = useState<PaginatedResponse<AdminRating> | null>(null);
  const [technicians, setTechnicians] = useState<AdminTechnician[]>([]);
  const [schools, setSchools] = useState<AdminSchool[]>([]);
  const [technicianId, setTechnicianId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [month, setMonth] = useState("");
  const [reason, setReason] = useState("");
  const [selectedRatingId, setSelectedRatingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRatings(page = 1) {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<PaginatedResponse<AdminRating>>("/admin/ratings", {
        params: {
          page,
          ...(technicianId ? { technician_id: technicianId } : {}),
          ...(schoolId ? { school_id: schoolId } : {}),
          ...(month ? { month } : {}),
        },
      });
      setRatings(data);
    } catch {
      setError("Não foi possível carregar as avaliações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [technicianResponse, schoolResponse, ratingsResponse] = await Promise.all([
          api.get<AdminTechnician[]>("/admin/technicians"),
          api.get<AdminSchool[]>("/admin/schools"),
          api.get<PaginatedResponse<AdminRating>>("/admin/ratings"),
        ]);
        setTechnicians(technicianResponse.data);
        setSchools(schoolResponse.data);
        setRatings(ratingsResponse.data);
      } catch {
        setError("Não foi possível carregar as avaliações e os filtros.");
      } finally {
        setLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  async function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadRatings(1);
  }

  async function handleInvalidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedRatingId === null) return;

    setSaving(true);
    setError(null);
    try {
      await api.patch(`/admin/ratings/${selectedRatingId}/invalidate`, { reason });
      setSelectedRatingId(null);
      setReason("");
      await loadRatings(ratings?.current_page ?? 1);
    } catch {
      setError("Não foi possível invalidar a avaliação. Confirma o motivo e tenta novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevalidate(ratingId: number) {
    setError(null);
    try {
      await api.patch(`/admin/ratings/${ratingId}/revalidate`);
      await loadRatings(ratings?.current_page ?? 1);
    } catch {
      setError("Não foi possível revalidar a avaliação.");
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Avaliações</h1>

      <form onSubmit={handleFilter} className="grid gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-medium text-gray-700">
          Técnico
          <select value={technicianId} onChange={(event) => setTechnicianId(event.target.value)} className="mt-1 w-full rounded border border-gray-300 p-2">
            <option value="">Todos os técnicos</option>
            {technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Colégio
          <select value={schoolId} onChange={(event) => setSchoolId(event.target.value)} className="mt-1 w-full rounded border border-gray-300 p-2">
            <option value="">Todos os colégios</option>
            {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Mês
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="mt-1 w-full rounded border border-gray-300 p-2" />
        </label>
        <button type="submit" className="self-end rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          Aplicar filtros
        </button>
      </form>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-center text-gray-600">A carregar avaliações...</p>
        ) : ratings?.data.length ? (
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Técnico</th>
                <th className="px-4 py-3">Colégio</th>
                <th className="px-4 py-3">Estrelas</th>
                <th className="px-4 py-3">Comentário</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ratings.data.map((rating) => (
                <tr key={rating.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3">{new Date(rating.created_at).toLocaleString("pt-AO", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Luanda" })}</td>
                  <td className="px-4 py-3">{rating.technician.name}</td>
                  <td className="px-4 py-3">{rating.school_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-amber-600">{"★".repeat(rating.stars)}</td>
                  <td className="max-w-xs whitespace-pre-wrap px-4 py-3">{rating.comment || "—"}</td>
                  <td className="px-4 py-3">
                    {rating.invalidated_at ? (
                      <span className="text-red-700">Inválida: {rating.invalidation_reason}</span>
                    ) : <span className="text-green-700">Válida</span>}
                  </td>
                  <td className="px-4 py-3">
                    {rating.invalidated_at ? (
                      <button onClick={() => void handleRevalidate(rating.id)} className="font-medium text-blue-700 hover:underline">
                        Revalidar
                      </button>
                    ) : (
                      <button onClick={() => setSelectedRatingId(rating.id)} className="font-medium text-red-700 hover:underline">
                        Invalidar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-8 text-center text-gray-500">Não foram encontradas avaliações.</p>
        )}
      </div>

      {ratings && ratings.last_page > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">Página {ratings.current_page} de {ratings.last_page} · {ratings.total} avaliações</p>
          <div className="flex gap-2">
            <button disabled={ratings.current_page <= 1} onClick={() => void loadRatings(ratings.current_page - 1)} className="rounded border bg-white px-3 py-2 disabled:opacity-50">
              Anterior
            </button>
            <button disabled={ratings.current_page >= ratings.last_page} onClick={() => void loadRatings(ratings.current_page + 1)} className="rounded border bg-white px-3 py-2 disabled:opacity-50">
              Seguinte
            </button>
          </div>
        </div>
      )}

      {selectedRatingId !== null && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="invalidate-title" className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 id="invalidate-title" className="text-xl font-bold text-gray-900">Invalidar avaliação</h2>
            <form onSubmit={handleInvalidate} className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Motivo
                <textarea required maxLength={255} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 min-h-24 w-full rounded border border-gray-300 p-2" />
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setSelectedRatingId(null); setReason(""); }} className="rounded px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" disabled={saving} className="rounded bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-50">
                  {saving ? "A guardar..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
