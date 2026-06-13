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
  Form,
  Input,
  Select,
  Spin,
  Divider,
  Badge,
  Row,
  Col,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { get, put } from "@/api/client";
import { useAuthStore } from "@/stores/auth";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface TaskDetailData {
  id: number;
  planId: number;
  status: string;
  assigneeId: number;
  result?: string;
  note?: string;
  executedAt?: string;
  scheduledDate: string;
  createdAt: string;
  plan: { id: number; name: string; frequency: string };
  assignee: { id: number; displayName: string };
  processRecords: Array<{
    id: number;
    action: string;
    note?: string;
    duration?: number;
    createdAt: string;
    operator: { id: number; displayName: string };
  }>;
}

const statusMap: Record<string, { color: any; label: string }> = {
  pending: { color: "default", label: "待执行" },
  completed: { color: "success", label: "已完成" },
  abnormal: { color: "error", label: "异常" },
};

const resultMap: Record<string, { color: string; label: string; icon?: any }> = {
  normal: { color: "green", label: "正常", icon: CheckCircleOutlined },
  abnormal: { color: "red", label: "异常", icon: ExclamationCircleOutlined },
};

const frequencyMap: Record<string, { label: string; color: string }> = {
  daily: { label: "每日", color: "blue" },
  weekly: { label: "每周", color: "purple" },
  monthly: { label: "每月", color: "geekblue" },
};

const actionLabelMap: Record<string, { label: string; color: string }> = {
  executed: { label: "执行巡检", color: "green" },
};

