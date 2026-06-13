import { useState } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Typography,
  message,
  Space,
  Alert,
  Row,
  Col,
  Steps,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { post } from "@/api/client";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const accountTypeOptions = [
  { value: "email", label: "企业邮箱", desc: "@company.com 企业邮箱账号" },
  { value: "vpn", label: "VPN 账号", desc: "远程办公内网访问权限" },
  { value: "system", label: "业务系统", desc: "POS/ERP/CRM 等业务系统" },
  { value: "database", label: "数据库权限", desc: "需管理员审批，生产环境限制" },
  { value: "wifi", label: "WiFi 账号", desc: "办公区无线网络账号" },
  { value: "other", label: "其他账号", desc: "未列出的其他系统或账号" },
];

const urgencyOptions = [
  { value: "low", label: "低", desc: "3 个工作日内处理即可" },
  { value: "medium", label: "中", desc: "1 个工作日内处理", default: true },
  { value: "high", label: "高", desc: "4 小时内需要响应" },
  { value: "urgent", label: "紧急", desc: "立即处理，影响营业" },
];

export default function AccountRequestNew() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      const result = await post("/api/account-requests", values);
      message.success("申请已提交，ID: #" + (result as any).id);
      navigate("/account-requests");
    } catch (err) {
      const e = err as { message?: string; detail?: string };
      message.error(e.message || "提交失败，请稍后再试" + (e.detail ? ` (${e.detail})` : ""));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/account-requests")}>
          返回申请列表
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 20 }}>
          <Title level={3} style={{ margin: 0 }}>
            <PlusOutlined style={{ color: "#1A365D", marginRight: 8 }} />
            提交账号申请
          </Title>
          <Text type="secondary" style={{ marginTop: 8, display: "block" }}>
            请准确填写账号用途和紧急度，值班人员将按序处理
          </Text>
        </div>

        <Steps
          size="small"
          current={0}
          style={{ marginBottom: 32 }}
          items={[
            { title: "填写申请", status: "process" },
            { title: "管理员审批", status: "wait" },
            { title: "值班处理", status: "wait" },
            { title: "完成交付", status: "wait" },
          ]}
        />

        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="涉及资产和权限变更的操作将全程记录审计日志，可在审计日志中查询"
          style={{ marginBottom: 24 }}
        />

        <Row justify="center">
          <Col xs={24} md={18} lg={14}>
            <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
              <Form.Item
                name="accountType"
                label={
                  <span>
                    <Text strong>账号类型</Text>
                    <Text type="danger"> *</Text>
                  </span>
                }
                rules={[{ required: true, message: "请选择需要申请的账号类型" }]}
              >
                <Select placeholder="请选择账号类型">
                  {accountTypeOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      <Space>
                        <Text strong>{opt.label}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          - {opt.desc}
                        </Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="purpose"
                label={
                  <span>
                    <Text strong>账号用途</Text>
                    <Text type="danger"> *</Text>
                  </span>
                }
                rules={[{ required: true, message: "请填写账号用途" }]}
                extra="请说明使用该账号的具体业务场景，如项目名称、系统名称、门店编码等"
              >
                <Input placeholder="如：门店POS系统、ERP财务模块、新员工入职邮箱等" />
              </Form.Item>

              <Form.Item
                name="urgency"
                label={
                  <span>
                    <Text strong>紧急程度</Text>
                  </span>
                }
                initialValue="medium"
                extra="越紧急的申请，值班人员会优先处理，请如实评估"
              >
                <Select>
                  {urgencyOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      <Space>
                        <Text strong>{opt.label}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          - {opt.desc}
                        </Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="reason"
                label={
                  <span>
                    <Text strong>详细说明</Text>
                  </span>
                }
                extra="可补充更多信息，例如权限范围、使用期限、特殊配置需求等"
              >
                <TextArea
                  rows={5}
                  placeholder="请补充更详细的背景信息，方便审批人判断：&#10;- 申请权限的范围（只读/读写/管理员）&#10;- 预计使用期限&#10;- 需访问的具体系统或服务器&#10;- 其他需要说明的事项"
                />
              </Form.Item>

              <div
                style={{
                  marginTop: 24,
                  padding: "16px 20px",
                  background: "#F7FAFC",
                  borderRadius: 6,
                  border: "1px solid #E2E8F0",
                }}
              >
                <Space>
                  <FileDoneOutlined style={{ color: "#1A365D", fontSize: 18 }} />
                  <div>
                    <Text strong style={{ color: "#1A365D" }}>
                      提交须知
                    </Text>
                    <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                      提交后系统会自动通知值班人员，审批通过后会记录处理时长用于时效考核。
                    </Text>
                  </div>
                </Space>
              </div>

              <Form.Item style={{ marginTop: 24 }}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={submitting} size="large">
                    <PlusOutlined /> 提交申请
                  </Button>
                  <Button size="large" onClick={() => navigate("/account-requests")}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
