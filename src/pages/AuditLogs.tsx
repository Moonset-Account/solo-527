import { useEffect, useState, useMemo } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Select,
  DatePicker,
  Form,
  message,
  Card,
  Spin,
  Row,
  Col,
  Statistic,
  Tooltip,
  Result,
} from "antd";
import { SearchOutlined, ReloadOutlined, FileTextOutlined, BarChartOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import { get } from "@/api/client";
import { useAuthStore } from "@/stores/auth";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface AuditLogItem {
  id: number;
  operatorId: number;
  action: string;
  entityType: string;
  entityId: number;
  detail?: string;
  createdAt: string;
  operator: { id: number; displayName: string };
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface UserOption {
  id: number;
  displayName: string;
  username: string;
  role: string;
}

interface FilterValues {
  operatorId?: number;
  action?: string;
  entityType?: string;
  dateRange?: [Dayjs, Dayjs];
}

const actionMap: Record<string, { label: string; color: string }> = {
  create_inspection_plan: { label: "创建巡检计划", color: "blue" },
  update_inspection_plan: { label: "更新巡检计划", color: "cyan" },
  delete_inspection_plan: { label: "删除巡检计划", color: "geekblue" },
  generate_inspection_tasks: { label: "生成巡检任务", color: "blue" },
  escalate_alert: { label: "升级告警", color: "orange" },
  assign_alert: { label: "指派告警", color: "volcano" },
  approve_account_request: { label: "审批通过账号申请", color: "green" },
  reject_account_request: { label: "驳回账号申请", color: "gold" },
  create_duty_schedule: { label: "创建值班排班", color: "purple" },
  update_duty_schedule: { label: "更新值班排班", color: "magenta" },
  delete_duty_schedule: { label: "删除值班排班", color: "purple" },
};

const entityTypeMap: Record<string, { label: string; color: string; route: string }> = {
  inspection_plan: { label: "巡检计划", color: "blue", route: "/inspections" },
  alert: { label: "告警", color: "red", route: "/alerts" },
  account_request: { label: "账号申请", color: "gold", route: "/account-requests" },
  duty_schedule: { label: "值班排班", color: "purple", route: "/duty" },
};

const actionCategoryColors: Record<string, string[]> = {
  inspection: ["blue", "cyan", "geekblue"],
  alert: ["orange", "volcano", "red"],
  account: ["gold", "green"],
  duty: ["purple", "magenta"],
};

export default function AuditLogs() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [form] = Form.useForm<FilterValues>();
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({});

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const u = await get<UserOption[]>("/api/users");
      setUsers(u);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "加载用户列表失败");
    } finally {
      setUsersLoading(false);
    }
  };

  const loadData = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, pageSize };
      if (appliedFilters.operatorId) params.operatorId = appliedFilters.operatorId;
      if (appliedFilters.action) params.action = appliedFilters.action;
      if (appliedFilters.entityType) params.entityType = appliedFilters.entityType;
      if (appliedFilters.dateRange && appliedFilters.dateRange[0]) {
        params.startDate = appliedFilters.dateRange[0].startOf("day").toISOString();
      }
      if (appliedFilters.dateRange && appliedFilters.dateRange[1]) {
        params.endDate = appliedFilters.dateRange[1].endOf("day").toISOString();
      }
      const result = await get<Paginated<AuditLogItem>>("/api/audit-logs", params);
      setData(result.items);
      setTotal(result.total);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "加载审计日志失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, page, pageSize, appliedFilters]);

  const actionStats = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((item) => {
      counts[item.action] = (counts[item.action] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action, count]) => ({
        action,
        count,
        ...(actionMap[action] || { label: action, color: "default" }),
      }));
  }, [data]);

  const handleSearch = () => {
    const values = form.getFieldsValue();
    setAppliedFilters(values);
    setPage(1);
  };

  const handleReset = () => {
    form.resetFields();
    setAppliedFilters({});
    setPage(1);
  };

  const handleEntityClick = (entityType: string, entityId: number) => {
    const cfg = entityTypeMap[entityType];
    if (cfg) {
      navigate(`${cfg.route}/${entityId}`);
    }
  };

  if (!isAdmin) {
    return (
      <Result
        status="403"
        title="无权限"
        subTitle="抱歉，您没有权限访问此页面，仅管理员可查看审计日志。"
        extra={
          <Button type="primary" onClick={() => navigate("/")}>
            返回首页
          </Button>
        }
      />
    );
  }

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
      render: (v: number) => <Text strong>#{v}</Text>,
    },
    {
      title: "操作时间",
      dataIndex: "createdAt",
      width: 180,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
      sorter: (a: AuditLogItem, b: AuditLogItem) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: "descend" as const,
    },
    {
      title: "操作人",
      dataIndex: ["operator", "displayName"],
      width: 120,
      render: (v: string) => v || "-",
    },
    {
      title: "操作",
      dataIndex: "action",
      width: 160,
      render: (v: string) => {
        const cfg = actionMap[v] || { label: v, color: "default" };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "实体类型",
      dataIndex: "entityType",
      width: 120,
      render: (v: string) => {
        const cfg = entityTypeMap[v] || { label: v, color: "default" };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "实体ID",
      dataIndex: "entityId",
      width: 100,
      render: (v: number, record: AuditLogItem) => {
        const cfg = entityTypeMap[record.entityType];
        if (cfg) {
          return (
            <a onClick={() => handleEntityClick(record.entityType, v)} style={{ fontWeight: 500 }}>
              #{v}
            </a>
          );
        }
        return <Text strong>#{v}</Text>;
      },
    },
    {
      title: "详情",
      dataIndex: "detail",
      ellipsis: { showTitle: false },
      render: (v: string | undefined) => {
        if (!v) return <span style={{ color: "#bfbfbf" }}>-</span>;
        return (
          <Tooltip title={v} placement="topLeft" overlayStyle={{ maxWidth: 480 }}>
            <Text>{v}</Text>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          审计日志
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          记录系统中所有重要操作，仅管理员可查看
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="当前页日志总数"
              value={total}
              prefix={<FileTextOutlined style={{ color: "#1A365D" }} />}
              valueStyle={{ color: "#1A365D" }}
            />
          </Card>
        </Col>
        {actionStats.length > 0 && (
          <Col xs={24} sm={12} md={18}>
            <Card size="small" title={<span><BarChartOutlined style={{ marginRight: 6 }} />操作类型分布（Top 5）</span>}>
              <Space wrap size={[12, 8]}>
                {actionStats.map((stat) => (
                  <Tag key={stat.action} color={stat.color} style={{ fontSize: 13, padding: "4px 12px" }}>
                    {stat.label}：<Text strong>{stat.count}</Text>
                  </Tag>
                ))}
              </Space>
            </Card>
          </Col>
        )}
      </Row>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          style={{ rowGap: 12, display: "flex", flexWrap: "wrap" }}
        >
          <Form.Item name="operatorId" label="操作人">
            <Select
              allowClear
              style={{ width: 160 }}
              placeholder="全部操作人"
              loading={usersLoading}
              showSearch
              optionFilterProp="children"
            >
              {users.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.displayName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="action" label="操作类型">
            <Select allowClear style={{ width: 180 }} placeholder="全部操作类型">
              {Object.entries(actionMap).map(([k, v]) => (
                <Option key={k} value={k}>
                  <Tag color={v.color} style={{ marginRight: 6 }} />
                  {v.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="entityType" label="实体类型">
            <Select allowClear style={{ width: 140 }} placeholder="全部实体类型">
              {Object.entries(entityTypeMap).map(([k, v]) => (
                <Option key={k} value={k}>
                  <Tag color={v.color} style={{ marginRight: 6 }} />
                  {v.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="dateRange" label="日期范围">
            <RangePicker style={{ width: 280 }} allowClear />
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
        </Form>
      </Card>

      <Spin spinning={loading}>
        <Table
          rowKey="id"
          dataSource={data}
          columns={columns}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Spin>
    </div>
  );
}