export default function InspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const taskId = parseInt(id || "0");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TaskDetailData | null>(null);
  const [executeForm] = Form.useForm();

  const loadDetail = async () => {
    try {
      setLoading(true);
      const result = await get<TaskDetailData>(`/api/inspections/tasks/${taskId}`);
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
  }, [taskId]);

  const handleExecute = async (values: { result: string; note?: string }) => {
    try {
      await put(`/api/inspections/tasks/${taskId}/execute`, values);
      if (values.result === "abnormal") {
        message.warning("任务执行完成，已自动生成异常告警，请关注告警中心");
      } else {
        message.success("任务执行成功");
      }
      executeForm.resetFields();
      loadDetail();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "执行失败");
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

  const durationMin = data.executedAt && data.scheduledDate
    ? calcMinutes(data.scheduledDate, data.executedAt)
    : null;

  const canExecute = data.status === "pending" && (data.assigneeId === user?.id || isAdmin);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/inspections")}>
          返回巡检列表
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              #{data.id} {data.plan?.name}
            </Title>
            <div style={{ marginTop: 8 }}>
              <Space wrap>
                <Badge status={statusMap[data.status]?.color} text={statusMap[data.status]?.label} />
                {data.result && resultMap[data.result] && (
                  <Tag
                    color={resultMap[data.result].color}
                    icon={resultMap[data.result].icon}
                  >
                    {resultMap[data.result].label}
                  </Tag>
                )}
                {data.plan?.frequency && (
                  <Tag color={frequencyMap[data.plan.frequency]?.color}>
                    {frequencyMap[data.plan.frequency]?.label}
                  </Tag>
                )}
                <span style={{ color: "#8c8c8c" }}>
                  创建于 {new Date(data.createdAt).toLocaleString("zh-CN")}
                </span>
              </Space>
            </div>
          </div>
          <Space wrap>
            {canExecute && (
              <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => {
                executeForm.setFieldsValue({ result: "normal" });
                const el = document.getElementById("execute-form-section");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
              }}>
                执行巡检
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {durationMin != null && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Card size="small">
              <div style={{ display: "flex", alignItems: "center" }}>
                <ClockCircleOutlined style={{ color: "#38B2AC", fontSize: 20, marginRight: 12 }} />
                <div>
                  <div style={{ color: "#8c8c8c", fontSize: 12 }}>响应时长</div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color:
                        durationMin < 0
                          ? "#38B2AC"
                          : durationMin <= 60
                          ? "#38A169"
                          : durationMin <= 120
                          ? "#ECC94B"
                          : "#E53E3E",
                    }}
                  >
                    {durationMin >= 0 ? `${durationMin} 分钟` : `提前 ${Math.abs(durationMin)} 分钟`}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="巡检计划">{data.plan?.name}</Descriptions.Item>
              <Descriptions.Item label="执行频率">
                {data.plan?.frequency ? (
                  <Tag color={frequencyMap[data.plan.frequency]?.color}>
                    {frequencyMap[data.plan.frequency]?.label}
                  </Tag>
                ) : (
                  "-"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="负责人">{data.assignee?.displayName}</Descriptions.Item>
              <Descriptions.Item label="任务状态">
                <Badge status={statusMap[data.status]?.color} text={statusMap[data.status]?.label} />
              </Descriptions.Item>
              <Descriptions.Item label="计划执行时间">
                <CalendarOutlined style={{ color: "#38B2AC", marginRight: 6 }} />
                {new Date(data.scheduledDate).toLocaleDateString("zh-CN")}
              </Descriptions.Item>
              <Descriptions.Item label="实际执行时间">
                {data.executedAt ? new Date(data.executedAt).toLocaleString("zh-CN") : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="巡检结果">
                {data.result && resultMap[data.result] ? (
                  <Tag
                    color={resultMap[data.result].color}
                    icon={resultMap[data.result].icon}
                  >
                    {resultMap[data.result].label}
                  </Tag>
                ) : (
                  "-"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="巡检备注">
                {data.note || <span style={{ color: "#bfbfbf" }}>无</span>}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {canExecute && (
            <Card
              id="execute-form-section"
              title="执行巡检"
              size="small"
              style={{
                marginBottom: 16,
                borderColor: "#ECC94B",
                boxShadow: "0 0 0 2px rgba(236, 201, 75, 0.15)",
              }}
            >
              <Form form={executeForm} layout="vertical" onFinish={handleExecute}>
                <Form.Item
                  name="result"
                  label="巡检结果"
                  rules={[{ required: true, message: "请选择巡检结果" }]}
                >
                  <Select>
                    <Option value="normal">
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        正常
                      </Tag>
                    </Option>
                    <Option value="abnormal">
                      <Tag color="red" icon={<ExclamationCircleOutlined />}>
                        异常
                      </Tag>
                    </Option>
                  </Select>
                </Form.Item>
                <Form.Item name="note" label="巡检备注">
                  <TextArea rows={5} placeholder="请填写巡检情况备注，异常情况请详细描述问题" />
                </Form.Item>
                <Form.Item shouldUpdate noStyle>
                  {({ getFieldValue }) =>
                    getFieldValue("result") === "abnormal" ? (
                      <div
                        style={{
                          marginBottom: 16,
                          padding: 12,
                          background: "#FFF2F0",
                          border: "1px solid #FFCCC7",
                          borderRadius: 6,
                          color: "#CF1322",
                        }}
                      >
                        <ExclamationCircleOutlined />{" "}
                        选择异常结果后，系统将自动生成告警，请确保备注信息完整
                      </div>
                    ) : null
                  }
                </Form.Item>
                <Button type="primary" onClick={() => executeForm.submit()} block icon={<ThunderboltOutlined />}>
                  提交巡检结果
                </Button>
              </Form>
            </Card>
          )}

          <Card title="处理过程时间线" size="small">
            {data.processRecords && data.processRecords.length > 0 ? (
              <Timeline
                items={data.processRecords.map((rec) => {
                  const cfg =
                    actionLabelMap[rec.action] || { label: rec.action, color: "gray" };
                  return {
                    color: cfg.color as any,
                    children: (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
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
              <div style={{ textAlign: "center", padding: 20, color: "#bfbfbf" }}>
                暂无处理记录
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="人员信息" size="small">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="巡检负责人">
                {data.assignee?.displayName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="所属计划ID">
                {data.planId ? `#${data.planId}` : "-"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
          {data.result === "abnormal" && (
            <Card
              title="异常告警提示"
              size="small"
              style={{ marginTop: 16, borderColor: "#FFCCC7" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  color: "#CF1322",
                }}
              >
                <ExclamationCircleOutlined style={{ fontSize: 20, marginRight: 8, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>该任务已标记为异常</div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    系统已自动生成告警，请前往告警中心查看并处理
                  </div>
                  <Button
                    size="small"
                    danger
                    style={{ marginTop: 8 }}
                    onClick={() => navigate("/alerts")}
                  >
                    查看告警
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
