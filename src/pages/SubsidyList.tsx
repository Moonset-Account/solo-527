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
  DatePicker,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  GiftOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { subsidiesApi, metersApi } from '@/api';
import type { SubsidyRecord, MeterZone } from '../../shared/types';
import { StatusTag } from '@/components/StatusTag';

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const SUBSIDY_STATUS_OPTIONS = [
  { value: 'PENDING', label: '待审核' },
  { value: 'APPROVED', label: '已审批' },
  { value: 'PAID', label: '已发放' },
];

const SUBSIDY_TYPE_OPTIONS = [
  { value: '国家补贴', label: '国家补贴' },
  { value: '省级补贴', label: '省级补贴' },
  { value: '市级补贴', label: '市级补贴' },
  { value: '区级补贴', label: '区级补贴' },
  { value: '其他补贴', label: '其他补贴' },
];

const SubsidyList: React.FC = () => {
  const [form] = Form.useForm();

  const [data, setData] = useState<SubsidyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [zones, setZones] = useState<MeterZone[]>([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    paidAmount: 0,
  });

  useEffect(() => {
    loadZones();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  const loadZones = async () => {
    try {
      const result = await metersApi.getZones();
      setZones(result);
    } catch (error) {
      message.error('加载分区数据失败');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      let startDate: string | undefined;
      let endDate: string | undefined;
      if (values.dateRange && values.dateRange.length === 2) {
        startDate = values.dateRange[0].format('YYYY-MM-DD');
        endDate = values.dateRange[1].format('YYYY-MM-DD');
      }
      const result = await subsidiesApi.getList({
        page,
        pageSize,
        status: values.status,
        type: values.type,
        zoneId: values.zoneId,
        keyword: values.keyword,
        startDate,
        endDate,
      });
      setData(result.data);
      setTotal(result.total);
      calculateStats(result.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records: SubsidyRecord[]) => {
    const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = records.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + r.amount, 0);
    const approvedAmount = records.filter(r => r.status === 'APPROVED').reduce((sum, r) => sum + r.amount, 0);
    const paidAmount = records.filter(r => r.status === 'PAID').reduce((sum, r) => sum + r.amount, 0);
    setStats({ totalAmount, pendingAmount, approvedAmount, paidAmount });
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleReset = () => {
    form.resetFields();
    setPage(1);
    loadData();
  };

  const columns: ColumnsType<SubsidyRecord> = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusTag type="subsidyStatus" value={status} />,
    },
    {
      title: '补贴周期',
      dataIndex: 'period',
      key: 'period',
      width: 120,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '补贴类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: '补贴金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (value: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          ¥{value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '所属分区',
      dataIndex: 'zoneName',
      key: 'zoneName',
      width: 120,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="累计补贴总额"
              value={stats.totalAmount}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
              suffix="元"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审核金额"
              value={stats.pendingAmount}
              precision={2}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              suffix="元"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已审批金额"
              value={stats.approvedAmount}
              precision={2}
              prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
              suffix="元"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已发放金额"
              value={stats.paidAmount}
              precision={2}
              prefix={<WalletOutlined style={{ color: '#52c41a' }} />}
              suffix="元"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <Space>
                <GiftOutlined style={{ color: '#1890ff' }} />
                补贴记录管理
              </Space>
            </Title>
            <Text type="secondary">查看和管理各级政府补贴发放记录</Text>
          </Col>
        </Row>

        <Form form={form} layout="inline">
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" allowClear style={{ width: 140 }}>
              {SUBSIDY_STATUS_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Select placeholder="全部类型" allowClear style={{ width: 140 }}>
              {SUBSIDY_TYPE_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="zoneId" label="分区">
            <Select placeholder="全部分区" allowClear style={{ width: 140 }}>
              {zones.map((zone) => (
                <Option key={zone.id} value={zone.id}>
                  {zone.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="keyword" label="搜索">
            <Input placeholder="周期/描述" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="dateRange" label="时间">
            <RangePicker style={{ width: 240 }} />
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
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default SubsidyList;
