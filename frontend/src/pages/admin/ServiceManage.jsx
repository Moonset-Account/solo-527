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
  message,
  Drawer,
  Descriptions,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { servicesApi, counselorApi } from '../../api';

const { Option } = Select;
const { TextArea } = Input;

const statusMap = {
  active: { text: '上架', color: 'green' },
  inactive: { text: '下架', color: 'default' },
};

function ServiceManage() {
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
      const result = await servicesApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setData(result.items);
      setPagination(prev => ({ ...prev, total: result.total }));
    } catch (error) {
      console.error('加载服务失败', error);
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
    form.setFieldsValue({ status: 'active' });
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
      content: '删除后服务将不可用，确定要删除吗？',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await servicesApi.remove(record.id);
          message.success('已删除');
          loadData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleViewDetail = async (record) => {
    try {
      const detail = await servicesApi.getDetail(record.id);
      setCurrentRecord(detail);
      setDetailVisible(true);
    } catch (error) {
      message.error('加载详情失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await servicesApi.update(editingRecord.id, values);
        message.success('更新成功');
      } else {
        await servicesApi.create(values);
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
      title: '服务名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: '咨询师',
      dataIndex: ['counselor', 'name'],
      key: 'counselor',
      width: 120,
    },
    {
      title: '时长(分钟)',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{price}</span>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
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
        title="服务项目管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建服务
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
        title={editingRecord ? '编辑服务' : '新建服务'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={500}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="所属咨询师"
            name="counselorId"
            rules={[{ required: true, message: '请选择咨询师' }]}
          >
            <Select placeholder="请选择咨询师">
              {counselors.map(c => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="服务名称"
            name="name"
            rules={[{ required: true, message: '请输入服务名称' }]}
          >
            <Input placeholder="例如：个人成长咨询" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              label="时长(分钟)"
              name="duration"
              rules={[{ required: true, message: '请输入时长' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={15} step={15} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              label="价格(元)"
              name="price"
              rules={[{ required: true, message: '请输入价格' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} step={10} style={{ width: '100%' }} prefix="¥" />
            </Form.Item>
          </div>

          <Form.Item label="服务描述" name="description">
            <TextArea rows={3} placeholder="请描述服务内容" />
          </Form.Item>

          <Form.Item label="备注" name="notes">
            <TextArea rows={2} placeholder="备注信息" />
          </Form.Item>

          <Form.Item label="状态" name="status">
            <Select>
              <Option value="active">上架</Option>
              <Option value="inactive">下架</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="服务详情"
        placement="right"
        width={500}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="服务名称">{currentRecord.name}</Descriptions.Item>
            <Descriptions.Item label="咨询师">{currentRecord.counselor?.name}</Descriptions.Item>
            <Descriptions.Item label="时长">{currentRecord.duration} 分钟</Descriptions.Item>
            <Descriptions.Item label="价格">¥{currentRecord.price}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[currentRecord.status]?.color}>
                {statusMap[currentRecord.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="服务描述">{currentRecord.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注">{currentRecord.notes || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(currentRecord.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}

export default ServiceManage;
