import { useEffect, useState, useMemo } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Select,
  Modal,
  Form,
  DatePicker,
  message,
  Popconfirm,
  Card,
  Spin,
  Row,
  Col,
  Statistic,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  TeamOutlined,
  SunOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { get, post, put, del } from "@/api/client";
import { useAuthStore } from "@/stores/auth";

const { Title, Text } = Typography;
const { Option } = Select;

interface DutyItem {
  id: number;
  staffId: number;
  date: string;
  shift: string;
  staff: { id: number; displayName: string };
}

interface UserOption {
  id: number;
  displayName: string;
  username: string;
  role: string;
}

const shiftConfig: Record<string, { label: string; color: string }> = {
  morning: { label: "早班", color: "gold" },
  afternoon: { label: "中班", color: "blue" },
  night: { label: "夜班", color: "purple" },
};

const shiftOrder = ["morning", "afternoon", "night"];

function formatMonth(d: Dayjs) {
  return d.format("YYYY-MM");
}

function getDaysInMonth(monthStr: string) {
  const year = parseInt(monthStr.split("-")[0]);
  const month = parseInt(monthStr.split("-")[1]);
  const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();
  const days: string[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const day = dayjs(`${year}-${month}-${String(i).padStart(2, "0")}`);
    days.push(day.format("YYYY-MM-DD"));
  }
  return days;
}

