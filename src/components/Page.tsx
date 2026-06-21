"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageProps {
  children: React.ReactNode;
  className?: string;
}

export function Page({ children, className }: PageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("p-6 lg:p-8 space-y-6", className)}
    >
      {children}
    </motion.div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}

export function PageHeader({ title, subtitle, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        {breadcrumb && (
          <div className="text-xs text-deep-blue-400 mb-1.5 flex items-center gap-2">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className={cn(b.href ? "hover:text-ink-gold-500 cursor-pointer" : "")}>{b.label}</span>
                {i < breadcrumb.length - 1 && <span className="text-deep-blue-200">/</span>}
              </span>
            ))}
          </div>
        )}
        <h1 className="section-title text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-deep-blue-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
