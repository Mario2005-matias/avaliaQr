import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import type { Session, School } from "../../types/index";

export default function Today() {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  
  // Estado do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isCurrent = true;
    Promise.all([
        api.get("/technician/sessions/today"),
        api.get("/technician/schools"),
      ])
      .then(([sessionsRes, schoolsRes]) => {
        if (isCurrent) {
          setSessions(sessionsRes.data);
          setSchools(schoolsRes.data);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          console.error("Failed to load technician dashboard data", error);
          setActionError(t("today.loadError"));
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [reloadKey, t]);

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    setCreatingSession(true);
    setActionError(null);
    try {
      const { data } = await api.post("/technician/sessions", { school_id: selectedSchool });
      
      setIsModalOpen(false);
      setToast(t("today.qrCreated"));
      window.setTimeout(() => {
        navigate(`/technician/session/${data.session_id}`, {
          state: { token: data.token, schoolName: data.school_name },
        });
      }, 700);
    } catch {
      setActionError(t("today.createError"));
    } finally {
      setCreatingSession(false);
    }
  }

  async function handleRevoke(id: number) {
    if (!confirm(t("today.confirmRevoke"))) return;
    setActionError(null);
    try {
      await api.delete(`/technician/sessions/${id}`);
      setReloadKey((key) => key + 1);
    } catch {
      setActionError(t("today.revokeError"));
    }
  }

  if (loading) return <div className="flex items-center justify-center gap-3 py-16 text-gray-500 dark:text-slate-400"><span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" aria-hidden="true" />{t("common.loading")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">{t("today.title")}</h1>
        <motion.button
          onClick={() => setIsModalOpen(true)}
          whileHover={reduceMotion ? undefined : { scale: 1.03 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-indigo-700 active:scale-95"
        >
          + {t("today.newSession")}
        </motion.button>
      </div>

      <AnimatePresence>
      {toast && (
        <motion.div initial={{ opacity: 0, y: -12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} role="status" className="fixed right-4 top-4 z-30 rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-white shadow-lg">
          {toast}
        </motion.div>
      )}
      </AnimatePresence>
      {actionError && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl bg-rose-100 p-3 text-rose-700 sm:flex-row sm:items-center sm:justify-between dark:bg-rose-950/50 dark:text-rose-200">
          <span>{actionError}</span>
          {!isModalOpen && (
            <button onClick={() => setReloadKey((key) => key + 1)} className="self-start rounded-lg px-3 py-1 font-semibold text-rose-700 transition-colors hover:bg-rose-200 sm:self-auto dark:text-rose-200 dark:hover:bg-rose-900">
              {t("common.retry")}
            </button>
          )}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          {t("today.empty")}
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence initial={false}>
          {sessions.map((s) => {
            const isExpired = s.is_expired;
            const isRevoked = s.revoked_at !== null;
            const isInactive = isExpired || isRevoked;

            return (
              <motion.div key={s.id} initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }} whileHover={reduceMotion ? undefined : { y: -2 }} className={`rounded-2xl border border-gray-100 border-l-4 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 ${isInactive ? 'border-l-gray-300 dark:border-l-slate-500' : 'border-l-emerald-500'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isInactive ? "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"}`} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 9h.01M15 9h.01M9 12h.01M15 12h.01" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold tracking-tight text-gray-900 dark:text-slate-50">{s.school_name}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {s.created_at} → {new Date(s.expires_at).toLocaleTimeString(i18n.resolvedLanguage === "en" ? "en" : "pt-AO", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Luanda" })} · {s.ratings_count} {t("today.ratings")}
                      {s.ratings_count > 0 && ` · ★ ${s.average_rating}`}
                    </p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${isInactive ? 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'}`}>
                    {isRevoked ? t("today.closed") : isExpired ? t("today.expired") : t("today.active")}
                  </span>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                  {!isInactive && (
                    <>
                      <motion.button
                        onClick={() => navigate(`/technician/session/${s.id}`)}
                        whileHover={reduceMotion ? undefined : { scale: 1.03 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                        className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-800 active:scale-95"
                      >
                        {t("today.showQr")}
                      </motion.button>
                      <button 
                        onClick={() => handleRevoke(s.id)}
                        className="rounded-xl px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                      >
                        {t("today.revoke")}
                      </button>
                    </>
                  )}
                  {isInactive && (
                    <button onClick={() => navigate("/technician/ratings")} className="rounded-xl px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-slate-700">
                      {t("today.viewRatings")}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal de Novo Atendimento */}
      <AnimatePresence>
      {isModalOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-20 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }} transition={{ duration: 0.2 }} role="dialog" aria-modal="true" aria-labelledby="new-session-title" className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl dark:border dark:border-slate-700 dark:bg-slate-800">
            <h2 id="new-session-title" className="mb-4 text-xl font-bold tracking-tight text-gray-900 dark:text-slate-50">{t("today.newTitle")}</h2>
            {actionError && <p role="alert" className="mb-4 rounded-xl bg-rose-100 p-3 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">{actionError}</p>}
            <form onSubmit={handleCreateSession}>
              <label htmlFor="school-select" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">{t("today.school")}</label>
              <select 
                id="school-select"
                required
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="mb-6 w-full rounded-xl border border-gray-200 bg-white p-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
              >
                <option value="">{t("today.selectSchool")}</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setIsModalOpen(false); setActionError(null); }} className="rounded-xl px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700">{t("common.cancel")}</button>
                <button type="submit" disabled={creatingSession} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-indigo-700 active:scale-95 disabled:opacity-60">
                  {creatingSession && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
                  {creatingSession ? t("today.generating") : t("today.generateQr")}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}