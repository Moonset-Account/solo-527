import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Button,
  Form,
  Input,
  Modal,
  Space,
  Tooltip,
  Spin,
  Empty,
  message,
  InputNumber,
  Switch,
  ColumnsType,
  Popconfirm,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ApartmentOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { plotApi } from '@/api';
import { Plot, Guid } from '@/types';

const { TextArea } = Input;

const columns: ColumnsType<Plot> = [
  {
    title: '地块编码',
    dataIndex: 'plotCode',
    key: 'plotCode',
    width: 140,
    render: (v) => <Tag color="blue">{v || '-'}</Tag>,
  },
  { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '大棚', dataIndex: 'greenhouseName', key: 'greenhouseName', width: 160 },
  {
    title: '面积(㎡)',
    dataIndex: 'area',
    key: 'area',
    width: 120,
    render: (v) => v?.toFixed(2) || '0.00',
  },
  { title: '位置', dataIndex: 'location', key: 'location', ellipsis: true },
  {
    title: '状态',
    dataIndex: 'isActive',
    key: 'isActive',
    width: 100,
    render: (v) =>
      v ? <Tag color="success">启用</Tag> : <Tag color="default">停用</Tag>,
  },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
    render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
  },
];

function Plots() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Plot | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await plotApi.getAll();
      setPlots(Array.isArray(data) ? data : []);
    } catch {
      message.error('加载地块数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (record?: Plot) => {
    setEditingRecord(record || null);
    if (record) {
      form.setFieldsValue({ ...record });
    } else {
      form.resetFields();
      form.setFieldsValue({ isActive: true });
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await plotApi.update(editingRecord.id, values);
        message.success('更新成功');
      } else {
        await plotApi.create(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      loadData();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error('保存失败');
    }
  };

  const handleDelete = async (id: Guid) => {
    try {
      await plotApi.remove(id);
      message.success('删除成功');
      loadData();
    } catch {
      message.error('删除失败，该地块可能有关联数据');
    }
  };

  const opColumns: ColumnsType<Plot> = [
    ...columns,
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑">
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal(record)}>
              编辑
            </Button>
          </Tooltip>
          <Popconfirm
            title="确定删除此地块？"
            description="删除后不可恢复，且该地块有关联数据时无法删除"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Card
        title={
          <Space>
            <ApartmentOutlined style={{ color: '#1677ff' }} />
            <span>地块管理</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              新增地块
            </Button>
          </Space>
        }
      >
        {plots.length === 0 ? (
          <Empty description="暂无地块数据" />
        ) : (
          <Table
            rowKey="id"
            columns={opColumns}
            dataSource={plots}
            scroll={{ x: 1400 }}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={editingRecord ? '编辑地块' : '新增地块'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        destroyOnClose={true}
        width={640}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="plotCode"
                label="地块编码"
                rules={[{ required: true, message: '请输入地块编码' }]}
              >
                <Input prefix={<ApartmentOutlined />} placeholder="如：P001" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="地块名称"
                rules={[{ required: true, message: '请输入地块名称' }]}
              >
                <Input placeholder="如：一号番茄种植区" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="greenhouseName"
                label="所属大棚"
                rules={[{ required: true, message: '请输入大棚名称' }]}
              >
                <Input placeholder="如：A区大棚1号" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="area"
                label="面积(㎡)"
                rules={[{ required: true, message: '请输入面积' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="location" label="位置描述">
                <Input prefix={<EnvironmentOutlined />} placeholder="如：园区东北角" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="description" label="详细描述">
                <TextArea rows={3} placeholder="可选：土壤类型、灌溉方式、备注信息等" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="isActive" label="启用状态" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="停用" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Spin>
  );
}

export default Plots;
