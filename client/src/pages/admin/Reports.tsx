import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, DatePicker, Space, Statistic, Table, Progress, Spin, Tag } from 'antd';
import { TrendingUp, Users, BarChart3, Percent } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import type { UsageTrendData, SeatUtilizationData } from '@/types';
import { getUsageTrend, getSeatUtilization } from '@/api/report';
import { formatMoney } from '@/utils';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ReportsPage: React.FC = () => {
  const [trendData, setTrendData] = useState<UsageTrendData | null>(null);
  const [utilizationData, setUtilizationData] = useState<SeatUtilizationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [trendType, setTrendType] = useState<'count' | 'users'>('count');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trend, utilization] = await Promise.all([
        getUsageTrend({
          startDate: dateRange[0]?.format('YYYY-MM-DD'),
          endDate: dateRange[1]?.format('YYYY-MM-DD'),
          type: trendType,
        }),
        getSeatUtilization(),
      ]);
      setTrendData(trend);
      setUtilizationData(utilization);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, trendType]);

  const getTrendChartOption = () => {
    if (!trendData) return {};
    
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: trendData.pluginData.map(p => p.plugin.name) },
      grid: { left: 50, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: trendData.overallData.map(d => d.date),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: { color: '#6b7280' },
      },
      series: trendData.pluginData.map((p, idx) => ({
        name: p.plugin.name,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2 },
        itemStyle: {
          color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'][idx % 6],
        },
        areaStyle: {
          opacity: 0.1,
        },
        data: p.series.map(s => s.value),
      })),
    };
  };

  const utilizationColumns = [
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: '授权数量',
      dataIndex: 'licenseCount',
      key: 'licenseCount',
      width: 100,
    },
    {
      title: '总席位',
      dataIndex: 'totalSeats',
      key: 'totalSeats',
      width: 100,
    },
    {
      title: '已使用',
      dataIndex: 'usedSeats',
      key: 'usedSeats',
      width: 100,
    },
    {
      title: '利用率',
      key: 'utilization',
      width: 200,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <Progress 
            percent={record.utilizationRate} 
            size="small" 
            strokeColor={record.utilizationRate > 80 ? '#52c41a' : record.utilizationRate > 50 ? '#faad14' : '#ff4d4f'}
            style={{ flex: 1, minWidth: 120 }}
          />
          <span className="text-sm font-medium w-12">{record.utilizationRate}%</span>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">数据报表</h2>
        <p className="text-gray-500 text-sm">查看插件使用趋势和席位利用率统计</p>
      </div>

      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card variant="borderless">
            <Statistic
              title="总使用次数"
              value={trendData?.summary.totalUsage || 0}
              prefix={<BarChart3 className="w-5 h-5 text-blue-500" />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless">
            <Statistic
              title="活跃用户数"
              value={trendData?.summary.totalActiveUsers || 0}
              prefix={<Users className="w-5 h-5 text-green-500" />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless">
            <Statistic
              title="总席位"
              value={utilizationData?.summary.totalSeats || 0}
              prefix={<TrendingUp className="w-5 h-5 text-purple-500" />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless">
            <Statistic
              title="整体利用率"
              value={utilizationData?.summary.overallUtilization || 0}
              suffix="%"
              prefix={<Percent className="w-5 h-5 text-orange-500" />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        variant="borderless" 
        className="mb-6"
        title="插件使用趋势"
        extra={
          <Space>
            <Select
              value={trendType}
              onChange={setTrendType}
              style={{ width: 120 }}
              size="small"
            >
              <Option value="count">使用次数</Option>
              <Option value="users">活跃用户</Option>
            </Select>
            <RangePicker
              size="small"
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            />
          </Space>
        }
      >
        <Spin spinning={loading}>
          <ReactECharts 
            option={getTrendChartOption()} 
            style={{ height: 360 }}
            opts={{ renderer: 'svg' }}
          />
        </Spin>
      </Card>

      <Card variant="borderless" title="部门席位利用率">
        <Spin spinning={loading}>
          <Table
            columns={utilizationColumns}
            dataSource={utilizationData?.departmentData || []}
            rowKey="department"
            pagination={false}
            expandable={{
              expandedRowRender: (record) => (
                <div className="pl-8">
                  <div className="text-gray-500 text-sm mb-2">插件明细：</div>
                  <Table
                    size="small"
                    columns={[
                      { title: '插件名称', dataIndex: 'pluginName', key: 'pluginName' },
                      { title: '总席位', dataIndex: 'totalSeats', key: 'totalSeats', width: 100 },
                      { title: '已使用', dataIndex: 'usedSeats', key: 'usedSeats', width: 100 },
                      { 
                        title: '利用率', 
                        key: 'rate', 
                        width: 200,
                        render: (_: any, r: any) => (
                          <div className="flex items-center gap-2">
                            <Progress percent={r.utilizationRate} size="small" style={{ flex: 1 }} />
                            <span className="text-sm w-10">{r.utilizationRate}%</span>
                          </div>
                        )
                      },
                    ]}
                    dataSource={record.plugins}
                    rowKey="pluginId"
                    pagination={false}
                  />
                </div>
              ),
            }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default ReportsPage;
