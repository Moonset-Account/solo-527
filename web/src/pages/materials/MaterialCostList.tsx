import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  message,
  Popconfirm,
  Form,
  Select,
  Input,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Card,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  DollarOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { MaterialCost, MaterialCostQueryParams, Material } from '@/types';
import {
  getMaterialCosts,
  createMaterialCost,
  updateMaterialCost,
  deleteMaterialCost,
  getCostStats,
  getMaterials,
} from '@/api/material';

const { RangePicker } = DatePicker;

const MaterialCostList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MaterialCost[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [queryParams, setQueryParams] = useState<MaterialCostQueryParams>({});
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<MaterialCost | null>(null);
  const [costStats, setCostStats] = useState({ totalCost: 0, totalQuantity: 0 });
  const [materialOptions, setMaterialOptions] = useState<{ label: string; value: string }[]>([]);
  const [searchForm] = Form.useForm();
  const [costForm] = Form.useForm();
  const [quantityUsed, setQuantityUsed] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMaterialCosts({
        ...queryParams,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setData(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      message.error('获取耗材成本列表失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams, pagination.current, pagination.pageSize]);

  const fetchCostStats = useCallback(async () => {
    try {
      const res = await getCostStats(
        queryParams.materialId,
        queryParams.startDate,
        queryParams.endDate
      );
      setCostStats({
        totalCost: res.totalCost || 0,
        totalQuantity: res.totalQuantity || 0,
      });
    } catch (error) {
      console.error('获取成本统计失败', error);
    }
  }, [queryParams.materialId, queryParams.startDate, queryParams.endDate]);

  const fetchMaterialOptions = useCallback(async () => {
    try {
      const res = await getMaterials({ page: 1, pageSize: 999 });
      setMaterialOptions(
        (res.list || []).map((m: Material) => ({
          label: `${m.materialName} (${m.materialCode})`,
          value: m.id,
        }))
      );
    } catch (error) {
      console.error('获取耗材列表失败', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchCostStats();
  }, [fetchCostStats]);

  useEffect(() => {
    fetchMaterialOptions();
  }, [fetchMaterialOptions]);

  const averageUnitCost = useMemo(() => {
    if (costStats.totalQuantity === 0) return 0;
    return costStats.totalCost / costStats.totalQuantity;
  }, [costStats]);

  const handleSearch = async (values: any) => {
    const params: MaterialCostQueryParams = { ...values };
    if (values.costDate && values.costDate.length === 2) {
      params.startDate = values.costDate[0]?.format('YYYY-MM-DD');
      params.endDate = values.costDate[1]?.format('YYYY-MM-DD');
      delete (params as any).costDate;
    }
    setQueryParams(params);
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
    setEditingCost(null);
    costForm.resetFields();
    setQuantityUsed(0);
    setUnitCost(0);
    costForm.setFieldsValue({
      quantityUsed: 0,
      unitCost: 0,
      totalCost: 0,
    });
    setFormModalOpen(true);
  };

  const handleEdit = (record: MaterialCost) => {
    setEditingCost(record);
    setQuantityUsed(record.quantityUsed || 0);
    setUnitCost(record.unitCost || 0);
    costForm.setFieldsValue({
      ...record,
      costDate: record.costDate ? dayjs(record.costDate) : undefined,
      materialId: record.materialId,
    });
    setFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMaterialCost(id);
      message.success('删除成功');
      fetchData();
      fetchCostStats();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      const formData = { ...values };
      if (formData.costDate) {
        formData.costDate = formData.costDate.format('YYYY-MM-DD');
      }
      if (editingCost) {
        await updateMaterialCost(editingCost.id, formData);
        message.success('更新成功');
      } else {
        await createMaterialCost(formData);
        message.success('创建成功');
      }
      setFormModalOpen(false);
      setEditingCost(null);
      costForm.resetFields();
      fetchData();
      fetchCostStats();
    } catch (error) {
      message.error(editingCost ? '更新失败' : '创建失败');
    }
  };

  const handleMaterialChange = (value: string) => {
    const selectedMaterial = materialOptions.find((m) => m.value === value);
    if (selectedMaterial) {
      const materialData = (materialOptions as any).find((m: any) => m.value === value);
      if (materialData?.unit) {
        costForm.setFieldsValue({ unit: materialData.unit });
      }
    }
  };

  const columns: ColumnsType<MaterialCost> = [
    {
      title: '耗材名称',
      dataIndex: 'materialName',
      key: 'materialName',
      width: 140,
      fixed: 'left',
      render: (val: string, record: MaterialCost) => val || record.material?.materialName || '-',
    },
    {
      title: '规格',
      dataIndex: 'materialSpec',
      key: 'materialSpec',
      width: 120,
      render: (val: string, record: MaterialCost) => val || record.material?.materialSpec || '-',
    },
    {
      title: '消耗数量',
      dataIndex: 'quantityUsed',
      key: 'quantityUsed',
      width: 100,
      render: (val: number) => <span style={{ fontWeight: 500 }}>{val}</span>,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      render: (val: string) => val || '-',
    },
    {
      title: '单价',
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: 100,
      render: (val: number) => `¥${Number(val || 0).toFixed(2)}`,
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 120,
      render: (val: number) => (
        <span style={{ color: '#cf1322', fontWeight: 'bold' }}>¥{Number(val || 0).toFixed(2)}</span>
      ),
    },
    {
      title: '成本日期',
      dataIndex: 'costDate',
      key: 'costDate',
      width: 120,
      render: (val: string | Date) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '关联订单',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 120,
      render: (val: string, record: MaterialCost) => {
        const orderNo = record.order?.orderNo;
        return orderNo || val || '-';
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
      render: (val: string) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_: any, record: MaterialCost) => (
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
            title="确认删除该成本记录？"
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
          <Card>
            <Statistic
              title="总成本"
              value={costStats.totalCost}
              precision={2}
              valueStyle={{ color: '#cf1322', fontSize: 24 }}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="平均单价"
              value={averageUnitCost}
              precision={2}
              valueStyle={{ color: '#1890ff', fontSize: 24 }}
              prefix={<BarChartOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16, padding: 16, background: '#fff', borderRadius: 8 }}>
        <Form
          form={searchForm}
          layout="vertical"
          onFinish={handleSearch}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="materialId" label="耗材">
                <Select
                  placeholder="请选择耗材"
                  options={materialOptions}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="orderId" label="订单ID">
                <Input placeholder="请输入订单ID" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="costDate" label="成本日期范围">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="耗材名称/备注" allowClear />
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增成本记录</Button>
        </Space>
      </div>

      <Table<MaterialCost>
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
      />

      <Modal
        title={editingCost ? '编辑耗材成本' : '新增耗材成本'}
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        width={700}
        destroyOnClose
        footer={null}
      >
        <Form
          form={costForm}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="materialId"
                label="耗材"
                rules={[{ required: true, message: '请选择耗材' }]}
              >
                <Select
                  placeholder="请选择耗材"
                  options={materialOptions}
                  showSearch
                  optionFilterProp="label"
                  onChange={handleMaterialChange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="orderId" label="关联订单ID">
                <Input placeholder="请输入订单ID" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="quantityUsed"
                label="消耗数量"
                rules={[{ required: true, message: '请输入消耗数量' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step="0.01"
                  placeholder="数量"
                  onChange={(val) => {
                    const qty = Number(val) || 0;
                    setQuantityUsed(qty);
                    costForm.setFieldsValue({ totalCost: Number((qty * unitCost).toFixed(2)) });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="单位">
                <Input placeholder="例如：包/卷/千克" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="unitCost"
                label="单价(元)"
                rules={[{ required: true, message: '请输入单价' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step="0.01"
                  placeholder="单价"
                  onChange={(val) => {
                    const cost = Number(val) || 0;
                    setUnitCost(cost);
                    costForm.setFieldsValue({ totalCost: Number((quantityUsed * cost).toFixed(2)) });
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalCost"
                label="总成本(元)"
                rules={[{ required: true, message: '总成本为必填' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step="0.01"
                  placeholder="自动计算=数量×单价"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="costDate" label="成本日期">
                <DatePicker style={{ width: '100%' }} placeholder="请选择成本日期" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Row justify="end">
            <Col>
              <Space>
                <Button onClick={() => setFormModalOpen(false)}>取消</Button>
                <Button type="primary" htmlType="submit">
                  {editingCost ? '更新' : '创建'}
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MaterialCostList;
