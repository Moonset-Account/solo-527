"use client";

import { KPICard } from "@/components/ui/KPICards";
import type { KPIs } from "@/types";
import {
  UserPlus,
  FileCheck2,
  Target,
  Clock4,
  UsersRound,
  AlertTriangle,
  ListTodo,
} from "lucide-react";

interface KPIGridProps {
  kpis: KPIs;
}

export function KPIGrid({ kpis }: KPIGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      <KPICard
        index={0}
        label={kpis.leads.label}
        value={kpis.leads.value}
        delta={kpis.leads.delta}
        Icon={UserPlus}
        tone="default"
      />
      <KPICard
        index={1}
        label={kpis.trials.label}
        value={kpis.trials.value}
        delta={kpis.trials.delta}
        Icon={FileCheck2}
        tone="warm"
      />
      <KPICard
        index={2}
        label={kpis.conversionRate.label}
        value={kpis.conversionRate.value}
        suffix="%"
        delta={kpis.conversionRate.delta}
        Icon={Target}
        tone="success"
      />
      <KPICard
        index={3}
        label={kpis.consumptionHours.label}
        value={kpis.consumptionHours.value}
        suffix="h"
        delta={kpis.consumptionHours.delta}
        Icon={Clock4}
        tone="default"
      />
      <KPICard
        index={4}
        label={kpis.students.label}
        value={kpis.students.value}
        delta={kpis.students.delta}
        Icon={UsersRound}
        tone="warm"
      />
      <KPICard
        index={5}
        label={kpis.renewalRisk.label}
        value={kpis.renewalRisk.value}
        delta={kpis.renewalRisk.delta}
        Icon={AlertTriangle}
        tone="danger"
      />
      <KPICard
        index={6}
        label={kpis.unfollowedTrials.label}
        value={kpis.unfollowedTrials.value}
        delta={kpis.unfollowedTrials.delta}
        Icon={ListTodo}
        tone="danger"
      />
    </div>
  );
}
