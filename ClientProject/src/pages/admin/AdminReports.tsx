import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { AdminTechnician } from "../../types/index";

type ReportType = "monthly" | "technician";

export default function AdminReports() {
  const [month, setMonth] = useState(() => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Luanda",
      year: "numeric",
      month: "2-digit",
    }).formatToParts(new Date());
    const year = parts.find((part) => part.type === "year")?.value;
    const monthPart = parts.find((part) => part.type === "month")?.value;
    return year && monthPart ? `${year}-${monthPart}` : "";
  });
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
        setError("Não foi possível carregar a lista de técnicos.");
      } finally {
        setLoadingTechnicians(false);
      }
    }

    void loadTechnicians();
  }, []);

  async function handleDownload() {
    if (!month || (reportType === "technician" && !technicianId)) {
      setError("Escolhe o mês e o técnico para gerar este relatório.");
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
      setError("Não foi possível gerar o relatório. Tenta novamente.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
      <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-700">
          Tipo de relatório
          <select value={reportType} onChange={(event) => setReportType(event.target.value as ReportType)} className="mt-1 w-full rounded border border-gray-300 p-2">
            <option value="monthly">Resumo mensal (técnicos e colégios)</option>
            <option value="technician">Relatório de um técnico</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Mês
          <input type="month" required value={month} onChange={(event) => setMonth(event.target.value)} className="mt-1 w-full rounded border border-gray-300 p-2" />
        </label>
        {reportType === "technician" && (
          <label className="block text-sm font-medium text-gray-700">
            Técnico
            <select required value={technicianId} onChange={(event) => setTechnicianId(event.target.value)} disabled={loadingTechnicians} className="mt-1 w-full rounded border border-gray-300 p-2">
              <option value="">Escolhe um técnico...</option>
              {technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}
            </select>
          </label>
        )}
        {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button onClick={() => void handleDownload()} disabled={downloading} className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {downloading ? "A gerar PDF..." : "Transferir PDF"}
        </button>
      </div>
    </section>
  );
}
