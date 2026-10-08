import { X } from "lucide-react";
import type { ReactNode } from "react";

export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl border-t border-border bg-card p-5 pb-8 animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const btnPrimary = "w-full rounded-xl bg-gradient-red py-3 font-bold text-primary-foreground shadow-red transition active:scale-[0.98] disabled:opacity-50";
export const inputCls = "w-full rounded-xl border border-input bg-secondary px-4 py-3 outline-none focus:border-primary";
