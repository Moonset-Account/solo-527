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
  Card,
  Drawer,
  Descriptions,
  Timeline,
  Badge,
  Popconfirm,
  Divider,
  Alert as AntdAlert,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { get, put } from "@/api/client";
import { useAuthStore } from "@/stores/auth";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface AccountRequestItem {
  id: number;
  accountType: string;
  purpose: string;
  urgency: string;
  reason?: string;
  status: string;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
  applicant: { id: number; displayName: string; storeId: number };
  approver?: { id: number; displayName: string };
  dutyStaff?: { id: number; displayName: string };
  approvalNote?: string;
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const accountTypeMap: Record<string, { label: string; color: string }> = {
  email: { label: "企业邮箱", color: "blue" },
  vpn: { label: "VPN 账号", color: "purple" },
  system: { label: "业务系统", color: "cyan" },
  database: { label: "数据库权限", color: "magenta" },
  wifi: { label: "WiFi 账号", color: "geekblue" },
  other: { label: "其他账号", color: "default" },
};

const urgencyMap: Record<string, { label: string; color: string }> = {
  low: { label: "低", color: "default" },
  medium: { label: "中", color: "blue" },
  high: { label: "高", color: "orange" },
  urgent: { label: "紧急", color: "red" },
};

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "待审批", color: "warning" },
  approved: { label: "已通过", color: "success" },
  rejected: { label: "已驳回", color: "error" },
};

