import { useRef, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useTranslation } from "react-i18next";
import { api, ensureCsrf } from "../lib/api";
import { DisplayPreferences } from "../components/DisplayPreferences";

gsap.registerPlugin(useGSAP);

export default function Login() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const pageRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useGSAP(() => {
    if (reduceMotion) return;
    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    timeline.fromTo(formRef.current, { opacity: 0, y: 28, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.7 })
      .fromTo(".login-orb", { opacity: 0, scale: 0.7 }, { opacity: 0.55, scale: 1, duration: 1.1, stagger: 0.15 }, 0);
  }, { scope: pageRef, dependencies: [reduceMotion] });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await ensureCsrf();
      const { data } = await api.post("/login", { email, password });
      if (data.user.role === "admin") {
        navigate("/admin/ratings");
      } else {
        navigate("/technician/today");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError<{ errors?: { email?: string[] } }>(error) && error.response?.status === 422) {
        setError(t("login.invalidCredentials"));
      } else {
        setError(t("login.connectionError"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={pageRef} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 py-16 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <DisplayPreferences />
      <div className="login-orb pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-indigo-300/60 blur-3xl dark:bg-indigo-500/20" />
      <div className="login-orb pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-violet-300/60 blur-3xl dark:bg-violet-500/20" />
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="relative w-full max-w-md space-y-6 rounded-3xl border border-white/80 bg-white/85 p-7 shadow-xl shadow-indigo-900/5 backdrop-blur-xl sm:p-9 dark:border-slate-700 dark:bg-slate-800/90 dark:shadow-indigo-950/40"
      >
        <div className="text-center">
          <p className="mb-3 text-xs font-bold tracking-[0.22em] text-indigo-600 dark:text-indigo-300">{t("login.eyebrow")}</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-50">{t("login.title")}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{t("login.subtitle")}</p>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-100 p-3 text-center text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            {t("login.email")}
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            placeholder={t("login.emailPlaceholder")}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            {t("login.password")}
          </label>
          <input
            id="login-password"
            type="password"
            required
            value={password}
            placeholder={t("login.passwordPlaceholder")}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          {loading ? t("login.submitting") : t("login.submit")}
        </motion.button>
        <p className="text-center text-xs text-gray-400 dark:text-slate-500">{t("login.secure")}</p>
      </form>
    </div>
  );
}
