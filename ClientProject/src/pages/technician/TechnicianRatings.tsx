import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import type { TechnicianRatingsResponse } from "../../types/index";

export default function TechnicianRatings() {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<TechnicianRatingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRatings() {
      try {
        const response = await api.get<TechnicianRatingsResponse>("/technician/ratings");
        setData(response.data);
      } catch {
        setError(t("technicianRatings.error"));
      } finally {
        setLoading(false);
      }
    }

    loadRatings();
  }, [t]);

  if (loading) {
    return <div className="flex items-center justify-center gap-3 py-16 text-gray-500 dark:text-slate-400"><span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" aria-hidden="true" />{t("technicianRatings.loading")}</div>;
  }

  if (error) {
    return (
      <div role="alert" className="rounded-2xl bg-rose-100 p-4 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">{t("technicianRatings.title")}</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{t("technicianRatings.average")}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-slate-50">
            <span className="text-amber-500">★</span> {data.average_rating.toFixed(1)}
          </p>
        </motion.div>
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : 0.08 }} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{t("technicianRatings.total")}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-slate-50">{data.total}</p>
        </motion.div>
      </div>

      {data.ratings.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          {t("technicianRatings.empty")}
        </div>
      ) : (
        <div className="space-y-4">
          {data.ratings.map((rating, index) => (
            <motion.article
              key={`${rating.created_at}-${index}`}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : Math.min(index * 0.06, 0.3) }}
              whileHover={reduceMotion ? undefined : { y: -2 }}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-slate-50">{rating.school_name}</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {new Date(rating.created_at).toLocaleString(i18n.resolvedLanguage === "en" ? "en" : "pt-AO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Africa/Luanda",
                    })}
                  </p>
                </div>
                <p className="font-semibold text-amber-600" aria-label={t("common.stars", { count: rating.stars })}>
                  {"★".repeat(rating.stars)}
                  <span className="sr-only"> {t("common.stars", { count: rating.stars })}</span>
                </p>
              </div>
              {rating.comment && (
                <p className="mt-4 whitespace-pre-wrap text-gray-700 dark:text-slate-300">{rating.comment}</p>
              )}
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
