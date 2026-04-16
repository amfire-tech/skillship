"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "success" | "error" | "info";

const TOAST_LIMIT = 4;
const TOAST_DURATION = 3500;

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timersRef.current.get(id));
    timersRef.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++counterRef.current;
    setToasts((prev) => {
      const next = [...prev, { id, message, type }];
      // Enforce queue limit — drop oldest if over limit
      return next.length > TOAST_LIMIT ? next.slice(next.length - TOAST_LIMIT) : next;
    });
    const timer = setTimeout(() => dismiss(id), TOAST_DURATION);
    timersRef.current.set(id, timer);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div aria-live="polite" aria-atomic="false" role="status" className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.18)] backdrop-blur-sm ${
                t.type === "success"
                  ? "border-primary/20 bg-white text-[var(--foreground)]"
                  : t.type === "error"
                  ? "border-red-200 bg-white text-[var(--foreground)]"
                  : "border-[var(--border)] bg-white text-[var(--foreground)]"
              }`}
            >
              {t.type === "success" && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              )}
              {t.type === "error" && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </span>
              )}
              {t.type === "info" && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                  </svg>
                </span>
              )}
              <p className="flex-1 text-sm font-medium">{t.message}</p>
              {/* Manual dismiss */}
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx.toast;
}
