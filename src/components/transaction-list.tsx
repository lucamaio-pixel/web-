"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { formatEuro } from "@/lib/utils";
import { X, Plus, ChevronLeft } from "lucide-react";

interface Subcategory {
  id: string;
  key: string;
  name: string;
  emoji: string;
}

interface Pilastro {
  id: string;
  key: string;
  name: string;
  emoji: string;
  subcategories: Subcategory[];
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

type Step = "pilastro" | "subcategory" | "rule";

export function TransactionList({ groups, pilastri }: { groups: DayGroup[]; pilastri: Pilastro[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [step, setStep] = useState<Step>("pilastro");
  const [selectedPilastro, setSelectedPilastro] = useState<Pilastro | null>(null);
  const [selectedSubcat, setSelectedSubcat] = useState<Subcategory | null>(null);
  const [creatingSubcat, setCreatingSubcat] = useState(false);
  const [newSubcatName, setNewSubcatName] = useState("");
  const [newSubcatEmoji, setNewSubcatEmoji] = useState("");
  const [isPending, startTransition] = useTransition();

  function open(t: Transaction) {
    setEditing(t);
    setStep("pilastro");
    setSelectedPilastro(pilastri.find((p) => p.id === t.pilastro?.id) ?? null);
    setSelectedSubcat(null);
    setCreatingSubcat(false);
    setNewSubcatName("");
    setNewSubcatEmoji("");
  }

  function close() {
    setEditing(null);
    setCreatingSubcat(false);
  }

  function pickPilastro(p: Pilastro) {
    setSelectedPilastro(p);
    setSelectedSubcat(null);
    setCreatingSubcat(false);
    setStep("subcategory");
  }

  function pickSubcat(s: Subcategory | null) {
    setSelectedSubcat(s);
    if (editing?.merchant) {
      setStep("rule");
    } else {
      save(selectedPilastro, s, false);
    }
  }

  async function createSubcat() {
    if (!selectedPilastro || !newSubcatName.trim()) return;
    const res = await fetch("/api/subcategories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pilastroId: selectedPilastro.id, name: newSubcatName.trim(), emoji: newSubcatEmoji.trim() }),
    });
    const data = await res.json();
    if (data.ok) {
      const newSub: Subcategory = data.subcategory;
      // Aggiunge localmente alla lista
      selectedPilastro.subcategories.push(newSub);
      setCreatingSubcat(false);
      setNewSubcatName("");
      setNewSubcatEmoji("");
      pickSubcat(newSub);
    }
  }

  async function save(pilastro: Pilastro | null, subcat: Subcategory | null, saveRule: boolean) {
    if (!editing) return;
    await fetch("/api/transactions/recategorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionId: editing.id,
        pilastroId: pilastro?.id ?? null,
        subcategoryId: subcat?.id ?? null,
        saveRule,
      }),
    });
    close();
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
                {dayDate.toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "long" })}
              </h2>
              <span className="text-xs text-stone-500">{formatEuro(total, { sign: true })}</span>
            </div>
            <Card>
              <ul className="divide-y divide-stone-100">
                {items.map((t) => (
                  <li key={t.id} className="px-4 py-3 flex justify-between items-center cursor-pointer active:bg-stone-50" onClick={() => open(t)}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-900 truncate">{t.merchant || t.description}</p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {t.pilastro?.emoji} {t.pilastro?.name ?? "—"}
                        {t.subcategory && <span className="text-stone-400"> › {t.subcategory.emoji} {t.subcategory.name}</span>}
                        {" · "}{t.account.name}
                        {t.isDebtPayment && " · 🏛️"}
                        {t.isInternalTransfer && " · ↔"}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ml-3 ${t.amount < 0 ? "text-stone-900" : "text-emerald-600"}`}>
                      {formatEuro(t.amount, { sign: true })}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        );
      })}

      {editing && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative bg-white rounded-t-2xl p-5 pb-24 space-y-4 max-h-[80vh] overflow-y-auto">

            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                {step !== "pilastro" && (
                  <button onClick={() => setStep(step === "rule" ? "subcategory" : "pilastro")} className="p-1 -ml-1">
                    <ChevronLeft className="w-4 h-4 text-stone-400" />
                  </button>
                )}
                <div>
                  <p className="font-semibold text-stone-900 text-sm">{editing.merchant || editing.description}</p>
                  <p className="text-xs text-stone-500">{formatEuro(editing.amount, { sign: true })}</p>
                </div>
              </div>
              <button onClick={close}><X className="w-5 h-5 text-stone-400" /></button>
            </div>

            {/* Step 1 — Scegli pilastro */}
            {step === "pilastro" && (
              <div>
                <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">1. Scegli pilastro</p>
                <div className="grid grid-cols-2 gap-2">
                  {pilastri.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => pickPilastro(p)}
                      className={`p-3 rounded-xl border text-left transition-colors ${selectedPilastro?.id === p.id ? "border-emerald-500 bg-emerald-50" : "border-stone-200 hover:bg-stone-50"}`}
                    >
                      <p className="text-sm font-medium">{p.emoji} {p.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 — Scegli/crea sottocategoria */}
            {step === "subcategory" && selectedPilastro && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-widest text-stone-400">
                  2. Sottocategoria in {selectedPilastro.emoji} {selectedPilastro.name}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPilastro.subcategories.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => pickSubcat(s)}
                      className="p-2.5 rounded-xl border border-stone-200 text-left hover:bg-stone-50 text-sm"
                    >
                      {s.emoji} {s.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setCreatingSubcat(true)}
                    className="p-2.5 rounded-xl border border-dashed border-stone-300 text-left text-sm text-stone-500 flex items-center gap-1 hover:bg-stone-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nuova
                  </button>
                </div>

                {creatingSubcat && (
                  <div className="border border-stone-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-medium text-stone-600">Nuova sottocategoria</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Emoji"
                        value={newSubcatEmoji}
                        onChange={(e) => setNewSubcatEmoji(e.target.value)}
                        className="w-14 border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-center"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        placeholder="Nome (es. Pediatra)"
                        value={newSubcatName}
                        onChange={(e) => setNewSubcatName(e.target.value)}
                        className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-sm"
                        onKeyDown={(e) => e.key === "Enter" && createSubcat()}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={createSubcat}
                        disabled={!newSubcatName.trim()}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium disabled:opacity-40"
                      >
                        Crea e assegna
                      </button>
                      <button
                        onClick={() => setCreatingSubcat(false)}
                        className="flex-1 py-1.5 rounded-lg bg-stone-100 text-stone-600 text-xs font-medium"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => pickSubcat(null)}
                  className="w-full text-xs text-stone-400 py-1 hover:text-stone-600"
                >
                  Salta sottocategoria
                </button>
              </div>
            )}

            {/* Step 3 — Salva regola */}
            {step === "rule" && selectedPilastro && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-widest text-stone-400">3. Applica sempre?</p>
                <div className="bg-stone-50 rounded-xl p-3 text-sm text-stone-700">
                  <span className="font-semibold">{editing.merchant}</span> →{" "}
                  {selectedPilastro.emoji} {selectedPilastro.name}
                  {selectedSubcat && <span className="text-stone-500"> › {selectedSubcat.emoji} {selectedSubcat.name}</span>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => save(selectedPilastro, selectedSubcat, true)}
                    disabled={isPending}
                    className="py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium"
                  >
                    Sì, sempre
                  </button>
                  <button
                    onClick={() => save(selectedPilastro, selectedSubcat, false)}
                    disabled={isPending}
                    className="py-3 rounded-xl bg-stone-100 text-stone-700 text-sm font-medium"
                  >
                    Solo questa
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
