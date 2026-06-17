import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Button,
  Modal,
  Badge,
  Empty,
  Progress,
  Spin,
  Space,
  Tooltip,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DashboardOutlined,
  ApartmentOutlined,
  WarningOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { dashboardApi, alertApi, environmentApi, batchApi } from '@/api';
import type {
  DashboardStatsDto,
  Alert,
  EnvironmentData,
  HarvestBatch,
  BatchStatus,
  AlertLevel,
  AlertStatus,
  Guid,
} from '@/types';
import {
  ALERT_LEVEL_COLORS,
  ALERT_LEVEL_NAMES,
  ALERT_STATUS_COLORS,
  ALERT_STATUS_NAMES,
  BATCH_STATUS_COLORS,
  BATCH_STATUS_NAMES,
  PARAMETER_TYPE_THRESHOLDS,
} from '@/constants/mappings';

type ParameterTypeKey = keyof typeof PARAMETER_TYPE_THRESHOLDS;

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [environments, setEnvironments] = useState<Record<Guid, EnvironmentData>>({});
  const [batches, setBatches] = useState<HarvestBatch[]>([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrId, setQrId] = useState<Guid | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, alertsData, envData, batchesData] = await Promise.all([
        dashboardApi.getStats(),
        alertApi.getActive(),
        environmentApi.getLatestAll(),
        batchApi.getAll({ status: 'Pending' as BatchStatus }),
      ]);
      const harvestingBatches = await batchApi.getAll({ status: 'Harvesting' as BatchStatus });
      setStats(statsData);
      setAlerts(alertsData);
      setEnvironments(envData);
      setBatches([...batchesData, ...harvestingBatches]);
    } catch (e) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcknowledge = async (id: Guid) => {
    try {
      await alertApi.acknowledge(id);
      message.success('已确认告警');
      loadData();
    } catch {
      message.error('操作失败');
    }
  };

  const handleResolve = async (id: Guid) => {
    try {
      await alertApi.resolve(id);
      message.success('已解决告警');
      loadData();
    } catch {
      message.error('操作失败');
    }
  };

  const showQrModal = useCallback((id: Guid) => {
    setQrId(id);
    setQrModalOpen(true);
  }, []);

  const alertColumns: ColumnsType<Alert> = [
    {
      title: '地块',
      dataIndex: ['plot', 'name'],
      key: 'plot',
      render: (_: unknown, record: Alert) => record.plot?.name || record.plot?.plotCode || '-',
    },
    {
      title: '参数',
      dataIndex: 'parameterType',
      key: 'parameterType',
      render: (v: string) => v || '-',
    },
    {
      title: '当前值 / 阈值',
      key: 'value',
      render: (_: unknown, record: Alert) => (
        <Space>
          <span style={{ color: 'red' }}>{record.currentValue}</span>
          <span>/</span>
          <span>{record.thresholdValue}</span>
        </Space>
      ),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (v: AlertLevel) => <Tag color={ALERT_LEVEL_COLORS[v]}>{ALERT_LEVEL_NAMES[v]}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: AlertStatus) => <Tag color={ALERT_STATUS_COLORS[v]}>{ALERT_STATUS_NAMES[v]}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Alert) => (
        <Space>
          <Tooltip title="确认告警">
            <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleAcknowledge(record.id)}>
              确认
            </Button>
          </Tooltip>
          <Tooltip title="解决告警">
            <Button size="small" type="primary" icon={<CloseCircleOutlined />} onClick={() => handleResolve(record.id)}>
              解决
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const batchColumns: ColumnsType<HarvestBatch> = [
    {
      title: '批次号',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      render: (v: string) => v || '-',
    },
    {
      title: '地块',
      key: 'plot',
      render: (_: unknown, record: HarvestBatch) =>
        [record.plot?.greenhouseName, record.plot?.plotCode].filter(Boolean).join(' - ') || '-',
    },
    {
      title: '品种',
      key: 'variety',
      render: (_: unknown, record: HarvestBatch) => record.variety?.name || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: BatchStatus) => <Tag color={BATCH_STATUS_COLORS[v]}>{BATCH_STATUS_NAMES[v]}</Tag>,
    },
    {
      title: '预计采收',
      dataIndex: 'harvestDate',
      key: 'harvestDate',
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '产量(kg)',
      dataIndex: 'actualYield',
      key: 'actualYield',
      render: (v: number) => (v ? v.toFixed(2) : '0.00'),
    },
    {
      title: '溯源二维码',
      key: 'qrcode',
      render: (_: unknown, record: HarvestBatch) => (
        <Button size="small" icon={<QrcodeOutlined />} onClick={() => showQrModal(record.id)}>
          查看
        </Button>
      ),
    },
  ];

  const calcInRangePercent = (value: number, min: number, max: number) => {
    const range = max - min;
    if (range <= 0) return 0;
    if (value <= min) return 0;
    if (value >= max) return 100;
    return Math.round(((value - min) / range) * 100);
  };

  const plotList = Object.values(environments);

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="活跃地块"
                value={stats?.activePlots || 0}
                prefix={<ApartmentOutlined style={{ color: '#1677ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="进行中批次"
                value={stats?.activeBatches || 0}
                prefix={<DashboardOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Badge count={(stats?.activeAlerts || 0) > 0 ? stats?.activeAlerts : 0} size="small">
                <Statistic
                  title="活跃告警"
                  value={stats?.activeAlerts || 0}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<WarningOutlined style={{ color: '#cf1322' }} />}
                />
              </Badge>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="今日采收(kg)"
                value={stats?.todayHarvestWeight || 0}
                precision={2}
                prefix={<ShoppingOutlined style={{ color: '#722ed1' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="缺失材料数"
                value={stats?.materialMissingCount || 0}
                valueStyle={{ color: '#d4380d' }}
                prefix={<FileTextOutlined style={{ color: '#d4380d' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="待处理订单"
                value={stats?.pendingOrdersCount || 0}
                prefix={<ExclamationCircleOutlined style={{ color: '#fa8c16' }} />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="活跃告警列表" extra={<Badge count={alerts.length} />}>
              {alerts.length === 0 ? (
                <Empty description="暂无活跃告警" />
              ) : (
                <Table
                  rowKey="id"
                  columns={alertColumns}
                  dataSource={alerts}
                  pagination={false}
                  size="small"
                />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="环境监测概览">
              {plotList.length === 0 ? (
                <Empty description="暂无环境数据" />
              ) : (
                <Row gutter={[12, 12]}>
                  {plotList.map((env) => {
                    const tRange = PARAMETER_TYPE_THRESHOLDS['Temperature' as ParameterTypeKey];
                    const hRange = PARAMETER_TYPE_THRESHOLDS['Humidity' as ParameterTypeKey];
                    const lRange = PARAMETER_TYPE_THRESHOLDS['LightIntensity' as ParameterTypeKey];
                    return (
                      <Col xs={24} sm={12} md={8} key={env.plotId}>
                        <Card size="small" title={env.plot?.name || env.plotId}>
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <div>
                              <div style={{ fontSize: 12 }}>温度: {env.temperature}°C</div>
                              <Progress
                                percent={calcInRangePercent(env.temperature, tRange.min, tRange.max)}
                                size="small"
                                showInfo={false}
                                strokeColor={
                                  env.temperature < tRange.min || env.temperature > tRange.max
                                    ? '#cf1322'
                                    : '#52c41a'
                                }
                              />
                            </div>
                            <div>
                              <div style={{ fontSize: 12 }}>湿度: {env.humidity}%</div>
                              <Progress
                                percent={calcInRangePercent(env.humidity, hRange.min, hRange.max)}
                                size="small"
                                showInfo={false}
                                strokeColor={
                                  env.humidity < hRange.min || env.humidity > hRange.max
                                    ? '#cf1322'
                                    : '#52c41a'
                                }
                              />
                            </div>
                            <div>
                              <div style={{ fontSize: 12 }}>光照: {env.lightIntensity}lux</div>
                              <Progress
                                percent={calcInRangePercent(env.lightIntensity, lRange.min, lRange.max)}
                                size="small"
                                showInfo={false}
                                strokeColor={
                                  env.lightIntensity < lRange.min || env.lightIntensity > lRange.max
                                    ? '#cf1322'
                                    : '#52c41a'
                                }
                              />
                            </div>
                          </Space>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </Card>
          </Col>
        </Row>

        <Card title="最近采收批次">
          {batches.length === 0 ? (
            <Empty description="暂无采收批次" />
          ) : (
            <Table
              rowKey="id"
              columns={batchColumns}
              dataSource={batches}
              pagination={{ pageSize: 5 }}
            />
          )}
        </Card>
      </Space>

      <Modal
        open={qrModalOpen}
        title="溯源二维码"
        onCancel={() => setQrModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setQrModalOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        {qrId && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <img
              src={batchApi.getQrCodeUrl(qrId)}
              alt="QR Code"
              style={{ maxWidth: 250, maxHeight: 250 }}
            />
          </div>
        )}
      </Modal>
    </Spin>
  );
}

export default Dashboard;
