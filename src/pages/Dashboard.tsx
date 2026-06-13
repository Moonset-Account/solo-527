import { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Tag, List, Spin, message, Typography } from "antd";
import {
  AlertOutlined,
  UserAddOutlined,
  ToolOutlined,
  ScheduleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import { Line } from "@ant-design/charts";
import { useNavigate } from "react-router-dom";
import { get } from "@/api/client";
import { useAuthStore } from "@/stores/auth";

const { Title } = Typography;

interface OverviewData {
  pendingAlerts: number;
  todayAlerts: number;
  pendingRequests: number;
  todayRequests: number;
  pendingInspectionTasks: number;
  pendingTasks: number;
  totalTasks: number;
  pendingTodayTaskCount: number;
  todayDuty: Array<{
    id: number;
    shift: string;
    staff: { id: number; displayName: string };
  }>;
  last7DaysResponse: Record<string, number>;
  avgByType: Record<string, number>;
}

const shiftLabel: Record<string, { text: string; color: string }> = {
  morning: { text: "早班 8:00-16:00", color: "gold" },
  afternoon: { text: "中班 16:00-24:00", color: "blue" },
  night: { text: "夜班 0:00-8:00", color: "purple" },
};

const ticketTypeLabel: Record<string, string> = {
  alert: "告警",
  account_request: "账号申请",
  inspection_task: "巡检任务",
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewData | null>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const result = await get<OverviewData>("/api/reports/overview");
      setData(result);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "加载概览失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading || !data) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  const chartData = Object.entries(data.last7DaysResponse).map(
    ([date, minutes]) => ({
      date,
      响应时长: Math.round(minutes / Math.max(1, Object.values(data.avgByType).reduce((a, b) => a + b, 1) / 10)),
      累计分钟: minutes,
    })
  );

  const lineConfig = {
    data: chartData,
    xField: "date",
    yField: ["累计分钟", "响应时长"],
    smooth: true,
    height: 280,
    legend: { position: "top" as const },
    color: ["#1A365D", "#38B2AC"],
    point: { size: 4, shape: "circle" as const },
    meta: {
      累计分钟: { alias: "累计响应时长(分钟)" },
      响应时长: { alias: "平均响应指数" },
    },
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24, marginTop: 0 }}>
        {isAdmin ? "IT 管理中心总览" : "我的工作台"}
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            onClick={() => navigate("/alerts")}
            style={{ cursor: "pointer" }}
            styles={{ body: { padding: 20 } }}
          >
            <Statistic
              title={
                <span>
                  <ExclamationCircleOutlined
                    style={{ color: "#E53E3E", marginRight: 8 }}
                  />
                  待处理告警
                </span>
              }
              value={data.pendingAlerts}
              valueStyle={{ color: "#E53E3E" }}
              prefix={<AlertOutlined />}
            />
            <div style={{ marginTop: 8, color: "#8c8c8c", fontSize: 12 }}>
              今日新增 {data.todayAlerts} 条
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            onClick={() => navigate("/account-requests")}
            style={{ cursor: "pointer" }}
            styles={{ body: { padding: 20 } }}
          >
            <Statistic
              title={
                <span>
                  <UserAddOutlined
                    style={{ color: "#ECC94B", marginRight: 8 }}
                  />
                  待审批账号申请
                </span>
              }
              value={data.pendingRequests}
              valueStyle={{ color: "#ECC94B" }}
              prefix={<FileDoneOutlined />}
            />
            <div style={{ marginTop: 8, color: "#8c8c8c", fontSize: 12 }}>
              今日新增 {data.todayRequests} 条
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            onClick={() => navigate("/inspections")}
            style={{ cursor: "pointer" }}
            styles={{ body: { padding: 20 } }}
          >
            <Statistic
              title={
                <span>
                  <ToolOutlined style={{ color: "#38B2AC", marginRight: 8 }} />
                  待执行巡检
                </span>
              }
              value={data.pendingInspectionTasks}
              valueStyle={{ color: "#38B2AC" }}
              prefix={<ScheduleOutlined />}
            />
            <div style={{ marginTop: 8, color: "#8c8c8c", fontSize: 12 }}>
              今日待执行 {data.pendingTodayTaskCount} 项
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card styles={{ body: { padding: 20 } }}>
            <Statistic
              title={
                <span>
                  <CheckCircleOutlined
                    style={{ color: "#38A169", marginRight: 8 }}
                  />
                  巡检进度
                </span>
              }
              value={data.totalTasks - data.pendingTasks}
              suffix={`/ ${data.totalTasks}`}
              valueStyle={{ color: "#38A169" }}
              prefix={<ClockCircleOutlined />}
            />
            <div style={{ marginTop: 8, color: "#8c8c8c", fontSize: 12 }}>
              完成率{" "}
              {data.totalTasks > 0
                ? Math.round(
                    ((data.totalTasks - data.pendingTasks) / data.totalTasks) *
                      100
                  )
                : 0}
              %
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={15}>
          <Card
            title={
              <span>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                近 7 天响应时长趋势
              </span>
            }
          >
            {chartData.length > 0 ? (
              <Line {...lineConfig} />
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "#8c8c8c",
                }}
              >
                暂无数据
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card
            title={
              <span>
                <ScheduleOutlined style={{ marginRight: 8 }} />
                今日值班人员
              </span>
            }
          >
            {data.todayDuty.length > 0 ? (
              <List
                size="small"
                dataSource={data.todayDuty}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "#1A365D",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 600,
                          }}
                        >
                          {item.staff.displayName.charAt(0)}
                        </div>
                      }
                      title={
                        <span style={{ fontWeight: 500 }}>
                          {item.staff.displayName}
                        </span>
                      }
                      description={
                        <Tag color={shiftLabel[item.shift]?.color || "default"}>
                          {shiftLabel[item.shift]?.text || item.shift}
                        </Tag>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px 0",
                  color: "#8c8c8c",
                }}
              >
                暂无值班安排
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {Object.keys(data.avgByType).length > 0 && (
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card
              title={
                <span>
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  近 7 天各类工单平均响应时长
                </span>
              }
              size="small"
            >
              <Row gutter={[16, 16]}>
                {Object.entries(data.avgByType).map(([type, avg]) => (
                  <Col xs={24} sm={12} md={8} key={type}>
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 6,
                        background:
                          type === "alert"
                            ? "#FFF5F5"
                            : type === "account_request"
                            ? "#FFFAE5"
                            : "#F0FFF4",
                        border: `1px solid ${
                          type === "alert"
                            ? "#FED7D7"
                            : type === "account_request"
                            ? "#FEFCBF"
                            : "#C6F6D5"
                        }`,
                      }}
                    >
                      <div style={{ color: "#4a5568", fontSize: 13 }}>
                        {ticketTypeLabel[type] || type}
                      </div>
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          marginTop: 4,
                          color:
                            type === "alert"
                              ? "#E53E3E"
                              : type === "account_request"
                              ? "#D69E2E"
                              : "#38A169",
                        }}
                      >
                        {avg}
                        <span style={{ fontSize: 14, fontWeight: 400 }}>
                          {" "}
                          分钟
                        </span>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
