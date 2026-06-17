"use client"

import * as React from "react"
import { Clock, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Alert } from "@/types/database"

interface AlertCardProps {
  alert: Alert
  onResolve?: (id: string) => void
  className?: string
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

const urgencyBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "warning" | "info"> = {
  critical: "destructive",
  high: "warning",
  medium: "info",
  low: "secondary",
}

const urgencyBorderColor: Record<string, string> = {
  critical: "border-l-red-500",
  high: "border-l-amber-500",
  medium: "border-l-blue-500",
  low: "border-l-slate-300",
}

function AlertCard({ alert, onResolve, className }: AlertCardProps) {
  return (
    <Card className={cn("border-l-4", urgencyBorderColor[alert.urgency_level] ?? "border-l-slate-300", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={urgencyBadgeVariant[alert.urgency_level]}>
                {alert.urgency_level}
              </Badge>
              <Badge variant="secondary">{alert.type.replace("_", " ")}</Badge>
            </div>
            <h4 className="text-sm font-semibold text-slate-900">{alert.title}</h4>
            {alert.description && (
              <p className="mt-1 text-sm text-slate-500 line-clamp-2">{alert.description}</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between px-4 pb-3 pt-0">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          <span>{formatTime(alert.created_at)}</span>
        </div>
        {!alert.is_resolved && onResolve && (
          <Button size="sm" variant="ghost" onClick={() => onResolve(alert.id)} className="text-xs">
            <CheckCircle className="h-3.5 w-3.5" />
            Resolve
          </Button>
        )}
        {alert.is_resolved && (
          <Badge variant="default" className="text-xs">Resolved</Badge>
        )}
      </CardFooter>
    </Card>
  )
}

export { AlertCard }
