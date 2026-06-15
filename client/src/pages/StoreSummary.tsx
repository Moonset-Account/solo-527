import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  DatePicker,
  Button,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  message
} from 'antd';
import { DownloadOutlined, ReloadOutlined, ShopOutlined, DollarOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { summaryApi, exportApi } from '@/services/api';
import { StoreSummaryDto, OrderStatus } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

const { RangePicker } = DatePicker;

const StoreSummary: React.FC = () => {
  const [data, setData] = useState<StoreSummaryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const params: { startDate?: string; endDate?: string } = {};
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }
      const response = await summaryApi.getStoreSummary(params);
      setData(response.data);
    } catch (error) {
      message.error('加载门店汇总数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'csv') => {
    setExporting(true);
    try {
      const params: any = { format };
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }
      const response = await exportApi.exportOrders(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `门店汇总_${dayjs().format('YYYYMMDDHHmmss')}.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const totalStats = data.reduce(
    (acc, item) => ({
      totalOrders: acc.totalOrders + item.totalOrders,
      totalAmount: acc.totalAmount + item.totalAmount,
      pendingOrders: acc.pendingOrders + item.pendingOrders,
      completedOrders: acc.completedOrders + item.completedOrders,
      overdueOrders: acc.overdueOrders + item.overdueOrders,
      qualityFailedOrders: acc.qualityFailedOrders + item.qualityFailedOrders
    }),
    { totalOrders: 0, totalAmount: 0, pendingOrders: 0, completedOrders: 0, overdueOrders: 0, qualityFailedOrders: 0 }
  );

  const columns: ColumnsType<StoreSummaryDto> = [
    {
      title: '门店名称',
      dataIndex: 'storeName',
      key: 'storeName',
      fixed: 'left',
      width: 150,
      render: (text) => (
        <Space>
          <ShopOutlined style={{ color: '#1890ff' }} />
          <strong>{text}</strong>
        </Space>
      )
    },
    {
      title: '总订单数',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      width: 100,
      sorter: (a, b) => a.totalOrders - b.totalOrders,
      render: (val) => <Tag color="blue">{val}</Tag>
    },
    {
      title: '待处理',
      dataIndex: 'pendingOrders',
      key: 'pendingOrders',
      width: 90,
      render: (val) => val > 0 ? <Tag color="orange">{val}</Tag> : <span style={{ color: '#999' }}>0</span>
    },
    {
      title: '生产中',
      dataIndex: 'inProductionOrders',
      key: 'inProductionOrders',
      width: 90,
      render: (val) => val > 0 ? <Tag color="processing">{val}</Tag> : <span style={{ color: '#999' }}>0</span>
    },
    {
      title: '已完成',
      dataIndex: 'completedOrders',
      key: 'completedOrders',
      width: 90,
      render: (val) => val > 0 ? <Tag color="success">{val}</Tag> : <span style={{ color: '#999' }}>0</span>
    },
    {
      title: '已交付',
      dataIndex: 'deliveredOrders',
      key: 'deliveredOrders',
      width: 90,
      render: (val) => val > 0 ? <Tag color="green">{val}</Tag> : <span style={{ color: '#999' }}>0</span>
    },
    {
      title: '质检不合格',
      dataIndex: 'qualityFailedOrders',
      key: 'qualityFailedOrders',
      width: 110,
      render: (val) => val > 0 ? <Tag color="red">{val}</Tag> : <span style={{ color: '#999' }}>0</span>
    },
    {
      title: '已逾期',
      dataIndex: 'overdueOrders',
      key: 'overdueOrders',
      width: 90,
      render: (val) => val > 0 ? <Tag color="error">{val}</Tag> : <span style={{ color: '#999' }}>0</span>
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
      render: (val) => <strong style={{ color: '#52c41a' }}>{formatCurrency(val)}</strong>
    },
    {
      title: '完成率',
      key: 'completionRate',
      width: 120,
      render: (_, record) => {
        const rate = record.totalOrders > 0 
          ? Math.round((record.completedOrders + record.deliveredOrders) / record.totalOrders * 100) 
          : 0;
        return (
          <Space>
            <div style={{ width: 60, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${rate}%`, 
                  height: '100%', 
                  background: rate >= 80 ? '#52c41a' : rate >= 50 ? '#faad14' : '#ff4d4f',
                  borderRadius: 4 
                }} 
              />
            </div>
            <span>{rate}%</span>
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        bordered={false}
        title="门店数据汇总"
        extra={
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            />
            <Button icon={<ReloadOutlined />} onClick={loadSummary} loading={loading}>
              刷新
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleExport('excel')}
              loading={exporting}
            >
              导出Excel
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleExport('csv')}
              loading={exporting}
            >
              导出CSV
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="总订单数"
                value={totalStats.totalOrders}
                prefix={<ShopOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="总金额"
                value={totalStats.totalAmount}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#52c41a' }}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="待处理"
                value={totalStats.pendingOrders}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="已完成"
                value={totalStats.completedOrders}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="质检不合格"
                value={totalStats.qualityFailedOrders}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="已逾期"
                value={totalStats.overdueOrders}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="storeId"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>
    </div>
  );
};

export default StoreSummary;
