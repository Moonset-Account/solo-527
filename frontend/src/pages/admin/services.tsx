import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Select,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import request from '../../utils/request';
import {
  Service,
  ServiceType,
  ServiceTypeLabels,
  PageResult,
} from '../../types';

const { Option } = Select;
const { TextArea } = Input;

interface QueryParams {
  page?: number;
  pageSize?: number;
  type?: ServiceType;
  keyword?: string;
  isActive?: boolean;
}

const ServicesPage = () => {
  const [data, setData] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [queryParams, setQueryParams] = useState<QueryParams>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Service | null>(null);
  const [form] = Form.useForm();

  const fetchData = async (params?: QueryParams) => {
    setLoading(true);
    try {
      const mergedParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...queryParams,
        ...params,
      };
      const result: PageResult<Service> = await request.get('/services', {
        params: mergedParams,
      });
      setData(result.data || []);
      setPagination({
        current: result.page || 1,
        pageSize: result.pageSize || 10,
        total: result.total || 0,
      });
    } catch (error) {
      console.error('获取服务列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData({ page: 1, ...queryParams });
  };

  const handleReset = () => {
    setQueryParams({});
    setPagination({ current: 1, pageSize: 10, total: 0 });
    fetchData({ page: 1 });
  };

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      sortOrder: 0,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: Service) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/services/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('删除服务失败:', error);
    }
  };

  const handleToggleActive = async (record: Service, checked: boolean) => {
    try {
      await request.put(`/services/${record.id}`, { isActive: checked });
      message.success(checked ? '已启用' : '已禁用');
      fetchData();
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await request.put(`/services/${editingRecord.id}`, values);
        message.success('更新成功');
      } else {
        await request.post('/services', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  const columns: ColumnsType<Service> = [
    {
      title: '服务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: ServiceType) => ServiceTypeLabels[type] || type,
    },
    {
      title: '时长(分钟)',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (value) => `¥${value}`,
    },
    {
      title: '原价',
      dataIndex: 'originalPrice',
      key: 'originalPrice',
      render: (value) => (value ? `¥${value}` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (value, record) => (
        <Switch
          checked={value}
          onChange={(checked) => handleToggleActive(record, checked)}
        />
      ),
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      sorter: (a, b) => a.sortOrder - b.sortOrder,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除该服务？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          placeholder="搜索服务名称"
          style={{ width: 200 }}
          allowClear
          onChange={(e) => setQueryParams((prev) => ({ ...prev, keyword: e.target.value }))}
        />
        <Select
          placeholder="选择类型"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setQueryParams((prev) => ({ ...prev, type: value }))}
        >
          {Object.values(ServiceType).map((type) => (
            <Option key={type} value={type}>
              {ServiceTypeLabels[type]}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="选择状态"
          allowClear
          style={{ width: 120 }}
          onChange={(value) => setQueryParams((prev) => ({ ...prev, isActive: value }))}
        >
          <Option value={true}>启用</Option>
          <Option value={false}>禁用</Option>
        </Select>
        <Button type="primary" onClick={handleSearch}>
          查询
        </Button>
        <Button onClick={handleReset}>重置</Button>
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建服务
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize, total: pagination.total });
            fetchData({ page, pageSize });
          },
        }}
      />

      <Modal
        title={editingRecord ? '编辑服务' : '新建服务'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="服务名称"
            rules={[{ required: true, message: '请输入服务名称' }]}
          >
            <Input placeholder="请输入服务名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="服务类型"
            rules={[{ required: true, message: '请选择服务类型' }]}
          >
            <Select placeholder="请选择服务类型">
              {Object.values(ServiceType).map((type) => (
                <Option key={type} value={type}>
                  {ServiceTypeLabels[type]}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入服务描述" />
          </Form.Item>
          <Form.Item
            name="duration"
            label="时长(分钟)"
            rules={[{ required: true, message: '请输入服务时长' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item
            name="price"
            label="价格"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
          </Form.Item>
          <Form.Item name="originalPrice" label="原价">
            <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
          </Form.Item>
          <Form.Item name="applicableSpecies" label="适用宠物种类">
            <Select
              mode="tags"
              placeholder="输入适用宠物种类，按回车确认"
              tokenSeparators={[',']}
            />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="isActive" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ServicesPage;
