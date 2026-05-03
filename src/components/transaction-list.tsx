"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { formatEuro } from "@/lib/utils";
import { X } from "lucide-react";

interface Pilastro {
  id: string;
  key: string;
  name: string;
  emoji: string;
}

interface Transaction {
  id: string;
  date: Date;
  merchant: string | null;
  description: string;
  amount: number;
  isDebtPayment: boolean;
  isInternalTransfer: boolean;
  account: { name: string };
  pilastro: { id: string; name: string; emoji: string } | null;
  subcategory: { id: string; name: string; emoji: string } | null;
}

interface DayGroup {
  day: string;
  items: Transaction[];
}

export function TransactionList({
  groups,
  pilastri,
}: {
  groups: DayGroup[];
  pilastri: Pilastro[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [isPending, startTransition] = useTransition();

  async function recategorize(pilastroId: string | null, saveRule: boolean) {
    if (!editing) return;
    await fetch("/api/transactions/recategorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: editing.id, pilastroId, saveRule }),
    });
    setEditing(null);
    startTransition(() => router.refresh());
  }

  return (
    <>
      {groups.map(({ day, items }) => {
        const dayDate = new Date(day + "T12:00:00");
        const total = items.reduce((s, t) => s + t.amount, 0);
        return (
          <div key={day} className="space-y-2">
            <div className="flex justify-between items-baseline px-1">
              <h2 className="text-sm font-semibold text-stone-700 capitalize">
                {dayDate.toLocaleDateString("it-IT", {
                  weekday: "short",
                  day: "2-digit",
                  month: "long",
                })}
              </h2>
              <span className="text-xs text-stone-500">
                {formatEuro(total, { sign: true })}
              </span>
            </div>
            <Card>
              <ul className="divide-y divide-stone-100">
                {items.map((t) => (
                  <li
                    key={t.id}
                    className="px-4 py-3 flex justify-between items-center active:bg-stone-50 cursor-pointer"
                    onClick={() => setEditing(t)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-900 truncate">
                        {t.merchant || t.description}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {t.pilastro?.emoji} {t.pilastro?.name ?? "—"}
                        {t.subcategory && <span className="text-stone-400"> › {t.subcategory.emoji} {t.subcategory.name}</span>}
                        {" · "}{t.account.name}
                        {t.isDebtPayment && " · 🏛️"}
                        {t.isInternalTransfer && " · ↔"}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ml-3 ${
                        t.amount < 0 ? "text-stone-900" : "text-emerald-600"
                      }`}
                    >
                      {formatEuro(t.amount, { sign: true })}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        );
      })}

      {/* Bottom sheet modifica categoria */}
      {editing && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setEditing(null)}
          />
          <div className="relative bg-white rounded-t-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-stone-900">
                  {editing.merchant || editing.description}
                </p>
                <p className="text-sm text-stone-500">
                  {formatEuro(editing.amount, { sign: true })} · attuale:{" "}
                  {editing.pilastro?.emoji} {editing.pilastro?.name ?? "Non assegnato"}
                </p>
              </div>
              <button onClick={() => setEditing(null)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">
                Cambia categoria
              </p>
              <div className="grid grid-cols-2 gap-2">
                {pilastri.map((p) => (
                  <PilastroChoice
                    key={p.id}
                    pilastro={p}
                    current={editing.pilastro?.id === p.id}
                    merchant={editing.merchant ?? ""}
                    onSelect={recategorize}
                    disabled={isPending}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PilastroChoice({
  pilastro,
  current,
  merchant,
  onSelect,
  disabled,
}: {
  pilastro: Pilastro;
  current: boolean;
  merchant: string;
  onSelect: (id: string, saveRule: boolean) => void;
  disabled: boolean;
}) {
  const [showRule, setShowRule] = useState(false);

  if (current) {
    return (
      <div className="p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-left">
        <p className="text-sm font-medium text-stone-900">
          {pilastro.emoji} {pilastro.name}
        </p>
        <p className="text-[10px] text-emerald-600 mt-0.5">✓ attuale</p>
      </div>
    );
  }

  if (showRule && merchant) {
    return (
      <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
        <p className="text-xs text-stone-600">
          Salva regola per <span className="font-semibold">{merchant}</span>?
        </p>
        <div className="flex gap-1.5">
          <button
            onClick={() => onSelect(pilastro.id, true)}
            disabled={disabled}
            className="flex-1 text-xs py-1.5 rounded-lg bg-emerald-600 text-white font-medium"
          >
            Sì, sempre
          </button>
          <button
            onClick={() => onSelect(pilastro.id, false)}
            disabled={disabled}
            className="flex-1 text-xs py-1.5 rounded-lg bg-stone-200 text-stone-700 font-medium"
          >
            Solo questa
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => (merchant ? setShowRule(true) : onSelect(pilastro.id, false))}
      disabled={disabled}
      className="p-3 rounded-xl border border-stone-200 text-left hover:bg-stone-50 active:bg-stone-100"
    >
      <p className="text-sm font-medium text-stone-900">
        {pilastro.emoji} {pilastro.name}
      </p>
    </button>
  );
}
