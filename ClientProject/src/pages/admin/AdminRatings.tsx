import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslation } from "react-i18next";
import { MonthSelector } from "../../components/MonthSelector";
import { api } from "../../lib/api";
import type {
  AdminRating,
  AdminSchool,
  AdminTechnician,
  PaginatedResponse,
} from "../../types/index";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function AdminRatings() {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const tableRef = useRef<HTMLDivElement>(null);
  const [ratings, setRatings] = useState<PaginatedResponse<AdminRating> | null>(null);
  const [technicians, setTechnicians] = useState<AdminTechnician[]>([]);
  const [schools, setSchools] = useState<AdminSchool[]>([]);
  const [technicianId, setTechnicianId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [month, setMonth] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [reason, setReason] = useState("");
  const [selectedRatingId, setSelectedRatingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revalidatingId, setRevalidatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useGSAP(() => {
    if (reduceMotion || loading || !ratings?.data.length || !tableRef.current) return;
    const rows = gsap.utils.toArray<HTMLElement>(".rating-row", tableRef.current);
    gsap.fromTo(rows, { opacity: 0, y: 14 }, {
      opacity: 1,
      y: 0,
      duration: 0.35,
      stagger: 0.045,
      ease: "power2.out",
      scrollTrigger: {
        trigger: tableRef.current,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    });
  }, { scope: tableRef, dependencies: [ratings, loading, reduceMotion] });

  async function loadRatings(page = 1, searchTerm = appliedSearch) {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<PaginatedResponse<AdminRating>>("/admin/ratings", {
        params: {
          page,
          ...(technicianId ? { technician_id: technicianId } : {}),
          ...(schoolId ? { school_id: schoolId } : {}),
          ...(month ? { month } : {}),
          ...(searchTerm ? { search: searchTerm } : {}),
        },
      });
      setRatings(data);
    } catch {
      setError(t("adminRatings.error"));
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
        setError(t("adminRatings.error"));
      } finally {
        setLoading(false);
      }
    }

    void loadInitialData();
  }, [t]);

  async function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const searchTerm = search.trim();
    setAppliedSearch(searchTerm);
    await loadRatings(1, searchTerm);
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
      setError(t("adminRatings.invalidateError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleRevalidate(ratingId: number) {
    setError(null);
    setRevalidatingId(ratingId);
    try {
      await api.patch(`/admin/ratings/${ratingId}/revalidate`);
      await loadRatings(ratings?.current_page ?? 1);
    } catch {
      setError(t("adminRatings.revalidateError"));
    } finally {
      setRevalidatingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">{t("adminRatings.title")}</h1>

      <MonthSelector onChange={setMonth} />
      <form onSubmit={handleFilter} className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-700 dark:bg-slate-800">
        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
          {t("adminRatings.technician")}
          <select value={technicianId} onChange={(event) => setTechnicianId(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50">
            <option value="">{t("adminRatings.allTechnicians")}</option>
            {technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
          {t("adminRatings.school")}
          <select value={schoolId} onChange={(event) => setSchoolId(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50">
            <option value="">{t("adminRatings.allSchools")}</option>
            {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
          </select>
        </label>
        <motion.button type="submit" whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="self-end rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400">
          {t("adminRatings.apply")}
        </motion.button>
      </form>

      <form onSubmit={handleFilter} className="flex flex-col gap-3 sm:flex-row">
        <label className="min-w-0 flex-1 text-sm font-medium text-gray-700 dark:text-slate-300">
          {t("adminRatings.searchLabel")}
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("adminRatings.searchPlaceholder")} className="mt-1 w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50" />
        </label>
        <motion.button type="submit" whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="self-end rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400">
          {t("adminRatings.search")}
        </motion.button>
      </form>

      {error && <p role="alert" className="rounded-2xl bg-rose-100 p-3 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">{error}</p>}

      <div ref={tableRef} className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-6 text-gray-500 dark:text-slate-400"><span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" aria-hidden="true" />{t("adminRatings.loading")}</div>
        ) : ratings?.data.length ? (
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-slate-700/70 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">{t("adminRatings.date")}</th>
                <th className="px-4 py-3">{t("adminRatings.technician")}</th>
                <th className="px-4 py-3">{t("adminRatings.school")}</th>
                <th className="px-4 py-3">{t("adminRatings.stars")}</th>
                <th className="px-4 py-3">{t("adminRatings.comment")}</th>
                <th className="px-4 py-3">{t("adminRatings.status")}</th>
                <th className="px-4 py-3">{t("adminRatings.action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 dark:divide-slate-700 dark:text-slate-300">
              {ratings.data.map((rating) => (
                <tr key={rating.id} className="rating-row align-top transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/40">
                  <td className="whitespace-nowrap px-4 py-3">{new Date(rating.created_at).toLocaleString(i18n.resolvedLanguage === "en" ? "en" : "pt-AO", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Luanda" })}</td>
                  <td className="px-4 py-3">{rating.technician.name}</td>
                  <td className="px-4 py-3">{rating.school_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-amber-500" aria-label={t("common.stars", { count: rating.stars })}>{"★".repeat(rating.stars)}<span className="sr-only"> {t("common.stars", { count: rating.stars })}</span></td>
                  <td className="max-w-xs whitespace-pre-wrap px-4 py-3">{rating.comment || "—"}</td>
                  <td className="px-4 py-3">
                    {rating.invalidated_at ? (
                      <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{t("adminRatings.invalid")}: {rating.invalidation_reason}</span>
                    ) : <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{t("adminRatings.valid")}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {rating.invalidated_at ? (
                      <button disabled={revalidatingId === rating.id} onClick={() => void handleRevalidate(rating.id)} className="flex items-center gap-2 rounded-xl px-3 py-2 font-medium text-indigo-700 transition-colors hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10">
                        {revalidatingId === rating.id && <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-700" aria-hidden="true" />}
                        {revalidatingId === rating.id ? t("adminRatings.revalidating") : t("adminRatings.revalidate")}
                      </button>
                    ) : (
                      <button onClick={() => setSelectedRatingId(rating.id)} className="rounded-lg px-3 py-2 font-medium text-rose-600 transition-colors hover:bg-rose-50">
                        {t("adminRatings.invalidate")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-8 text-center text-gray-500 dark:text-slate-400">{t("adminRatings.empty")}</p>
        )}
      </div>

      {ratings && ratings.last_page > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600 dark:text-slate-400">{t("adminRatings.page", { current: ratings.current_page, last: ratings.last_page, total: ratings.total, count: ratings.total })}</p>
          <div className="flex gap-2">
            <button disabled={ratings.current_page <= 1} onClick={() => void loadRatings(ratings.current_page - 1)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              {t("common.previous")}
            </button>
            <button disabled={ratings.current_page >= ratings.last_page} onClick={() => void loadRatings(ratings.current_page + 1)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              {t("common.next")}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
      {selectedRatingId !== null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-20 flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm">
          <motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }} transition={{ duration: 0.2 }} role="dialog" aria-modal="true" aria-labelledby="invalidate-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:border dark:border-slate-700 dark:bg-slate-800">
            <h2 id="invalidate-title" className="text-xl font-bold text-gray-900 dark:text-slate-50">{t("adminRatings.invalidateTitle")}</h2>
            <form onSubmit={handleInvalidate} className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                {t("adminRatings.reason")}
                <textarea required maxLength={255} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50" />
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setSelectedRatingId(null); setReason(""); }} className="rounded-xl px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700">{t("common.cancel")}</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-rose-700 active:scale-95 disabled:opacity-50">
                  {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
                  {saving ? t("adminRatings.saving") : t("adminRatings.confirmInvalidation")}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </section>
  );
}
