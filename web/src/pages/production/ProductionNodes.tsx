import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Popconfirm,
  Form,
  Select,
  Input,
  InputNumber,
  Switch,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ProductionNode, NodeType, PaginationParams } from '@/types';
import {
  getNodes,
  createNode,
  updateNode,
  deleteNode,
} from '@/api/production';

const nodeTypeMap: Record<NodeType, string> = {
  process: '加工工序',
  quality: '质量检测',
  packaging: '包装工序',
  delivery: '出库配送',
};

const nodeTypeColorMap: Record<NodeType, string> = {
  process: 'blue',
  quality: 'cyan',
  packaging: 'green',
  delivery: 'purple',
};

const ProductionNodes: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductionNode[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [queryParams, setQueryParams] = useState<PaginationParams & { nodeType?: NodeType; isActive?: boolean }>({});
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<ProductionNode | null>(null);
  const [searchForm] = Form.useForm();
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNodes({
        ...queryParams,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setData(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      message.error('获取生产节点列表失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = async (values: any) => {
    setQueryParams(values);
    setPagination({ ...pagination, current: 1 });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setQueryParams({});
    setPagination({ ...pagination, current: 1 });
  };

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleAdd = () => {
    setEditingNode(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      sortOrder: 0,
    });
    setFormModalOpen(true);
  };

  const handleEdit = (record: ProductionNode) => {
    setEditingNode(record);
    form.setFieldsValue({
      ...record,
      thresholdConfig: record.thresholdConfig ? JSON.stringify(record.thresholdConfig, null, 2) : '',
    });
    setFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNode(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = { ...values };
      if (submitData.thresholdConfig) {
        try {
          submitData.thresholdConfig = JSON.parse(submitData.thresholdConfig);
        } catch {
          message.error('阈值配置JSON格式错误');
          return;
        }
      } else {
        delete submitData.thresholdConfig;
      }
      if (editingNode) {
        await updateNode(editingNode.id, submitData);
        message.success('更新成功');
      } else {
        await createNode(submitData);
        message.success('创建成功');
      }
      setFormModalOpen(false);
      setEditingNode(null);
      form.resetFields();
      fetchData();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(editingNode ? '更新失败' : '创建失败');
    }
  };

  const columns: ColumnsType<ProductionNode> = [
    {
      title: '节点名称',
      dataIndex: 'nodeName',
      key: 'nodeName',
      width: 150,
    },
    {
      title: '节点编码',
      dataIndex: 'nodeCode',
      key: 'nodeCode',
      width: 120,
    },
    {
      title: '类型',
      dataIndex: 'nodeType',
      key: 'nodeType',
      width: 100,
      render: (type: NodeType) => (
        <Tag color={nodeTypeColorMap[type]}>{nodeTypeMap[type]}</Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'nodeDescription',
      key: 'nodeDescription',
      width: 200,
      ellipsis: true,
      render: (val: string) => val || '-',
    },
    {
      title: '预估工时(小时)',
      dataIndex: 'estimatedHours',
      key: 'estimatedHours',
      width: 120,
      render: (val: number) => val ?? '-',
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      render: (val: number) => val ?? 0,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_: any, record: ProductionNode) => (
        <Space size="small">
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该节点？"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, padding: 16, background: '#fff', borderRadius: 8 }}>
        <Form
          form={searchForm}
          layout="vertical"
          onFinish={handleSearch}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="nodeType" label="节点类型">
                <Select
                  placeholder="请选择节点类型"
                  options={Object.entries(nodeTypeMap).map(([value, label]) => ({ value, label }))}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="isActive" label="启用状态">
                <Select
                  placeholder="请选择状态"
                  options={[
                    { value: true, label: '启用' },
                    { value: false, label: '禁用' },
                  ]}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="节点名称/编码" allowClear />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end">
            <Col>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start' }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增节点</Button>
        </Space>
      </div>

      <Table<ProductionNode>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t: number) => `共 ${t} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingNode ? '编辑生产节点' : '新增生产节点'}
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        onOk={handleSubmit}
        okText="确定"
        cancelText="取消"
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="nodeName"
                label="节点名称"
                rules={[{ required: true, message: '请输入节点名称' }]}
              >
                <Input placeholder="请输入节点名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="nodeCode"
                label="节点编码"
                rules={[{ required: true, message: '请输入节点编码' }]}
              >
                <Input placeholder="请输入节点编码" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="nodeType"
                label="节点类型"
                rules={[{ required: true, message: '请选择节点类型' }]}
              >
                <Select
                  placeholder="请选择节点类型"
                  options={Object.entries(nodeTypeMap).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="estimatedHours"
                label="预估工时(小时)"
              >
                <InputNumber min={0} step={0.5} style={{ width: '100%' }} placeholder="请输入预估工时" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="sortOrder"
                label="排序"
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="数字越小越靠前" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="isActive"
                label="是否启用"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="nodeDescription"
                label="节点描述"
              >
                <Input.TextArea rows={3} placeholder="请输入节点描述" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="thresholdConfig"
                label="阈值配置(JSON)"
              >
                <Input.TextArea rows={4} placeholder='{"warningHours": 8, "maxDelayHours": 24}' />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductionNodes;
