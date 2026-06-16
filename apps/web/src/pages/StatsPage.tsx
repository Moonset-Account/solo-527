import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Select, DatePicker, Space, Row, Col, Statistic, Progress, Empty, Tag, Table } from 'antd';
import ReactECharts from 'echarts-for-react';
import { statsApi, campsApi } from '../services/api';
import { campStatusMap, conversionSourceMap, formatNumber } from '../lib/constants';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;

const StatsPage: React.FC = () => {
  const [campId, setCampId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<any>(null);

  const { data: camps } = useQuery({
    queryKey: ['camps', 'all'],
    queryFn: () => campsApi.list({ pageSize: 100, page: 1 }),
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: statsApi.overview,
  });

  const { data: completion, isLoading: completionLoading } = useQuery({
    queryKey: ['stats', 'completion', campId],
    queryFn: () => statsApi.completion(campId ? { campId } : undefined),
  });

  const dateParams: any = {};
  if (dateRange && dateRange.length === 2) {
    dateParams.startDate = dateRange[0].toISOString();
    dateParams.endDate = dateRange[1].toISOString();
  }
  if (campId) dateParams.campId = campId;

  const { data: checkinStats } = useQuery({
    queryKey: ['stats', 'checkins', dateParams],
    queryFn: () => statsApi.checkins(dateParams),
  });

  const { data: conversionStats } = useQuery({
    queryKey: ['stats', 'conversion', dateParams],
    queryFn: () => statsApi.conversionSources(dateParams),
  });

  const completionList = Array.isArray(completion) ? completion : completion ? [completion] : [];

  const completionChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: completionList.map((c: any) => c.campName).slice(0, 5) },
    grid: { left: 50, right: 20, top: 40, bottom: 40 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: completionList[0]?.byDate ? completionList[0].byDate.map((d: any) => d.date.slice(5)) : [],
      axisLabel: { rotate: 45 },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' },
    },
    series: completionList.slice(0, 5).map((c: any, i: number) => ({
      name: c.campName,
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.1 },
      data: c.byDate ? c.byDate.map((d: any) => d.completionRate) : [],
      color: ['#722ED1', '#13C2C2', '#FA8C16', '#52C41A', '#EB2F96'][i],
    })),
  };

  const completionBarOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 20, bottom: 60 },
    xAxis: {
      type: 'category',
      data: completionList.map((c: any) => c.campName),
      axisLabel: { rotate: 30 },
    },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      {
        type: 'bar',
        barWidth: 30,
        data: completionList.map((c: any) => ({
          value: c.completionRate,
          itemStyle: {
            color: c.completionRate >= 80 ? '#52C41A' : c.completionRate >= 60 ? '#FA8C16' : '#FF4D4F',
          },
        })),
        label: { show: true, position: 'top', formatter: '{c}%' },
      },
    ],
  };

  const checkinChartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: checkinStats?.byDate ? checkinStats.byDate.map((d: any) => d.date.slice(5)) : [],
    },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'bar',
        data: checkinStats?.byDate ? checkinStats.byDate.map((d: any) => d.count) : [],
        color: '#722ED1',
      },
    ],
  };

  const checkinPieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        label: { formatter: '{b}: {d}%' },
        data: (checkinStats?.byStatus || []).map((s: any) => ({
          name: s.status === 'pending' ? '待审核' : s.status === 'approved' ? '已通过' : '已拒绝',
          value: s.count,
          itemStyle: {
            color: s.status === 'pending' ? '#FA8C16' : s.status === 'approved' ? '#52C41A' : '#FF4D4F',
          },
        })),
      },
    ],
  };

  const conversionPieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        label: { formatter: '{b}: {d}%' },
        data: (conversionStats?.bySource || []).map((s: any, i: number) => ({
          name: (conversionSourceMap[s.source] || {}).label || s.source,
          value: s.count,
          itemStyle: {
            color: ['#722ED1', '#13C2C2', '#FA8C16', '#52C41A', '#1890FF', '#EB2F96', '#FA541C', '#888'][i],
          },
        })),
      },
    ],
  };

  const completionColumns: ColumnsType<any> = [
    { title: '营期名称', dataIndex: 'campName', width: 200 },
    {
      title: '学员总数',
      dataIndex: 'totalMembers',
      width: 100,
      align: 'center',
    },
    {
      title: '完课人数',
      dataIndex: 'completedMembers',
      width: 100,
      align: 'center',
      render: (n) => <span style={{ color: '#52C41A', fontWeight: 500 }}>{n}</span>,
    },
    {
      title: '掉队人数',
      dataIndex: 'fallingBehindMembers',
      width: 100,
      align: 'center',
      render: (n) => (n > 0 ? <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{n}</span> : n),
    },
    {
      title: '完课率',
      dataIndex: 'completionRate',
      width: 200,
      render: (rate, r) => (
        <Progress
          percent={rate}
          status={rate < 60 ? 'exception' : undefined}
          format={() => `${rate}% (${r.completedMembers}/${r.totalMembers})`}
        />
      ),
    },
    {
      title: '平均进度',
      dataIndex: 'averageProgress',
      width: 120,
      render: (p) => `${p}%`,
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div className="filter-row">
          <Space size="large">
            <Select
              allowClear
              placeholder="全部营期"
              style={{ width: 240 }}
              value={campId}
              onChange={setCampId}
              options={camps?.items?.map((c: any) => ({ value: c.id, label: c.name }))}
            />
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder={['统计起', '止']}
            />
          </Space>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title="营期总数" value={overview?.camps?.total || 0} />
            <div style={{ marginTop: 8, color: '#13C2C2', fontSize: 13 }}>
              进行中 {overview?.camps?.ongoing || 0} 个
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title="会员总数" value={overview?.members?.total || 0} />
            <div style={{ marginTop: 8, color: '#52C41A', fontSize: 13 }}>
              活跃 {overview?.members?.active || 0} 人
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="掉队学员"
              value={overview?.members?.fallingBehind || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <div style={{ marginTop: 8, fontSize: 13 }}>
              掉队率：
              {overview?.members?.total > 0
                ? ((overview.members.fallingBehind / overview.members.total) * 100).toFixed(1)
                : 0}
              %
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title="待处理事项" value={
              (overview?.pending?.checkins || 0) +
              (overview?.pending?.refunds || 0) +
              (overview?.pending?.todos || 0)
            } />
            <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
              打卡 {overview?.pending?.checkins || 0} · 退款 {overview?.pending?.refunds || 0}
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title="完课率报表"
        style={{ marginBottom: 16 }}
        loading={completionLoading}
        extra={<Tag color="blue">学员掉队直接影响完课率</Tag>}
      >
        {completionList.length > 0 ? (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} lg={14}>
                <Card size="small" title="完课率趋势">
                  <ReactECharts option={completionChartOption} style={{ height: 280 }} />
                </Card>
              </Col>
              <Col xs={24} lg={10}>
                <Card size="small" title="各营完课率对比">
                  <ReactECharts option={completionBarOption} style={{ height: 280 }} />
                </Card>
              </Col>
            </Row>
            <Table
              rowKey="campId"
              columns={completionColumns}
              dataSource={completionList}
              pagination={false}
            />
          </>
        ) : (
          <Empty description="暂无数据" style={{ padding: 60 }} />
        )}
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="打卡统计">
            <ReactECharts option={checkinChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="打卡状态分布">
            <ReactECharts option={checkinPieOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="转化来源分析">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <ReactECharts option={conversionPieOption} style={{ height: 320 }} />
          </Col>
          <Col xs={24} lg={14}>
            <Table
              size="small"
              rowKey="source"
              columns={[
                {
                  title: '转化来源',
                  dataIndex: 'source',
                  render: (s) => {
                    const m = conversionSourceMap[s] || {};
                    return <Tag color={m.color as any}>{m.label || s}</Tag>;
                  },
                },
                {
                  title: '新增人数',
                  dataIndex: 'count',
                  width: 100,
                  render: (n) => <strong>{n}</strong>,
                  sorter: (a: any, b: any) => a.count - b.count,
                },
                {
                  title: '累计金额',
                  dataIndex: 'totalAmount',
                  width: 140,
                  render: (a) => <span style={{ color: '#FA8C16' }}>¥{formatNumber(a)}</span>,
                },
                {
                  title: '占比',
                  key: 'percent',
                  render: (_, r) => {
                    const total = (conversionStats?.bySource || []).reduce(
                      (s: number, x: any) => s + x.count,
                      0,
                    );
                    const percent = total > 0 ? ((r.count / total) * 100).toFixed(1) : 0;
                    return (
                      <Progress
                        percent={parseFloat(percent)}
                        size="small"
                        format={() => `${percent}%`}
                      />
                    );
                  },
                },
              ]}
              dataSource={conversionStats?.bySource || []}
              pagination={false}
            />
            <Card size="small" style={{ marginTop: 16 }} title="TOP 销售">
              {(conversionStats?.bySalesPerson || []).length > 0 ? (
                <ReactECharts
                  option={{
                    grid: { left: 80, right: 30, top: 10, bottom: 20 },
                    xAxis: { type: 'value' },
                    yAxis: {
                      type: 'category',
                      data: (conversionStats?.bySalesPerson || []).map((s: any) => s.salesPerson).reverse(),
                    },
                    series: [
                      {
                        type: 'bar',
                        data: (conversionStats?.bySalesPerson || []).map((s: any) => s.count).reverse(),
                        color: '#722ED1',
                        label: { show: true, position: 'right' },
                      },
                    ],
                  }}
                  style={{ height: 200 }}
                />
              ) : (
                <Empty description="暂无销售数据" style={{ padding: 20 }} />
              )}
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default StatsPage;
