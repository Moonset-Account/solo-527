import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Phone,
  User,
  MapPin,
  Calendar,
  Star,
  MessageCircle,
  ArrowLeft,
  Award,
  Clock,
} from "lucide-react";
import { Page, PageHeader } from "@/components/Page";
import { StatusChip, leadStatusVariant, leadLevelVariant, trialStatusVariant } from "@/components/ui/StatusChip";
import { api } from "@/lib/trpc/server";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import AddFollowUpForm from "@/components/leads/AddFollowUpForm";

const statusLabels: Record<string, string> = {
  NEW: "新线索",
  FOLLOWING: "跟进中",
  TRIAL_SCHEDULED: "待试听",
  TRIAL_DONE: "已试听",
  CONVERTED: "已转化",
  LOST: "已流失",
};

const levelLabels: Record<string, string> = {
  HOT: "高意向",
  WARM: "中意向",
  COLD: "低意向",
};

const majorLabels: Record<string, string> = {
  FINE_ARTS: "美术",
  DESIGN: "设计",
  MEDIA: "数字媒体",
  MUSIC: "音乐",
  DANCE: "舞蹈",
  OTHER: "其他",
};

const followTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
  PHONE: { label: "电话", icon: "📞", color: "bg-blue-500" },
  WECHAT: { label: "微信", icon: "💬", color: "bg-green-500" },
  VISIT: { label: "到访", icon: "🏢", color: "bg-purple-500" },
  OTHER: { label: "其他", icon: "📝", color: "bg-gray-500" },
};

