"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Users,
  FileDown,
  CalendarClock,
} from "lucide-react";
import { trpc } from "@/trpc/client";
import { cn, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";

export default function DashboardPage() {
  const router = useRouter();

  const { data: stats, isLoading: statsLoading } =
    trpc.followUp.getDashboardStats.useQuery();
  const { data: pendingData, isLoading: pendingLoading } =
    trpc.followUp.list.useQuery({ status: "PENDING", take: 10 });
  const { data: conflicts, isLoading: conflictsLoading } =
    trpc.followUp.getConflicts.useQuery();

  const updateStatusMutation = trpc.followUp.updateStatus.useMutation();
  const resolveConflictMutation = trpc.followUp.resolveConflict.useMutation();

  const handleStartFollowUp = (id: string) => {
    updateStatusMutation.mutate(
      { id, status: "IN_PROGRESS" },
      {
        onSuccess: () => {
          router.push(`/follow-ups/${id}`);
        },
      }
    );
  };

  const handleResolveConflict = (
    appointmentId: string,
    newDate: Date,
    newTimeSlot: string
  ) => {
    resolveConflictMutation.mutate({
      appointmentId,
      newDate,
      newTimeSlot,
    });
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-indigo-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-indigo-primary">病历随访台</h1>
        <p className="text-sm text-indigo-primary/50 mt-1">
          今日随访任务概览与号源冲突管理
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="待随访数"
          value={stats?.pendingCount ?? 0}
          icon={<Clock className="w-5 h-5" />}
          subtitle={`完成率 ${((stats?.completionRate ?? 0) * 100).toFixed(1)}%`}
        />
        <StatCard
          title="随访中"
          value={stats?.inProgressCount ?? 0}
          icon={<Loader2 className="w-5 h-5" />}
          trend="positive"
        />
        <StatCard
          title="已完成"
          value={stats?.completedCount ?? 0}
          icon={<CheckCircle2 className="w-5 h-5" />}
          trend="positive"
        />
        <StatCard
          title="号源冲突"
          value={stats?.conflictCount ?? 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={stats?.conflictCount ? "negative" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-beige-dark flex items-center justify-between">
            <h2 className="text-lg font-bold text-indigo-primary">
              今日待随访
            </h2>
            <Link
              href="/follow-ups"
              className="text-sm text-green-primary hover:text-green-dark"
            >
              查看全部
            </Link>
          </div>
          {pendingLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-indigo-primary animate-spin" />
            </div>
          ) : !pendingData?.items.length ? (
            <div className="px-5 py-12 text-center text-sm text-indigo-primary/40">
              暂无待随访任务
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-indigo-primary/50 border-b border-beige-dark">
                    <th className="px-5 py-3 font-medium">患者姓名</th>
                    <th className="px-5 py-3 font-medium">主诉</th>
                    <th className="px-5 py-3 font-medium">截止日期</th>
                    <th className="px-5 py-3 font-medium">状态</th>
                    <th className="px-5 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingData.items.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-beige-dark/50 hover:bg-beige/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/follow-ups/${task.id}`)}
                    >
                      <td className="px-5 py-3 font-medium text-indigo-primary">
                        {task.patient.name}
                      </td>
                      <td className="px-5 py-3 text-indigo-primary/70 max-w-[200px] truncate">
                        {task.medicalRecord.chiefComplaint}
                      </td>
                      <td className="px-5 py-3 text-indigo-primary/60">
                        {formatDate(task.dueDate)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartFollowUp(task.id);
                          }}
                          disabled={updateStatusMutation.isPending}
                          className={cn(
                            "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                            "bg-green-primary text-white hover:bg-green-dark",
                            updateStatusMutation.isPending &&
                              "opacity-50 cursor-not-allowed"
                          )}
                        >
                          分配
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-beige-dark flex items-center justify-between">
            <h2 className="text-lg font-bold text-indigo-primary">
              号源冲突
            </h2>
            <AlertTriangle className="w-4 h-4 text-amber" />
          </div>
          {conflictsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-indigo-primary animate-spin" />
            </div>
          ) : !conflicts?.length ? (
            <div className="px-5 py-12 text-center text-sm text-indigo-primary/40">
              暂无号源冲突
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {conflicts.map((appt) => (
                <div
                  key={appt.id}
                  className="rounded-lg border border-amber/30 bg-amber-light/20 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-indigo-primary">
                      {appt.patient.name}
                    </span>
                    <span className="text-xs text-amber">
                      {formatDate(appt.appointmentDate)} {appt.timeSlot}
                    </span>
                  </div>
                  <div className="text-xs text-indigo-primary/50">
                    医生: {appt.doctorId}
                  </div>
                  <button
                    onClick={() =>
                      handleResolveConflict(
                        appt.id,
                        new Date(appt.appointmentDate),
                        appt.timeSlot
                      )
                    }
                    disabled={resolveConflictMutation.isPending}
                    className={cn(
                      "w-full py-1.5 rounded-lg text-xs font-medium transition-colors",
                      "bg-amber text-white hover:bg-amber/90",
                      resolveConflictMutation.isPending &&
                        "opacity-50 cursor-not-allowed"
                    )}
                  >
                    调整时间
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm px-5 py-4">
        <span className="text-sm font-medium text-indigo-primary/60 mr-2">
          快捷操作
        </span>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-green-primary text-white hover:bg-green-dark transition-colors">
          <Plus className="w-4 h-4" />
          新建随访任务
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-primary text-white hover:bg-indigo-light transition-colors">
          <Users className="w-4 h-4" />
          批量分配
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-primary/20 text-indigo-primary hover:bg-beige-dark transition-colors">
          <FileDown className="w-4 h-4" />
          导出报表
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-primary/20 text-indigo-primary hover:bg-beige-dark transition-colors">
          <CalendarClock className="w-4 h-4" />
          随访日历
        </button>
      </div>
    </div>
  );
}
