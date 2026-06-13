"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  BarChart3,
  Clock,
  SlidersHorizontal,
  Bell,
} from "lucide-react";
import { mockData } from "@/utils/mockData";
import {
  severityConfig,
  periodConfig,
  thresholdTypeConfig,
  directionConfig,
} from "@/utils/format";
import { api } from "@/trpc/react";

const STEPS = [
  { title: "选择指标", icon: BarChart3 },
  { title: "设置时间范围", icon: Clock },
  { title: "配置阈值", icon: SlidersHorizontal },
  { title: "告警渠道", icon: Bell },
];

const channelOptions = [
  { type: "in_app", label: "站内信", description: "系统内消息通知" },
  { type: "email", label: "邮件", description: "发送邮件通知" },
  { type: "wework", label: "企业微信", description: "推送至企业微信" },
];

export default function NewAlertRulePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [ruleName, setRuleName] = useState("");
  const [selectedMetricId, setSelectedMetricId] = useState("");
  const [period, setPeriod] = useState<"DAY" | "WEEK" | "MONTH">("DAY");
  const [thresholdType, setThresholdType] = useState<"ABSOLUTE" | "PERCENTAGE">("PERCENTAGE");
  const [thresholdValue, setThresholdValue] = useState("");
  const [direction, setDirection] = useState<"ABOVE" | "BELOW" | "BOTH">("BELOW");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["in_app"]);
  const [recipients, setRecipients] = useState("");

  const createMutation = api.alertRule.create.useMutation();
  const ctx = api.useUtils();
  const metricsQuery = api.metric.list.useQuery();

  const metrics = metricsQuery.data && metricsQuery.data.length > 0
    ? metricsQuery.data
    : mockData.metrics;

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return !!selectedMetricId && !!ruleName.trim();
      case 1:
        return !!period;
      case 2:
        return !!thresholdValue && Number(thresholdValue) !== 0;
      case 3:
        return selectedChannels.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    const recipientList = recipients
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const channels = selectedChannels.map((type) => ({
      type: type as "in_app" | "email" | "wework",
      recipients: recipientList.length > 0 ? recipientList : ["all"],
    }));

    const data = {
      name: ruleName,
      metricId: selectedMetricId,
      period,
      thresholdType,
      thresholdValue: Number(thresholdValue),
      direction,
      severity,
      channels,
    };

    createMutation.mutate(data, {
      onSuccess: () => {
        ctx.alertRule.list.invalidate();
        router.push("/alerts/rules");
      },
    });
  };

  const toggleChannel = (type: string) => {
    setSelectedChannels((prev) =>
      prev.includes(type) ? prev.filter((c) => c !== type) : [...prev, type]
    );
  };

  const selectedMetric = metrics.find((m) => m.id === selectedMetricId);

  if (metricsQuery.isLoading) {
    return (
      <div className="animate-fade-in max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="h-7 w-32 bg-neutral-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-neutral-200 rounded animate-pulse" />
        </div>
        <div className="card p-12">
          <div className="h-6 w-40 bg-neutral-200 rounded animate-pulse mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-neutral-900">新建告警规则</h1>
        <p className="text-sm text-neutral-500 mt-1">按步骤配置新的告警规则</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={index} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted
                        ? "bg-primary-600 text-white"
                        : isActive
                        ? "bg-primary-50 border-2 border-primary-600 text-primary-600"
                        : "bg-neutral-100 text-neutral-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      isActive || isCompleted ? "text-primary-700" : "text-neutral-400"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 mt-[-1.25rem] ${
                      index < currentStep ? "bg-primary-600" : "bg-neutral-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {createMutation.isError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            创建失败：{createMutation.error.message || "请稍后重试"}
          </p>
        </div>
      )}

      <div className="card p-6 mb-6">
        {currentStep === 0 && (
          <div>
            <h2 className="text-base font-semibold text-neutral-800 mb-1">选择监控指标</h2>
            <p className="text-sm text-neutral-500 mb-4">设置规则名称并选择需要监控异常的销售指标</p>

            <div className="mb-5">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                规则名称
              </label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="例如：日销售额下降告警"
                className="input"
              />
            </div>

            <div className="space-y-2">
              {metrics.map((metric) => (
                <button
                  key={metric.id}
                  onClick={() => setSelectedMetricId(metric.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedMetricId === metric.id
                      ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                      : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-800">
                          {metric.name}
                        </span>
                        <span className="badge badge-neutral">{metric.category}</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {metric.code} · {metric.unit} · {metric.description}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedMetricId === metric.id
                          ? "border-primary-600 bg-primary-600"
                          : "border-neutral-300"
                      }`}
                    >
                      {selectedMetricId === metric.id && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <h2 className="text-base font-semibold text-neutral-800 mb-1">设置时间范围</h2>
            <p className="text-sm text-neutral-500 mb-4">
              选择数据统计周期和比较时间范围
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                统计周期
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(periodConfig) as Array<"DAY" | "WEEK" | "MONTH">).map(
                  (key) => (
                    <button
                      key={key}
                      onClick={() => setPeriod(key)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        period === key
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                      }`}
                    >
                      <span className="text-sm font-medium">{periodConfig[key].label}</span>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {key === "DAY" ? "每日统计" : key === "WEEK" ? "每周统计" : "每月统计"}
                      </p>
                    </button>
                  )
                )}
              </div>
            </div>

            {selectedMetric && (
              <div className="p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm text-neutral-600">
                  当前选择指标：<span className="font-medium text-neutral-800">{selectedMetric.name}</span>
                  <span className="text-neutral-400 ml-2">({selectedMetric.code})</span>
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 className="text-base font-semibold text-neutral-800 mb-1">配置阈值</h2>
            <p className="text-sm text-neutral-500 mb-4">
              设定触发告警的阈值条件和严重程度
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  阈值类型
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(thresholdTypeConfig) as Array<"ABSOLUTE" | "PERCENTAGE">).map(
                    (key) => (
                      <button
                        key={key}
                        onClick={() => setThresholdType(key)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          thresholdType === key
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {thresholdTypeConfig[key].label}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  阈值
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(e.target.value)}
                    placeholder={
                      thresholdType === "PERCENTAGE" ? "例如: 10" : "例如: 50000"
                    }
                    className="input pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                    {thresholdType === "PERCENTAGE" ? "%" : selectedMetric?.unit || "元"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  偏离方向
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(directionConfig) as Array<"ABOVE" | "BELOW" | "BOTH">).map(
                    (key) => (
                      <button
                        key={key}
                        onClick={() => setDirection(key)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          direction === key
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {directionConfig[key].label}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  严重程度
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {(Object.keys(severityConfig) as Array<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">).map(
                    (key) => {
                      const config = severityConfig[key];
                      return (
                        <button
                          key={key}
                          onClick={() => setSeverity(key)}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            severity === key
                              ? `border-current ${config.bg} ${config.color}`
                              : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                            <span className="text-sm font-medium">{config.label}</span>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 className="text-base font-semibold text-neutral-800 mb-1">告警渠道</h2>
            <p className="text-sm text-neutral-500 mb-4">
              选择告警通知渠道和接收人
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  通知渠道
                </label>
                <div className="space-y-2">
                  {channelOptions.map((channel) => (
                    <button
                      key={channel.type}
                      onClick={() => toggleChannel(channel.type)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedChannels.includes(channel.type)
                          ? "border-primary-500 bg-primary-50"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-neutral-800">
                            {channel.label}
                          </span>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {channel.description}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedChannels.includes(channel.type)
                              ? "bg-primary-600 border-primary-600"
                              : "border-neutral-300"
                          }`}
                        >
                          {selectedChannels.includes(channel.type) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  接收人
                </label>
                <input
                  type="text"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="输入接收人邮箱或用户名，多个用逗号分隔"
                  className="input"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={currentStep === 0 ? () => router.push("/alerts/rules") : handlePrev}
          className="btn btn-secondary"
        >
          {currentStep === 0 ? (
            <>
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </>
          ) : (
            <>
              <ArrowLeft className="w-4 h-4" />
              上一步
            </>
          )}
        </button>

        <div className="flex items-center gap-3">
          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="btn btn-primary"
            >
              下一步
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!canGoNext() || createMutation.isPending}
              className="btn btn-primary"
            >
              <Check className="w-4 h-4" />
              {createMutation.isPending ? "保存中..." : "保存规则"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
