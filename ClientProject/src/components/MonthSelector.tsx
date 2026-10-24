import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type MonthSelectorProps = {
  onChange: (month: string) => void;
  initialDate?: Date;
};

function getMonthParts(date: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Africa/Luanda",
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value) - 1,
  };
}

function toMonthString(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function MonthSelector({ onChange, initialDate = new Date() }: MonthSelectorProps) {
  const { i18n, t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const { year, month } = getMonthParts(initialDate);
    return new Date(Date.UTC(year, month, 15, 12));
  });
  const { year: currentYear, month: currentMonth } = getMonthParts(new Date());
  const isCurrentMonth =
    selectedMonth.getUTCFullYear() === currentYear &&
    selectedMonth.getUTCMonth() === currentMonth;

  useEffect(() => {
    onChange(toMonthString(selectedMonth));
  }, [onChange, selectedMonth]);

  function changeMonth(offset: number) {
    setSelectedMonth((current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + offset, 15, 12)));
  }

  const locale = i18n.resolvedLanguage?.startsWith("en") ? "en" : "pt-AO";
  const label = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Luanda",
  }).format(selectedMonth);

  return (
    <div className="flex items-center justify-center gap-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
      <button
        type="button"
        onClick={() => changeMonth(-1)}
        aria-label={t("monthSelector.previous")}
        className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-gray-600 transition-all hover:scale-105 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
      >
        <span aria-hidden="true">←</span>
      </button>
      <span className="min-w-40 text-center text-lg font-bold capitalize tracking-tight text-gray-900 dark:text-slate-50">
        {label}
      </span>
      <button
        type="button"
        onClick={() => changeMonth(1)}
        disabled={isCurrentMonth}
        aria-label={t("monthSelector.next")}
        className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-gray-600 transition-all hover:scale-105 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:scale-100 disabled:hover:bg-transparent disabled:hover:text-gray-300 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-300 dark:disabled:text-slate-600"
      >
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
