import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Switch,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  ColorPicker,
  message,
  Drawer,
  Descriptions,
  Popconfirm,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useReminderStore } from '@/store/reminderStore';
import {
  formatDateTime,
  REMINDER_LEVEL_COLORS,
  REMINDER_LEVEL_NAMES,
} from '@/utils';
import type { ReminderRule, ReminderLevel } from '@/types';

const { Option } = Select;
const { TextArea } = Input;

export default function ReminderRules() {
  const navigate = useNavigate();
  const { rules, fetchRules, createRule, updateRule, deleteRule, isLoading } = useReminderStore();

  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ReminderRule | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ReminderRule | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleSubmit = async (values: Partial<ReminderRule>) => {
    try {
      const color = values.color as unknown as { toHexString: () => string };
      const ruleData: Partial<ReminderRule> = {
        ...values,
        color: color?.toHexString ? color.toHexString() : values.color,
        trigger_condition: values.trigger_condition ? JSON.parse(values.trigger_condition as unknown as string) : {},
      };

      if (editingRule) {
        await updateRule(editingRule.id, ruleData);
        message.success('规则更新成功');
      } else {
        await createRule(ruleData);
        message.success('规则创建成功');
      }

      setShowModal(false);
      form.resetFields();
      setEditingRule(null);
      fetchRules();
    } catch {
      message.error('保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRule(id);
      message.success('删除成功');
      fetchRules();
    } catch {
      message.error('删除失败');
    }
  };

  const handleToggleActive = async (rule: ReminderRule, checked: boolean) => {
    try {
      await updateRule(rule.id, { is_active: checked });
      message.success(checked ? '已启用' : '已禁用');
      fetchRules();
    } catch {
      message.error('操作失败');
    }
  };

  const triggerTypes = [
    { value: 'inventory_conflict', label: '房态冲突' },
    { value: 'order_pending', label: '订单待确认超时' },
    { value: 'checkin_tomorrow', label: '明日入住提醒' },
    { value: 'payment_overdue', label: '支付逾期' },
    { value: 'cleaning_overdue', label: '清洁任务逾期' },
    { value: 'custom', label: '自定义' },
  ];

  const columns = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: ReminderLevel) => (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: REMINDER_LEVEL_COLORS[level] }}
          />
          <span>{REMINDER_LEVEL_NAMES[level]}</span>
        </div>
      ),
    },
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ReminderRule) => (
        <div>
          <div className="flex items-center gap-2">
            <span
              className="font-medium cursor-pointer hover:text-primary-600"
              onClick={() => {
                setSelectedRule(record);
                setShowDetailDrawer(true);
              }}
            >
              {text}
            </span>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: record.color }}
            />
          </div>
          {record.description && (
            <div className="text-sm text-gray-500 mt-1">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: '触发类型',
      dataIndex: 'trigger_type',
      key: 'trigger_type',
      width: 140,
      render: (type: string) => {
        const trigger = triggerTypes.find((t) => t.value === type);
        return <Tag color="blue">{trigger?.label || type}</Tag>;
      },
    },
    {
      title: '处理时限',
      dataIndex: 'time_limit_minutes',
      key: 'time_limit_minutes',
      width: 140,
      render: (minutes: number) => (
        <div className="flex items-center gap-1">
          <ClockCircleOutlined />
          <span>{minutes} 分钟</span>
        </div>
      ),
    },
    {
      title: '升级级别',
      dataIndex: 'escalation_level',
      key: 'escalation_level',
      width: 100,
      render: (level?: ReminderLevel) => {
        if (!level) return <span className="text-gray-400">-</span>;
        return (
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: REMINDER_LEVEL_COLORS[level] }}
            />
            <span className="text-sm">{REMINDER_LEVEL_NAMES[level]}</span>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (active: boolean, record: ReminderRule) => (
        <Switch
          checked={active}
          onChange={(checked) => handleToggleActive(record, checked)}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: ReminderRule) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRule(record);
              form.setFieldsValue({
                ...record,
                color: record.color,
                trigger_condition: JSON.stringify(record.trigger_condition, null, 2),
              });
              setShowModal(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个规则吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 m-0">
          <SettingOutlined className="mr-2" />
          提醒规则配置
        </h1>
        <Space>
          <Button onClick={() => navigate('/admin/reminders')}>返回提醒列表</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRule(null);
              form.resetFields();
              form.setFieldsValue({
                level: 3,
                time_limit_minutes: 60,
                is_active: true,
                color: REMINDER_LEVEL_COLORS[3],
                trigger_condition: '{}',
              });
              setShowModal(true);
            }}
          >
            新建规则
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条规则`,
          }}
        />
      </Card>

      <Modal
        title={editingRule ? '编辑提醒规则' : '新建提醒规则'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          form.resetFields();
          setEditingRule(null);
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="规则名称"
                rules={[{ required: true, message: '请输入规则名称' }]}
              >
                <Input placeholder="例如：房态冲突紧急提醒" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="level"
                label="提醒级别"
                rules={[{ required: true, message: '请选择级别' }]}
              >
                <Select>
                  {[1, 2, 3, 4].map((level) => (
                    <Option key={level} value={level}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: REMINDER_LEVEL_COLORS[level as ReminderLevel] }}
                        />
                        {level}级 - {REMINDER_LEVEL_NAMES[level as ReminderLevel]}
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="规则描述">
            <TextArea rows={2} placeholder="请输入规则描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="trigger_type"
                label="触发类型"
                rules={[{ required: true, message: '请选择触发类型' }]}
              >
                <Select>
                  {triggerTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="time_limit_minutes"
                label="处理时限（分钟）"
                rules={[{ required: true, message: '请输入处理时限' }]}
              >
                <InputNumber className="w-full" min={1} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="trigger_condition"
            label="触发条件（JSON格式）"
            rules={[{ required: true, message: '请输入触发条件' }]}
            help='使用JSON格式定义触发条件，例如：{"conflict_type": "double_booking"}'
          >
            <TextArea rows={4} placeholder='{"key": "value"}' />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="escalation_level"
                label="逾期升级级别"
                help="逾期未处理时自动升级到此级别"
              >
                <Select allowClear placeholder="不升级">
                  {[1, 2, 3, 4].map((level) => (
                    <Option key={level} value={level}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: REMINDER_LEVEL_COLORS[level as ReminderLevel] }}
                        />
                        {level}级 - {REMINDER_LEVEL_NAMES[level as ReminderLevel]}
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="color"
                label="标识颜色"
                rules={[{ required: true, message: '请选择颜色' }]}
              >
                <ColorPicker showText />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="is_active" label="启用规则" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button
                onClick={() => {
                  setShowModal(false);
                  form.resetFields();
                  setEditingRule(null);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                {editingRule ? '更新规则' : '创建规则'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="规则详情"
        open={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        width={600}
      >
        {selectedRule && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: selectedRule.color }}
                >
                  {selectedRule.level}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedRule.name}</h3>
                  <p className="text-gray-500">{selectedRule.description}</p>
                </div>
              </div>
            </div>

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="级别">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: REMINDER_LEVEL_COLORS[selectedRule.level] }}
                  />
                  {REMINDER_LEVEL_NAMES[selectedRule.level]}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {selectedRule.is_active ? (
                  <Tag color="green">已启用</Tag>
                ) : (
                  <Tag color="gray">已禁用</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="触发类型">
                {triggerTypes.find((t) => t.value === selectedRule.trigger_type)?.label ||
                  selectedRule.trigger_type}
              </Descriptions.Item>
              <Descriptions.Item label="处理时限">
                {selectedRule.time_limit_minutes} 分钟
              </Descriptions.Item>
              {selectedRule.escalation_level && (
                <Descriptions.Item label="升级级别" span={2}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: REMINDER_LEVEL_COLORS[selectedRule.escalation_level],
                      }}
                    />
                    {REMINDER_LEVEL_NAMES[selectedRule.escalation_level]}
                  </div>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="标识颜色" span={2}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: selectedRule.color }}
                  />
                  <code>{selectedRule.color}</code>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="触发条件" span={2}>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(selectedRule.trigger_condition, null, 2)}
                </pre>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(selectedRule.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {formatDateTime(selectedRule.updated_at)}
              </Descriptions.Item>
            </Descriptions>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="primary"
                onClick={() => {
                  setEditingRule(selectedRule);
                  form.setFieldsValue({
                    ...selectedRule,
                    color: selectedRule.color,
                    trigger_condition: JSON.stringify(selectedRule.trigger_condition, null, 2),
                  });
                  setShowDetailDrawer(false);
                  setShowModal(true);
                }}
              >
                编辑规则
              </Button>
              <Button onClick={() => setShowDetailDrawer(false)}>关闭</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
