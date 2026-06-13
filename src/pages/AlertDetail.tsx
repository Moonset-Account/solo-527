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
  Select,
  Drawer,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DeleteColumnOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { get, post, put } from "@/api/client";
import { useAuthStore } from "@/stores/auth";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface AlertDetailData {
  id: number;
  title: string;
  level: string;
  source: string;
  description?: string;
  status: string;
  createdAt: string;
  confirmedAt?: string;
  escalatedAt?: string;
  resolvedAt?: string;
  confirmedByUser?: { id: number; displayName: string };
  escalatedToUser?: { id: number; displayName: string };
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

const actionLabelMap: Record<string, { label: string; color: string }> = {
  created: { label: "创建告警", color: "blue" },
  confirmed: { label: "确认告警", color: "green" },
  escalated: { label: "升级告警", color: "red" },
  resolved: { label: "解决告警", color: "success" },
  assigned: { label: "指派值班", color: "purple" },
};

export default function AlertDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const alertId = parseInt(id || "0");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AlertDetailData | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);

  const [escalateModal, setEscalateModal] = useState(false);
  const [confirmDrawer, setConfirmDrawer] = useState(false);
  const [resolveDrawer, setResolveDrawer] = useState(false);
  const [assignDrawer, setAssignDrawer] = useState(false);
  const [escalateForm] = Form.useForm();
  const [confirmForm] = Form.useForm();
  const [resolveForm] = Form.useForm();
  const [assignForm] = Form.useForm();

  const loadDetail = async () => {
    try {
      setLoading(true);
      const result = await get<AlertDetailData>(`/api/alerts/${alertId}`);
      setData(result);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "加载详情失败");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const u = await get<UserOption[]>("/api/users");
      setUsers(u);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    loadDetail();
    loadUsers();
  }, [alertId]);

  const handleConfirm = async (values: any) => {
    try {
      await post(`/api/alerts/${alertId}/confirm`, values);
      message.success("确认成功");
      setConfirmDrawer(false);
      confirmForm.resetFields();
      loadDetail();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "确认失败");
    }
  };

  const handleEscalate = async (values: any) => {
    try {
      await post(`/api/alerts/${alertId}/escalate`, values);
      message.success("升级成功");
      setEscalateModal(false);
      escalateForm.resetFields();
      loadDetail();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "升级失败");
    }
  };

  const handleResolve = async (values: any) => {
    try {
      await post(`/api/alerts/${alertId}/resolve`, values);
      message.success("已标记为解决");
      setResolveDrawer(false);
      resolveForm.resetFields();
      loadDetail();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "操作失败");
    }
  };

  const handleAssign = async (values: any) => {
    try {
      await put(`/api/alerts/${alertId}/assign`, values);
      message.success("指派成功");
      setAssignDrawer(false);
      assignForm.resetFields();
      loadDetail();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "指派失败");
    }
  };

  const calcMinutes = (from: string, to: string) =>
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000);

  if (loading || !data) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  const responseMin = data.confirmedAt ? calcMinutes(data.createdAt, data.confirmedAt) : null;
  const handleMin = data.resolvedAt && (data.confirmedAt || data.createdAt)
    ? calcMinutes(data.confirmedAt || data.createdAt, data.resolvedAt)
    : null;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/alerts")}>
          返回告警列表
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              #{data.id} {data.title}
            </Title>
            <div style={{ marginTop: 8 }}>
              <Space wrap>
                <Tag color={levelMap[data.level]?.color} icon={data.level === "critical" ? <ExclamationCircleOutlined /> : undefined}>
                  {levelMap[data.level]?.label}
                </Tag>
                <Tag color={statusMap[data.status]?.color}>
                  {statusMap[data.status]?.label}
                </Tag>
                <Tag icon={<ClockCircleOutlined />}>
                  {sourceMap[data.source] || data.source}
                </Tag>
                <span style={{ color: "#8c8c8c" }}>
                  创建于 {new Date(data.createdAt).toLocaleString("zh-CN")}
                </span>
              </Space>
            </div>
          </div>
          <Space wrap>
            {data.status === "pending" && (
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setConfirmDrawer(true)}>
                确认告警
              </Button>
            )}
            {(data.status === "pending" || data.status === "confirmed" || data.status === "escalated") && (
              <>
                <Button danger icon={<ArrowUpOutlined />} onClick={() => setEscalateModal(true)}>
                  升级
                </Button>
                <Button type="primary" style={{ background: "#38A169", borderColor: "#38A169" }} icon={<CheckOutlined />} onClick={() => setResolveDrawer(true)}>
                  标记解决
                </Button>
              </>
            )}
            {isAdmin && (
              <Button icon={<DeleteColumnOutlined />} onClick={() => setAssignDrawer(true)}>
                指派值班
              </Button>
            )}
          </Space>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card size="small">
            <Statistic
              title={
                <span>
                  <ClockCircleOutlined style={{ color: "#38B2AC", marginRight: 6 }} />
                  响应时长
                </span>
              }
              value={responseMin != null ? responseMin : "-"}
              suffix={responseMin != null ? "分钟" : ""}
              valueStyle={{ color: responseMin == null ? "#bfbfbf" : responseMin <= 30 ? "#38A169" : responseMin <= 60 ? "#ECC94B" : "#E53E3E" }}
            />
            <div style={{ marginTop: 4, fontSize: 12, color: "#8c8c8c" }}>
              {responseMin != null ? "创建 → 确认" : "未响应"}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small">
            <Statistic
              title={
                <span>
                  <CheckCircleOutlined style={{ color: "#38A169", marginRight: 6 }} />
                  处理时长
                </span>
              }
              value={handleMin != null ? handleMin : "-"}
              suffix={handleMin != null ? "分钟" : ""}
              valueStyle={{ color: handleMin == null ? "#bfbfbf" : handleMin <= 60 ? "#38A169" : "#E53E3E" }}
            />
            <div style={{ marginTop: 4, fontSize: 12, color: "#8c8c8c" }}>
              {handleMin != null ? "确认 → 解决" : "未解决"}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small">
            <Statistic
              title={
                <span>
                  <DeleteColumnOutlined style={{ color: "#ECC94B", marginRight: 6 }} />
                  值班人员
                </span>
              }
              value={data.dutyStaff?.displayName || "未指派"}
              valueStyle={{ fontSize: 18, color: data.dutyStaff ? "#1A365D" : "#bfbfbf" }}
            />
            <div style={{ marginTop: 4, fontSize: 12, color: "#8c8c8c" }}>
              {data.escalatedToUser?.displayName ? `升级至: ${data.escalatedToUser.displayName}` : ""}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="创建时间">{new Date(data.createdAt).toLocaleString("zh-CN")}</Descriptions.Item>
              <Descriptions.Item label="确认时间">{data.confirmedAt ? `${data.confirmedByUser?.displayName || ""} ${new Date(data.confirmedAt).toLocaleString("zh-CN")}` : "-"}</Descriptions.Item>
              <Descriptions.Item label="升级时间">{data.escalatedAt ? `${data.escalatedToUser?.displayName || ""} ${new Date(data.escalatedAt).toLocaleString("zh-CN")}` : "-"}</Descriptions.Item>
              <Descriptions.Item label="解决时间">{data.resolvedAt ? new Date(data.resolvedAt).toLocaleString("zh-CN") : "-"}</Descriptions.Item>
              <Descriptions.Item label="详细描述">{data.description || "-"}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="处理过程时间线" size="small">
            {data.processRecords.length > 0 ? (
              <Timeline
                items={data.processRecords.map((rec) => {
                  const cfg = actionLabelMap[rec.action] || { label: rec.action, color: "gray" };
                  return {
                    color: cfg.color as any,
                    children: (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>
                            <Text strong>{cfg.label}</Text>
                            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                              - {rec.operator?.displayName}
                            </Text>
                          </span>
                          <span style={{ fontSize: 12, color: "#bfbfbf" }}>
                            {new Date(rec.createdAt).toLocaleString("zh-CN")}
                          </span>
                        </div>
                        {rec.note && <div style={{ marginTop: 4, color: "#4a5568" }}>{rec.note}</div>}
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

        <Col xs={24} lg={10}>
          <Card title="人员信息" size="small">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="值班人员">
                {data.dutyStaff?.displayName || <Tag color="default">未指派</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="确认人">
                {data.confirmedByUser?.displayName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="升级至">
                {data.escalatedToUser?.displayName || "-"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Drawer title="确认告警" open={confirmDrawer} onClose={() => { setConfirmDrawer(false); confirmForm.resetFields(); }} width={480}>
        <Form form={confirmForm} layout="vertical" onFinish={handleConfirm}>
          <Form.Item name="note" label="确认备注">
            <TextArea rows={4} placeholder="请填写确认信息，如初步排查结果等" />
          </Form.Item>
          <Button type="primary" onClick={() => confirmForm.submit()} block>
            确认告警
          </Button>
        </Form>
      </Drawer>

      <Modal title="升级告警" open={escalateModal} onCancel={() => { setEscalateModal(false); escalateForm.resetFields(); }} onOk={() => escalateForm.submit()} width={480}>
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

      <Drawer title="解决方案" open={resolveDrawer} onClose={() => { setResolveDrawer(false); resolveForm.resetFields(); }} width={480}>
        <Form form={resolveForm} layout="vertical" onFinish={handleResolve}>
          <Form.Item name="note" label="解决方案" rules={[{ required: true, message: "请填写解决方案" }]}>
            <TextArea rows={6} placeholder="请详细说明解决过程和最终方案，方便后续复盘" />
          </Form.Item>
          <Button type="primary" style={{ background: "#38A169", borderColor: "#38A169" }} onClick={() => resolveForm.submit()} block>
            标记已解决
          </Button>
        </Form>
      </Drawer>

      <Drawer title="指派值班人员" open={assignDrawer} onClose={() => { setAssignDrawer(false); assignForm.resetFields(); }} width={480}>
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
    </div>
  );
}