export default function AccountRequests() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AccountRequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterUrgency, setFilterUrgency] = useState<string | undefined>();

  const [approveModal, setApproveModal] = useState<{ id: number } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: number } | null>(null);
  const [detailDrawer, setDetailDrawer] = useState<AccountRequestItem | null>(null);
  const [detailWithRecords, setDetailWithRecords] = useState<any>(null);

  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, pageSize };
      if (filterStatus) params.status = filterStatus;
      if (filterUrgency) params.urgency = filterUrgency;
      const result = await get<Paginated<AccountRequestItem>>("/api/account-requests", params);
      setData(result.items);
      setTotal(result.total);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "加载申请列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, filterStatus, filterUrgency]);

  const handleApprove = async (values: any) => {
    if (!approveModal) return;
    try {
      await put(`/api/account-requests/${approveModal.id}/approve`, values);
      message.success("已通过审批");
      setApproveModal(null);
      approveForm.resetFields();
      loadData();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "审批失败");
    }
  };

  const handleReject = async (values: any) => {
    if (!rejectModal) return;
    try {
      await put(`/api/account-requests/${rejectModal.id}/reject`, values);
      message.success("已驳回申请");
      setRejectModal(null);
      rejectForm.resetFields();
      loadData();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "操作失败");
    }
  };

  const openDetail = async (item: AccountRequestItem) => {
    setDetailDrawer(item);
    try {
      const d = await get(`/api/account-requests/${item.id}`);
      setDetailWithRecords(d);
    } catch (err) {
      // ignore
    }
  };

  const calcDuration = (from: string, to: string) =>
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 70,
      render: (v: number) => <Text strong>#{v}</Text>,
    },
    {
      title: "账号类型",
      dataIndex: "accountType",
      width: 120,
      render: (v: string) => {
        const cfg = accountTypeMap[v] || { label: v, color: "default" };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "用途",
      dataIndex: "purpose",
      render: (v: string, r: AccountRequestItem) => (
        <a onClick={() => openDetail(r)} style={{ color: "#1A365D", fontWeight: 500 }}>
          {v}
        </a>
      ),
    },
    {
      title: "紧急度",
      dataIndex: "urgency",
      width: 90,
      render: (v: string) => {
        const cfg = urgencyMap[v] || { label: v, color: "default" };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (v: string) => {
        const cfg = statusMap[v] || { label: v, color: "default" };
        return <Badge status={cfg.color as any} text={cfg.label} />;
      },
    },
    {
      title: "申请人",
      dataIndex: ["applicant", "displayName"],
      width: 100,
    },
    {
      title: "审批人",
      dataIndex: ["approver", "displayName"],
      width: 100,
      render: (v: string | undefined) => v || "-",
    },
    {
      title: "值班处理",
      dataIndex: ["dutyStaff", "displayName"],
      width: 100,
      render: (v: string | undefined) => v || <span style={{ color: "#bfbfbf" }}>未安排</span>,
    },
    {
      title: "申请时间",
      dataIndex: "createdAt",
      width: 170,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "响应时长",
      width: 110,
      render: (_: any, r: AccountRequestItem) => {
        if (r.completedAt) {
          const m = calcDuration(r.createdAt, r.completedAt);
          return (
            <Tag color={m <= 60 ? "success" : m <= 180 ? "warning" : "error"} icon={<ClockCircleOutlined />}>
              {m >= 60 ? `${Math.floor(m / 60)}小时${m % 60}分` : `${m}分钟`}
            </Tag>
          );
        }
        return <span style={{ color: "#bfbfbf" }}>处理中</span>;
      },
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      fixed: "right" as const,
      render: (_: any, r: AccountRequestItem) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/account-requests/${r.id}`)}>
            详情
          </Button>
          {isAdmin && r.status === "pending" && (
            <>
              <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => setApproveModal({ id: r.id })}>
                通过
              </Button>
              <Button type="link" size="small" danger icon={<CloseCircleOutlined />} onClick={() => setRejectModal({ id: r.id })}>
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center" }}>
        <Title level={3} style={{ margin: 0 }}>
          账号申请
        </Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/account-requests/new")}>
            提交新申请
          </Button>
        </Space>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
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
              <Option key={k} value={k}>{v.label}</Option>
            ))}
          </Select>
          <span>紧急度：</span>
          <Select
            allowClear
            style={{ width: 120 }}
            placeholder="全部级别"
            value={filterUrgency}
            onChange={(v) => {
              setFilterUrgency(v);
              setPage(1);
            }}
          >
            {Object.entries(urgencyMap).map(([k, v]) => (
              <Option key={k} value={k}>{v.label}</Option>
            ))}
          </Select>
        </Space>
      </Card>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        scroll={{ x: 1400 }}
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

      <Modal
        title={`审批申请 #${approveModal?.id ?? ""}`}
        open={!!approveModal}
        onCancel={() => { setApproveModal(null); approveForm.resetFields(); }}
        onOk={() => approveForm.submit()}
        width={480}
      >
        <Form form={approveForm} layout="vertical" onFinish={handleApprove}>
          <Form.Item name="approvalNote" label="审批备注">
            <TextArea rows={4} placeholder="请填写审批说明，如账号配置方式、交付时间等（可选）" />
          </Form.Item>
          <AntdAlert type="info" showIcon message="通过后账号将自动标记为已完成，并记录响应时长" />
        </Form>
      </Modal>

      <Modal
        title={`驳回申请 #${rejectModal?.id ?? ""}`}
        open={!!rejectModal}
        onCancel={() => { setRejectModal(null); rejectForm.resetFields(); }}
        onOk={() => rejectForm.submit()}
        width={480}
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Form.Item name="approvalNote" label="驳回原因" rules={[{ required: true, message: "请填写驳回原因，方便申请人理解" }]}>
            <TextArea rows={4} placeholder="请说明驳回原因，如资料不全、用途不明确、权限范围过大等" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`申请详情 ${detailDrawer ? `#${detailDrawer.id}` : ""}`}
        open={!!detailDrawer}
        onClose={() => { setDetailDrawer(null); setDetailWithRecords(null); }}
        width={560}
        extra={
          <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => detailDrawer && navigate(`/account-requests/${detailDrawer.id}`)}>
            打开完整页面
          </Button>
        }
      >
        {detailDrawer && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="账号类型">
                <Tag color={accountTypeMap[detailDrawer.accountType]?.color}>
                  {accountTypeMap[detailDrawer.accountType]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="紧急度">
                <Tag color={urgencyMap[detailDrawer.urgency]?.color}>
                  {urgencyMap[detailDrawer.urgency]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {statusMap[detailDrawer.status]?.label}
              </Descriptions.Item>
              <Descriptions.Item label="用途">{detailDrawer.purpose}</Descriptions.Item>
              <Descriptions.Item label="详细说明">{detailDrawer.reason || "-"}</Descriptions.Item>
              <Descriptions.Item label="申请人">{detailDrawer.applicant?.displayName}</Descriptions.Item>
              <Descriptions.Item label="值班人员">{detailDrawer.dutyStaff?.displayName || "-"}</Descriptions.Item>
              <Descriptions.Item label="申请时间">{new Date(detailDrawer.createdAt).toLocaleString("zh-CN")}</Descriptions.Item>
              <Descriptions.Item label="审批备注">{detailDrawer.approvalNote || "-"}</Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {detailDrawer.completedAt ? new Date(detailDrawer.completedAt).toLocaleString("zh-CN") : "-"}
              </Descriptions.Item>
            </Descriptions>

            {detailWithRecords?.processRecords?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <Divider orientation="left">处理过程</Divider>
                <Timeline
                  items={detailWithRecords.processRecords.map((rec: any) => ({
                    color:
                      rec.action === "created"
                        ? "blue"
                        : rec.action === "approved"
                        ? "green"
                        : rec.action === "rejected"
                        ? "red"
                        : "gray",
                    children: (
                      <div>
                        <div>
                          <Text strong>{processAction(rec.action)}</Text>
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

function processAction(action: string) {
  const map: Record<string, string> = {
    created: "提交申请",
    approved: "审批通过",
    rejected: "驳回申请",
  };
  return map[action] || action;
}
