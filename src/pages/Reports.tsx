import { useEffect, useState, useMemo } from "react";
import {
  Card,
  DatePicker,
  Row,
  Col,
  Statistic,
  Tag,
  Tabs,
  Space,
  Button,
  message,
  Spin,
  Divider,
  Typography,
  Result,
} from "antd";
import {
  BarChartOutlined,
  ExclamationCircleOutlined,
  UserAddOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  RiseOutlined,
  FallOutlined,
} from "@ant-design/icons";
import { Line, Column } from "@ant-design/charts";
import dayjs, { Dayjs } from "dayjs";
import { get } from "@/api/client";
import { useAuthStore } from "@/stores/auth";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface SlaItem {
  total: number;
  confirmed: number;
  confirmRate: number;
  avgResponseMinutes: number;
  slaRate: number;
}

interface AccountRequestSlaItem {
  total: number;
  approved: number;
  approvalRate: number;
  avgResponseMinutes: number;
  slaRate: number;
}

interface SlaData {
  alert: SlaItem;
  accountRequest: AccountRequestSlaItem;
}

interface TrendDataPoint {
  total: number;
  byLevel?: Record<string, number>;
  byUrgency?: Record<string, number>;
}

interface TrendData {
  alertTrend: Record<string, TrendDataPoint>;
  requestTrend: Record<string, TrendDataPoint>;
}

const levelColorMap: Record<string, string> = {
  info: "#3182CE",
  warning: "#ECC94B",
  critical: "#E53E3E",
  error: "#E53E3E",
};

const levelLabelMap: Record<string, string> = {
  info: "信息",
  warning: "警告",
  critical: "严重",
  error: "错误",
};

const urgencyColorMap: Record<string, string> = {
  low: "#38A169",
  medium: "#ECC94B",
  high: "#ED8936",
  urgent: "#E53E3E",
};

const urgencyLabelMap: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "紧急",
};

