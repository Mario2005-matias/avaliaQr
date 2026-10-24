import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { MonthSelector } from "../../components/MonthSelector";
import { api } from "../../lib/api";
import type { AdminTechnician } from "../../types/index";

type ReportType = "monthly" | "technician";

export default function AdminReports() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [month, setMonth] = useState("");
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [technicianId, setTechnicianId] = useState("");
  const [technicians, setTechnicians] = useState<AdminTechnician[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTechnicians() {
      try {
        const { data } = await api.get<AdminTechnician[]>("/admin/technicians");
        setTechnicians(data);
      } catch {
        setError(t("adminReports.technicianLoadError"));
      } finally {
        setLoadingTechnicians(false);
      }
    }

    void loadTechnicians();
  }, [t]);

  async function handleDownload() {
    if (!month || (reportType === "technician" && !technicianId)) {
      setError(t("adminReports.chooseMonthTechnician"));
      return;
    }

    setDownloading(true);
    setError(null);
    try {
      const path = reportType === "monthly"
        ? `/admin/reports/monthly/${month}`
        : `/admin/reports/technician/${technicianId}/${month}`;
      const response = await api.get<Blob>(path, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = reportType === "monthly"
        ? `relatorio-mensal-${month}.pdf`
        : `relatorio-tecnico-${technicianId}-${month}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      setError(t("adminReports.error"));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">{t("adminReports.title")}</h1>
      <MonthSelector onChange={setMonth} />
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
          {t("adminReports.type")}
          <select value={reportType} onChange={(event) => setReportType(event.target.value as ReportType)} className="mt-1 w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50">
            <option value="monthly">{t("adminReports.monthly")}</option>
            <option value="technician">{t("adminReports.technicianReport")}</option>
          </select>
        </label>
        {reportType === "technician" && (
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            {t("adminRatings.technician")}
            <select required value={technicianId} onChange={(event) => setTechnicianId(event.target.value)} disabled={loadingTechnicians} className="mt-1 w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50">
              <option value="">{loadingTechnicians ? t("common.loading") : t("adminReports.selectTechnician")}</option>
              {technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}
            </select>
          </label>
        )}
        {error && <p role="alert" className="rounded-2xl bg-rose-100 p-3 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">{error}</p>}
        <motion.button onClick={() => void handleDownload()} disabled={downloading || !month} whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400">
          {downloading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          {downloading ? t("adminReports.downloading") : t("adminReports.download")}
        </motion.button>
      </div>
    </section>
  );
}
