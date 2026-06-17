import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  showConfirm?: boolean;
  showCancel?: boolean;
  closeOnOverlayClick?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  onConfirm,
  confirmText = "确认",
  cancelText = "取消",
  confirmLoading = false,
  showConfirm = true,
  showCancel = true,
  closeOnOverlayClick = true,
  size = "md",
  className,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleOverlayClick}
      />
      <div
        className={cn(
          "relative w-full mx-4 bg-card rounded-xl shadow-xl border border-card-border animate-fade-in",
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-card-border">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-muted/10 transition-colors text-muted hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
        {footer !== undefined ? (
          footer
        ) : (
          (showConfirm || showCancel) && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-card-border">
              {showCancel && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  {cancelText}
                </Button>
              )}
              {showConfirm && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onConfirm}
                  loading={confirmLoading}
                >
                  {confirmText}
                </Button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
