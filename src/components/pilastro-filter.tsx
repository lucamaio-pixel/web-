"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Pilastro {
  id: string;
  key: string;
  name: string;
  emoji: string;
}

export function PilastroFilter({ pilastri, selected }: { pilastri: Pilastro[]; selected: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (selected === key) {
      params.delete("pilastro");
    } else {
      params.set("pilastro", key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      {pilastri.map((p) => (
        <button
          key={p.key}
          onClick={() => toggle(p.key)}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            selected === p.key
              ? "bg-emerald-600 text-white"
              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          <span>{p.emoji}</span>
          <span>{p.name}</span>
        </button>
      ))}
    </div>
  );
}
