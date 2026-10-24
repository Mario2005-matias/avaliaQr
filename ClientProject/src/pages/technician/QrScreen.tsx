import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import type { Session } from "../../types/index";

gsap.registerPlugin(useGSAP);

export default function QrScreen() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Tenta apanhar os dados via state (quando vem do botão "Criar"),
  // ou faz fetch se for uma entrada direta na página.
  const [token] = useState<string | null>(location.state?.token || null);
  const [schoolName] = useState<string>(location.state?.schoolName || t("today.newTitle"));
  const [ratingsCount, setRatingsCount] = useState(0);
  const [counterLoading, setCounterLoading] = useState(false);
  const [counterError, setCounterError] = useState<string | null>(null);
  const qrCardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (reduceMotion || !qrCardRef.current) return;
    gsap.to(qrCardRef.current, {
      boxShadow: "0 0 42px rgba(99, 102, 241, 0.24)",
      duration: 1.8,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  }, { dependencies: [reduceMotion] });

  async function refreshCounter() {
    if (!id) return;

    setCounterLoading(true);
    setCounterError(null);
    try {
      const { data } = await api.get<Session[]>("/technician/sessions/today");
      const session = data.find((item) => item.id === Number(id));
      if (!session) {
        setCounterError(t("qr.notFound"));
        return;
      }
      setRatingsCount(session.ratings_count);
    } catch {
      setCounterError(t("qr.refreshError"));
    } finally {
      setCounterLoading(false);
    }
  }

  useEffect(() => {
    // Se não tiver o token em memória (ex: fez refresh na página), 
    // precisas de um endpoint para recuperar o token.
    // Para simplificar nesta fase, se não houver token, avisamos o utilizador.
    if (!token) {
      // Idealmente, aqui fazíamos um GET /technician/sessions/{id}/token
      // Mas como a arquitetura de segurança decidiu não guardar o token em claro,
      // o técnico perde o token se fizer refresh, a não ser que a sessão seja reaproveitada.
      alert(t("qr.missing"));
      navigate("/technician/today");
    }
  }, [token, navigate, t]);

  if (!token) return null;

  const url = `${import.meta.env.VITE_APP_URL}/avaliar/${token}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <button 
        onClick={() => navigate("/technician/today")}
        className="absolute left-4 top-4 rounded-xl px-3 py-2 font-medium text-gray-500 transition-colors hover:bg-white hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
      >
        ✕ {t("qr.close")}
      </button>

      <motion.h1 initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-2 text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">{schoolName}</motion.h1>
      <p className="mb-8 text-center text-gray-500 dark:text-slate-400">{t("qr.instruction")}</p>

      <div ref={qrCardRef} className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-lg dark:border-slate-700">
        <QRCodeSVG value={url} size={280} level="M" />
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-700 dark:text-slate-300">{t("qr.received")}: <strong className="text-indigo-700 dark:text-indigo-300">{ratingsCount}</strong></p>
        <motion.button
          type="button"
          onClick={refreshCounter}
          disabled={counterLoading}
          whileHover={reduceMotion ? undefined : { scale: 1.03 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          className="mt-3 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {counterLoading && <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-middle" aria-hidden="true" />}
          {counterLoading ? t("qr.refreshing") : t("qr.refresh")}
        </motion.button>
        {counterError && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-rose-300">{counterError}</p>}
      </div>

      <p className="mt-8 max-w-md text-center text-sm text-gray-400 dark:text-slate-500">
        {t("qr.validity")}
      </p>
    </div>
  );
}