"use client";

import { type ReactNode, useEffect, useRef } from "react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="w-full max-w-md rounded-xl border border-border bg-surface p-0 text-foreground shadow-lg backdrop:bg-slate-900/40"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрити"
          className="focus-ring rounded-md p-1 text-muted hover:bg-background hover:text-foreground"
        >
          ✕
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
