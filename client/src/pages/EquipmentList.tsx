import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Select,
  Row,
  Col,
  Statistic,
  message,
  Tooltip
} from 'antd';
import {
  ToolOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { equipmentApi } from '@/services/api';
import { EquipmentDto, EquipmentStatus } from '@/types';
import { formatDate } from '@/utils/format';

const { Option } = Select;

const getEquipmentStatusConfig = (status: EquipmentStatus) => {
  const configs: Record<EquipmentStatus, { color: string; text: string; icon: React.ReactNode; bgColor: string }> = {
    [EquipmentStatus.Idle]: {
      color: 'success',
      text: '空闲',
      icon: <CheckCircleOutlined />,
      bgColor: '#f6ffed'
    },
    [EquipmentStatus.InUse]: {
      color: 'processing',
      text: '使用中',
      icon: <PlayCircleOutlined />,
      bgColor: '#e6f7ff'
    },
    [EquipmentStatus.Maintenance]: {
      color: 'warning',
      text: '维护中',
      icon: <ToolOutlined />,
      bgColor: '#fffbe6'
    },
    [EquipmentStatus.Faulty]: {
      color: 'error',
      text: '故障',
      icon: <WarningOutlined />,
      bgColor: '#fff1f0'
    },
    [EquipmentStatus.Offline]: {
      color: 'default',
      text: '离线',
      icon: <CloseCircleOutlined />,
      bgColor: '#f5f5f5'
    }
  };
  return configs[status] || configs[EquipmentStatus.Offline];
};

const EquipmentList: React.FC = () => {
  const [data, setData] = useState<EquipmentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<EquipmentStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadEquipments();
  }, []);

  const loadEquipments = async () => {
    setLoading(true);
    try {
      const params: { status?: EquipmentStatus; type?: string } = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      if (filterType !== 'all') {
        params.type = filterType;
      }
      const response = await equipmentApi.getList(params);
      setData(response.data);
    } catch (error) {
      message.error('加载设备列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadEquipments();
  };

  const stats = {
    total: data.length,
    idle: data.filter(d => d.status === EquipmentStatus.Idle).length,
    inUse: data.filter(d => d.status === EquipmentStatus.InUse).length,
    maintenance: data.filter(d => d.status === EquipmentStatus.Maintenance).length,
    faulty: data.filter(d => d.status === EquipmentStatus.Faulty).length
  };

  const equipmentTypes = Array.from(new Set(data.map(d => d.type)));

  const columns: ColumnsType<EquipmentDto> = [
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left',
      render: (text, record) => (
        <Space>
          <ToolOutlined style={{ color: '#1890ff' }} />
          <strong>{text}</strong>
          <Tag color="blue" style={{ fontSize: 11 }}>{record.code}</Tag>
        </Space>
      )
    },
    {
      title: '设备类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      filters: equipmentTypes.map(t => ({ text: t, value: t })),
      onFilter: (value, record) => record.type === value
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: EquipmentStatus) => {
        const config = getEquipmentStatusConfig(status);
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
      filters: [
        { text: '空闲', value: EquipmentStatus.Idle },
        { text: '使用中', value: EquipmentStatus.InUse },
        { text: '维护中', value: EquipmentStatus.Maintenance },
        { text: '故障', value: EquipmentStatus.Faulty },
        { text: '离线', value: EquipmentStatus.Offline }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: '上次维护',
      dataIndex: 'lastMaintenanceDate',
      key: 'lastMaintenanceDate',
      width: 120,
      render: (date) => date ? formatDate(date) : '-'
    },
    {
      title: '下次维护',
      dataIndex: 'nextMaintenanceDate',
      key: 'nextMaintenanceDate',
      width: 120,
      render: (date) => {
        if (!date) return '-';
        const daysUntil = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return (
          <Space direction="vertical" size={0}>
            <span>{formatDate(date)}</span>
            {daysUntil <= 7 ? (
              <Tag color={daysUntil <= 0 ? 'red' : 'orange'} style={{ margin: 0, fontSize: 11 }}>
                {daysUntil <= 0 ? `已逾期 ${Math.abs(daysUntil)} 天` : `还剩 ${daysUntil} 天`}
              </Tag>
            ) : null}
          </Space>
        );
      }
    },
    {
      title: '是否启用',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (active) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? '启用' : '停用'}
        </Tag>
      )
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 150,
      ellipsis: {
        showTitle: false
      },
      render: (text) => text ? (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ) : '-'
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        bordered={false}
        title={
          <Space>
            <ToolOutlined style={{ color: '#1890ff' }} />
            <span>设备管理</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 120 }}
              allowClear
              placeholder="设备状态"
            >
              <Option value="all">全部状态</Option>
              <Option value={EquipmentStatus.Idle}>空闲</Option>
              <Option value={EquipmentStatus.InUse}>使用中</Option>
              <Option value={EquipmentStatus.Maintenance}>维护中</Option>
              <Option value={EquipmentStatus.Faulty}>故障</Option>
              <Option value={EquipmentStatus.Offline}>离线</Option>
            </Select>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 120 }}
              allowClear
              placeholder="设备类型"
            >
              <Option value="all">全部类型</Option>
              {equipmentTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
            <Button type="primary" onClick={handleFilter}>筛选</Button>
            <Button icon={<ReloadOutlined />} onClick={loadEquipments} loading={loading}>
              刷新
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="设备总数"
                value={stats.total}
                prefix={<ToolOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ background: '#f6ffed' }}>
              <Statistic
                title="空闲"
                value={stats.idle}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ background: '#e6f7ff' }}>
              <Statistic
                title="使用中"
                value={stats.inUse}
                prefix={<PlayCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ background: '#fffbe6' }}>
              <Statistic
                title="维护中"
                value={stats.maintenance}
                prefix={<ToolOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ background: '#fff1f0' }}>
              <Statistic
                title="故障"
                value={stats.faulty}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ background: '#f0f5ff' }}>
              <Statistic
                title="利用率"
                value={stats.total > 0 ? Math.round(stats.inUse / stats.total * 100) : 0}
                suffix="%"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 台设备`
          }}
        />
      </Card>
    </div>
  );
};

export default EquipmentList;
