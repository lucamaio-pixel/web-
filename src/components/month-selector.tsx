"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS_IT = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

interface Props {
  selected: string; // "YYYY-MM"
  availableMonths: string[]; // months with data
}

export function MonthSelector({ selected, availableMonths }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selYear, selMonth] = selected.split("-").map(Number);

  const years = Array.from(
    new Set(availableMonths.map((m) => Number(m.slice(0, 4))))
  ).sort();
  const currentYear = selYear;

  function go(month: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", month);
    router.push(`${pathname}?${params.toString()}`);
  }

  function prevYear() {
    const idx = years.indexOf(currentYear);
    if (idx > 0) go(`${years[idx - 1]}-${String(selMonth).padStart(2, "0")}`);
  }

  function nextYear() {
    const idx = years.indexOf(currentYear);
    if (idx < years.length - 1) go(`${years[idx + 1]}-${String(selMonth).padStart(2, "0")}`);
  }

  return (
    <div className="space-y-2">
      {years.length > 1 && (
        <div className="flex items-center justify-between px-1">
          <button
            onClick={prevYear}
            disabled={years.indexOf(currentYear) === 0}
            className="p-1 rounded text-stone-400 hover:text-stone-700 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-stone-700">{currentYear}</span>
          <button
            onClick={nextYear}
            disabled={years.indexOf(currentYear) === years.length - 1}
            className="p-1 rounded text-stone-400 hover:text-stone-700 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="grid grid-cols-6 gap-1.5">
        {MONTHS_IT.map((label, i) => {
          const m = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
          const isSelected = m === selected;
          const hasData = availableMonths.includes(m);
          return (
            <button
              key={m}
              onClick={() => go(m)}
              className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-emerald-600 text-white"
                  : hasData
                  ? "bg-stone-100 text-stone-800 hover:bg-stone-200"
                  : "bg-white text-stone-300 border border-stone-100"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
