import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { getDeviceId } from "../utils/device";
import { StarsInput } from "../components/StarsInput";
import axios from "axios";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { DisplayPreferences } from "../components/DisplayPreferences";

export default function Evaluate() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Dados do técnico
  const [technician, setTechnician] = useState<{ name: string; photo_url: string | null } | null>(null);
  const [school, setSchool] = useState<{ name: string } | null>(null);

  // Estado do formulário
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Valida o token ao abrir a página
  useEffect(() => {
    async function fetchSession() {
      try {
        const { data } = await api.get(`/public/service-sessions/${token}`);
        
        if (data.is_full) {
          setError(t("evaluate.full"));
          return;
        }

        setTechnician(data.technician);
        setSchool(data.school);
      } catch (error: unknown) {
        const code = axios.isAxiosError<{ error?: string }>(error)
          ? error.response?.data?.error
          : undefined;
        if (code === "SESSAO_EXPIRADA") setError(t("evaluate.expired"));
        else if (code === "SESSAO_REVOGADA") setError(t("evaluate.revoked"));
        else setError(t("evaluate.invalidToken"));
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [token, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stars === 0) {
      setError(t("evaluate.chooseStars"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post(`/public/service-sessions/${token}/ratings`, {
        stars,
        comment: comment.trim() === "" ? null : comment,
        device_id: getDeviceId(),
      });
      setSuccess(true);
    } catch (error: unknown) {
      const code = axios.isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error
        : undefined;
      if (code === "JA_AVALIASTE") setError(t("evaluate.alreadyRated"));
      else if (code === "LIMITE_ATINGIDO") setError(t("evaluate.full"));
      else if (code === "RATE_LIMIT") setError(t("evaluate.rateLimit"));
      else setError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white text-gray-600 dark:from-slate-950 dark:to-slate-900 dark:text-slate-400">
        <DisplayPreferences />
        <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" aria-hidden="true" />
        {t("evaluate.loading")}
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-6 text-center dark:from-slate-950 dark:to-slate-900">
        <DisplayPreferences />
        <motion.div initial={reduceMotion ? false : { scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 220, damping: 16 }} className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">✓</motion.div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">{t("evaluate.successTitle")}</h1>
        <p className="text-gray-600 dark:text-slate-400">{t("evaluate.successSubtitle")}</p>
      </div>
    );
  }

  // Se houver erro e não houver técnico carregado (erro fatal de validação do QR)
  if (error && !technician) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-6 text-center dark:from-slate-950 dark:to-slate-900">
        <DisplayPreferences />
        <div className="text-6xl text-red-500 mb-4">⚠</div>
        <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-slate-50">{t("evaluate.fatalTitle")}</h1>
        <p className="text-gray-600 dark:text-slate-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-gradient-to-br from-indigo-50 to-white px-5 py-16 transition-colors duration-300 sm:px-6 sm:py-12 dark:from-slate-950 dark:to-slate-900">
      <DisplayPreferences />
      {/* Cabeçalho do Técnico */}
      <motion.div initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-8 flex w-full max-w-md flex-col items-center rounded-3xl border border-white/80 bg-white/80 p-6 text-center shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80">
        {technician?.photo_url ? (
          <img
            src={technician.photo_url}
            alt={technician.name}
            className="mb-4 h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
          />
        ) : (
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-3xl font-bold text-indigo-600">
            {technician?.name.charAt(0)}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{technician?.name}</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            {t("evaluate.active")}
          </span>
        </div>
        <p className="mt-1 text-gray-600 dark:text-slate-400">{school?.name}</p>
      </motion.div>

      {/* Formulário */}
      <motion.form initial={reduceMotion ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.1 }} onSubmit={handleSubmit} className="w-full max-w-md space-y-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-center text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-50">{t("evaluate.question")}</h2>
        
        <StarsInput value={stars} onChange={setStars} disabled={isSubmitting} />

        <div>
          <textarea
            placeholder={t("evaluate.commentPlaceholder")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            disabled={isSubmitting}
            className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
            rows={4}
          />
          <div className="mt-1 text-right text-xs text-gray-400">{t("evaluate.characterCount", { count: comment.length })}</div>
        </div>

        {error && <div role="alert" className="rounded-xl bg-rose-100 p-3 text-center text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">{error}</div>}

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          {isSubmitting ? t("evaluate.submitting") : t("evaluate.submit")}
        </motion.button>
      </motion.form>
      
      <p className="mt-6 text-center text-xs text-gray-400 dark:text-slate-500">
        {t("evaluate.anonymous")}
      </p>
    </div>
  );
}