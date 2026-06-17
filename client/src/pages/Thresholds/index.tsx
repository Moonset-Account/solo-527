import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Button,
  Form,
  Select,
  Modal,
  Space,
  Tooltip,
  Spin,
  Empty,
  message,
  InputNumber,
  Tabs,
  ColumnsType,
  Popconfirm,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
  ApartmentOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { thresholdApi, plotApi } from '@/api';
import {
  Threshold,
  Plot,
  Guid,
  ParameterType,
} from '@/types';
import { PARAMETER_TYPE_NAMES, PARAMETER_TYPE_UNITS } from '@/constants/mappings';

const { TabPane } = Tabs;
const { Option } = Select;

const PARAM_TYPES: ParameterType[] = ['Temperature', 'Humidity', 'SoilMoisture', 'LightIntensity', 'Co2Level'];

const columns: ColumnsType<Threshold> = [
  {
    title: '地块',
    key: 'plot',
    width: 200,
    render: (_, record) =>
      record.plot ? (
        <Space>
          <ApartmentOutlined style={{ color: '#52c41a' }} />
          <span>
            {[record.plot.greenhouseName, record.plot.plotCode, record.plot.name].filter(Boolean).join(' - ')}
          </span>
        </Space>
      ) : (
        <Space>
          <GlobalOutlined style={{ color: '#1677ff' }} />
          <Tag color="blue">全局配置</Tag>
        </Space>
      ),
  },
  {
    title: '参数类型',
    dataIndex: 'parameterType',
    key: 'parameterType',
    width: 160,
    render: (v) => (
      <Space>
        <span>{PARAMETER_TYPE_NAMES[v as ParameterType] || v}</span>
        <span style={{ color: '#888' }}>({PARAMETER_TYPE_UNITS[v as ParameterType] || ''})</span>
      </Space>
    ),
  },
  {
    title: '最小值',
    dataIndex: 'minValue',
    key: 'minValue',
    width: 120,
    render: (v) => <strong style={{ color: '#1677ff' }}>{v}</strong>,
  },
  {
    title: '最大值',
    dataIndex: 'maxValue',
    key: 'maxValue',
    width: 120,
    render: (v) => <strong style={{ color: '#cf1322' }}>{v}</strong>,
  },
  {
    title: '正常范围',
    key: 'range',
    width: 180,
    render: (_, record) => (
      <span>
        {record.minValue} ~ {record.maxValue} {PARAMETER_TYPE_UNITS[record.parameterType as ParameterType] || ''}
      </span>
    ),
  },
  {
    title: '更新时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
    render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
  },
];

function Thresholds() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Threshold | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, plotData] = await Promise.all([thresholdApi.getAll(), plotApi.getAll()]);
      setThresholds(Array.isArray(data) ? data : []);
      setPlots(plotData);
    } catch {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (record?: Threshold) => {
    setEditingRecord(record || null);
    if (record) {
      form.setFieldsValue({
        ...record,
        plotId: record.plotId || 'global',
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ plotId: 'global' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: Partial<Threshold> = {
        ...values,
        plotId: values.plotId === 'global' ? null : values.plotId,
        id: editingRecord?.id,
      };
      if (!payload.parameterType || payload.minValue === undefined || payload.maxValue === undefined) {
        throw new Error('缺少必填字段');
      }
      if (payload.minValue >= payload.maxValue) {
        message.error('最小值必须小于最大值');
        return;
      }
      await thresholdApi.save(payload);
      message.success(editingRecord ? '更新成功' : '创建成功');
      setModalOpen(false);
      loadData();
    } catch (e: any) {
      if (e?.errorFields) return;
      if (e.message) message.error(e.message);
      else message.error('保存失败');
    }
  };

  const handleDelete = async (id: Guid) => {
    try {
      await thresholdApi.remove(id);
      message.success('删除成功');
      loadData();
    } catch {
      message.error('删除失败');
    }
  };

  const globalThresholds = thresholds.filter((t) => !t.plotId);
  const plotThresholds = thresholds.filter((t) => t.plotId);

  const opColumns: ColumnsType<Threshold> = [
    ...columns,
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑">
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal(record)}>
              编辑
            </Button>
          </Tooltip>
          <Popconfirm
            title="确定删除此阈值配置？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getDataSource = () => {
    if (activeTab === 'global') return globalThresholds;
    if (activeTab === 'plot') return plotThresholds;
    return thresholds;
  };

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card
          title={
            <Space>
              <span>阈值配置</span>
              <span style={{ color: '#888', fontSize: 12 }}>
                全局配置适用于所有未单独配置阈值的地块
              </span>
            </Space>
          }
          extra={
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadData}>
                刷新
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                新增配置
              </Button>
            </Space>
          }
        >
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab={<span><GlobalOutlined /> 全部（{thresholds.length}）</span>} key="all">
              <TableWrapper
                columns={opColumns}
                data={getDataSource()}
                loading={loading}
              />
            </TabPane>
            <TabPane tab={<span><GlobalOutlined /> 全局阈值（{globalThresholds.length}）</span>} key="global">
              <TableWrapper
                columns={opColumns}
                data={getDataSource()}
                loading={loading}
              />
            </TabPane>
            <TabPane tab={<span><ApartmentOutlined /> 按地块配置（{plotThresholds.length}）</span>} key="plot">
              <TableWrapper
                columns={opColumns}
                data={getDataSource()}
                loading={loading}
              />
            </TabPane>
          </Tabs>
        </Card>
      </Space>

      <Modal
        open={modalOpen}
        title={editingRecord ? '编辑阈值配置' : '新增阈值配置'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        destroyOnClose={true}
        width={560}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                name="plotId"
                label="地块"
                rules={[{ required: true, message: '请选择地块或全局' }]}
              >
                <Select>
                  <Option value="global">
                    <Space><GlobalOutlined /> 全局配置（适用于所有未单独配置的地块）</Space>
                  </Option>
                  <Option disabled>────────────────────</Option>
                  {plots.map((p) => (
                    <Option key={p.id} value={p.id}>
                      <Space>
                        <ApartmentOutlined />
                        {[p.greenhouseName, p.plotCode, p.name].filter(Boolean).join(' - ')}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="parameterType"
                label="参数类型"
                rules={[{ required: true, message: '请选择参数类型' }]}
              >
                <Select>
                  {PARAM_TYPES.map((t) => (
                    <Option key={t} value={t}>
                      {PARAMETER_TYPE_NAMES[t]} ({PARAMETER_TYPE_UNITS[t]})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="minValue"
                label="最小值"
                rules={[{ required: true, message: '请输入最小值' }]}
              >
                <InputNumber style={{ width: '100%' }} step={0.1} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="maxValue"
                label="最大值"
                rules={[{ required: true, message: '请输入最大值' }]}
              >
                <InputNumber style={{ width: '100%' }} step={0.1} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Spin>
  );
}

function TableWrapper({
  columns,
  data,
  loading,
}: {
  columns: ColumnsType<Threshold>;
  data: Threshold[];
  loading: boolean;
}) {
  return data.length === 0 && !loading ? (
    <Empty description="暂无阈值配置，点击右上角【新增配置】添加" />
  ) : (
    <Table
      rowKey={(r) => `${r.plotId || 'global'}-${r.parameterType}-${r.id}`}
      columns={columns}
      dataSource={data}
      pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
    />
  );
}

export default Thresholds;
