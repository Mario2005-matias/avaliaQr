import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import type { AdminTechnician } from "../../types/index";

export default function AdminTechnicians() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
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
      setError(t("adminTechnicians.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get<AdminTechnician[]>("/admin/technicians")
      .then(({ data }) => setTechnicians(data))
      .catch(() => setError(t("adminTechnicians.error")))
      .finally(() => setLoading(false));
  }, [t]);

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
      setError(t("adminTechnicians.createError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">{t("adminTechnicians.title")}</h1>
        <motion.button onClick={() => setModalOpen(true)} whileHover={reduceMotion ? undefined : { scale: 1.03 }} whileTap={reduceMotion ? undefined : { scale: 0.97 }} className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400">
          {t("adminTechnicians.add")}
        </motion.button>
      </div>

      {error && <p role="alert" className="rounded-2xl bg-rose-100 p-3 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
        {loading ? <div className="flex items-center justify-center gap-3 p-6 text-gray-500 dark:text-slate-400"><span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" aria-hidden="true" />{t("adminTechnicians.loading")}</div> : technicians.length ? (
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-slate-700/70 dark:text-slate-300"><tr><th className="px-4 py-3">{t("adminRatings.technician")}</th><th className="px-4 py-3">{t("adminTechnicians.email")}</th><th className="px-4 py-3">{t("adminTechnicians.status")}</th></tr></thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 dark:divide-slate-700 dark:text-slate-300">
              {technicians.map((technician) => (
                <tr key={technician.id}>
                  <td className="flex items-center gap-3 px-4 py-3">
                    {technician.photo_url && <img src={technician.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />}
                    <span>{technician.name}</span>
                  </td>
                  <td className="px-4 py-3">{technician.email}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${technician.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300"}`}>{technician.active ? t("adminTechnicians.active") : t("adminTechnicians.inactive")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="p-8 text-center text-gray-500 dark:text-slate-400">{t("adminTechnicians.empty")}</p>}
      </div>

      <AnimatePresence>
      {modalOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-20 flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm">
          <motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }} transition={{ duration: 0.2 }} role="dialog" aria-modal="true" aria-labelledby="technician-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:border dark:border-slate-700 dark:bg-slate-800">
            <h2 id="technician-title" className="text-xl font-bold tracking-tight text-gray-900 dark:text-slate-50">{t("adminTechnicians.add")}</h2>
            <form onSubmit={handleCreate} encType="multipart/form-data" className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t("adminTechnicians.name")}<input name="name" required maxLength={255} className="mt-1 w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50" /></label>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t("adminTechnicians.email")}<input name="email" type="email" required className="mt-1 w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50" /></label>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t("adminTechnicians.password")}<input name="password" type="password" minLength={8} required className="mt-1 w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50" /></label>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t("adminTechnicians.photo")}<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-1 w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50" /></label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700">{t("common.cancel")}</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-indigo-700 active:scale-95 disabled:opacity-50">
                  {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
                  {saving ? t("adminRatings.saving") : t("adminTechnicians.create")}
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
