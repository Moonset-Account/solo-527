import { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Select,
  Input,
  Form,
  message,
  Card,
  Spin,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  UserAddOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { get } from "@/api/client";
import { useAuthStore } from "@/stores/auth";

const { Title } = Typography;
const { Option } = Select;

interface RecordItem {
  id: number;
  ticketType: string;
  ticketId: number;
  action: string;
  note?: string;
  operatorId: number;
  duration?: number;
  createdAt: string;
  operator: { id: number; displayName: string };
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface TypeStat {
  avgResponseTime: number;
  avgHandleTime: number;
  count: number;
}

interface StatsData {
  [key: string]: TypeStat;
}

interface FilterValues {
  ticketType?: string;
  ticketId?: string;
}

const ticketTypeMap: Record<string, { label: string; color: string; icon: React.ReactNode; route: string }> = {
  alert: { label: "告警", color: "red", icon: <ExclamationCircleOutlined />, route: "/alerts" },
  account_request: { label: "账号申请", color: "gold", icon: <UserAddOutlined />, route: "/account-requests" },
  inspection_task: { label: "巡检任务", color: "cyan", icon: <ToolOutlined />, route: "/inspections" },
};

const actionLabelMap: Record<string, string> = {
  created: "创建",
  confirmed: "确认",
  approved: "审批通过",
  rejected: "驳回",
  escalated: "升级",
  resolved: "解决",
  executed: "执行",
  assigned: "指派",
};

export default function Records() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [data, setData] = useState<RecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [stats, setStats] = useState<StatsData>({});

  const [form] = Form.useForm<FilterValues>();
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({});

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const result = await get<StatsData>("/api/records/stats");
      setStats(result);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "加载统计数据失败");
    } finally {
      setStatsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, pageSize };
      if (appliedFilters.ticketType) params.ticketType = appliedFilters.ticketType;
      if (appliedFilters.ticketId) params.ticketId = appliedFilters.ticketId;
      const result = await get<Paginated<RecordItem>>("/api/records", params);
      setData(result.items);
      setTotal(result.total);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "加载处理记录失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadStats();
  }, [page, pageSize]);

  const handleSearch = () => {
    const values = form.getFieldsValue();
    setAppliedFilters(values);
    setPage(1);
    setTimeout(() => loadData(), 0);
  };

  const handleReset = () => {
    form.resetFields();
    setAppliedFilters({});
    setPage(1);
    setTimeout(() => loadData(), 0);
  };

  const goToDetail = (ticketType: string, ticketId: number) => {
    const cfg = ticketTypeMap[ticketType];
    if (cfg) {
      navigate(`${cfg.route}/${ticketId}`);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 70,
      render: (v: number) => <span style={{ color: "#8c8c8c" }}>#{v}</span>,
    },
    {
      title: "工单类型",
      dataIndex: "ticketType",
      width: 120,
      render: (v: string) => {
        const cfg = ticketTypeMap[v] || { label: v, color: "default", icon: null };
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "工单ID",
      dataIndex: "ticketId",
      width: 100,
      render: (v: number, r: RecordItem) => (
        <a
          onClick={() => goToDetail(r.ticketType, v)}
          style={{ color: "#1A365D", fontWeight: 500 }}
        >
          #{v}
        </a>
      ),
    },
    {
      title: "动作名",
      dataIndex: "action",
      width: 120,
      render: (v: string) => actionLabelMap[v] || v,
    },
    {
      title: "操作人",
      dataIndex: ["operator", "displayName"],
      width: 120,
      render: (v: string) => v || "-",
    },
    {
      title: "用时(分钟)",
      dataIndex: "duration",
      width: 120,
      render: (v: number | undefined) => {
        if (v == null) return <span style={{ color: "#bfbfbf" }}>-</span>;
        const color = v <= 30 ? "success" : v <= 60 ? "warning" : "error";
        return (
          <Tag color={color} icon={<ClockCircleOutlined />}>
            {v} 分钟
          </Tag>
        );
      },
    },
    {
      title: "备注",
      dataIndex: "note",
      ellipsis: true,
      render: (v: string | undefined) => v || <span style={{ color: "#bfbfbf" }}>-</span>,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      width: 170,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      fixed: "right" as const,
      render: (_: any, r: RecordItem) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => goToDetail(r.ticketType, r.ticketId)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  const statCardList = Object.entries(ticketTypeMap).map(([key, cfg]) => {
    const stat = stats[key];
    return { key, cfg, stat };
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center" }}>
        <Title level={3} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          处理记录
        </Title>
        <Button icon={<ReloadOutlined />} onClick={() => { loadData(); loadStats(); }}>
          刷新
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {statCardList.map(({ key, cfg, stat }) => (
          <Col xs={24} sm={12} lg={8} key={key}>
            <Card styles={{ body: { padding: 16 } }} loading={statsLoading}>
              <div style={{ marginBottom: 12 }}>
                <Tag color={cfg.color} icon={cfg.icon} style={{ fontSize: 14, padding: "4px 10px" }}>
                  <strong>{cfg.label}</strong>
                </Tag>
              </div>
              <Row gutter={8}>
                <Col span={8}>
                  <Statistic
                    title="总数"
                    value={stat?.count || 0}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="平均响应(分钟)"
                    value={stat?.avgResponseTime || 0}
                    valueStyle={{ fontSize: 18, color: "#38B2AC" }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="平均处理(分钟)"
                    value={stat?.avgHandleTime || 0}
                    valueStyle={{ fontSize: 18, color: "#38A169" }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Space wrap size="middle">
            <Form.Item name="ticketType" label="工单类型">
              <Select
                allowClear
                style={{ width: 160 }}
                placeholder="全部类型"
              >
                {Object.entries(ticketTypeMap).map(([k, v]) => (
                  <Option key={k} value={k}>
                    {v.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="ticketId" label="工单ID">
              <Input
                style={{ width: 160 }}
                placeholder="请输入工单ID"
                allowClear
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  查询
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Space>
        </Form>
      </Card>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
    </div>
  );
}
