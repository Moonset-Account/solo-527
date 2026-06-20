import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  Row,
  Col,
  Card,
  Statistic,
  message,
  Typography,
  Progress,
  Tag,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PartitionOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { metersApi } from '@/api';
import type { MeterZone } from '../../shared/types';
import { StatusTag } from '@/components/StatusTag';

const { Option } = Select;
const { Title, Text } = Typography;

const ZONE_STATUS_OPTIONS = [
  { value: 'NORMAL', label: '正常' },
  { value: 'WARNING', label: '告警' },
  { value: 'ERROR', label: '异常' },
];

const MeterList: React.FC = () => {
  const [form] = Form.useForm();

  const [data, setData] = useState<MeterZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalZones: 0,
    totalDevices: 0,
    onlineDevices: 0,
    totalCapacity: 0,
    normalZones: 0,
    warningZones: 0,
    errorZones: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const result = await metersApi.getZones({
        status: values.status,
        keyword: values.keyword,
      });
      setData(result);
      calculateStats(result);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (zones: MeterZone[]) => {
    const totalZones = zones.length;
    const totalDevices = zones.reduce((sum, z) => sum + z.deviceCount, 0);
    const onlineDevices = zones.reduce((sum, z) => sum + z.onlineCount, 0);
    const totalCapacity = zones.reduce((sum, z) => sum + z.totalCapacity, 0);
    const normalZones = zones.filter(z => z.status === 'NORMAL').length;
    const warningZones = zones.filter(z => z.status === 'WARNING').length;
    const errorZones = zones.filter(z => z.status === 'ERROR').length;
    setStats({ totalZones, totalDevices, onlineDevices, totalCapacity, normalZones, warningZones, errorZones });
  };

  const handleSearch = () => {
    loadData();
  };

  const handleReset = () => {
    form.resetFields();
    loadData();
  };

  const getOnlineRate = (online: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((online / total) * 100);
  };

  const getOnlineRateColor = (rate: number) => {
    if (rate >= 95) return '#52c41a';
    if (rate >= 80) return '#faad14';
    return '#f5222d';
  };

  const columns: ColumnsType<MeterZone> = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusTag type="zoneStatus" value={status} />,
    },
    {
      title: '分区名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text, record) => (
        <Space>
          <PartitionOutlined style={{ color: '#1890ff' }} />
          <Text strong>{text}</Text>
          <Tag color="blue" style={{ marginLeft: 0 }}>
            {record.code}
          </Tag>
        </Space>
      ),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 180,
      render: (text) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: '设备总数',
      dataIndex: 'deviceCount',
      key: 'deviceCount',
      width: 100,
      align: 'center',
      render: (value: number) => <Text strong>{value}</Text>,
    },
    {
      title: '在线设备',
      dataIndex: 'onlineCount',
      key: 'onlineCount',
      width: 100,
      align: 'center',
      render: (value: number) => <Text strong style={{ color: '#52c41a' }}>{value}</Text>,
    },
    {
      title: '在线率',
      key: 'onlineRate',
      width: 150,
      render: (_, record) => {
        const rate = getOnlineRate(record.onlineCount, record.deviceCount);
        return (
          <Tooltip title={`${record.onlineCount}/${record.deviceCount} 台设备在线`}>
            <Progress
              percent={rate}
              size="small"
              strokeColor={getOnlineRateColor(rate)}
              showInfo={true}
            />
          </Tooltip>
        );
      },
    },
    {
      title: '装机容量',
      dataIndex: 'totalCapacity',
      key: 'totalCapacity',
      width: 120,
      align: 'right',
      render: (value: number) => (
        <Space>
          <ThunderboltOutlined style={{ color: '#faad14' }} />
          <Text strong>{value.toLocaleString()} kW</Text>
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />;
      case 'WARNING':
        return <WarningOutlined style={{ color: '#faad14', fontSize: 24 }} />;
      case 'ERROR':
        return <CloseCircleOutlined style={{ color: '#f5222d', fontSize: 24 }} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="分区总数"
              value={stats.totalZones}
              prefix={<PartitionOutlined style={{ color: '#1890ff' }} />}
              suffix="个"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="设备总数"
              value={stats.totalDevices}
              prefix={<BarChartOutlined style={{ color: '#722ed1' }} />}
              suffix="台"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在线设备"
              value={stats.onlineDevices}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              suffix="台"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总装机容量"
              value={stats.totalCapacity}
              precision={0}
              prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />}
              suffix="kW"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Space align="center">
              {getStatusIcon('NORMAL')}
              <div>
                <Text type="secondary">正常分区</Text>
                <div>
                  <Text strong style={{ fontSize: 20, color: '#52c41a' }}>
                    {stats.normalZones}
                  </Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    个
                  </Text>
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Space align="center">
              {getStatusIcon('WARNING')}
              <div>
                <Text type="secondary">告警分区</Text>
                <div>
                  <Text strong style={{ fontSize: 20, color: '#faad14' }}>
                    {stats.warningZones}
                  </Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    个
                  </Text>
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Space align="center">
              {getStatusIcon('ERROR')}
              <div>
                <Text type="secondary">异常分区</Text>
                <div>
                  <Text strong style={{ fontSize: 20, color: '#f5222d' }}>
                    {stats.errorZones}
                  </Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    个
                  </Text>
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <Space>
                <PartitionOutlined style={{ color: '#1890ff' }} />
                表计分区管理
              </Space>
            </Title>
            <Text type="secondary">管理光伏电站的表计分区和设备在线状态</Text>
          </Col>
        </Row>

        <Form form={form} layout="inline">
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" allowClear style={{ width: 140 }}>
              {ZONE_STATUS_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="keyword" label="搜索">
            <Input placeholder="分区名称/编号/位置" allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
          }}
          scroll={{ x: 1100 }}
        />
      </Card>
    </div>
  );
};

export default MeterList;
