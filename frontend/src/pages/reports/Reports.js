import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Tabs,
  DatePicker,
  Select,
  Space,
} from 'antd';
import {
  RiseOutlined,
  UserOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSalesFunnel,
  fetchLeadSourceReport,
  fetchSalesPerformance,
  fetchTimeoutReport,
  fetchTrendReport,
  fetchResponseNodeReport,
} from '../../store/slices/commonSlice';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;

const Reports = () => {
  const dispatch = useDispatch();
  const {
    salesFunnel,
    leadSourceReport,
    salesPerformance,
    timeoutReport,
    trendReport,
    responseNodeReport,
  } = useSelector(state => state.common);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    dispatch(fetchSalesFunnel());
    dispatch(fetchLeadSourceReport());
    dispatch(fetchSalesPerformance());
    dispatch(fetchTimeoutReport());
    dispatch(fetchTrendReport({ days: 30 }));
    dispatch(fetchResponseNodeReport());
  }, [dispatch]);

  const funnelOption = salesFunnel ? {
    title: { text: '销售漏斗', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    series: [{
      type: 'funnel',
      left: '10%',
      top: 60,
      bottom: 20,
      width: '80%',
      min: 0,
      max: salesFunnel.summary?.total_leads || 100,
      sort: 'descending',
      gap: 2,
      label: {
        show: true,
        position: 'inside',
        formatter: '{b}\n{c}',
      },
      itemStyle: { borderColor: '#fff', borderWidth: 1 },
      data: salesFunnel.funnel?.map(item => ({ value: item.count, name: item.stage })) || [],
    }]
  } : {};

  const sourceOption = {
    title: { text: '线索来源分布', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: leadSourceReport.map(item => ({
        value: item.total_leads,
        name: item.name,
      })),
    }],
  };

  const trendOption = trendReport ? {
    title: { text: '趋势分析', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增线索', '成交金额'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendReport.leads_trend?.map(item => dayjs(item.date).format('MM-DD')) || [],
    },
    yAxis: [
      { type: 'value', name: '线索数' },
      { type: 'value', name: '金额(元)' },
    ],
    series: [
      {
        name: '新增线索',
        type: 'line',
        smooth: true,
        data: trendReport.leads_trend?.map(item => item.count) || [],
        areaStyle: { opacity: 0.3 },
      },
      {
        name: '成交金额',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: trendReport.contracts_trend?.map(item => item.amount || 0) || [],
        areaStyle: { opacity: 0.3 },
      },
    ],
  } : {};

  const performanceColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: '负责线索',
      dataIndex: 'assigned_leads',
      key: 'assigned_leads',
      sorter: (a, b) => a.assigned_leads - b.assigned_leads,
    },
    {
      title: '成交线索',
      dataIndex: 'won_leads',
      key: 'won_leads',
      sorter: (a, b) => a.won_leads - b.won_leads,
    },
    {
      title: '转化率',
      dataIndex: 'conversion_rate',
      key: 'conversion_rate',
      render: (rate) => <span style={{ color: rate > 20 ? '#52c41a' : '#faad14' }}>{rate}%</span>,
      sorter: (a, b) => a.conversion_rate - b.conversion_rate,
    },
    {
      title: '合同数',
      dataIndex: 'total_contracts',
      key: 'total_contracts',
    },
    {
      title: '业绩金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `¥${Number(amount).toFixed(2)}`,
      sorter: (a, b) => a.total_amount - b.total_amount,
    },
  ];

  const sourceColumns = [
    {
      title: '来源渠道',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '线索数',
      dataIndex: 'total_leads',
      key: 'total_leads',
      sorter: (a, b) => a.total_leads - b.total_leads,
    },
    {
      title: '成交数',
      dataIndex: 'won_count',
      key: 'won_count',
    },
    {
      title: '转化率',
      dataIndex: 'conversion_rate',
      key: 'conversion_rate',
      render: (rate) => <span>{rate}%</span>,
      sorter: (a, b) => a.conversion_rate - b.conversion_rate,
    },
    {
      title: '成交总额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `¥${Number(amount).toFixed(2)}`,
      sorter: (a, b) => a.total_amount - b.total_amount,
    },
    {
      title: '平均客单价',
      dataIndex: 'avg_amount',
      key: 'avg_amount',
      render: (amount) => `¥${Number(amount).toFixed(2)}`,
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总线索数"
                value={salesFunnel?.summary?.total_leads || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总成交金额"
                value={salesFunnel?.summary?.total_amount || 0}
                prefix="¥"
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="成交转化率"
                value={salesFunnel?.summary?.lost_rate || 0}
                suffix="%"
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="超时跟进数"
                value={timeoutReport?.summary?.total || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <span>时间范围：</span>
          <RangePicker
            onChange={(dates) => setDateRange(dates)}
          />
        </Space>
      </Card>

      <Tabs defaultActiveKey="1">
        <TabPane tab="销售漏斗" key="1">
          <Row gutter={[16, 16]}>
            <Col span={14}>
              <Card>
                <ReactECharts option={funnelOption} style={{ height: 400 }} />
              </Card>
            </Col>
            <Col span={10}>
              <Card title="转化数据">
                {salesFunnel?.conversion_rates && (
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div>
                      <div style={{ color: '#999' }}>联系转化率</div>
                      <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                        {salesFunnel.conversion_rates.to_contacted}%
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#999' }}>咨询转化率</div>
                      <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                        {salesFunnel.conversion_rates.to_consulting}%
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#999' }}>报价转化率</div>
                      <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                        {salesFunnel.conversion_rates.to_quoting}%
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#999' }}>成交转化率</div>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                        {salesFunnel.conversion_rates.to_won}%
                      </div>
                    </div>
                  </Space>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="线索来源" key="2">
          <Row gutter={[16, 16]}>
            <Col span={10}>
              <Card>
                <ReactECharts option={sourceOption} style={{ height: 350 }} />
              </Card>
            </Col>
            <Col span={14}>
              <Card title="来源分析">
                <Table
                  columns={sourceColumns}
                  dataSource={leadSourceReport}
                  rowKey="id"
                  size="small"
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="销售业绩" key="3">
          <Card title="销售业绩排行">
            <Table
              columns={performanceColumns}
              dataSource={salesPerformance}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="趋势分析" key="4">
          <Card>
            <ReactECharts option={trendOption} style={{ height: 400 }} />
          </Card>
        </TabPane>

        <TabPane tab="超时分析" key="5">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card title="超时概况">
                {timeoutReport?.summary && (
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div>
                      <div style={{ color: '#999' }}>超时总数</div>
                      <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff4d4f' }}>
                        {timeoutReport.summary.total}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#999' }}>已处理</div>
                      <div style={{ fontSize: 20, color: '#52c41a' }}>
                        {timeoutReport.summary.handled}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#999' }}>未处理</div>
                      <div style={{ fontSize: 20, color: '#faad14' }}>
                        {timeoutReport.summary.unhandled}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#999' }}>处理率</div>
                      <div style={{ fontSize: 20 }}>
                        {timeoutReport.summary.handled_rate}%
                      </div>
                    </div>
                  </Space>
                )}
              </Card>
            </Col>
            <Col span={16}>
              <Card title="责任人超时统计">
                <Table
                  columns={[
                    { title: '责任人', dataIndex: 'responsible_person__full_name', key: 'name', render: (text) => text || '-' },
                    { title: '超时次数', dataIndex: 'count', key: 'count', sorter: (a, b) => a.count - b.count },
                    { title: '平均超时时长(小时)', dataIndex: 'avg_duration', key: 'avg_duration', render: (d) => d?.toFixed(1) },
                  ]}
                  dataSource={timeoutReport?.by_person || []}
                  rowKey="responsible_person"
                  size="small"
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="响应节点" key="6">
          <Card title="响应节点分布">
            <Table
              columns={[
                { title: '响应节点', dataIndex: 'response_node', key: 'node' },
                { title: '线索数', dataIndex: 'count', key: 'count', sorter: (a, b) => a.count - b.count },
              ]}
              dataSource={responseNodeReport}
              rowKey="response_node"
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Reports;
