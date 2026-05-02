"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Plus, Receipt, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/pilastri", label: "Pilastri", icon: BarChart3 },
  { href: "/import", label: "Aggiungi", icon: Plus, primary: true },
  { href: "/transazioni", label: "Movimenti", icon: Receipt },
  { href: "/debiti", label: "Debiti", icon: Landmark },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-stone-200">
      <div className="max-w-2xl mx-auto grid grid-cols-5">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center py-2.5 gap-1 transition-colors",
                active ? "text-emerald-600" : "text-stone-500 hover:text-stone-700"
              )}
            >
              {link.primary ? (
                <div className="bg-emerald-600 text-white rounded-full p-2 shadow-md -mt-6 border-4 border-white">
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
