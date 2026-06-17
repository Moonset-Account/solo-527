"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Edit2,
  Power,
  PowerOff,
  Download,
  TrendingUp,
  Calendar,
  Users,
  Bell,
  Mail,
  MessageCircle,
  Smartphone,
  Filter,
  ChevronDown,
  Layers,
  BarChart3,
  Clock,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { TrendChart } from "@/components/TrendChart";
import { RemarkModal } from "@/components/RemarkModal";
import { Modal } from "@/components/Modal";
import { mockMetrics, getMockMetricData, mockUsers } from "@/services/mockData";
import type { Metric, DimensionConfig, AlertRule, Subscription, MetricDataPoint } from "@/types";
import {
  cn,
  formatNumber,
  formatPercent,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  generateId,
} from "@/lib/utils";

const channelLabels: Record<string, string> = {
  EMAIL: "邮件",
  WECHAT: "微信",
  SMS: "短信",
};

const channelIcons: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="w-3.5 h-3.5" />,
  WECHAT: <MessageCircle className="w-3.5 h-3.5" />,
  SMS: <Smartphone className="w-3.5 h-3.5" />,
};

const alertTypeLabels: Record<string, string> = {
  THRESHOLD: "阈值告警",
  ANOMALY: "异常检测",
};

const operatorLabels: Record<string, string> = {
  GT: "大于",
  GTE: "大于等于",
  LT: "小于",
  LTE: "小于等于",
  EQ: "等于",
  BETWEEN: "区间",
};

