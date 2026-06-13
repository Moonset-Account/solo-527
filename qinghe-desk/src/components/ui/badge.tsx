import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-pine-800 text-white",
        secondary: "bg-amber-100 text-amber-800",
        destructive: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
        success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
        warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
        outline: "text-zinc-700 ring-1 ring-zinc-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
