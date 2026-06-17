import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
  bordered?: boolean;
  shadow?: boolean;
}

export function Card({
  children,
  className,
  title,
  description,
  footer,
  hoverable = false,
  bordered = true,
  shadow = true,
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-xl transition-all duration-300",
        bordered && "border border-card-border",
        shadow && "shadow-card",
        hoverable && "hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer",
        className
      )}
    >
      {(title || description) && (
        <div className="px-6 pt-6 pb-4">
          {title && <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>}
          {description && <p className="text-sm text-muted mt-2">{description}</p>}
        </div>
      )}
      <div className={cn("px-6 pb-6", !title && !description && "pt-6")}>{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-card-border text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}