export default function MetricDetailPage() {
  const params = useParams();
  const router = useRouter();
  const metricId = params.id as string;

  const metric = useMemo(() => {
    return mockMetrics.find((m) => m.id === metricId) || mockMetrics[0];
  }, [metricId]);

  const [dimensions, setDimensions] = useState<DimensionConfig[]>(metric.dimensions);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(metric.subscriptions);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(metric.alertRules);

  const [trendMode, setTrendMode] = useState<"current" | "yoy" | "mom">("current");
  const [detailFilters, setDetailFilters] = useState({ startDate: "", endDate: "" });
  const [searchDetail, setSearchDetail] = useState("");

  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [remarkModalConfig, setRemarkModalConfig] = useState<{
    title: string;
    placeholder: string;
    onConfirm: (remark: string) => void | Promise<void>;
  }>({
    title: "请输入备注",
    placeholder: "请输入操作备注...",
    onConfirm: async (remark: string) => {},
  });

  const [dimensionModalOpen, setDimensionModalOpen] = useState(false);
  const [editingDimension, setEditingDimension] = useState<DimensionConfig | null>(null);
  const [dimensionForm, setDimensionForm] = useState({ name: "", key: "", values: "" });

  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [subscriptionForm, setSubscriptionForm] = useState({
    name: "",
    subscribers: [] as string[],
    channels: [] as string[],
    hour: 9,
    minute: 0,
  });

  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertRule | null>(null);
  const [alertForm, setAlertForm] = useState({
    name: "",
    type: "THRESHOLD",
    operator: "LT",
    threshold: 0,
    notificationChannels: [] as string[],
    notifyUsers: [] as string[],
  });

  const trendData = useMemo(() => {
    const currentData = getMockMetricData(metricId);
    const series = [
      {
        dataKey: "current",
        name: "当前值",
        color: "#3B82F6",
        data: currentData,
      },
    ];

    if (trendMode === "yoy") {
      const yoyData = currentData.map((d) => ({
        ...d,
        value: d.value * (0.8 + Math.random() * 0.4),
      }));
      series.push({
        dataKey: "yoy",
        name: "同比",
        color: "#10B981",
        data: yoyData,
      });
    } else if (trendMode === "mom") {
      const momData = currentData.map((d) => ({
        ...d,
        value: d.value * (0.9 + Math.random() * 0.2),
      }));
      series.push({
        dataKey: "mom",
        name: "环比",
        color: "#F59E0B",
        data: momData,
      });
    }

    return series;
  }, [metricId, trendMode]);

  const detailData = useMemo(() => {
    const baseData = getMockMetricData(metricId);
    return baseData
      .map((d, i) => ({
        ...d,
        id: `detail-${i}`,
        channel: ["自然流量", "广告投放", "社交媒体", "应用商店"][i % 4],
        region: ["华东", "华北", "华南", "西南", "东北"][i % 5],
        device: ["iOS", "Android", "Web"][i % 3],
      }))
      .filter((d) => {
        const matchesSearch =
          d.channel.includes(searchDetail) ||
          d.region.includes(searchDetail) ||
          d.device.includes(searchDetail);
        const matchesStart = !detailFilters.startDate || d.date >= detailFilters.startDate;
        const matchesEnd = !detailFilters.endDate || d.date <= detailFilters.endDate;
        return matchesSearch && matchesStart && matchesEnd;
      });
  }, [metricId, searchDetail, detailFilters]);

  const openRemarkModal = (config: {
    title: string;
    placeholder: string;
    onConfirm: (remark: string) => void | Promise<void>;
  }) => {
    setRemarkModalConfig(config);
    setRemarkModalOpen(true);
  };

  const handleToggleDimension = (dim: DimensionConfig) => {
    openRemarkModal({
      title: dim.isActive ? "停用维度" : "启用维度",
      placeholder: `请输入${dim.isActive ? "停用" : "启用"}维度"${dim.name}"的原因...`,
      onConfirm: async (remark) => {
        setDimensions((prev) =>
          prev.map((d) => (d.id === dim.id ? { ...d, isActive: !d.isActive } : d))
        );
        console.log("操作备注:", remark);
      },
    });
  };

  const handleEditDimension = (dim?: DimensionConfig) => {
    if (dim) {
      setEditingDimension(dim);
      setDimensionForm({
        name: dim.name,
        key: dim.key,
        values: dim.values.join(", "),
      });
    } else {
      setEditingDimension(null);
      setDimensionForm({ name: "", key: "", values: "" });
    }
    setDimensionModalOpen(true);
  };

  const handleSaveDimension = () => {
    setDimensionModalOpen(false);
    openRemarkModal({
      title: editingDimension ? "编辑维度" : "新增维度",
      placeholder: `请输入${editingDimension ? "编辑" : "新增"}维度"${dimensionForm.name}"的原因...`,
      onConfirm: async (remark) => {
        const newDim: DimensionConfig = {
          id: editingDimension?.id || generateId(),
          name: dimensionForm.name,
          key: dimensionForm.key,
          values: dimensionForm.values.split(",").map((v) => v.trim()),
          isActive: editingDimension?.isActive ?? true,
          sortOrder: editingDimension?.sortOrder ?? dimensions.length + 1,
        };

        if (editingDimension) {
          setDimensions((prev) => prev.map((d) => (d.id === editingDimension.id ? newDim : d)));
        } else {
          setDimensions((prev) => [...prev, newDim]);
        }
        console.log("操作备注:", remark);
      },
    });
  };

  const handleEditSubscription = (sub?: Subscription) => {
    if (sub) {
      setEditingSubscription(sub);
      setSubscriptionForm({
        name: sub.name,
        subscribers: sub.subscribers,
        channels: sub.channels,
        hour: sub.schedule.hour,
        minute: sub.schedule.minute,
      });
    } else {
      setEditingSubscription(null);
      setSubscriptionForm({
        name: "",
        subscribers: [],
        channels: [],
        hour: 9,
        minute: 0,
      });
    }
    setSubscriptionModalOpen(true);
  };

  const handleSaveSubscription = () => {
    setSubscriptionModalOpen(false);
    openRemarkModal({
      title: editingSubscription ? "编辑订阅" : "新增订阅",
      placeholder: `请输入${editingSubscription ? "编辑" : "新增"}订阅"${subscriptionForm.name}"的原因...`,
      onConfirm: async (remark) => {
        const newSub: Subscription = {
          id: editingSubscription?.id || generateId(),
          metricId: metric.id,
          name: subscriptionForm.name,
          dimensions: null,
          channels: subscriptionForm.channels as any,
          subscribers: subscriptionForm.subscribers,
          schedule: {
            hour: subscriptionForm.hour,
            minute: subscriptionForm.minute,
            timezone: "Asia/Shanghai",
          },
          templateId: null,
          isEnabled: editingSubscription?.isEnabled ?? true,
          createdBy: "user-1",
          createdAt: new Date(),
        };

        if (editingSubscription) {
          setSubscriptions((prev) =>
            prev.map((s) => (s.id === editingSubscription.id ? newSub : s))
          );
        } else {
          setSubscriptions((prev) => [...prev, newSub]);
        }
        console.log("操作备注:", remark);
      },
    });
  };

  const handleToggleSubscription = (sub: Subscription) => {
    openRemarkModal({
      title: sub.isEnabled ? "停用订阅" : "启用订阅",
      placeholder: `请输入${sub.isEnabled ? "停用" : "启用"}订阅"${sub.name}"的原因...`,
      onConfirm: async (remark) => {
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === sub.id ? { ...s, isEnabled: !s.isEnabled } : s))
        );
        console.log("操作备注:", remark);
      },
    });
  };

  const handleEditAlert = (rule?: AlertRule) => {
    if (rule) {
      setEditingAlert(rule);
      setAlertForm({
        name: rule.name,
        type: rule.type,
        operator: rule.operator,
        threshold: rule.threshold,
        notificationChannels: rule.notificationChannels,
        notifyUsers: rule.notifyUsers,
      });
    } else {
      setEditingAlert(null);
      setAlertForm({
        name: "",
        type: "THRESHOLD",
        operator: "LT",
        threshold: 0,
        notificationChannels: [],
        notifyUsers: [],
      });
    }
    setAlertModalOpen(true);
  };

  const handleSaveAlert = () => {
    setAlertModalOpen(false);
    openRemarkModal({
      title: editingAlert ? "编辑告警规则" : "新增告警规则",
      placeholder: `请输入${editingAlert ? "编辑" : "新增"}告警规则"${alertForm.name}"的原因...`,
      onConfirm: async (remark) => {
        const newRule: AlertRule = {
          id: editingAlert?.id || generateId(),
          metricId: metric.id,
          name: alertForm.name,
          type: alertForm.type as any,
          operator: alertForm.operator as any,
          threshold: alertForm.threshold,
          thresholdMin: null,
          thresholdMax: null,
          detectionAlgorithm: "THREE_SIGMA",
          notificationChannels: alertForm.notificationChannels as any,
          notifyUsers: alertForm.notifyUsers,
          silentPeriodStart: null,
          silentPeriodEnd: null,
          isEnabled: editingAlert?.isEnabled ?? true,
        };

        if (editingAlert) {
          setAlertRules((prev) =>
            prev.map((r) => (r.id === editingAlert.id ? newRule : r))
          );
        } else {
          setAlertRules((prev) => [...prev, newRule]);
        }
        console.log("操作备注:", remark);
      },
    });
  };

  const handleToggleAlert = (rule: AlertRule) => {
    openRemarkModal({
      title: rule.isEnabled ? "停用告警规则" : "启用告警规则",
      placeholder: `请输入${rule.isEnabled ? "停用" : "启用"}告警规则"${rule.name}"的原因...`,
      onConfirm: async (remark) => {
        setAlertRules((prev) =>
          prev.map((r) => (r.id === rule.id ? { ...r, isEnabled: !r.isEnabled } : r))
        );
        console.log("操作备注:", remark);
      },
    });
  };

  const handleExport = () => {
    console.log("导出数据:", detailData);
  };

  const formatValue = (value: number): string => {
    if (metric.unit === "%") {
      return formatPercent(value);
    }
    return formatNumber(value);
  };

  const dimensionColumns: Column<DimensionConfig>[] = [
    {
      key: "name",
      title: "维度名称",
      dataIndex: "name",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{record.name}</p>
            <p className="text-xs text-muted font-mono">{record.key}</p>
          </div>
        </div>
      ),
    },
    {
      key: "values",
      title: "维度值",
      dataIndex: "values",
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {(value as string[]).slice(0, 3).map((v, i) => (
            <span key={i} className="px-2 py-0.5 bg-muted/10 text-muted text-xs rounded">
              {v}
            </span>
          ))}
          {(value as string[]).length > 3 && (
            <span className="px-2 py-0.5 bg-muted/10 text-muted text-xs rounded">
              +{(value as string[]).length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "sortOrder",
      title: "排序",
      dataIndex: "sortOrder",
      align: "center",
    },
    {
      key: "isActive",
      title: "状态",
      dataIndex: "isActive",
      align: "center",
      render: (value) => (
        <StatusBadge status={value ? "normal" : "pending"}>
          {value ? "已启用" : "已停用"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      title: "操作",
      dataIndex: "id",
      align: "center",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={(e) => {
              e.stopPropagation();
              handleEditDimension(record);
            }}
          >
            编辑
          </Button>
          <Button
            variant={record.isActive ? "danger" : "primary"}
            size="sm"
            leftIcon={record.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleDimension(record);
            }}
          >
            {record.isActive ? "停用" : "启用"}
          </Button>
        </div>
      ),
    },
  ];

  const alertColumns: Column<AlertRule>[] = [
    {
      key: "name",
      title: "规则名称",
      dataIndex: "name",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-danger" />
          </div>
          <div>
            <p className="font-medium text-foreground">{record.name}</p>
            <p className="text-xs text-muted">
              {alertTypeLabels[record.type]} · {operatorLabels[record.operator]} {formatValue(record.threshold)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "notificationChannels",
      title: "推送渠道",
      dataIndex: "notificationChannels",
      render: (value) => (
        <div className="flex gap-1">
          {(value as string[]).map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
            >
              {channelIcons[c]}
              {channelLabels[c]}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "notifyUsers",
      title: "通知人员",
      dataIndex: "notifyUsers",
      render: (value) => (
        <div className="flex -space-x-2">
          {(value as string[]).slice(0, 3).map((uid) => {
            const user = mockUsers.find((u) => u.id === uid);
            return (
              <div
                key={uid}
                className="w-7 h-7 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-xs font-medium text-primary"
                title={user?.name}
              >
                {user?.name?.charAt(0)}
              </div>
            );
          })}
          {(value as string[]).length > 3 && (
            <div className="w-7 h-7 rounded-full bg-muted/20 border-2 border-card flex items-center justify-center text-xs font-medium text-muted">
              +{(value as string[]).length - 3}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "isEnabled",
      title: "状态",
      dataIndex: "isEnabled",
      align: "center",
      render: (value) => (
        <StatusBadge status={value ? "normal" : "pending"}>
          {value ? "已启用" : "已停用"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      title: "操作",
      dataIndex: "id",
      align: "center",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={(e) => {
              e.stopPropagation();
              handleEditAlert(record);
            }}
          >
            编辑
          </Button>
          <Button
            variant={record.isEnabled ? "danger" : "primary"}
            size="sm"
            leftIcon={record.isEnabled ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleAlert(record);
            }}
          >
            {record.isEnabled ? "停用" : "启用"}
          </Button>
        </div>
      ),
    },
  ];

  const detailColumns: Column<any>[] = [
    {
      key: "date",
      title: "日期",
      dataIndex: "date",
      sortable: true,
      render: (value) => formatDate(value as string),
    },
    {
      key: "channel",
      title: "渠道",
      dataIndex: "channel",
      sortable: true,
    },
    {
      key: "region",
      title: "地区",
      dataIndex: "region",
      sortable: true,
    },
    {
      key: "device",
      title: "设备",
      dataIndex: "device",
      sortable: true,
    },
    {
      key: "value",
      title: "数值",
      dataIndex: "value",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="font-semibold font-display">{formatValue(value as number)}</span>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "指标管理", href: "/metrics" },
            { label: metric.name },
          ]}
        />

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{metric.name}</h1>
              <span className="px-2.5 py-1 bg-muted/10 text-muted font-mono text-sm rounded">
                {metric.code}
              </span>
              <StatusBadge
                status={
                  metric.status === "NORMAL"
                    ? "normal"
                    : metric.status === "WARNING"
                    ? "warning"
                    : "critical"
                }
              >
                {metric.status === "NORMAL" ? "正常" : metric.status === "WARNING" ? "警告" : "严重"}
              </StatusBadge>
            </div>
            <p className="text-sm text-muted mt-2">{metric.description}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-foreground font-display">
              {formatValue(metric.currentValue)}
              <span className="text-lg font-normal text-muted ml-1">
                {metric.unit === "%" ? "" : metric.unit}
              </span>
            </p>
            <p
              className={cn(
                "text-sm font-medium mt-1",
                metric.changeRate > 0 && "text-success",
                metric.changeRate < 0 && "text-danger"
              )}
            >
              {metric.changeRate > 0 ? "↑" : metric.changeRate < 0 ? "↓" : ""}{" "}
              {formatPercent(Math.abs(metric.changeRate))} 较昨日
            </p>
          </div>
        </div>

        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <span>维度配置</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => handleEditDimension()}
              >
                添加维度
              </Button>
            </div>
          }
          description="配置指标的分析维度，支持多维度下钻分析"
        >
          <DataTable
            columns={dimensionColumns as any}
            data={dimensions as any}
            rowKey="id"
            pagination={false}
            showHeader={true}
          />
        </Card>

        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>日报订阅</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => handleEditSubscription()}
              >
                添加订阅
              </Button>
            </div>
          }
          description="配置日报推送规则，定时发送指标数据给相关人员"
        >
          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无订阅配置</p>
              <p className="text-sm mt-1">点击上方按钮添加日报订阅</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-4 bg-muted/5 rounded-lg border border-card-border"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        sub.isEnabled ? "bg-primary/10" : "bg-muted/10"
                      )}
                    >
                      <Mail
                        className={cn("w-5 h-5", sub.isEnabled ? "text-primary" : "text-muted")}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{sub.name}</p>
                        <StatusBadge status={sub.isEnabled ? "normal" : "pending"} size="sm">
                          {sub.isEnabled ? "已启用" : "已停用"}
                        </StatusBadge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {sub.subscribers.length} 人
                        </span>
                        <span className="flex items-center gap-1">
                          <Bell className="w-3.5 h-3.5" />
                          {sub.channels.map((c) => channelLabels[c]).join("、")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          每日 {String(sub.schedule.hour).padStart(2, "0")}:
                          {String(sub.schedule.minute).padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      onClick={() => handleEditSubscription(sub)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant={sub.isEnabled ? "danger" : "primary"}
                      size="sm"
                      leftIcon={
                        sub.isEnabled ? (
                          <PowerOff className="w-3.5 h-3.5" />
                        ) : (
                          <Power className="w-3.5 h-3.5" />
                        )
                      }
                      onClick={() => handleToggleSubscription(sub)}
                    >
                      {sub.isEnabled ? "停用" : "启用"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <span>告警规则</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => handleEditAlert()}
              >
                添加规则
              </Button>
            </div>
          }
          description="配置指标异常告警规则，及时发现数据异常"
        >
          <DataTable
            columns={alertColumns as any}
            data={alertRules as any}
            rowKey="id"
            pagination={false}
            showHeader={true}
          />
        </Card>

        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>历史趋势</span>
              </div>
              <div className="flex gap-2">
                {(["current", "yoy", "mom"] as const).map((mode) => (
                  <Button
                    key={mode}
                    variant={trendMode === mode ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setTrendMode(mode)}
                  >
                    {mode === "current" ? "当前" : mode === "yoy" ? "同比" : "环比"}
                  </Button>
                ))}
              </div>
            </div>
          }
          description="近30天指标趋势变化"
        >
          <TrendChart series={trendData} height={350} />
        </Card>

        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span>明细查询</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleExport}
              >
                导出数据
              </Button>
            </div>
          }
          description="多维度查询指标明细数据"
        >
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="搜索渠道、地区、设备..."
                value={searchDetail}
                onChange={(e) => setSearchDetail(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted" />
                <input
                  type="date"
                  value={detailFilters.startDate}
                  onChange={(e) =>
                    setDetailFilters((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  className="px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              <span className="text-muted self-center">至</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted" />
                <input
                  type="date"
                  value={detailFilters.endDate}
                  onChange={(e) =>
                    setDetailFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>
          </div>

          <DataTable
            columns={detailColumns as any}
            data={detailData as any}
            rowKey="id"
            pageSize={10}
          />
        </Card>
      </div>

      <RemarkModal
        isOpen={remarkModalOpen}
        onClose={() => setRemarkModalOpen(false)}
        title={remarkModalConfig.title}
        placeholder={remarkModalConfig.placeholder}
        onConfirm={async (remark) => {
          await remarkModalConfig.onConfirm(remark);
          setRemarkModalOpen(false);
        }}
      />

      <Modal
        isOpen={dimensionModalOpen}
        onClose={() => setDimensionModalOpen(false)}
        title={editingDimension ? "编辑维度" : "新增维度"}
        onConfirm={handleSaveDimension}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              维度名称 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={dimensionForm.name}
              onChange={(e) =>
                setDimensionForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="请输入维度名称，如：渠道、地区"
              className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              维度Key <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={dimensionForm.key}
              onChange={(e) =>
                setDimensionForm((prev) => ({ ...prev, key: e.target.value }))
              }
              placeholder="请输入维度Key，如：channel、region"
              className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              维度值 <span className="text-danger">*</span>
            </label>
            <textarea
              value={dimensionForm.values}
              onChange={(e) =>
                setDimensionForm((prev) => ({ ...prev, values: e.target.value }))
              }
              placeholder="请输入维度值，多个值用逗号分隔，如：自然流量, 广告投放, 社交媒体"
              rows={3}
              className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        title={editingSubscription ? "编辑订阅" : "新增订阅"}
        onConfirm={handleSaveSubscription}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              订阅名称 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={subscriptionForm.name}
              onChange={(e) =>
                setSubscriptionForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="请输入订阅名称"
              className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              推送渠道 <span className="text-danger">*</span>
            </label>
            <div className="flex gap-3">
              {Object.entries(channelLabels).map(([key, label]) => (
                <label
                  key={key}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-all",
                    subscriptionForm.channels.includes(key)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-card-border hover:border-primary/50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={subscriptionForm.channels.includes(key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSubscriptionForm((prev) => ({
                          ...prev,
                          channels: [...prev.channels, key],
                        }));
                      } else {
                        setSubscriptionForm((prev) => ({
                          ...prev,
                          channels: prev.channels.filter((c) => c !== key),
                        }));
                      }
                    }}
                    className="hidden"
                  />
                  {channelIcons[key]}
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              订阅人员 <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {mockUsers.map((user) => (
                <label
                  key={user.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-all",
                    subscriptionForm.subscribers.includes(user.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-card-border hover:border-primary/50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={subscriptionForm.subscribers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSubscriptionForm((prev) => ({
                          ...prev,
                          subscribers: [...prev.subscribers, user.id],
                        }));
                      } else {
                        setSubscriptionForm((prev) => ({
                          ...prev,
                          subscribers: prev.subscribers.filter((s) => s !== user.id),
                        }));
                      }
                    }}
                    className="hidden"
                  />
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs opacity-70">{user.department}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              推送时间 <span className="text-danger">*</span>
            </label>
            <div className="flex items-center gap-2">
              <select
                value={subscriptionForm.hour}
                onChange={(e) =>
                  setSubscriptionForm((prev) => ({
                    ...prev,
                    hour: parseInt(e.target.value),
                  }))
                }
                className="px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span className="text-muted">:</span>
              <select
                value={subscriptionForm.minute}
                onChange={(e) =>
                  setSubscriptionForm((prev) => ({
                    ...prev,
                    minute: parseInt(e.target.value),
                  }))
                }
                className="px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                {Array.from({ length: 60 }).map((_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        title={editingAlert ? "编辑告警规则" : "新增告警规则"}
        onConfirm={handleSaveAlert}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              规则名称 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={alertForm.name}
              onChange={(e) =>
                setAlertForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="请输入规则名称"
              className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                告警类型 <span className="text-danger">*</span>
              </label>
              <select
                value={alertForm.type}
                onChange={(e) =>
                  setAlertForm((prev) => ({ ...prev, type: e.target.value }))
                }
                className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                {Object.entries(alertTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                比较方式 <span className="text-danger">*</span>
              </label>
              <select
                value={alertForm.operator}
                onChange={(e) =>
                  setAlertForm((prev) => ({ ...prev, operator: e.target.value }))
                }
                className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                {Object.entries(operatorLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              阈值 <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              value={alertForm.threshold}
              onChange={(e) =>
                setAlertForm((prev) => ({ ...prev, threshold: parseFloat(e.target.value) }))
              }
              placeholder={`请输入阈值，当前单位：${metric.unit}`}
              className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              推送渠道 <span className="text-danger">*</span>
            </label>
            <div className="flex gap-3">
              {Object.entries(channelLabels).map(([key, label]) => (
                <label
                  key={key}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-all",
                    alertForm.notificationChannels.includes(key)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-card-border hover:border-primary/50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={alertForm.notificationChannels.includes(key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAlertForm((prev) => ({
                          ...prev,
                          notificationChannels: [...prev.notificationChannels, key],
                        }));
                      } else {
                        setAlertForm((prev) => ({
                          ...prev,
                          notificationChannels: prev.notificationChannels.filter(
                            (c) => c !== key
                          ),
                        }));
                      }
                    }}
                    className="hidden"
                  />
                  {channelIcons[key]}
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              通知人员 <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {mockUsers.map((user) => (
                <label
                  key={user.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-all",
                    alertForm.notifyUsers.includes(user.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-card-border hover:border-primary/50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={alertForm.notifyUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAlertForm((prev) => ({
                          ...prev,
                          notifyUsers: [...prev.notifyUsers, user.id],
                        }));
                      } else {
                        setAlertForm((prev) => ({
                          ...prev,
                          notifyUsers: prev.notifyUsers.filter((s) => s !== user.id),
                        }));
                      }
                    }}
                    className="hidden"
                  />
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs opacity-70">{user.department}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
