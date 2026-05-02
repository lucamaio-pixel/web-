import { getAccounts } from "@/lib/queries";
import { ImportClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const accounts = await getAccounts();
  return (
    <div className="space-y-6">
      <header>
        <p className="text-stone-500 text-sm">Aggiungi dati</p>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
          Importa CSV
        </h1>
        <p className="text-stone-600 text-sm mt-1">
          Carica i movimenti dalla tua app bancaria. Verranno categorizzati automaticamente.
        </p>
      </header>
      <ImportClient accounts={accounts.map(a => ({ id: a.id, name: a.name, type: a.type, color: a.color }))} />
    </div>
  );
}