const trialStatusLabels: Record<string, string> = {
  SCHEDULED: "待上课",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  NO_SHOW: "未出席",
};

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const a = await api();
  const lead = await a.leads.getById(params.id);

  if (!lead) notFound();

  return (
    <Page>
      <PageHeader
        title={lead.name}
        subtitle={`线索详情 · 创建于 ${formatDate(lead.createdAt)}`}
        breadcrumb={[
          { label: "首页", href: "/" },
          { label: "线索管理", href: "/leads" },
          { label: lead.name },
        ]}
        actions={
          <Link href="/leads" className="btn-secondary gap-1.5">
            <ArrowLeft size={16} />
            返回列表
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start gap-4 pb-5 border-b border-deep-blue-100">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-deep-blue-500 to-deep-blue-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {lead.name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h2 className="text-xl font-bold text-deep-blue-800">{lead.name}</h2>
                  <StatusChip variant={leadStatusVariant(lead.status)} size="md">
                    {statusLabels[lead.status]}
                  </StatusChip>
                  <StatusChip variant={leadLevelVariant(lead.level)} size="md">
                    {levelLabels[lead.level]}
                  </StatusChip>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-3">
                  <div className="flex items-center gap-2 text-sm text-deep-blue-600">
                    <Phone size={14} className="text-deep-blue-400" />
                    <span>{lead.phone}</span>
                  </div>
                  {lead.parentName && (
                    <div className="flex items-center gap-2 text-sm text-deep-blue-600">
                      <User size={14} className="text-deep-blue-400" />
                      <span>家长：{lead.parentName}</span>
                    </div>
                  )}
                  {lead.source && (
                    <div className="flex items-center gap-2 text-sm text-deep-blue-600">
                      <MapPin size={14} className="text-deep-blue-400" />
                      <span>来源：{lead.source}</span>
                    </div>
                  )}
                  {lead.intendedMajor && (
                    <div className="flex items-center gap-2 text-sm text-deep-blue-600">
                      <Award size={14} className="text-deep-blue-400" />
                      <span>意向：{majorLabels[lead.intendedMajor]}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-deep-blue-600">
                    <User size={14} className="text-deep-blue-400" />
                    <span>负责人：{lead.assigneeName || "未分配"}</span>
                  </div>
                </div>
                {lead.remark && (
                  <div className="mt-4 p-3 bg-deep-blue-50/50 rounded-lg text-sm text-deep-blue-600">
                    <span className="font-medium text-deep-blue-700">备注：</span>
                    {lead.remark}
                  </div>
                )}
                {lead.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {lead.tags.map((t, i) => (
                      <span
                        key={i}
                        className="chip border border-ink-gold-200 bg-ink-gold-50 text-ink-gold-600 px-2 py-0.5 text-xs"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {lead.trials.length > 0 && (
              <div className="pt-5">
                <h3 className="text-sm font-semibold text-deep-blue-700 mb-3 flex items-center gap-1.5">
                  <Calendar size={16} />
                  试听记录
                  <span className="num ml-1 text-deep-blue-400">({lead.trials.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lead.trials.map((t) => (
                    <div
                      key={t.id}
                      className={cn(
                        "rounded-xl border p-4 transition",
                        t.status === "COMPLETED"
                          ? "border-green-200 bg-green-50/40"
                          : t.status === "SCHEDULED"
                          ? "border-ink-gold-200 bg-ink-gold-50/40"
                          : t.status === "NO_SHOW"
                          ? "border-red-200 bg-red-50/30"
                          : "border-deep-blue-200 bg-deep-blue-50/40"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-deep-blue-800">
                            {t.className || "试听课程"}
                          </div>
                          {t.teacherName && (
                            <div className="text-xs text-deep-blue-500 mt-0.5">
                              老师：{t.teacherName}
                            </div>
                          )}
                        </div>
                        <StatusChip variant={trialStatusVariant(t.status)} size="sm">
                          {trialStatusLabels[t.status]}
                        </StatusChip>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-deep-blue-600 mt-2">
                        <Clock size={13} className="text-deep-blue-400" />
                        <span>
                          {formatDateTime(t.trialAt)} · {t.durationMinutes}分钟
                        </span>
                      </div>
                      {t.status === "COMPLETED" && t.satisfaction !== undefined && (
                        <div className="flex items-center gap-1 mt-3">
                          <span className="text-xs text-deep-blue-500 mr-1">满意度：</span>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              size={14}
                              className={cn(
                                i <= t.satisfaction!
                                  ? "text-ink-gold-500 fill-ink-gold-500"
                                  : "text-deep-blue-200"
                              )}
                            />
                          ))}
                        </div>
                      )}
                      {t.parentFeedback && (
                        <div className="mt-2 p-2 bg-white rounded-md text-xs text-deep-blue-600">
                          <span className="font-medium text-deep-blue-700">家长反馈：</span>
                          {t.parentFeedback}
                        </div>
                      )}
                      {t.teacherRemark && (
                        <div className="mt-2 p-2 bg-white rounded-md text-xs text-deep-blue-600">
                          <span className="font-medium text-deep-blue-700">老师评价：</span>
                          {t.teacherRemark}
                        </div>
                      )}
                      {t.scheduledByName && (
                        <div className="text-xs text-deep-blue-400 mt-2">
                          排课人：{t.scheduledByName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <AddFollowUpForm leadId={lead.id} />

            <div className="card">
              <h3 className="text-sm font-semibold text-deep-blue-700 mb-4 flex items-center gap-1.5">
                <MessageCircle size={16} />
                跟进时间线
                <span className="num ml-1 text-deep-blue-400">({lead.followUps.length})</span>
              </h3>

              {lead.followUps.length === 0 ? (
                <div className="py-8 text-center text-sm text-deep-blue-400">
                  暂无跟进记录
                </div>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-deep-blue-200" />
                  <div className="space-y-5">
                    {lead.followUps.map((fu) => {
                      const type = followTypeLabels[fu.type] || followTypeLabels.OTHER;
                      return (
                        <div key={fu.id} className="relative">
                          <div
                            className={cn(
                              "absolute -left-[22px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ring-white",
                              type.color
                            )}
                          />
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="chip border border-deep-blue-100 bg-deep-blue-50 text-deep-blue-600 px-2 py-0.5 text-xs">
                              <span className="mr-1">{type.icon}</span>
                              {type.label}
                            </span>
                            <span className="text-xs text-deep-blue-500">
                              {formatDateTime(fu.createdAt)}
                            </span>
                            <span className="text-xs text-deep-blue-600 font-medium">
                              {fu.staffName}
                            </span>
                          </div>
                          <p className="text-sm text-deep-blue-700 leading-relaxed">
                            {fu.content}
                          </p>
                          {fu.nextFollowAt && (
                            <div className="mt-2 inline-flex items-center gap-1 text-xs text-ink-gold-600 bg-ink-gold-50 px-2 py-1 rounded-md">
                              <Calendar size={12} />
                              下次跟进：{formatDateTime(fu.nextFollowAt)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-deep-blue-700 mb-3">统计信息</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-deep-blue-50/60 rounded-lg">
                <div className="text-xs text-deep-blue-500 mb-1">跟进次数</div>
                <div className="text-2xl font-bold text-deep-blue-700 num">
                  {lead.followUps.length}
                </div>
              </div>
              <div className="p-3 bg-ink-gold-50/60 rounded-lg">
                <div className="text-xs text-deep-blue-500 mb-1">试听次数</div>
                <div className="text-2xl font-bold text-ink-gold-600 num">
                  {lead.trials.length}
                </div>
              </div>
            </div>
          </div>

          {lead.convertedStudent && (
            <div className="card border-success-green/40 bg-green-50/40">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-success-green/10 flex items-center justify-center">
                  <Award size={16} className="text-success-green" />
                </div>
                <div>
                  <div className="text-xs text-deep-blue-500">已转化学员</div>
                  <div className="text-sm font-semibold text-deep-blue-700">
                    {lead.convertedStudent.name}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-deep-blue-600">
                {lead.convertedStudent.grade && (
                  <div>年级：{lead.convertedStudent.grade}</div>
                )}
                <div>
                  课时：<span className="num">{lead.convertedStudent.remainingHours}</span> /
                  <span className="num"> {lead.convertedStudent.totalHours}h</span>
                </div>
                <div>状态：{lead.convertedStudent.status === "ACTIVE" ? "在读" : "已结业"}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
