"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/utils";
import { Upload, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";

interface AccountSummary {
  id: string;
  name: string;
  type: string;
  color: string;
}

interface PreviewItem {
  date: string;
  merchant: string;
  description: string;
  amount: number;
  type: string;
  suggestedPilastro: string;
  pilastroName: string;
  pilastroEmoji: string;
  isInternalTransfer: boolean;
  isDebtPayment: boolean;
}

interface ImportStats {
  total: number;
  income: number;
  expenses: number;
  internal: number;
  debt: number;
  netFlow: number;
  byMonth: Record<string, { income: number; expenses: number; count: number }>;
}

type ImportResult =
  | { mode: "preview"; previewItems: PreviewItem[]; stats: ImportStats; totalCount: number }
  | { mode: "imported"; imported: number; skipped: number; total: number; stats: ImportStats };

export function ImportClient({ accounts }: { accounts: AccountSummary[] }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const isPostePay = selectedAccount?.type === "postepay";
  const [csvContent, setCsvContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    setError(null);
    setResult(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Per favore carica un file .csv");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target?.result || "");
      setCsvContent(content);
    };
    reader.readAsText(file);
  }, []);

  async function runImport(preview: boolean) {
    if (!csvContent || !accountId) {
      setError("Carica un CSV e seleziona un conto");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent, accountId, preview }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Errore importazione");
      if (preview) {
        setResult({ mode: "preview", ...data });
      } else {
        setResult({ mode: "imported", ...data });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setCsvContent("");
    setFileName("");
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Conto di destinazione</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {accounts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccountId(a.id)}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  accountId === a.id
                    ? "bg-emerald-50 border-emerald-500"
                    : "bg-white border-stone-200 hover:bg-stone-50"
                }`}
              >
                <p className="font-medium text-stone-900 text-sm">{a.name}</p>
                <p className="text-xs text-stone-500 capitalize mt-0.5">{a.type}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. File CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              dragOver
                ? "border-emerald-500 bg-emerald-50"
                : csvContent
                ? "border-emerald-200 bg-emerald-50/50"
                : "border-stone-200 hover:bg-stone-50"
            }`}
          >
            {csvContent ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-emerald-600" />
                <p className="text-sm font-medium text-stone-900">{fileName}</p>
                <p className="text-xs text-stone-500">
                  {(csvContent.length / 1024).toFixed(1)} KB ·{" "}
                  {csvContent.split("\n").length - 1} righe
                </p>
                <button
                  onClick={reset}
                  className="text-xs text-stone-500 hover:text-stone-900 mt-1 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Rimuovi
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="text-sm text-stone-700 font-medium">
                  Trascina il CSV qui oppure
                </p>
                <label className="inline-block mt-3">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                  <span className="cursor-pointer inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">
                    Seleziona file
                  </span>
                </label>
                <p className="text-xs text-stone-500 mt-3">
                  {isPostePay
                    ? "Formato PostePay/BancoPosta: Lista Movimenti → Esporta CSV"
                    : "Formato Hype: app → Movimenti → Esporta CSV"}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {csvContent && !result && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => runImport(true)}
          >
            Anteprima
          </Button>
          <Button disabled={loading} onClick={() => runImport(false)}>
            {loading ? "Importo..." : "Importa"}
          </Button>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 flex gap-2 items-start">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900 text-sm">Errore</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {result?.mode === "imported" && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="py-4">
            <div className="flex gap-2 items-start">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-emerald-900">
                  Importazione completata
                </p>
                <p className="text-sm text-emerald-800 mt-1">
                  {result.imported} nuove transazioni,{" "}
                  {result.skipped > 0 && `${result.skipped} duplicati saltati,`} {" "}
                  totale processato {result.total}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-emerald-200">
              <Stat label="Entrate" value={formatEuro(result.stats.income)} positive />
              <Stat label="Uscite" value={formatEuro(result.stats.expenses)} />
            </div>
          </CardContent>
        </Card>
      )}

      {result?.mode === "preview" && (
        <PreviewBlock
          items={result.previewItems}
          stats={result.stats}
          total={result.totalCount}
          onConfirm={() => runImport(false)}
          loading={loading}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-stone-500 uppercase tracking-wide">{label}</p>
      <p
        className={`text-sm font-semibold ${
          positive ? "text-emerald-700" : "text-stone-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PreviewBlock({
  items,
  stats,
  total,
  onConfirm,
  loading,
}: {
  items: PreviewItem[];
  stats: ImportStats;
  total: number;
  onConfirm: () => void;
  loading: boolean;
}) {
  const months = Object.entries(stats.byMonth).sort();
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anteprima — {total} transazioni</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Entrate" value={formatEuro(stats.income)} positive />
            <Stat label="Uscite" value={formatEuro(stats.expenses)} />
            <Stat label="Netto" value={formatEuro(stats.netFlow)} />
          </div>
          {months.length > 0 && (
            <div className="border-t border-stone-100 pt-3">
              <p className="text-xs uppercase tracking-wide text-stone-500 mb-2">
                Per mese
              </p>
              <div className="space-y-1">
                {months.map(([m, s]) => (
                  <div key={m} className="flex justify-between text-sm">
                    <span className="text-stone-600">{m}</span>
                    <span className="text-stone-900">
                      {s.count} mov. · -{formatEuro(s.expenses)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorizzazione (prime 50)</CardTitle>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          <ul className="divide-y divide-stone-100">
            {items.map((t, i) => (
              <li key={i} className="py-2 flex justify-between items-center text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900 truncate">
                    {t.merchant || t.description}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {t.pilastroEmoji} {t.pilastroName}
                    {t.isInternalTransfer && " · interno"}
                    {t.isDebtPayment && " · debito"}
                  </p>
                </div>
                <span
                  className={`ml-2 font-semibold ${
                    t.amount < 0 ? "text-stone-900" : "text-emerald-600"
                  }`}
                >
                  {formatEuro(t.amount, { sign: true })}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full"
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? "Importo..." : `Conferma e importa ${total} transazioni`}
      </Button>
    </div>
  );
}
