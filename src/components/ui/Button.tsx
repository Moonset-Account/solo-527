import { cn } from "@/utils/cn";
import { forwardRef, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "warning" | "success";
  size?: "sm" | "md" | "lg";
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
}

const variantClasses = {
  primary:
    "bg-brand-500 hover:bg-brand-600 text-white border-brand-500 hover:border-brand-600",
  secondary:
    "bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600 hover:border-slate-500",
  outline:
    "bg-transparent hover:bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-500",
  ghost:
    "bg-transparent hover:bg-slate-800 text-slate-300 border-transparent hover:border-slate-600",
  danger:
    "bg-danger-500 hover:bg-danger-600 text-white border-danger-500 hover:border-danger-600",
  warning:
    "bg-warning-500 hover:bg-warning-600 text-white border-warning-500 hover:border-warning-600",
  success:
    "bg-success-500 hover:bg-success-600 text-white border-success-500 hover:border-success-600",
};

const sizeClasses = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, isLoading, leftIcon, rightIcon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded border font-medium transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 focus:ring-offset-slate-900",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon}
        {children}
        {rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
