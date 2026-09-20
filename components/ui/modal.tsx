"use client";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="glass-panel relative w-full max-w-lg rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-rose-300 hover:text-rose-200">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
