import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  message,
  Drawer,
  Descriptions,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { waitlistRulesApi, counselorApi } from '../../api';

const { Option } = Select;
const { TextArea } = Input;

const ruleTypeMap = {
  time_window: { text: '时间窗口', color: 'blue' },
  capacity: { text: '容量限制', color: 'green' },
  priority: { text: '优先级', color: 'orange' },
};

function WaitlistRulesManage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [counselors, setCounselors] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
    loadCounselors();
  }, [pagination.current, pagination.pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await waitlistRulesApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setData(result.items);
      setPagination(prev => ({ ...prev, total: result.total }));
    } catch (error) {
      console.error('加载规则失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCounselors = async () => {
    try {
      const result = await counselorApi.getList({ page: 1, pageSize: 100 });
      setCounselors(result.items);
    } catch (error) {
      console.error('加载咨询师失败', error);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      notificationWindowMinutes: 30,
      responseTimeoutMinutes: 15,
      maxQueueSize: 10,
      priority: 0,
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除？',
      content: '删除后规则将不再生效，确定要删除吗？',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await waitlistRulesApi.remove(record.id);
          message.success('已删除');
          loadData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleToggle = async (record) => {
    try {
      await waitlistRulesApi.toggle(record.id);
      message.success('状态已更新');
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleViewDetail = (record) => {
    setCurrentRecord(record);
    setDetailVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await waitlistRulesApi.update(editingRecord.id, values);
        message.success('更新成功');
      } else {
        await waitlistRulesApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      if (error.errorFields) return;
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      key: 'ruleName',
      width: 200,
    },
    {
      title: '规则类型',
      dataIndex: 'ruleType',
      key: 'ruleType',
      width: 120,
      render: (type) => {
        const info = ruleTypeMap[type] || { text: type, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '适用咨询师',
      dataIndex: 'counselorId',
      key: 'counselor',
      width: 120,
      render: (id) => {
        if (!id) return '全部';
        const counselor = counselors.find(c => c.id === id);
        return counselor?.name || '指定咨询师';
      },
    },
    {
      title: '通知窗口(分钟)',
      dataIndex: 'notificationWindowMinutes',
      key: 'notificationWindowMinutes',
      width: 120,
    },
    {
      title: '响应超时(分钟)',
      dataIndex: 'responseTimeoutMinutes',
      key: 'responseTimeoutMinutes',
      width: 120,
    },
    {
      title: '最大队列',
      dataIndex: 'maxQueueSize',
      key: 'maxQueueSize',
      width: 100,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (active, record) => (
        <Switch
          checked={active}
          onChange={() => handleToggle(record)}
          size="small"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="候补释放规则"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建规则
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
          }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑规则' : '新建规则'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="规则名称"
            name="ruleName"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>

          <Form.Item
            label="规则类型"
            name="ruleType"
            rules={[{ required: true, message: '请选择规则类型' }]}
          >
            <Select>
              <Option value="time_window">时间窗口</Option>
              <Option value="capacity">容量限制</Option>
              <Option value="priority">优先级</Option>
            </Select>
          </Form.Item>

          <Form.Item label="适用咨询师" name="counselorId">
            <Select allowClear placeholder="不选则对所有咨询师生效">
              {counselors.map(c => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              label="通知窗口(分钟)"
              name="notificationWindowMinutes"
              style={{ flex: 1 }}
            >
              <InputNumber min={1} max={120} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              label="响应超时(分钟)"
              name="responseTimeoutMinutes"
              style={{ flex: 1 }}
            >
              <InputNumber min={1} max={60} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="最大队列人数" name="maxQueueSize" style={{ flex: 1 }}>
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="优先级" name="priority" style={{ flex: 1 }}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item label="规则描述" name="description">
            <TextArea rows={2} placeholder="请输入规则描述" />
          </Form.Item>

          <Form.Item label="启用状态" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="规则详情"
        placement="right"
        width={500}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="规则名称">{currentRecord.ruleName}</Descriptions.Item>
            <Descriptions.Item label="规则类型">
              <Tag color={ruleTypeMap[currentRecord.ruleType]?.color}>
                {ruleTypeMap[currentRecord.ruleType]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="适用咨询师">
              {currentRecord.counselorId ? '指定咨询师' : '全部'}
            </Descriptions.Item>
            <Descriptions.Item label="通知窗口">
              {currentRecord.notificationWindowMinutes} 分钟
            </Descriptions.Item>
            <Descriptions.Item label="响应超时">
              {currentRecord.responseTimeoutMinutes} 分钟
            </Descriptions.Item>
            <Descriptions.Item label="最大队列">{currentRecord.maxQueueSize} 人</Descriptions.Item>
            <Descriptions.Item label="优先级">{currentRecord.priority}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={currentRecord.isActive ? 'green' : 'default'}>
                {currentRecord.isActive ? '启用' : '禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="描述">{currentRecord.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(currentRecord.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}

export default WaitlistRulesManage;