export default function Reports() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [slaData, setSlaData] = useState<SlaData | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(29, "day"),
    dayjs(),
  ]);

  const fetchSla = async (start: string, end: string) => {
    try {
      const result = await get<SlaData>("/api/reports/sla", {
        startDate: start,
        endDate: end,
      });
      setSlaData(result);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "加载SLA概览失败");
    }
  };

  const fetchTrend = async (start: string, end: string) => {
    try {
      const result = await get<TrendData>("/api/reports/trend", {
        startDate: start,
        endDate: end,
        granularity: "day",
      });
      setTrendData(result);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "加载趋势数据失败");
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const start = dateRange[0].startOf("day").toISOString();
      const end = dateRange[1].endOf("day").toISOString();
      await Promise.all([fetchSla(start, end), fetchTrend(start, end)]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin]);

  const handleDateChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates as [Dayjs, Dayjs]);
    }
  };

  const handleQuery = () => {
    if (!dateRange[0] || !dateRange[1]) {
      message.warning("请选择日期范围");
      return;
    }
    loadAllData();
  };

  const alertLineData = useMemo(() => {
    if (!trendData?.alertTrend) return [];
    return Object.entries(trendData.alertTrend)
      .map(([date, info]) => ({
        date: date.slice(5),
        告警数: info.total,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [trendData]);

  const alertLevelData = useMemo(() => {
    if (!trendData?.alertTrend) return [];
    const result: Array<{ date: string; 级别: string; 数量: number }> = [];
    Object.entries(trendData.alertTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, info]) => {
        if (info.byLevel) {
          Object.entries(info.byLevel).forEach(([level, count]) => {
            result.push({
              date: date.slice(5),
              级别: levelLabelMap[level] || level,
              数量: count,
            });
          });
        }
      });
    return result;
  }, [trendData]);

  const requestLineData = useMemo(() => {
    if (!trendData?.requestTrend) return [];
    return Object.entries(trendData.requestTrend)
      .map(([date, info]) => ({
        date: date.slice(5),
        申请数: info.total,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [trendData]);

  const requestUrgencyData = useMemo(() => {
    if (!trendData?.requestTrend) return [];
    const result: Array<{ date: string; 紧急度: string; 数量: number }> = [];
    Object.entries(trendData.requestTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, info]) => {
        if (info.byUrgency) {
          Object.entries(info.byUrgency).forEach(([urgency, count]) => {
            result.push({
              date: date.slice(5),
              紧急度: urgencyLabelMap[urgency] || urgency,
              数量: count,
            });
          });
        }
      });
    return result;
  }, [trendData]);

  const alertLineConfig = {
    data: alertLineData,
    xField: "date",
    yField: "告警数",
    smooth: true,
    height: 300,
    color: "#E53E3E",
    point: { size: 4, shape: "circle" as const },
    label: {
      style: { fill: "#aaa", fontSize: 10 },
    },
  };

  const alertLevelConfig = {
    data: alertLevelData,
    xField: "date",
    yField: "数量",
    seriesField: "级别",
    isGroup: true,
    height: 300,
    color: Object.values(levelColorMap),
    legend: { position: "top" as const },
    label: {
      style: { fill: "#aaa", fontSize: 10 },
    },
  };

  const requestLineConfig = {
    data: requestLineData,
    xField: "date",
    yField: "申请数",
    smooth: true,
    height: 300,
    color: "#ECC94B",
    point: { size: 4, shape: "circle" as const },
    label: {
      style: { fill: "#aaa", fontSize: 10 },
    },
  };

  const requestUrgencyConfig = {
    data: requestUrgencyData,
    xField: "date",
    yField: "数量",
    seriesField: "紧急度",
    isGroup: true,
    height: 300,
    color: Object.values(urgencyColorMap),
    legend: { position: "top" as const },
    label: {
      style: { fill: "#aaa", fontSize: 10 },
    },
  };

  if (!isAdmin) {
    return (
      <Result
        status="403"
        title="无权限访问"
        subTitle="抱歉，该页面仅管理员可访问，请联系管理员获取权限"
      />
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Title level={3} style={{ margin: 0 }}>
          <BarChartOutlined style={{ marginRight: 8 }} />
          时效报表
        </Title>
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            allowClear={false}
            style={{ minWidth: 260 }}
          />
          <Button type="primary" onClick={handleQuery} loading={loading}>
            查询
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadAllData} loading={loading}>
            刷新
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Card title={<span><ClockCircleOutlined style={{ marginRight: 8 }} />SLA 概览</span>} style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                size="small"
                title={
                  <Space>
                    <ExclamationCircleOutlined style={{ color: "#E53E3E" }} />
                    <span style={{ fontWeight: 600 }}>告警</span>
                  </Space>
                }
                style={{ border: "1px solid #FED7D7" }}
              >
                <Row gutter={[12, 12]}>
                  <Col xs={12} sm={8}>
                    <Statistic
                      title={<span style={{ fontSize: 12 }}>总数</span>}
                      value={slaData?.alert.total || 0}
                      prefix={<ExclamationCircleOutlined />}
                      valueStyle={{ fontSize: 20 }}
                    />
                  </Col>
                  <Col xs={12} sm={8}>
                    <Statistic
                      title={<span style={{ fontSize: 12 }}>处理数</span>}
                      value={slaData?.alert.confirmed || 0}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ fontSize: 20, color: "#38A169" }}
                    />
                  </Col>
                  <Col xs={12} sm={8}>
                    <Statistic
                      title={<span style={{ fontSize: 12 }}>处理率</span>}
                      value={slaData?.alert.confirmRate || 0}
                      suffix="%"
                      valueStyle={{ fontSize: 20, color: "#1A365D" }}
                    />
                  </Col>
                  <Col xs={12} sm={8}>
                    <Statistic
                      title={<span style={{ fontSize: 12 }}>平均响应(分钟)</span>}
                      value={slaData?.alert.avgResponseMinutes || 0}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{
                        fontSize: 20,
                        color:
                          (slaData?.alert.avgResponseMinutes || 0) <= 30
                            ? "#38A169"
                            : (slaData?.alert.avgResponseMinutes || 0) <= 60
                            ? "#ECC94B"
                            : "#E53E3E",
                      }}
                    />
                  </Col>
                  <Col xs={24} sm={16}>
                    <div style={{ padding: "8px 12px", borderRadius: 6, background: "#FFF5F5" }}>
                      <Space direction="vertical" size={4} style={{ width: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                          <Text style={{ fontSize: 12, color: "#718096" }}>
                            <RiseOutlined style={{ color: "#38A169", marginRight: 4 }} />
                            SLA 达标率 (目标 ≤30 分钟)
                          </Text>
                          <Tag
                            color={
                              (slaData?.alert.slaRate || 0) >= 95
                                ? "success"
                                : (slaData?.alert.slaRate || 0) >= 80
                                ? "warning"
                                : "error"
                            }
                            style={{ margin: 0 }}
                          >
                            <strong style={{ fontSize: 16 }}>{slaData?.alert.slaRate || 0}%</strong>
                          </Tag>
                        </div>
                      </Space>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                size="small"
                title={
                  <Space>
                    <UserAddOutlined style={{ color: "#D69E2E" }} />
                    <span style={{ fontWeight: 600 }}>账号申请</span>
                  </Space>
                }
                style={{ border: "1px solid #FEFCBF" }}
              >
                <Row gutter={[12, 12]}>
                  <Col xs={12} sm={8}>
                    <Statistic
                      title={<span style={{ fontSize: 12 }}>总数</span>}
                      value={slaData?.accountRequest.total || 0}
                      prefix={<UserAddOutlined />}
                      valueStyle={{ fontSize: 20 }}
                    />
                  </Col>
                  <Col xs={12} sm={8}>
                    <Statistic
                      title={<span style={{ fontSize: 12 }}>审批通过</span>}
                      value={slaData?.accountRequest.approved || 0}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ fontSize: 20, color: "#38A169" }}
                    />
                  </Col>
                  <Col xs={12} sm={8}>
                    <Statistic
                      title={<span style={{ fontSize: 12 }}>审批率</span>}
                      value={slaData?.accountRequest.approvalRate || 0}
                      suffix="%"
                      valueStyle={{ fontSize: 20, color: "#1A365D" }}
                    />
                  </Col>
                  <Col xs={12} sm={8}>
                    <Statistic
                      title={<span style={{ fontSize: 12 }}>平均响应(分钟)</span>}
                      value={slaData?.accountRequest.avgResponseMinutes || 0}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{
                        fontSize: 20,
                        color:
                          (slaData?.accountRequest.avgResponseMinutes || 0) <= 30
                            ? "#38A169"
                            : (slaData?.accountRequest.avgResponseMinutes || 0) <= 60
                            ? "#ECC94B"
                            : "#E53E3E",
                      }}
                    />
                  </Col>
                  <Col xs={24} sm={16}>
                    <div style={{ padding: "8px 12px", borderRadius: 6, background: "#FFFAE5" }}>
                      <Space direction="vertical" size={4} style={{ width: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                          <Text style={{ fontSize: 12, color: "#718096" }}>
                            <RiseOutlined style={{ color: "#38A169", marginRight: 4 }} />
                            SLA 达标率 (目标 ≤30 分钟)
                          </Text>
                          <Tag
                            color={
                              (slaData?.accountRequest.slaRate || 0) >= 95
                                ? "success"
                                : (slaData?.accountRequest.slaRate || 0) >= 80
                                ? "warning"
                                : "error"
                            }
                            style={{ margin: 0 }}
                          >
                            <strong style={{ fontSize: 16 }}>{slaData?.accountRequest.slaRate || 0}%</strong>
                          </Tag>
                        </div>
                      </Space>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Card>

        <Divider style={{ margin: "8px 0 16px 0" }} />

        <Card title={<span><BarChartOutlined style={{ marginRight: 8 }} />趋势分析</span>}>
          <Tabs
            defaultActiveKey="alert"
            items={[
              {
                key: "alert",
                label: (
                  <span>
                    <ExclamationCircleOutlined style={{ color: "#E53E3E" }} />
                    告警趋势
                  </span>
                ),
                children: (
                  <div>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} xl={12}>
                        <Card size="small" title="告警数量趋势 (按日)" styles={{ body: { paddingTop: 8 } }}>
                          {alertLineData.length > 0 ? (
                            <Line {...alertLineConfig} />
                          ) : (
                            <div style={{ textAlign: "center", padding: "60px 0", color: "#8c8c8c" }}>
                              暂无数据
                            </div>
                          )}
                        </Card>
                      </Col>
                      <Col xs={24} xl={12}>
                        <Card size="small" title="告警级别分布 (按日)" styles={{ body: { paddingTop: 8 } }}>
                          {alertLevelData.length > 0 ? (
                            <Column {...alertLevelConfig} />
                          ) : (
                            <div style={{ textAlign: "center", padding: "60px 0", color: "#8c8c8c" }}>
                              暂无数据
                            </div>
                          )}
                        </Card>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: "request",
                label: (
                  <span>
                    <UserAddOutlined style={{ color: "#D69E2E" }} />
                    申请趋势
                  </span>
                ),
                children: (
                  <div>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} xl={12}>
                        <Card size="small" title="申请数量趋势 (按日)" styles={{ body: { paddingTop: 8 } }}>
                          {requestLineData.length > 0 ? (
                            <Line {...requestLineConfig} />
                          ) : (
                            <div style={{ textAlign: "center", padding: "60px 0", color: "#8c8c8c" }}>
                              暂无数据
                            </div>
                          )}
                        </Card>
                      </Col>
                      <Col xs={24} xl={12}>
                        <Card size="small" title="申请紧急度分布 (按日)" styles={{ body: { paddingTop: 8 } }}>
                          {requestUrgencyData.length > 0 ? (
                            <Column {...requestUrgencyConfig} />
                          ) : (
                            <div style={{ textAlign: "center", padding: "60px 0", color: "#8c8c8c" }}>
                              暂无数据
                            </div>
                          )}
                        </Card>
                      </Col>
                    </Row>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </Spin>
    </div>
  );
}
