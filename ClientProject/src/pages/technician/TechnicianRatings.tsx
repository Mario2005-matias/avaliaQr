import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { TechnicianRatingsResponse } from "../../types/index";

export default function TechnicianRatings() {
  const [data, setData] = useState<TechnicianRatingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRatings() {
      try {
        const response = await api.get<TechnicianRatingsResponse>("/technician/ratings");
        setData(response.data);
      } catch {
        setError("Não foi possível carregar as avaliações. Tenta novamente.");
      } finally {
        setLoading(false);
      }
    }

    loadRatings();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-600">A carregar avaliações...</p>;
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">As minhas avaliações</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Média</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            ★ {data.average_rating.toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total de avaliações</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{data.total}</p>
        </div>
      </div>

      {data.ratings.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow-sm">
          Ainda não tens avaliações.
        </div>
      ) : (
        <div className="space-y-4">
          {data.ratings.map((rating, index) => (
            <article
              key={`${rating.created_at}-${index}`}
              className="rounded-lg bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{rating.school_name}</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(rating.created_at).toLocaleString("pt-AO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Africa/Luanda",
                    })}
                  </p>
                </div>
                <p className="font-semibold text-amber-600" aria-label={`${rating.stars} estrelas`}>
                  {"★".repeat(rating.stars)}
                  <span className="sr-only"> {rating.stars} de 5 estrelas</span>
                </p>
              </div>
              {rating.comment && (
                <p className="mt-4 whitespace-pre-wrap text-gray-700">{rating.comment}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
