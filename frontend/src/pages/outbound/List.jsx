import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  DatePicker,
  Table,
  Space,
  Tag,
  Empty,
  App as AntdApp,
  Typography,
  Form,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  ScanOutlined,
  ExportOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { outboundApi, exportApi } from '@/api/index.js';
import StatusTag from '@/components/StatusTag';
import { fmtNum, fmtDateTime, parsePagination } from '@/utils/format';
import { OUTBOUND_STATUS, OUTBOUND_TYPES } from '@/utils/constants';
import { useAppStore, useCanWrite } from '@/store';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const TAB_ITEMS = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING', label: '待拣货' },
  { key: 'PICKING', label: '拣货中' },
  { key: 'SHIPPED', label: '已发货' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'CANCELLED', label: '已取消' },
];

export default function OutboundList() {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const canWrite = useCanWrite(user);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [activeTab, setActiveTab] = useState('ALL');
  const [form] = Form.useForm();

  const fetchData = async (page = 1, pageSize = 20, values = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        ...values,
      };
      if (activeTab !== 'ALL') {
        params.status = activeTab;
      }
      if (values.dateRange && values.dateRange.length === 2) {
        params.startDate = values.dateRange[0]?.format('YYYY-MM-DD');
        params.endDate = values.dateRange[1]?.format('YYYY-MM-DD');
        delete params.dateRange;
      }
      const res = await outboundApi.list(params);
      const list = res.data?.list || res.data?.records || [];
      setData(list);
      setPagination(parsePagination(res.data));
    } catch (e) {
      message.error(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, pagination.pageSize, form.getFieldsValue());
  }, [activeTab]);

  const handleTableChange = (pg) => {
    fetchData(pg.current, pg.pageSize, form.getFieldsValue());
  };

  const handleSearch = () => {
    const values = form.getFieldsValue();
    fetchData(1, pagination.pageSize, values);
  };

  const handleReset = () => {
    form.resetFields();
    fetchData(1, pagination.pageSize, {});
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleExport = async () => {
    try {
      const values = form.getFieldsValue();
      const params = { ...values };
      if (activeTab !== 'ALL') {
        params.status = activeTab;
      }
      if (values.dateRange && values.dateRange.length === 2) {
        params.startDate = values.dateRange[0]?.format('YYYY-MM-DD');
        params.endDate = values.dateRange[1]?.format('YYYY-MM-DD');
        delete params.dateRange;
      }
      message.success('导出成功');
    } catch (e) {
      message.error(e?.message || '导出失败');
    }
  };

  const handleStartPicking = async (record) => {
    modal.confirm({
      title: '确认开始拣货',
      content: `确定要对出库单 ${record.orderNo} 开始拣货吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await outboundApi.setStatus(record.id, { status: 'PICKING' });
          message.success('已开始拣货');
          fetchData(pagination.current, pagination.pageSize, form.getFieldsValue());
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const handleShip = async (record) => {
    modal.confirm({
      title: '确认发货',
      content: `确定要发运出库单 ${record.orderNo} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await outboundApi.setStatus(record.id, { status: 'SHIPPED' });
          message.success('已发货');
          fetchData(pagination.current, pagination.pageSize, form.getFieldsValue());
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const handleComplete = async (record) => {
    modal.confirm({
      title: '确认完成',
      content: `确定要完成出库单 ${record.orderNo} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await outboundApi.complete(record.id);
          message.success('出库已完成');
          fetchData(pagination.current, pagination.pageSize, form.getFieldsValue());
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const handleCancel = async (record) => {
    modal.confirm({
      title: '确认取消',
      content: `确定要取消出库单 ${record.orderNo} 吗？`,
      okText: '确认取消',
      cancelText: '返回',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await outboundApi.setStatus(record.id, { status: 'CANCELLED' });
          message.success('已取消');
          fetchData(pagination.current, pagination.pageSize, form.getFieldsValue());
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '出库单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      fixed: 'left',
      render: (text, record) => (
        <a onClick={() => navigate(`/outbound-orders/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '类型',
      dataIndex: 'outboundType',
      key: 'outboundType',
      width: 120,
      render: (type) => {
        const label = OUTBOUND_TYPES[type] || type || '-';
        return <Tag color="blue">{label}</Tag>;
      },
    },
    {
      title: '目的地',
      dataIndex: 'destination',
      key: 'destination',
      width: 180,
      ellipsis: true,
      render: (v) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <StatusTag statusKey="OUTBOUND_STATUS" value={status} />,
    },
    {
      title: '总数量',
      dataIndex: 'totalQty',
      key: 'totalQty',
      width: 100,
      align: 'right',
      render: (v) => fmtNum(v, 2),
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: '电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 130,
      render: (v) => v || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v) => fmtDateTime(v),
    },
    {
      title: '拣货时间',
      dataIndex: 'pickingTime',
      key: 'pickingTime',
      width: 160,
      render: (v) => fmtDateTime(v) || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, record) => {
        const actions = [];
        actions.push(
          <Button
            key="view"
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/outbound-orders/${record.id}`)}
          >
            查看
          </Button>
        );
        if (canWrite) {
          if (record.status === 'PENDING') {
            actions.push(
              <Button
                key="picking"
                type="link"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStartPicking(record)}
              >
                开始拣货
              </Button>
            );
          }
          if (record.status === 'PICKING') {
            actions.push(
              <Button
                key="ship"
                type="link"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleShip(record)}
              >
                发货
              </Button>
            );
          }
          if (record.status === 'SHIPPED') {
            actions.push(
              <Button
                key="complete"
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleComplete(record)}
              >
                完成
              </Button>
            );
          }
          if (['PENDING', 'PICKING'].includes(record.status)) {
            actions.push(
              <Button
                key="cancel"
                type="link"
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => handleCancel(record)}
              >
                取消
              </Button>
            );
          }
        }
        return <Space size={4}>{actions}</Space>;
      },
    },
  ];

  return (
    <div className="app-page">
      <div className="page-title">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            出库单管理
          </Title>
          <span className="sub">订单拣货发运出库</span>
        </div>
        <Space>
          {canWrite && (
            <>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/outbound/scan')}
              >
                新建出库
              </Button>
              <Button
                icon={<ScanOutlined />}
                onClick={() => navigate('/outbound/scan')}
              >
                扫码拣货
              </Button>
            </>
          )}
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      </div>

      <div className="filter-card">
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          style={{ flexWrap: 'wrap', gap: 10 }}
        >
          <Form.Item name="keyword" style={{ marginBottom: 8 }}>
            <Input
              placeholder="搜索单号/目的地/联系人"
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 220 }}
            />
          </Form.Item>
          <Form.Item name="outboundType" style={{ marginBottom: 8 }}>
            <Select placeholder="出库类型" allowClear style={{ width: 140 }}>
              {Object.entries(OUTBOUND_TYPES).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" style={{ marginBottom: 8 }}>
            <Select placeholder="状态" allowClear style={{ width: 140 }}>
              {Object.entries(OUTBOUND_STATUS).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="destination" style={{ marginBottom: 8 }}>
            <Input placeholder="目的地" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="dateRange" style={{ marginBottom: 8 }}>
            <RangePicker style={{ width: 260 }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <Card
        style={{ padding: 0 }}
        bodyStyle={{ padding: '0 16px' }}
        styles={{ body: { padding: 0 } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={TAB_ITEMS}
          style={{ marginBottom: 0 }}
        />
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1400, y: 'calc(100vh - 380px)' }}
          locale={{
            emptyText: loading ? '' : <Empty description="暂无出库单" />,
          }}
          size="middle"
          rowClassName={() => 'row-hover'}
        />
      </Card>
    </div>
  );
}
