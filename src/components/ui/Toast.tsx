"use client";

import { create } from "zustand";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type Toast = { id: number; message: string; type: "success" | "error" };

interface ToastState {
  toasts: Toast[];
  push: (message: string, type?: Toast["type"]) => void;
  remove: (id: number) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, type = "success") => {
    const id = ++counter;
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => get().remove(id), 4000);
  },
  remove: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function Toaster() {
  const { toasts, remove } = useToastStore();
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex w-72 items-start gap-2 rounded-lg border bg-white p-3 text-sm shadow-lg"
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red" />
          )}
          <span className="flex-1 text-slate-body">{toast.message}</span>
          <button
            onClick={() => remove(toast.id)}
            className="text-slate-soft hover:text-slate-body"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
