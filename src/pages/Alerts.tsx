import { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Select,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Card,
  Drawer,
  Descriptions,
  Timeline,
  Badge,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  DeleteColumnOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { get, post, put } from "@/api/client";
import { useAuthStore } from "@/stores/auth";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface AlertItem {
  id: number;
  title: string;
  level: string;
  source: string;
  description?: string;
  status: string;
  createdAt: string;
  confirmedAt?: string;
  resolvedAt?: string;
  confirmedByUser?: { id: number; displayName: string };
  escalatedToUser?: { id: number; displayName: string };
  dutyStaff?: { id: number; displayName: string };
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

const levelMap: Record<string, { color: string; label: string }> = {
  info: { color: "blue", label: "信息" },
  warning: { color: "orange", label: "警告" },
  critical: { color: "red", label: "严重" },
  error: { color: "red", label: "错误" },
};

const statusMap: Record<string, { color: string; label: string }> = {
  pending: { color: "default", label: "待处理" },
  confirmed: { color: "processing", label: "已确认" },
  escalated: { color: "warning", label: "已升级" },
  resolved: { color: "success", label: "已解决" },
};

const sourceMap: Record<string, string> = {
  monitoring: "监控系统",
  manual: "人工上报",
  inspection: "巡检发现",
  staff: "员工反馈",
  email: "邮件告警",
  sms: "短信通知",
};

export default function Alerts() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AlertItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterLevel, setFilterLevel] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [escalateModal, setEscalateModal] = useState<{ id: number } | null>(null);
  const [assignDrawer, setAssignDrawer] = useState<{ id: number } | null>(null);
  const [confirmDrawer, setConfirmDrawer] = useState<{ id: number } | null>(null);
  const [resolveDrawer, setResolveDrawer] = useState<{ id: number } | null>(null);
  const [detailOpen, setDetailOpen] = useState<AlertItem | null>(null);

  const [form] = Form.useForm();
  const [escalateForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [confirmForm] = Form.useForm();
  const [resolveForm] = Form.useForm();

  const [users, setUsers] = useState<UserOption[]>([]);
  const [detailWithRecord, setDetailWithRecord] = useState<any>(null);

  const loadUsers = async () => {
    try {
      const u = await get<UserOption[]>("/api/users");
      setUsers(u);
    } catch (err) {
      // ignore
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, pageSize };
      if (filterLevel) params.level = filterLevel;
      if (filterStatus) params.status = filterStatus;
      const result = await get<Paginated<AlertItem>>("/api/alerts", params);
      setData(result.items);
      setTotal(result.total);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "加载告警列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadUsers();
  }, [page, pageSize, filterLevel, filterStatus]);

  const handleCreate = async (values: any) => {
    try {
      await post("/api/alerts", values);
      message.success("告警创建成功");
      setCreateModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err) {
      const e = err as { message?: string; detail?: string };
      message.error(e.message || "创建失败" + (e.detail ? `：${e.detail}` : ""));
    }
  };

  const handleConfirm = async (values: any) => {
    if (!confirmDrawer) return;
    try {
      await post(`/api/alerts/${confirmDrawer.id}/confirm`, values);
      message.success("告警已确认");
      setConfirmDrawer(null);
      confirmForm.resetFields();
      loadData();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "确认失败");
    }
  };

  const handleEscalate = async (values: any) => {
    if (!escalateModal) return;
    try {
      await post(`/api/alerts/${escalateModal.id}/escalate`, values);
      message.success("告警已升级");
      setEscalateModal(null);
      escalateForm.resetFields();
      loadData();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "升级失败");
    }
  };

  const handleAssign = async (values: any) => {
    if (!assignDrawer) return;
    try {
      await put(`/api/alerts/${assignDrawer.id}/assign`, values);
      message.success("已指派值班人员");
      setAssignDrawer(null);
      assignForm.resetFields();
      loadData();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "指派失败");
    }
  };

  const handleResolve = async (values: any) => {
    if (!resolveDrawer) return;
    try {
      await post(`/api/alerts/${resolveDrawer.id}/resolve`, values);
      message.success("告警已解决");
      setResolveDrawer(null);
      resolveForm.resetFields();
      loadData();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "解决失败");
    }
  };

  const openDetail = async (item: AlertItem) => {
    setDetailOpen(item);
    try {
      const d = await get(`/api/alerts/${item.id}`);
      setDetailWithRecord(d);
    } catch (err) {
      // ignore
    }
  };

  const calcDurationMinutes = (from: string, to: string) => {
    const ms = new Date(to).getTime() - new Date(from).getTime();
    return Math.round(ms / 60000);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 70,
      render: (v: number) => <Text strong>#{v}</Text>,
    },
    {
      title: "标题",
      dataIndex: "title",
      render: (v: string, r: AlertItem) => (
        <a onClick={() => openDetail(r)} style={{ color: "#1A365D", fontWeight: 500 }}>
          {v}
        </a>
      ),
    },
    {
      title: "级别",
      dataIndex: "level",
      width: 100,
      render: (v: string) => {
        const cfg = levelMap[v] || { color: "default", label: v };
        return (
          <Tag color={cfg.color} icon={v === "critical" || v === "error" ? <ExclamationCircleOutlined /> : undefined}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "来源",
      dataIndex: "source",
      width: 110,
      render: (v: string) => sourceMap[v] || v,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (v: string) => {
        const cfg = statusMap[v] || { color: "default", label: v };
        return <Badge status={cfg.color as any} text={cfg.label} />;
      },
    },
    {
      title: "值班人员",
      dataIndex: "dutyStaff",
      width: 120,
      render: (v: { displayName: string } | undefined) => v?.displayName || <span style={{ color: "#bfbfbf" }}>未指派</span>,
    },
    {
      title: "确认人",
      dataIndex: "confirmedByUser",
      width: 120,
      render: (v: { displayName: string } | undefined) => v?.displayName || "-",
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      width: 170,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "响应时长",
      width: 110,
      render: (_: any, r: AlertItem) => {
        if (r.confirmedAt) {
          const m = calcDurationMinutes(r.createdAt, r.confirmedAt);
          return (
            <Tag color={m <= 30 ? "success" : m <= 60 ? "warning" : "error"} icon={<ClockCircleOutlined />}>
              {m} 分钟
            </Tag>
          );
        }
        return <span style={{ color: "#bfbfbf" }}>未响应</span>;
      },
    },
    {
      title: "操作",
      key: "action",
      width: 260,
      fixed: "right" as const,
      render: (_: any, r: AlertItem) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/alerts/${r.id}`)}>
            详情
          </Button>
          {r.status === "pending" && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => setConfirmDrawer({ id: r.id })}>
              确认
            </Button>
          )}
          {(r.status === "pending" || r.status === "confirmed") && (
            <>
              <Button type="link" size="small" danger icon={<ArrowUpOutlined />} onClick={() => setEscalateModal({ id: r.id })}>
                升级
              </Button>
              <Button type="link" size="small" onClick={() => setResolveDrawer({ id: r.id })}>
                解决
              </Button>
            </>
          )}
          {isAdmin && (
            <Button type="link" size="small" icon={<DeleteColumnOutlined />} onClick={() => setAssignDrawer({ id: r.id })}>
              指派
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center" }}>
        <Title level={3} style={{ margin: 0 }}>
          告警确认
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          新建告警
        </Button>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <span>级别：</span>
          <Select
            allowClear
            style={{ width: 120 }}
            placeholder="全部级别"
            value={filterLevel}
            onChange={(v) => {
              setFilterLevel(v);
              setPage(1);
            }}
          >
            {Object.entries(levelMap).map(([k, v]) => (
              <Option key={k} value={k}>
                {v.label}
              </Option>
            ))}
          </Select>
          <span>状态：</span>
          <Select
            allowClear
            style={{ width: 140 }}
            placeholder="全部状态"
            value={filterStatus}
            onChange={(v) => {
              setFilterStatus(v);
              setPage(1);
            }}
          >
            {Object.entries(statusMap).map(([k, v]) => (
              <Option key={k} value={k}>
                {v.label}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        scroll={{ x: 1300 }}
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

      <Modal title="新建告警" open={createModalOpen} onCancel={() => { setCreateModalOpen(false); form.resetFields(); }} onOk={() => form.submit()} width={520}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="告警标题" rules={[{ required: true, message: "请输入告警标题" }]}>
            <Input placeholder="如：门店路由器离线" />
          </Form.Item>
          <Form.Item name="source" label="告警来源" rules={[{ required: true, message: "请选择来源" }]} initialValue="manual">
            <Select>
              {Object.entries(sourceMap).map(([k, v]) => (
                <Option key={k} value={k}>{v}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="level" label="告警级别" initialValue="info">
            <Select>
              {Object.entries(levelMap).map(([k, v]) => (
                <Option key={k} value={k}>{v.label}</Option>
              ))}
            </Select>
          </Form.Item>
          {isAdmin && (
            <Form.Item name="dutyStaffId" label="指派值班人员">
              <Select placeholder="可稍后指派" allowClear>
                {users.map((u) => (
                  <Option key={u.id} value={u.id}>{u.displayName}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="description" label="详细描述">
            <TextArea rows={3} placeholder="请详细描述故障情况，如具体设备、时间、影响范围等" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`确认告警 ${confirmDrawer ? `#${confirmDrawer.id}` : ""}`}
        open={!!confirmDrawer}
        onClose={() => { setConfirmDrawer(null); confirmForm.resetFields(); }}
        width={480}
      >
        <Form form={confirmForm} layout="vertical" onFinish={handleConfirm}>
          <Form.Item name="note" label="确认备注">
            <TextArea rows={4} placeholder="请填写确认信息，如初步排查结果等" />
          </Form.Item>
          <Button type="primary" onClick={() => confirmForm.submit()} block>
            确认告警
          </Button>
        </Form>
      </Drawer>

      <Modal
        title={`升级告警 ${escalateModal ? `#${escalateModal.id}` : ""}`}
        open={!!escalateModal}
        onCancel={() => { setEscalateModal(null); escalateForm.resetFields(); }}
        onOk={() => escalateForm.submit()}
        width={480}
      >
        <Form form={escalateForm} layout="vertical" onFinish={handleEscalate}>
          <Form.Item name="escalatedTo" label="升级至" rules={[{ required: true, message: "请选择升级目标人员" }]}>
            <Select placeholder="请选择需通知的上级/其他部门人员">
              {users.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.displayName} ({u.role === "admin" ? "管理员" : "门店运维"})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="note" label="升级说明">
            <TextArea rows={4} placeholder="请说明升级原因及相关情况" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`指派值班人员 ${assignDrawer ? `#${assignDrawer.id}` : ""}`}
        open={!!assignDrawer}
        onClose={() => { setAssignDrawer(null); assignForm.resetFields(); }}
        width={480}
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
          <Form.Item name="dutyStaffId" label="值班人员" rules={[{ required: true, message: "请选择值班人员" }]}>
            <Select placeholder="请选择负责该告警的值班人员">
              {users.map((u) => (
                <Option key={u.id} value={u.id}>{u.displayName}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="note" label="备注">
            <TextArea rows={3} placeholder="可填写指派说明" />
          </Form.Item>
          <Button type="primary" onClick={() => assignForm.submit()} block>
            指派
          </Button>
        </Form>
      </Drawer>

      <Drawer
        title={`解决告警 ${resolveDrawer ? `#${resolveDrawer.id}` : ""}`}
        open={!!resolveDrawer}
        onClose={() => { setResolveDrawer(null); resolveForm.resetFields(); }}
        width={480}
      >
        <Form form={resolveForm} layout="vertical" onFinish={handleResolve}>
          <Form.Item name="note" label="解决方案" rules={[{ required: true, message: "请填写解决方案" }]}>
            <TextArea rows={5} placeholder="请详细说明解决过程和最终方案，方便后续复盘" />
          </Form.Item>
          <Button type="primary" onClick={() => resolveForm.submit()} block>
            标记已解决
          </Button>
        </Form>
      </Drawer>

      <Drawer
        title={`告警详情 ${detailOpen ? `#${detailOpen.id}` : ""}`}
        open={!!detailOpen}
        onClose={() => { setDetailOpen(null); setDetailWithRecord(null); }}
        width={560}
      >
        {detailOpen && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="标题">{detailOpen.title}</Descriptions.Item>
              <Descriptions.Item label="级别">
                <Tag color={levelMap[detailOpen.level]?.color}>
                  {levelMap[detailOpen.level]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {statusMap[detailOpen.status]?.label}
              </Descriptions.Item>
              <Descriptions.Item label="来源">{sourceMap[detailOpen.source] || detailOpen.source}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(detailOpen.createdAt).toLocaleString("zh-CN")}
              </Descriptions.Item>
              <Descriptions.Item label="描述">{detailOpen.description || "-"}</Descriptions.Item>
              <Descriptions.Item label="值班人员">{detailOpen.dutyStaff?.displayName || "-"}</Descriptions.Item>
              <Descriptions.Item label="确认人/时间">
                {detailOpen.confirmedByUser?.displayName || "-"}
                {detailOpen.confirmedAt ? ` (${new Date(detailOpen.confirmedAt).toLocaleString("zh-CN")})` : ""}
              </Descriptions.Item>
              <Descriptions.Item label="升级至">
                {detailOpen.escalatedToUser?.displayName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="解决时间">
                {detailOpen.resolvedAt ? new Date(detailOpen.resolvedAt).toLocaleString("zh-CN") : "-"}
              </Descriptions.Item>
            </Descriptions>

            {detailWithRecord?.processRecords?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <Text strong style={{ fontSize: 14 }}>处理过程</Text>
                <Timeline
                  style={{ marginTop: 12 }}
                  items={detailWithRecord.processRecords.map((rec: any) => ({
                    color:
                      rec.action === "created"
                        ? "blue"
                        : rec.action === "confirmed"
                        ? "green"
                        : rec.action === "escalated"
                        ? "red"
                        : rec.action === "resolved"
                        ? "success"
                        : "gray",
                    children: (
                      <div>
                        <div>
                          <Text strong>{recordActionLabel(rec.action)}</Text>
                          {" - "}
                          <span style={{ color: "#8c8c8c", fontSize: 12 }}>
                            {rec.operator?.displayName}
                          </span>
                          <span style={{ color: "#bfbfbf", fontSize: 12, marginLeft: 8 }}>
                            {new Date(rec.createdAt).toLocaleString("zh-CN")}
                          </span>
                        </div>
                        {rec.note && <div style={{ marginTop: 4 }}>{rec.note}</div>}
                        {rec.duration != null && (
                          <div style={{ marginTop: 4, color: "#38B2AC", fontSize: 12 }}>
                            <ClockCircleOutlined /> 用时 {rec.duration} 分钟
                          </div>
                        )}
                      </div>
                    ),
                  }))}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

function recordActionLabel(action: string) {
  const map: Record<string, string> = {
    created: "创建告警",
    confirmed: "确认告警",
    escalated: "升级告警",
    resolved: "解决告警",
    assigned: "指派值班",
  };
  return map[action] || action;
}
