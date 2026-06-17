import { useEffect, useState, useRef } from 'react';
import {
  Card,
  Descriptions,
  Tabs,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Spin,
  Empty,
  message,
  Tooltip,
  Row,
  Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { batchApi, environmentApi, materialApi, orderApi } from '@/api';
import type {
  HarvestBatch,
  EnvironmentData,
  ApplicationMaterial,
  Order,
  MaterialStatus,
  OrderStatus,
  Guid,
} from '@/types';
import {
  BATCH_STATUS_COLORS,
  BATCH_STATUS_NAMES,
  MATERIAL_STATUS_COLORS,
  MATERIAL_STATUS_NAMES,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_NAMES,
} from '@/constants/mappings';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

type MaterialStatusValue = 'Missing' | 'Submitted' | 'Approved' | 'Rejected';
const MATERIAL_STATUS_VALUES: MaterialStatusValue[] = ['Missing', 'Submitted', 'Approved', 'Rejected'];

function Detail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: Guid }>();
  const [loading, setLoading] = useState(false);
  const [envLoading, setEnvLoading] = useState(false);
  const [batch, setBatch] = useState<HarvestBatch | null>(null);
  const [envData, setEnvData] = useState<EnvironmentData[]>([]);
  const [materials, setMaterials] = useState<ApplicationMaterial[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ApplicationMaterial | null>(null);
  const [materialForm] = Form.useForm();
  const chartRef = useRef<unknown>(null);

  const materialColumns: ColumnsType<ApplicationMaterial> = [
    { title: '材料类型', dataIndex: 'materialType', key: 'materialType' },
    { title: '材料名称', dataIndex: 'materialName', key: 'materialName' },
    {
      title: '施用日期',
      dataIndex: 'applicationDate',
      key: 'applicationDate',
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '数量',
      key: 'qty',
      render: (_: unknown, r: ApplicationMaterial) => `${r.quantity ?? ''}${r.unit || ''}`,
    },
    { title: '施用人', dataIndex: 'applicator', key: 'applicator' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: MaterialStatus) => (
        <Tag color={MATERIAL_STATUS_COLORS[v]}>{MATERIAL_STATUS_NAMES[v]}</Tag>
      ),
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    { title: '处理结果', dataIndex: 'processResult', key: 'processResult', ellipsis: true },
  ];

  const orderColumns: ColumnsType<Order> = [
    { title: '订单号', dataIndex: 'orderNumber', key: 'orderNumber' },
    { title: '客户', dataIndex: 'customerName', key: 'customerName' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (v: number) => `¥${(v ?? 0).toFixed(2)}`,
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => `¥${(v ?? 0).toFixed(2)}`,
    },
    {
      title: '交货日期',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: OrderStatus) => (
        <Tag color={ORDER_STATUS_COLORS[v]}>{ORDER_STATUS_NAMES[v]}</Tag>
      ),
    },
  ];

  const loadBatch = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const b = await batchApi.getById(id);
      setBatch(b);
    } catch {
      message.error('加载批次详情失败');
    } finally {
      setLoading(false);
    }
  };

  const loadEnvironment = async () => {
    if (!id || !batch?.plotId) return;
    setEnvLoading(true);
    try {
      const start = dayjs().subtract(7, 'day').toISOString();
      const end = dayjs().toISOString();
      const data = await environmentApi.getRange(batch.plotId, start, end);
      setEnvData(Array.isArray(data) ? data : []);
    } catch {
      setEnvData([]);
    } finally {
      setEnvLoading(false);
    }
  };

  const loadMaterials = async () => {
    if (!id) return;
    try {
      const data = await materialApi.getByBatch(id);
      setMaterials(data);
    } catch {
      setMaterials([]);
    }
  };

  const loadOrders = async () => {
    if (!id) return;
    try {
      const data = await orderApi.getAll({ batchId: id });
      setOrders(data);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    loadBatch();
  }, [id]);

  useEffect(() => {
    if (batch?.plotId) {
      loadEnvironment();
    }
    loadMaterials();
    loadOrders();
  }, [batch?.plotId, id]);

  const openMaterialModal = (record?: ApplicationMaterial) => {
    setEditingMaterial(record || null);
    if (record) {
      materialForm.setFieldsValue({
        ...record,
        applicationDate: record.applicationDate ? dayjs(record.applicationDate) : null,
      });
    } else {
      materialForm.resetFields();
    }
    setMaterialModalOpen(true);
  };

  const handleMaterialSubmit = async () => {
    try {
      const values = await materialForm.validateFields();
      const payload: Record<string, unknown> = {
        ...values,
        harvestBatchId: id,
        applicationDate: values.applicationDate?.toISOString?.() || dayjs().toISOString(),
      };
      if (editingMaterial) {
        await materialApi.update(editingMaterial.id, payload);
        message.success('更新成功');
      } else {
        await materialApi.create(payload);
        message.success('创建成功');
      }
      setMaterialModalOpen(false);
      loadMaterials();
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error('保存失败');
    }
  };

  const updateMaterialStatus = async (
    materialId: Guid,
    newStatus: MaterialStatusValue,
    remark?: string,
  ) => {
    try {
      await materialApi.update(materialId, { status: newStatus, processResult: remark });
      message.success('状态更新成功');
      loadMaterials();
    } catch {
      message.error('状态更新失败');
    }
  };

  const chartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['温度(°C)', '湿度(%)', '光照(lux/1000)'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: envData.map((d) => dayjs(d.recordedAt).format('MM-DD HH:mm')),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '温度(°C)',
        type: 'line',
        smooth: true,
        data: envData.map((d) => d.temperature),
        lineStyle: { color: '#ff7875' },
        itemStyle: { color: '#ff7875' },
      },
      {
        name: '湿度(%)',
        type: 'line',
        smooth: true,
        data: envData.map((d) => d.humidity),
        lineStyle: { color: '#69b1ff' },
        itemStyle: { color: '#69b1ff' },
      },
      {
        name: '光照(lux/1000)',
        type: 'line',
        smooth: true,
        data: envData.map((d) => Math.round(d.lightIntensity / 1000)),
        lineStyle: { color: '#ffd666' },
        itemStyle: { color: '#ffd666' },
      },
    ],
  };

  const mColumns: ColumnsType<ApplicationMaterial> = [
    ...materialColumns,
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: ApplicationMaterial) => (
        <Space>
          <Tooltip title="编辑">
            <Button size="small" icon={<EditOutlined />} onClick={() => openMaterialModal(record)}>
              编辑
            </Button>
          </Tooltip>
          {record.status !== 'Approved' && (
            <Tooltip title="审核通过">
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => updateMaterialStatus(record.id, 'Approved')}
              >
                通过
              </Button>
            </Tooltip>
          )}
          {record.status === 'Submitted' && (
            <Tooltip title="拒绝">
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => updateMaterialStatus(record.id, 'Rejected')}
              >
                拒绝
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space style={{ marginBottom: 8 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/batches')}>
            返回列表
          </Button>
        </Space>

        <Card title="批次基本信息">
          {batch && (
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="批次号">{batch.batchNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={BATCH_STATUS_COLORS[batch.status]}>
                  {BATCH_STATUS_NAMES[batch.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="地块">
                {[batch.plot?.greenhouseName, batch.plot?.plotCode].filter(Boolean).join(' - ') ||
                  '-'}
              </Descriptions.Item>
              <Descriptions.Item label="品种">
                {[batch.variety?.category, batch.variety?.name].filter(Boolean).join(' / ') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="种植日期">
                {dayjs(batch.plantingDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="预计采收">
                {batch.harvestDate ? dayjs(batch.harvestDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="预计产量(kg)">
                {batch.expectedYield ? batch.expectedYield.toFixed(2) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="实际产量(kg)">
                {batch.actualYield ? batch.actualYield.toFixed(2) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {batch.remark || '-'}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Card>

        <Card>
          <Tabs defaultActiveKey="env">
            <TabPane tab="环境历史" key="env">
              <Spin spinning={envLoading}>
                {envData.length === 0 ? (
                  <Empty description="暂无环境数据" />
                ) : (
                  <ReactECharts
                    ref={chartRef as React.Ref<unknown>}
                    option={chartOption}
                    style={{ height: 380 }}
                    notMerge={true}
                    lazyUpdate={true}
                  />
                )}
              </Spin>
            </TabPane>

            <TabPane tab="申报材料" key="material">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => openMaterialModal()}>
                    新增材料
                  </Button>
                </Space>
                {materials.length === 0 ? (
                  <Empty description="暂无材料记录" />
                ) : (
                  <Table
                    rowKey="id"
                    columns={mColumns}
                    dataSource={materials}
                    pagination={false}
                    size="middle"
                  />
                )}
              </Space>
            </TabPane>

            <TabPane tab="关联订单" key="order">
              {orders.length === 0 ? (
                <Empty description="暂无关联订单" />
              ) : (
                <Table
                  rowKey="id"
                  columns={orderColumns}
                  dataSource={orders}
                  pagination={false}
                  size="middle"
                />
              )}
            </TabPane>
          </Tabs>
        </Card>
      </Space>

      <Modal
        open={materialModalOpen}
        title={editingMaterial ? '编辑材料' : '新增材料'}
        onCancel={() => setMaterialModalOpen(false)}
        onOk={handleMaterialSubmit}
        destroyOnClose={true}
        width={600}
      >
        <Form form={materialForm} layout="vertical" preserve={false}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="materialType"
                label="材料类型"
                rules={[{ required: true, message: '请输入材料类型' }]}
              >
                <Input placeholder="如：农药、肥料" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="materialName"
                label="材料名称"
                rules={[{ required: true, message: '请输入材料名称' }]}
              >
                <Input placeholder="材料名称" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="quantity"
                label="数量"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="unit" label="单位">
                <Input placeholder="kg/L/瓶" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="applicationDate"
                label="施用日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="applicator" label="施用人">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select>
                  {MATERIAL_STATUS_VALUES.map((s) => (
                    <Option key={s} value={s}>
                      {MATERIAL_STATUS_NAMES[s]}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="remark" label="备注">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
            {editingMaterial && (
              <Col xs={24}>
                <Form.Item name="processResult" label="处理结果">
                  <TextArea rows={2} />
                </Form.Item>
              </Col>
            )}
          </Row>
        </Form>
      </Modal>
    </Spin>
  );
}

export default Detail;