export default function Duty() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DutyItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DutyItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

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
      const result = await get<DutyItem[]>("/api/duty", {
        month: formatMonth(currentMonth) });
      setData(result || []);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "加载值班列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadUsers();
  }, [currentMonth]);

  const stats = useMemo(() => {
    const uniqueDays = new Set<string>();
    const staffCount: Record<string, number> = {};
    data.forEach((item) => {
      uniqueDays.add(item.date);
      const name = item.staff?.displayName || `用户${item.staffId}`;
      staffCount[name] = (staffCount[name] || 0) + 1;
    });
    return {
      totalDays: uniqueDays.size,
      staffCount,
    };
  }, [data]);

  const calendarData = useMemo(() => {
    const days = getDaysInMonth(formatMonth(currentMonth));
    const map: Record<string, Record<string, DutyItem[]>> = {};
    data.forEach((item) => {
      const d = dayjs(item.date).format("YYYY-MM-DD");
      if (!map[d]) map[d] = {};
      if (!map[d][item.shift]) map[d][item.shift] = [];
      map[d][item.shift].push(item);
    });
    return days.map((date) => {
      const row: any = { key: date, date };
      shiftOrder.forEach((shift) => {
        row[shift] = map[date]?.[shift] || [];
      });
      return row;
    });
  }, [data, currentMonth]);

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ shift: "morning" });
    setModalOpen(true);
  };

  const handleEdit = (item: DutyItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      staffId: item.staffId,
      date: dayjs(item.date),
      shift: item.shift,
    });
    setModalOpen(true);
  };

  const handleDelete = async (item: DutyItem) => {
    try {
      await del(`/api/duty/${item.id}`);
      message.success("删除成功");
      loadData();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "删除失败");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      const payload = {
        staffId: values.staffId,
        date: values.date.format("YYYY-MM-DD"),
        shift: values.shift,
      };
      if (editingItem) {
        await put(`/api/duty/${editingItem.id}`, payload);
        message.success("编辑成功");
      } else {
        await post("/api/duty", payload);
        message.success("新增成功");
      }
      setModalOpen(false);
      form.resetFields();
      setEditingItem(null);
      loadData();
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message || "操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  const renderShiftCell = (items: DutyItem[]) => {
    if (!items || items.length === 0) {
      return <span style={{ color: "#bfbfbf" }}>—</span>;
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "4px 8px",
              background: "#fafafa",
              borderRadius: 4,
              border: "1px solid #f0f0f0",
              flexWrap: "wrap",
              gap: 4,
            }}
          >
            <span style={{ fontWeight: 500 }}>{item.staff?.displayName || `用户${item.staffId}`}</span>
            {isAdmin && (
              <Space size={4}>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  style={{ padding: 0 }}
                  onClick={() => handleEdit(item)}
                />
                <Popconfirm
                  title="确定删除该值班安排？"
                  description={`将删除 ${item.staff?.displayName} 的值班记录`}
                  onConfirm={() => handleDelete(item)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    style={{ padding: 0 }}
                  />
                </Popconfirm>
              </Space>
            )}
          </div>
        ))}
      </div>
    );
  };

  const columns = [
    {
      title: "日期",
      dataIndex: "date",
      width: 140,
      fixed: "left" as const,
      render: (dateStr: string) => {
        const d = dayjs(dateStr);
        const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.day()];
        const isToday = d.isSame(dayjs(), "day");
        return (
          <div>
            <div style={{ fontWeight: 600, color: isToday ? "#1A365D" : undefined }}>
              {d.format("MM-DD")}
            </div>
            <div style={{ fontSize: 12, color: "#8c8c8c" }}>
              {weekday}
              {isToday && <Tag color="blue" style={{ marginLeft: 4 }}>今天</Tag>}
            </div>
          </div>
        );
      },
    },
    ...shiftOrder.map((shift) => ({
      title: (
        <span>
          <Tag color={shiftConfig[shift].color}>
            {shift === "morning" && <SunOutlined />}
            {shift === "afternoon" && <ClockCircleOutlined />}
            {shift === "night" && <CalendarOutlined />}
            {" "}{shiftConfig[shift].label}
          </Tag>
        </span>
      ),
      dataIndex: shift,
      render: renderShiftCell,
    })),
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          值班管理
        </Title>
        <Space wrap>
          <DatePicker
            picker="month"
            value={currentMonth}
            onChange={(v) => v && setCurrentMonth(v)}
            format="YYYY 年 MM 月"
            style={{ width: 160 }}
          />
          {isAdmin && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              新增值班安排
            </Button>
          )}
        </Space>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title={
                <span>
                  <CalendarOutlined style={{ marginRight: 6 }} />
                  当月值班天数
                </span>
              }
              value={stats.totalDays}
              suffix="天"
              valueStyle={{ color: "#1A365D" }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title={
                <span>
                  <TeamOutlined style={{ marginRight: 6 }} />
                  值班总班次
                </span>
              }
              value={data.length}
              suffix="次"
              valueStyle={{ color: "#38B2AC" }}
            />
          </Col>
          <Col xs={24} md={8}>
            <div>
              <Text type="secondary" style={{ fontSize: 14 }}>
                各人员值班次数
              </Text>
            </div>
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.keys(stats.staffCount).length > 0 ? (
                Object.entries(stats.staffCount)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, count]) => (
                    <Tag key={name} color="geekblue">
                      {name}: {count} 次
                    </Tag>
                  ))
              ) : (
                <span style={{ color: "#bfbfbf" }}>暂无数据</span>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      <Divider style={{ margin: "0 0 16px 0" }} />

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={calendarData}
          pagination={false}
          scroll={{ x: 900 }}
          size="middle"
        />
      )}

      <Modal
        title={editingItem ? "编辑值班安排" : "新增值班安排"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingItem(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="确定"
        cancelText="取消"
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="staffId"
            label="值班人员"
            rules={[{ required: true, message: "请选择值班人员" }]}
          >
            <Select placeholder="请选择值班人员" showSearch optionFilterProp="children">
              {users.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.displayName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="date"
            label="日期"
            rules={[{ required: true, message: "请选择日期" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="YYYY 年 MM 月 DD 日"
              placeholder="请选择日期"
            />
          </Form.Item>
          <Form.Item
            name="shift"
            label="班次"
            rules={[{ required: true, message: "请选择班次" }]}
            initialValue="morning"
          >
            <Select placeholder="请选择班次">
              {Object.entries(shiftConfig).map(([key, cfg]) => (
                <Option key={key} value={key}>
                  <Tag color={cfg.color}>
                    {key === "morning" && <SunOutlined />}
                    {key === "afternoon" && <ClockCircleOutlined />}
                    {key === "night" && <CalendarOutlined />}
                    {" "}{cfg.label}
                  </Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
