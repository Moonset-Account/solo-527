"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  width?: string;
}

export function Drawer({ open, onClose, title, children, className, width = "max-w-2xl" }: DrawerProps) {
  if (!open) return null;

  return (
    <>
      <div className="drawer-overlay animate-fade-in" onClick={onClose} />
      <div
        className={cn(
          "drawer-content animate-slide-in-right",
          width,
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </>
  );
}

interface DrawerHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerHeader({ children, className }: DrawerHeaderProps) {
  return (
    <div className={cn("mb-6 border-b border-slate-200 pb-4", className)}>
      {children}
    </div>
  );
}

interface DrawerFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerFooter({ children, className }: DrawerFooterProps) {
  return (
    <div className={cn("mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4", className)}>
      {children}
    </div>
  );
}

interface DrawerSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function DrawerSection({ title, children, className }: DrawerSectionProps) {
  return (
    <div className={cn("mb-6", className)}>
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  );
}
