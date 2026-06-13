import { ReactNode } from "react";

export function Modal({
  open, onClose, title, children, size = "md", footer, }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  footer?: ReactNode;
}) {
  if (!open) return null;
  const sizeCls = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-3xl",
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative w-full ${sizeCls} card shadow-xl`}>
        <div className="card-header">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="btn-ghost h-8 w-8 p-0 !rounded-md" aria-label="关闭">✕</button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function useModal() {
  const [open, setOpen] = [false, () => {}];
  return { open, setOpen };
}
