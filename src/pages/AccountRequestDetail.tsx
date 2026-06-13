import { useEffect, useState } from "react";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  message,
  Timeline,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  Drawer,
  Spin,
  Steps,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { get, put } from "@/api/client";
import { useAuthStore } from "@/stores/auth";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface DetailData {
  id: number;
  accountType: string;
  purpose: string;
  urgency: string;
  reason?: string;
  status: string;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
  approvalNote?: string;
  applicant: { id: number; displayName: string; storeId: number; store?: { id: number; name: string; address: string } };
  approver?: { id: number; displayName: string };
  dutyStaff?: { id: number; displayName: string };
  processRecords: Array<{
    id: number;
    action: string;
    note?: string;
    duration?: number;
    createdAt: string;
    operator: { id: number; displayName: string };
  }>;
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

export default function AccountRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const reqId = parseInt(id || "0");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DetailData | null>(null);

  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const loadDetail = async () => {
    try {
      setLoading(true);
      const result = await get<DetailData>(`/api/account-requests/${reqId}`);
      setData(result);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "加载详情失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [reqId]);

  const handleApprove = async (values: any) => {
    try {
      await put(`/api/account-requests/${reqId}/approve`, values);
      message.success("审批通过，账号交付完成");
      setApproveModal(false);
      approveForm.resetFields();
      loadDetail();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "审批失败");
    }
  };

  const handleReject = async (values: any) => {
    try {
      await put(`/api/account-requests/${reqId}/reject`, values);
      message.success("已驳回申请");
      setRejectModal(false);
      rejectForm.resetFields();
      loadDetail();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "操作失败");
    }
  };

  if (loading || !data) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  const calcMinutes = (from: string, to: string) =>
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000);

  const totalMin = data.completedAt ? calcMinutes(data.createdAt, data.completedAt) : null;

  const stepIndex =
    data.status === "pending" ? 1 : data.status === "approved" ? 3 : data.status === "rejected" ? 2 : 0;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/account-requests")}>
          返回申请列表
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              #{data.id} {accountTypeMap[data.accountType]?.label}账号申请
            </Title>
            <div style={{ marginTop: 8 }}>
              <Space wrap>
                <Tag color={accountTypeMap[data.accountType]?.color}>
                  {accountTypeMap[data.accountType]?.label}
                </Tag>
                <Tag color={urgencyMap[data.urgency]?.color}>
                  紧急度: {urgencyMap[data.urgency]?.label}
                </Tag>
                <Tag color={statusMap[data.status]?.color}>
                  {statusMap[data.status]?.label}
                </Tag>
                <span style={{ color: "#8c8c8c" }}>
                  申请于 {new Date(data.createdAt).toLocaleString("zh-CN")}
                </span>
              </Space>
            </div>
          </div>
          <Space wrap>
            {isAdmin && data.status === "pending" && (
              <>
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setApproveModal(true)}>
                  审批通过
                </Button>
                <Button danger icon={<CloseCircleOutlined />} onClick={() => setRejectModal(true)}>
                  驳回申请
                </Button>
              </>
            )}
          </Space>
        </div>
      </Card>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Steps
          size="small"
          current={stepIndex}
          items={[
            { title: "提交申请", status: "finish", description: new Date(data.createdAt).toLocaleString("zh-CN") },
            {
              title: "管理员审批",
              status: data.status === "pending" ? "process" : data.status === "rejected" ? "error" : "finish",
              description:
                data.approvedAt || data.completedAt
                  ? `${data.approver?.displayName || ""} ${new Date(data.approvedAt || data.completedAt).toLocaleString("zh-CN")}`
                  : "等待审批",
            },
            { title: "值班处理", status: data.status === "pending" ? "wait" : "finish", description: data.dutyStaff?.displayName || "系统自动安排" },
            {
              title: "完成交付",
              status: data.status === "approved" ? "finish" : "wait",
              description: data.completedAt ? new Date(data.completedAt).toLocaleString("zh-CN") : undefined,
            },
          ]}
        />
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card size="small">
            <Statistic
              title={
                <span>
                  <ClockCircleOutlined style={{ color: "#38B2AC", marginRight: 6 }} />
                  总处理时长
                </span>
              }
              value={totalMin != null ? (totalMin >= 60 ? `${(totalMin / 60).toFixed(1)}` : totalMin) : "-"}
              suffix={totalMin != null ? (totalMin >= 60 ? "小时" : "分钟") : ""}
              valueStyle={{ color: totalMin == null ? "#bfbfbf" : totalMin <= 60 ? "#38A169" : totalMin <= 180 ? "#ECC94B" : "#E53E3E" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small">
            <Statistic
              title={
                <span>
                  <CheckCircleOutlined style={{ color: "#38A169", marginRight: 6 }} />
                  审批人
                </span>
              }
              value={data.approver?.displayName || "待审批"}
              valueStyle={{ fontSize: 18, color: data.approver ? "#1A365D" : "#bfbfbf" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small">
            <Statistic
              title={
                <span>
                  <InfoCircleOutlined style={{ color: "#ECC94B", marginRight: 6 }} />
                  值班处理
                </span>
              }
              value={data.dutyStaff?.displayName || "未安排"}
              valueStyle={{ fontSize: 18, color: data.dutyStaff ? "#1A365D" : "#bfbfbf" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card title="申请信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="申请人">
                {data.applicant?.displayName}
                {data.applicant?.store?.name ? ` (${data.applicant.store.name})` : ""}
              </Descriptions.Item>
              <Descriptions.Item label="账号类型">
                <Tag color={accountTypeMap[data.accountType]?.color}>
                  {accountTypeMap[data.accountType]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="紧急程度">
                <Tag color={urgencyMap[data.urgency]?.color}>
                  {urgencyMap[data.urgency]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="用途">{data.purpose}</Descriptions.Item>
              <Descriptions.Item label="详细说明">{data.reason || "-"}</Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {new Date(data.createdAt).toLocaleString("zh-CN")}
              </Descriptions.Item>
              <Descriptions.Item label="审批/处理结果">
                {data.status === "pending" ? "等待审批" : data.approvalNote || statusMap[data.status]?.label}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {data.completedAt ? new Date(data.completedAt).toLocaleString("zh-CN") : "-"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="处理过程时间线" size="small">
            {data.processRecords.length > 0 ? (
              <Timeline
                items={data.processRecords.map((rec) => {
                  const cfg: Record<string, { label: string; color: string }> = {
                    created: { label: "提交申请", color: "blue" },
                    approved: { label: "审批通过", color: "green" },
                    rejected: { label: "驳回申请", color: "red" },
                  };
                  const c = cfg[rec.action] || { label: rec.action, color: "gray" };
                  return {
                    color: c.color as any,
                    children: (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>
                            <Text strong>{c.label}</Text>
                            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                              - {rec.operator?.displayName}
                            </Text>
                          </span>
                          <span style={{ color: "#bfbfbf", fontSize: 12 }}>
                            {new Date(rec.createdAt).toLocaleString("zh-CN")}
                          </span>
                        </div>
                        {rec.note && <div style={{ marginTop: 4 }}>{rec.note}</div>}
                        {rec.duration != null && (
                          <Tag style={{ marginTop: 6 }} color="blue" icon={<ClockCircleOutlined />}>
                            用时 {rec.duration} 分钟
                          </Tag>
                        )}
                      </div>
                    ),
                  };
                })}
              />
            ) : (
              <div style={{ textAlign: "center", padding: 20, color: "#bfbfbf" }}>暂无处理记录</div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card title="人员与时效" size="small">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="申请人">
                {data.applicant?.displayName}
              </Descriptions.Item>
              <Descriptions.Item label="所属门店/部门">
                {data.applicant?.store?.name || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="值班人员">
                {data.dutyStaff?.displayName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="审批人">
                {data.approver?.displayName || "-"}
              </Descriptions.Item>
              <Divider style={{ margin: "4px 0" }} />
              <Descriptions.Item label="提交 → 审批完成">
                {totalMin != null ? (
                  <Tag color={totalMin <= 60 ? "success" : totalMin <= 180 ? "warning" : "error"} icon={<ClockCircleOutlined />}>
                    {totalMin >= 60 ? `${Math.floor(totalMin / 60)}小时${totalMin % 60}分` : `${totalMin}分钟`}
                  </Tag>
                ) : (
                  <span style={{ color: "#bfbfbf" }}>处理中</span>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Modal
        title={`审批申请 #${data.id}`}
        open={approveModal}
        onCancel={() => { setApproveModal(false); approveForm.resetFields(); }}
        onOk={() => approveForm.submit()}
        width={480}
      >
        <Form form={approveForm} layout="vertical" onFinish={handleApprove}>
          <Form.Item label="审批人">
            <Tag color="blue">{user?.displayName || "当前用户"}</Tag>
          </Form.Item>
          <Form.Item name="approvalNote" label="审批备注/交付说明">
            <TextArea rows={4} placeholder="请填写账号配置方式、账号信息、交付说明等" />
          </Form.Item>
          <div style={{ padding: "8px 12px", background: "#F0FFF4", borderRadius: 4, color: "#38A169", fontSize: 13 }}>
            <InfoCircleOutlined style={{ marginRight: 6 }} />
            通过后系统将自动记录为已完成，并计算本次处理的总响应时长用于时效统计
          </div>
        </Form>
      </Modal>

      <Modal
        title={`驳回申请 #${data.id}`}
        open={rejectModal}
        onCancel={() => { setRejectModal(false); rejectForm.resetFields(); }}
        onOk={() => rejectForm.submit()}
        width={480}
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Form.Item name="approvalNote" label="驳回原因" rules={[{ required: true, message: "请填写驳回原因，方便申请人修改" }]}>
            <TextArea rows={5} placeholder="请详细说明驳回原因：&#10;• 资料不完整需要补充哪些信息？&#10;• 权限范围是否需要调整？&#10;• 用途不明确的具体问题？&#10;• 其他说明..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
