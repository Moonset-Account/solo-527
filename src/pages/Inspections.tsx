import { useEffect, useState } from "react";
import {
  Tabs,
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
  Badge,
  DatePicker,
  InputNumber,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import { get, post, put, del } from "@/api/client";
import { useAuthStore } from "@/stores/auth";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface PlanItem {
  id: number;
  name: string;
  frequency: string;
  assigneeId: number;
  createdAt: string;
  assignee: { id: number; displayName: string };
}

interface PlanDetail extends PlanItem {
  tasks: TaskItem[];
}

interface TaskItem {
  id: number;
  planId: number;
  status: string;
  assigneeId: number;
  result?: string;
  note?: string;
  executedAt?: string;
  scheduledDate: string;
  createdAt: string;
  plan: { id: number; name: string };
  assignee: { id: number; displayName: string };
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

const frequencyMap: Record<string, { label: string; color: string }> = {
  daily: { label: "每日", color: "blue" },
  weekly: { label: "每周", color: "purple" },
  monthly: { label: "每月", color: "geekblue" },
};

const statusMap: Record<string, { color: any; label: string }> = {
  pending: { color: "default", label: "待执行" },
  completed: { color: "success", label: "已完成" },
  abnormal: { color: "error", label: "异常" },
};

const resultMap: Record<string, { color: string; label: string }> = {
  normal: { color: "green", label: "正常" },
  abnormal: { color: "red", label: "异常" },
};

export default function Inspections() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [plansLoading, setPlansLoading] = useState(false);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [plansTotal, setPlansTotal] = useState(0);
  const [plansPage, setPlansPage] = useState(1);
  const [plansPageSize, setPlansPageSize] = useState(20);

  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterPlanId, setFilterPlanId] = useState<number | undefined>();
  const [filterAssigneeId, setFilterAssigneeId] = useState<number | undefined>();

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [generateModal, setGenerateModal] = useState<{ id: number; name: string } | null>(null);
  const [planDetailDrawer, setPlanDetailDrawer] = useState<PlanDetail | null>(null);

  const [executeDrawer, setExecuteDrawer] = useState<TaskItem | null>(null);

  const [planForm] = Form.useForm();
  const [generateForm] = Form.useForm();
  const [executeForm] = Form.useForm();

  const [users, setUsers] = useState<UserOption[]>([]);
  const [allPlans, setAllPlans] = useState<PlanItem[]>([]);

  const loadUsers = async () => {
    try {
      const u = await get<UserOption[]>("/api/users");
      setUsers(u);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "加载用户列表失败");
    }
  };

  const loadPlans = async () => {
    try {
      setPlansLoading(true);
      const result = await get<Paginated<PlanItem>>("/api/inspections/plans", {
        page: plansPage,
        pageSize: plansPageSize,
      });
      setPlans(result.items);
      setPlansTotal(result.total);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "加载巡检计划失败");
    } finally {
      setPlansLoading(false);
    }
  };

  const loadAllPlans = async () => {
    try {
      const result = await get<Paginated<PlanItem>>("/api/inspections/plans", {
        page: 1,
        pageSize: 999,
      });
      setAllPlans(result.items);
    } catch (err) {
      // ignore
    }
  };

  const loadTasks = async () => {
    try {
      setTasksLoading(true);
      const params: Record<string, string | number | undefined> = {};
      if (filterPlanId) params.planId = filterPlanId;
      if (filterStatus) params.status = filterStatus;
      if (filterAssigneeId) params.assigneeId = filterAssigneeId;
      const result = await get<TaskItem[]>("/api/inspections/tasks", params);
      setTasks(result);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "加载巡检任务失败");
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadAllPlans();
  }, []);

  useEffect(() => {
    loadPlans();
  }, [plansPage, plansPageSize]);

  useEffect(() => {
    loadTasks();
  }, [filterStatus, filterPlanId, filterAssigneeId]);

  const openCreatePlan = () => {
    setEditingPlan(null);
    planForm.resetFields();
    planForm.setFieldsValue({ frequency: "weekly" });
    setPlanModalOpen(true);
  };

  const openEditPlan = (item: PlanItem) => {
    setEditingPlan(item);
    planForm.setFieldsValue({
      name: item.name,
      frequency: item.frequency,
      assigneeId: item.assigneeId,
    });
    setPlanModalOpen(true);
  };

  const handlePlanSubmit = async (values: any) => {
    try {
      if (editingPlan) {
        await put(`/api/inspections/plans/${editingPlan.id}`, values);
        message.success("计划更新成功");
      } else {
        await post("/api/inspections/plans", values);
        message.success("计划创建成功");
      }
      setPlanModalOpen(false);
      planForm.resetFields();
      loadPlans();
      loadAllPlans();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "操作失败");
    }
  };

  const handleDeletePlan = async (id: number) => {
    try {
      await del(`/api/inspections/plans/${id}`);
      message.success("删除成功");
      loadPlans();
      loadAllPlans();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "删除失败");
    }
  };

  const openPlanDetail = async (item: PlanItem) => {
    try {
      const detail = await get<PlanDetail>(`/api/inspections/plans/${item.id}`);
      setPlanDetailDrawer(detail);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "加载计划详情失败");
    }
  };

  const openGenerateTasks = (item: PlanItem) => {
    setGenerateModal({ id: item.id, name: item.name });
    generateForm.resetFields();
    generateForm.setFieldsValue({ count: 7, startDate: dayjs() });
  };

  const handleGenerateTasks = async (values: { startDate: Dayjs; count: number }) => {
    if (!generateModal) return;
    try {
      await post(`/api/inspections/plans/${generateModal.id}/generate-tasks`, {
        startDate: values.startDate.format("YYYY-MM-DD"),
        count: values.count,
      });
      message.success("任务生成成功");
      setGenerateModal(null);
      generateForm.resetFields();
      loadTasks();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "生成任务失败");
    }
  };

  const openExecuteDrawer = (item: TaskItem) => {
    setExecuteDrawer(item);
    executeForm.resetFields();
    executeForm.setFieldsValue({ result: "normal" });
  };

  const handleExecute = async (values: { result: string; note?: string }) => {
    if (!executeDrawer) return;
    try {
      await put(`/api/inspections/tasks/${executeDrawer.id}/execute`, values);
      if (values.result === "abnormal") {
        message.warning("任务执行完成，已自动生成异常告警，请关注告警中心");
      } else {
        message.success("任务执行成功");
      }
      setExecuteDrawer(null);
      executeForm.resetFields();
      loadTasks();
      if (planDetailDrawer) {
        openPlanDetail({ id: planDetailDrawer.id, name: planDetailDrawer.name, frequency: planDetailDrawer.frequency, assigneeId: planDetailDrawer.assigneeId, createdAt: planDetailDrawer.createdAt, assignee: planDetailDrawer.assignee });
      }
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "执行失败");
    }
  };

  const calcDuration = (scheduled: string, executed: string) => {
    const ms = new Date(executed).getTime() - new Date(scheduled).getTime();
    return Math.round(ms / 60000);
  };

  const planColumns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 70,
      render: (v: number) => <Text strong>#{v}</Text>,
    },
    {
      title: "计划名称",
      dataIndex: "name",
      render: (v: string, r: PlanItem) => (
        <a onClick={() => openPlanDetail(r)} style={{ color: "#1A365D", fontWeight: 500 }}>
          {v}
        </a>
      ),
    },
    {
      title: "执行频率",
      dataIndex: "frequency",
      width: 100,
      render: (v: string) => {
        const cfg = frequencyMap[v] || { label: v, color: "default" };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "负责人",
      dataIndex: "assignee",
      width: 130,
      render: (v: { displayName: string }) => v?.displayName,
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
      width: 280,
      fixed: "right" as const,
      render: (_: any, r: PlanItem) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openPlanDetail(r)}>
            详情
          </Button>
          {isAdmin && (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditPlan(r)}>
                编辑
              </Button>
              <Button type="link" size="small" icon={<ThunderboltOutlined />} onClick={() => openGenerateTasks(r)}>
                生成任务
              </Button>
              <Popconfirm title="确认删除该巡检计划？" onConfirm={() => handleDeletePlan(r.id)} okText="删除" cancelText="取消">
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const taskColumns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 70,
      render: (v: number) => <Text strong>#{v}</Text>,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (v: string) => {
        const cfg = statusMap[v] || { color: "default", label: v };
        return <Badge status={cfg.color} text={cfg.label} />;
      },
    },
    {
      title: "计划名",
      dataIndex: "plan",
      render: (v: { name: string }, r: TaskItem) => (
        <a onClick={() => navigate(`/inspections/${r.id}`)} style={{ color: "#1A365D", fontWeight: 500 }}>
          {v?.name}
        </a>
      ),
    },
    {
      title: "负责人",
      dataIndex: "assignee",
      width: 120,
      render: (v: { displayName: string }) => v?.displayName,
    },
    {
      title: "计划执行时间",
      dataIndex: "scheduledDate",
      width: 120,
      render: (v: string) => new Date(v).toLocaleDateString("zh-CN"),
    },
    {
      title: "实际执行时间",
      dataIndex: "executedAt",
      width: 170,
      render: (v: string | undefined) => v ? new Date(v).toLocaleString("zh-CN") : <span style={{ color: "#bfbfbf" }}>未执行</span>,
    },
    {
      title: "结果",
      dataIndex: "result",
      width: 90,
      render: (v: string | undefined) => {
        if (!v) return "-";
        const cfg = resultMap[v] || { label: v, color: "default" };
        return (
          <Tag color={cfg.color} icon={v === "abnormal" ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "响应时长",
      width: 110,
      render: (_: any, r: TaskItem) => {
        if (r.executedAt && r.scheduledDate) {
          const minutes = calcDuration(r.scheduledDate, r.executedAt);
          const color = minutes <= 60 ? "success" : minutes <= 120 ? "warning" : "error";
          return (
            <Tag color={color as any} icon={<ClockCircleOutlined />}>
              {minutes >= 0 ? `${minutes} 分钟` : `提前 ${Math.abs(minutes)} 分钟`}
            </Tag>
          );
        }
        return <span style={{ color: "#bfbfbf" }}>-</span>;
      },
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      fixed: "right" as const,
      render: (_: any, r: TaskItem) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/inspections/${r.id}`)}>
            详情
          </Button>
          {r.status === "pending" && (!user || r.assigneeId === user.id || isAdmin) && (
            <Button type="primary" size="small" icon={<ThunderboltOutlined />} onClick={() => openExecuteDrawer(r)}>
              执行
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
          设备巡检
        </Title>
      </div>

      <Tabs
        defaultActiveKey="plans"
        items={[
          {
            key: "plans",
            label: "巡检计划",
            children: (
              <div>
                <div style={{ marginBottom: 12 }}>
                  {isAdmin && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreatePlan}>
                      新建巡检计划
                    </Button>
                  )}
                </div>
                <Card size="small">
                  <Table
                    rowKey="id"
                    loading={plansLoading}
                    dataSource={plans}
                    columns={planColumns}
                    scroll={{ x: 1100 }}
                    pagination={{
                      current: plansPage,
                      pageSize: plansPageSize,
                      total: plansTotal,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (t) => `共 ${t} 条`,
                      onChange: (p, ps) => {
                        setPlansPage(p);
                        setPlansPageSize(ps);
                      },
                    }}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: "tasks",
            label: "巡检任务",
            children: (
              <div>
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Space wrap>
                    <span>状态：</span>
                    <Select
                      allowClear
                      style={{ width: 120 }}
                      placeholder="全部状态"
                      value={filterStatus}
                      onChange={(v) => setFilterStatus(v)}
                    >
                      {Object.entries(statusMap).map(([k, v]) => (
                        <Option key={k} value={k}>
                          {v.label}
                        </Option>
                      ))}
                    </Select>
                    <span>巡检计划：</span>
                    <Select
                      allowClear
                      style={{ width: 200 }}
                      placeholder="全部计划"
                      value={filterPlanId}
                      onChange={(v) => setFilterPlanId(v)}
                    >
                      {allPlans.map((p) => (
                        <Option key={p.id} value={p.id}>
                          {p.name}
                        </Option>
                      ))}
                    </Select>
                    <span>负责人：</span>
                    <Select
                      allowClear
                      style={{ width: 150 }}
                      placeholder="全部负责人"
                      value={filterAssigneeId}
                      onChange={(v) => setFilterAssigneeId(v)}
                    >
                      {users.map((u) => (
                        <Option key={u.id} value={u.id}>
                          {u.displayName}
                        </Option>
                      ))}
                    </Select>
                  </Space>
                </Card>
                <Card size="small">
                  <Table
                    rowKey="id"
                    loading={tasksLoading}
                    dataSource={tasks}
                    columns={taskColumns}
                    scroll={{ x: 1300 }}
                    pagination={false}
                  />
                </Card>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={editingPlan ? "编辑巡检计划" : "新建巡检计划"}
        open={planModalOpen}
        onCancel={() => {
          setPlanModalOpen(false);
          planForm.resetFields();
        }}
        onOk={() => planForm.submit()}
        width={520}
      >
        <Form form={planForm} layout="vertical" onFinish={handlePlanSubmit}>
          <Form.Item name="name" label="计划名称" rules={[{ required: true, message: "请输入计划名称" }]}>
            <Input placeholder="如：门店设备周巡检" />
          </Form.Item>
          <Form.Item name="frequency" label="执行频率" rules={[{ required: true, message: "请选择执行频率" }]}>
            <Select>
              {Object.entries(frequencyMap).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="assigneeId" label="负责人" rules={[{ required: true, message: "请选择负责人" }]}>
            <Select placeholder="请选择巡检负责人">
              {users.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.displayName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`批量生成任务 - ${generateModal?.name || ""}`}
        open={!!generateModal}
        onCancel={() => {
          setGenerateModal(null);
          generateForm.resetFields();
        }}
        onOk={() => generateForm.submit()}
        width={480}
      >
        <Form form={generateForm} layout="vertical" onFinish={handleGenerateTasks}>
          <Form.Item name="startDate" label="开始日期" rules={[{ required: true, message: "请选择开始日期" }]}>
            <DatePicker style={{ width: "100%" }} placeholder="选择第一个任务的执行日期" />
          </Form.Item>
          <Form.Item
            name="count"
            label="生成数量"
            rules={[{ required: true, message: "请输入生成数量" }]}
            extra="系统将按照计划频率自动计算后续日期"
          >
            <InputNumber min={1} max={365} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`执行巡检任务 ${executeDrawer ? `#${executeDrawer.id}` : ""}`}
        open={!!executeDrawer}
        onClose={() => {
          setExecuteDrawer(null);
          executeForm.resetFields();
        }}
        width={480}
      >
        {executeDrawer && (
          <div>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="巡检计划">{executeDrawer.plan?.name}</Descriptions.Item>
              <Descriptions.Item label="负责人">{executeDrawer.assignee?.displayName}</Descriptions.Item>
              <Descriptions.Item label="计划执行日期">
                <CalendarOutlined /> {new Date(executeDrawer.scheduledDate).toLocaleDateString("zh-CN")}
              </Descriptions.Item>
            </Descriptions>
            <Divider orientation="left">执行结果</Divider>
            <Form form={executeForm} layout="vertical" onFinish={handleExecute}>
              <Form.Item name="result" label="巡检结果" rules={[{ required: true, message: "请选择巡检结果" }]}>
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
                    <div style={{ marginBottom: 16, padding: 12, background: "#FFF2F0", border: "1px solid #FFCCC7", borderRadius: 6, color: "#CF1322" }}>
                      <ExclamationCircleOutlined /> 选择异常结果后，系统将自动生成告警，请确保备注信息完整
                    </div>
                  ) : null
                }
              </Form.Item>
              <Button type="primary" onClick={() => executeForm.submit()} block icon={<ThunderboltOutlined />}>
                提交巡检结果
              </Button>
            </Form>
          </div>
        )}
      </Drawer>

      <Drawer
        title={`计划详情 ${planDetailDrawer ? `#${planDetailDrawer.id}` : ""}`}
        open={!!planDetailDrawer}
        onClose={() => setPlanDetailDrawer(null)}
        width={640}
      >
        {planDetailDrawer && (
          <div>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="计划名称">{planDetailDrawer.name}</Descriptions.Item>
              <Descriptions.Item label="执行频率">
                <Tag color={frequencyMap[planDetailDrawer.frequency]?.color}>
                  {frequencyMap[planDetailDrawer.frequency]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="负责人">{planDetailDrawer.assignee?.displayName}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(planDetailDrawer.createdAt).toLocaleString("zh-CN")}
              </Descriptions.Item>
            </Descriptions>
            <Title level={5}>关联任务（{planDetailDrawer.tasks?.length || 0}）</Title>
            <Table
              size="small"
              rowKey="id"
              dataSource={planDetailDrawer.tasks || []}
              pagination={false}
              columns={[
                {
                  title: "ID",
                  dataIndex: "id",
                  width: 70,
                  render: (v: number) => `#${v}`,
                },
                {
                  title: "状态",
                  dataIndex: "status",
                  width: 100,
                  render: (v: string) => {
                    const cfg = statusMap[v] || { color: "default", label: v };
                    return <Badge status={cfg.color} text={cfg.label} />;
                  },
                },
                {
                  title: "计划日期",
                  dataIndex: "scheduledDate",
                  width: 120,
                  render: (v: string) => new Date(v).toLocaleDateString("zh-CN"),
                },
                {
                  title: "结果",
                  dataIndex: "result",
                  width: 90,
                  render: (v: string | undefined) => {
                    if (!v) return "-";
                    const cfg = resultMap[v] || { label: v, color: "default" };
                    return <Tag color={cfg.color}>{cfg.label}</Tag>;
                  },
                },
                {
                  title: "操作",
                  width: 80,
                  render: (_: any, r: any) => (
                    <Button type="link" size="small" onClick={() => navigate(`/inspections/${r.id}`)}>
                      详情
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
