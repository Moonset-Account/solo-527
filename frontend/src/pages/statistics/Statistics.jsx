import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Button, Space, DatePicker, Select, Form, Dropdown, message } from 'antd';
import {
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import request from '../../utils/request.js';
import dayjs from 'dayjs';

const { Option } = Select;

const Statistics = () => {
  const [dashboard, setDashboard] = useState({});
  const [trendData, setTrendData] = useState([]);
  const [agingData, setAgingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, trendRes, agingRes] = await Promise.all([
        request.get('/statistics/dashboard'),
        request.get('/statistics/collection-trend', { params: { months: 6 } }),
        request.get('/statistics/aging'),
      ]);
      setDashboard(dashboardRes.stats || {});
      setTrendData(trendRes.data || []);
      setAgingData(agingRes.buckets || []);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const doExport = async (type) => {
    setExporting(true);
    setExportType(type);
    try {
      const endpointMap = {
        bills: '/statistics/export/bills',
        transactions: '/statistics/export/transactions',
        payments: '/statistics/export/payments',
        collections: '/statistics/export/collections',
      };
      const labelMap = {
        bills: '账单列表',
        transactions: '流水列表',
        payments: '付款记录',
        collections: '催收记录',
      };
      const response = await request.get(endpointMap[type], {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `${labelMap[type]}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success(`${labelMap[type]}导出成功`);
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    } finally {
      setExporting(false);
      setExportType(null);
    }
  };

  const exportMenuItems = [
    {
      key: 'bills',
      icon: <ExportOutlined />,
      label: '导出账单列表（含收费进度、逾期天数）',
    },
    {
      key: 'transactions',
      icon: <ExportOutlined />,
      label: '导出流水列表',
    },
    {
      key: 'payments',
      icon: <ExportOutlined />,
      label: '导出付款记录',
    },
    {
      key: 'collections',
      icon: <ExportOutlined />,
      label: '导出催收记录',
    },
  ];

  const statsCards = [
    {
      title: '应收总额',
      value: `¥${Number(dashboard.totalReceivables || 0).toLocaleString()}`,
      icon: <DollarOutlined style={{ color: '#1890ff', fontSize: 28 }} />,
      color: '#e6f7ff',
    },
    {
      title: '已收款',
      value: `¥${Number(dashboard.totalPaid || 0).toLocaleString()}`,
      icon: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 28 }} />,
      color: '#f6ffed',
    },
    {
      title: '待收款',
      value: `¥${Number(dashboard.outstandingBalance || 0).toLocaleString()}`,
      icon: <ClockCircleOutlined style={{ color: '#faad14', fontSize: 28 }} />,
      color: '#fff7e6',
    },
    {
      title: '逾期账单',
      value: dashboard.overdueBills || 0,
      icon: <WarningOutlined style={{ color: '#ff4d4f', fontSize: 28 }} />,
      color: '#fff1f0',
    },
  ];

  const recoveryRate = dashboard.totalReceivables > 0
    ? Math.round((dashboard.totalPaid / dashboard.totalReceivables) * 100)
    : 0;

  const agingColumns = [
    {
      title: '账龄区间',
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => `¥${Number(val).toLocaleString()}`,
    },
    {
      title: '笔数',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: '占比',
      key: 'percent',
      render: (_, record, index) => {
        const total = agingData.reduce((sum, item) => sum + item.amount, 0);
        const percent = total > 0 ? Math.round((record.amount / total) * 100) : 0;
        return (
          <Progress percent={percent} size="small" status={index === 0 ? 'normal' : 'exception'} />
        );
      },
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>回款统计</h2>
        <Space>
          <Dropdown
            menu={{
              items: exportMenuItems,
              onClick: ({ key }) => doExport(key),
            }}
            disabled={exporting}
          >
            <Button icon={<DownloadOutlined />} loading={exporting}>
              导出报表{exporting && exportType ? `(${exportType})` : ''}
            </Button>
          </Dropdown>
          <Button onClick={fetchAllData}>
            刷新
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statsCards.map((card, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card bordered={false} style={{ borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    backgroundColor: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}
                >
                  {card.icon}
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: 13, marginBottom: 4 }}>{card.title}</div>
                  <div style={{ fontSize: 22, fontWeight: 600 }}>{card.value}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <LineChartOutlined />
                回款趋势
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 8, height: '100%' }}
          >
            <div style={{ height: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '20px 10px' }}>
              {trendData.map((item, index) => (
                <div key={index} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 220, justifyContent: 'flex-end' }}>
                    <div
                      style={{
                        width: 24,
                        backgroundColor: '#1890ff',
                        borderRadius: '4px 4px 0 0',
                        height: `${(item.billed / (Math.max(...trendData.map(d => d.billed)) || 1)) * 180}px`,
                        marginBottom: 4,
                        minHeight: 2,
                      }}
                      title={`应收: ¥${Number(item.billed).toLocaleString()}`}
                    />
                    <div
                      style={{
                        width: 24,
                        backgroundColor: '#52c41a',
                        borderRadius: '4px 4px 0 0',
                        height: `${(item.collected / (Math.max(...trendData.map(d => d.collected)) || 1)) * 180}px`,
                        minHeight: 2,
                      }}
                      title={`实收: ¥${Number(item.collected).toLocaleString()}`}
                    />
                  </div>
                  <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>{item.month}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
              <Space>
                <div style={{ width: 12, height: 12, background: '#1890ff', borderRadius: 2 }} />
                <span style={{ fontSize: 12, color: '#666' }}>应收金额</span>
              </Space>
              <Space>
                <div style={{ width: 12, height: 12, background: '#52c41a', borderRadius: 2 }} />
                <span style={{ fontSize: 12, color: '#666' }}>实收金额</span>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <PieChartOutlined />
                回款率
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 8, marginBottom: 16 }}
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Progress
                type="circle"
                percent={recoveryRate}
                size={160}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <div style={{ marginTop: 16, color: '#666' }}>
                <div>已收款 / 应收总额</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#333', marginTop: 4 }}>
                  ¥{Number(dashboard.totalPaid || 0).toLocaleString()} / ¥{Number(dashboard.totalReceivables || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </Card>

          <Card
            title={
              <Space>
                <BarChartOutlined />
                账单概览
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 8 }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="总账单"
                  value={dashboard.totalBills || 0}
                  valueStyle={{ fontSize: 20 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="未付款"
                  value={dashboard.unpaidBills || 0}
                  valueStyle={{ fontSize: 20, color: '#faad14' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="已付款"
                  value={dashboard.paidBills || 0}
                  valueStyle={{ fontSize: 20, color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <WarningOutlined />
                账龄分析
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 8 }}
          >
            <Table
              dataSource={agingData}
              columns={agingColumns}
              rowKey="label"
              size="middle"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;
