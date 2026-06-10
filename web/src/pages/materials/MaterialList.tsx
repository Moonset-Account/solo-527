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
  Card,
  Statistic,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Material, MaterialCategory, MaterialQueryParams } from '@/types';
import { materialCategoryMap } from '@/types';
import {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getLowStockMaterials,
} from '@/api/material';

const categoryColorMap: Record<MaterialCategory, string> = {
  paper: 'blue',
  ink: 'magenta',
  plate: 'geekblue',
  chemical: 'orange',
  packaging: 'green',
  other: 'default',
};

const MaterialList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [queryParams, setQueryParams] = useState<MaterialQueryParams>({});
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lowStockAlertVisible, setLowStockAlertVisible] = useState(false);
  const [searchForm] = Form.useForm();
  const [materialForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMaterials({
        ...queryParams,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setData(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      message.error('获取耗材列表失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams, pagination.current, pagination.pageSize]);

  const fetchLowStockCount = useCallback(async () => {
    try {
      const res = await getLowStockMaterials();
      setLowStockCount(res.length || 0);
    } catch (error) {
      console.error('获取低库存数量失败', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchLowStockCount();
  }, [fetchLowStockCount]);

  const handleSearch = async (values: any) => {
    const params: MaterialQueryParams = { ...values };
    if (values.isActive === undefined) {
      delete params.isActive;
    }
    setQueryParams(params);
    setPagination({ ...pagination, current: 1 });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setQueryParams({});
    setLowStockAlertVisible(false);
    setPagination({ ...pagination, current: 1 });
  };

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleAdd = () => {
    setEditingMaterial(null);
    materialForm.resetFields();
    materialForm.setFieldsValue({
      isActive: true,
      safetyStock: 0,
      currentStock: 0,
    });
    setFormModalOpen(true);
  };

  const handleEdit = (record: Material) => {
    setEditingMaterial(record);
    materialForm.setFieldsValue({
      ...record,
    });
    setFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMaterial(id);
      message.success('删除成功');
      fetchData();
      fetchLowStockCount();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      const formData = { ...values };
      if (formData.thresholdConfig && typeof formData.thresholdConfig === 'string') {
        try {
          formData.thresholdConfig = JSON.parse(formData.thresholdConfig);
        } catch (e) {
          message.error('阈值配置JSON格式错误');
          return;
        }
      }
      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, formData);
        message.success('更新成功');
      } else {
        await createMaterial(formData);
        message.success('创建成功');
      }
      setFormModalOpen(false);
      setEditingMaterial(null);
      materialForm.resetFields();
      fetchData();
      fetchLowStockCount();
    } catch (error) {
      message.error(editingMaterial ? '更新失败' : '创建失败');
    }
  };

  const handleLowStockClick = () => {
    setLowStockAlertVisible(true);
    searchForm.setFieldsValue({
      isLowStock: true,
    });
    setQueryParams({ ...queryParams, isLowStock: true });
    setPagination({ ...pagination, current: 1 });
  };

  const isLowStockRow = (record: Material) => {
    return record.currentStock <= record.safetyStock;
  };

  const isZeroStock = (record: Material) => {
    return record.currentStock === 0;
  };

  const columns: ColumnsType<Material> = [
    {
      title: '耗材名称',
      dataIndex: 'materialName',
      key: 'materialName',
      width: 140,
      fixed: 'left',
      render: (val: string, record: Material) => (
        <Space>
          {val}
          {isZeroStock(record) && <Tag color="error" icon={<WarningOutlined />}>缺货</Tag>}
        </Space>
      ),
    },
    {
      title: '编码',
      dataIndex: 'materialCode',
      key: 'materialCode',
      width: 120,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: MaterialCategory) => (
        <Tag color={categoryColorMap[category]}>
          {materialCategoryMap[category]}
        </Tag>
      ),
    },
    {
      title: '规格',
      dataIndex: 'materialSpec',
      key: 'materialSpec',
      width: 120,
      render: (val: string) => val || '-',
    },
    {
      title: '库存单位',
      dataIndex: 'stockUnit',
      key: 'stockUnit',
      width: 80,
      render: (val: string) => val || '-',
    },
    {
      title: '当前库存',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 100,
      render: (val: number, record: Material) => {
        const color = isZeroStock(record) ? '#ff4d4f' : isLowStockRow(record) ? '#faad14' : undefined;
        const weight = isZeroStock(record) || isLowStockRow(record) ? 'bold' : undefined;
        return <span style={{ color, fontWeight: weight }}>{val}</span>;
      },
    },
    {
      title: '安全库存',
      dataIndex: 'safetyStock',
      key: 'safetyStock',
      width: 100,
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 120,
      render: (val: string) => val || '-',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (val: boolean) => (
        <Tag color={val ? 'success' : 'default'}>{val ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (val: string | Date) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_: any, record: Material) => (
        <Space size="small" wrap>
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该耗材？"
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
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            onClick={handleLowStockClick}
            hoverable
            style={{
              cursor: 'pointer',
              background: lowStockCount > 0 ? '#fff2f0' : '#fff',
              borderColor: lowStockCount > 0 ? '#ffccc7' : '#f0f0f0',
            }}
          >
            <Statistic
              title="低库存预警"
              value={lowStockCount}
              suffix="种"
              valueStyle={{
                color: lowStockCount > 0 ? '#cf1322' : '#52c41a',
                fontSize: 24,
              }}
              prefix={<WarningOutlined />}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>点击筛选低库存耗材</div>
          </Card>
        </Col>
      </Row>

      {lowStockAlertVisible && (
        <Alert
          message="低库存筛选模式"
          description="当前显示的是库存低于安全库存的耗材，可点击重置按钮返回全部列表"
          type="warning"
          showIcon
          closable
          onClose={() => {
            setLowStockAlertVisible(false);
            searchForm.setFieldsValue({ isLowStock: undefined });
            setQueryParams({ ...queryParams, isLowStock: undefined });
            setPagination({ ...pagination, current: 1 });
          }}
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ marginBottom: 16, padding: 16, background: '#fff', borderRadius: 8 }}>
        <Form
          form={searchForm}
          layout="vertical"
          onFinish={handleSearch}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="category" label="分类">
                <Select
                  placeholder="请选择分类"
                  options={Object.entries(materialCategoryMap).map(([value, label]) => ({ value, label }))}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="isActive" label="启用状态" valuePropName="checked">
                <Select
                  placeholder="请选择状态"
                  allowClear
                  options={[
                    { label: '启用', value: true },
                    { label: '禁用', value: false },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="isLowStock" label="低库存预警" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="名称/编码/供应商" allowClear />
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

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增耗材</Button>
        </Space>
      </div>

      <Table<Material>
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
        scroll={{ x: 1400 }}
        rowClassName={(record) => {
          if (isZeroStock(record)) return 'ant-table-row-danger';
          if (isLowStockRow(record)) return 'ant-table-row-warning';
          return '';
        }}
      />

      <style>{`
        .ant-table-row-danger > td {
          background-color: #fff1f0 !important;
        }
        .ant-table-row-warning > td {
          background-color: #fffbe6 !important;
        }
      `}</style>

      <Modal
        title={editingMaterial ? '编辑耗材' : '新增耗材'}
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        width={700}
        destroyOnClose
        footer={null}
      >
        <Form
          form={materialForm}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="materialName"
                label="耗材名称"
                rules={[{ required: true, message: '请输入耗材名称' }]}
              >
                <Input placeholder="请输入耗材名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="materialCode"
                label="编码"
                rules={[{ required: true, message: '请输入编码' }]}
              >
                <Input placeholder="请输入编码" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select
                  placeholder="请选择分类"
                  options={Object.entries(materialCategoryMap).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="materialSpec" label="规格">
                <Input placeholder="请输入规格" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="stockUnit" label="库存单位">
                <Input placeholder="例如：包/卷/千克" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="supplier" label="供应商">
                <Input placeholder="请输入供应商" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="safetyStock"
                label="安全库存"
                rules={[{ required: true, message: '请输入安全库存' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入安全库存" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currentStock"
                label="当前库存"
                rules={[{ required: true, message: '请输入当前库存' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入当前库存" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="启用状态"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="thresholdConfig" label="阈值配置(JSON)">
            <Input.TextArea
              rows={3}
              placeholder='{"minStock": 10, "maxStock": 500, "reorderPoint": 20}'
            />
          </Form.Item>
          <Row justify="end">
            <Col>
              <Space>
                <Button onClick={() => setFormModalOpen(false)}>取消</Button>
                <Button type="primary" htmlType="submit">
                  {editingMaterial ? '更新' : '创建'}
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MaterialList;
