import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, DatePicker, Table, Tag, Space,
  Tabs, Alert
} from 'antd';
import {
  BarChartOutlined, PieChartOutlined,
  TeamOutlined, CheckCircleOutlined, WarningOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { reportApi } from '../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const ReportPage: React.FC = () => {
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [helpProgress, setHelpProgress] = useState<any>(null);
  const [eventClosure, setEventClosure] = useState<any>(null);
  const [performance, setPerformance] = useState<any[]>([]);
  const [voteParticipation, setVoteParticipation] = useState<any>(null);
  const [shiftStats, setShiftStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      };

      const [help, closure, perf, vote, shift] = await Promise.all([
        reportApi.getHelpProgress(params) as any,
        reportApi.getEventClosure() as any,
        reportApi.getPerformance(params) as any,
        reportApi.getVoteParticipation() as any,
        reportApi.getShiftStats() as any,
      ]);

      setHelpProgress(help);
      setEventClosure(closure);
      setPerformance(perf);
      setVoteParticipation(vote);
      setShiftStats(shift);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventClosureChart = () => {
    if (!eventClosure) return null;
    
    const types = ['rectification', 'vote', 'patrol'];
    const typeNames = ['整改复查', '议题投票', '巡逻任务'];
    const statuses = ['pending', 'processing', 'reviewing', 'voting', 'completed', 'closed'];
    const statusNames = ['待处理', '处理中', '复查中', '投票中', '已完成', '已关闭'];

    const series = statuses.map((status, idx) => ({
      name: statusNames[idx],
      type: 'bar',
      stack: 'total',
      data: types.map(type => eventClosure[type]?.[status] || 0),
    }));

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: statusNames },
      xAxis: { type: 'category', data: typeNames },
      yAxis: { type: 'value' },
      series,
    };
  };

  const getShiftChart = () => {
    if (!shiftStats) return null;
    
    const shifts = ['morning', 'afternoon', 'night'];
    const shiftNames = ['早班', '中班', '晚班'];

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['待执行', '进行中', '已完成'] },
      xAxis: { type: 'category', data: shiftNames },
      yAxis: { type: 'value' },
      series: [
        { name: '待执行', type: 'bar', data: shifts.map(s => shiftStats[s]?.pendingTasks || 0) },
        { name: '进行中', type: 'bar', data: shifts.map(s => shiftStats[s]?.inProgressTasks || 0) },
        { name: '已完成', type: 'bar', data: shifts.map(s => shiftStats[s]?.completedTasks || 0) },
      ],
    };
  };

  const performanceColumns = [
    {
      title: '人员',
      dataIndex: 'userName',
      key: 'userName',
      render: (text: string, record: any) => (
        <Space>
          <span>{text}</span>
          <Tag color="blue">{record.role === 'manager' ? '管理员' : '网格员'}</Tag>
        </Space>
      ),
    },
    {
      title: '班次',
      dataIndex: 'shift',
      key: 'shift',
      render: (shift: string) => {
        const names: any = { morning: '早班', afternoon: '中班', night: '晚班' };
        return names[shift] || shift;
      },
    },
    {
      title: '网格区域',
      dataIndex: 'gridArea',
      key: 'gridArea',
    },
    {
      title: '事件完成率',
      dataIndex: 'eventCompletionRate',
      key: 'eventCompletionRate',
      render: (rate: string) => <Tag color={parseFloat(rate) >= 80 ? 'green' : parseFloat(rate) >= 60 ? 'orange' : 'red'}>{rate}%</Tag>,
    },
    {
      title: '任务完成率',
      dataIndex: 'taskCompletionRate',
      key: 'taskCompletionRate',
      render: (rate: string) => <Tag color={parseFloat(rate) >= 80 ? 'green' : parseFloat(rate) >= 60 ? 'orange' : 'red'}>{rate}%</Tag>,
    },
    {
      title: '待办完成率',
      dataIndex: 'todoCompletionRate',
      key: 'todoCompletionRate',
      render: (rate: string) => <Tag color={parseFloat(rate) >= 80 ? 'green' : parseFloat(rate) >= 60 ? 'orange' : 'red'}>{rate}%</Tag>,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">数据报表</h1>
        <Space>
          <RangePicker
            value={dateRange as any}
            onChange={(dates: any) => setDateRange(dates)}
            style={{ width: 300 }}
          />
        </Space>
      </div>

      {helpProgress && helpProgress.summary.unresolvedVotingExceptions > 0 && (
        <Alert
          message={`有 ${helpProgress.summary.unresolvedVotingExceptions} 个未处理的投票资格异常`}
          description={helpProgress.impactAnalysis.votingExceptionImpact}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <div className="help-progress-card">
            <div className="help-progress-score">{helpProgress?.summary.impactScore || 0}</div>
            <div className="help-progress-status">
              帮扶进度: {helpProgress?.summary.helpProgressStatus || '-'}
            </div>
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, opacity: 0.9 }}>
              综合评分
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card">
            <Statistic
              title="事件闭环率"
              value={helpProgress?.summary.eventClosureRate || '0%'}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              {helpProgress?.summary.completedEvents || 0} / {helpProgress?.summary.totalEvents || 0} 件
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card">
            <Statistic
              title="任务完成率"
              value={helpProgress?.summary.taskCompletionRate || '0%'}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              {helpProgress?.summary.completedTasks || 0} / {helpProgress?.summary.totalTasks || 0} 件
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card">
            <Statistic
              title="投票参与率"
              value={voteParticipation?.averageParticipationRate || '0%'}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              {voteParticipation?.eligibleVoterCount || 0} 个合格选民
            </div>
          </div>
        </Col>
      </Row>

      <Tabs defaultActiveKey="closure" size="large">
        <TabPane tab={<span><BarChartOutlined /> 事件闭环统计</span>} key="closure">
          <Card loading={loading}>
            <ReactECharts option={getEventClosureChart()} style={{ height: 400 }} />
          </Card>
        </TabPane>

        <TabPane tab={<span><PieChartOutlined /> 班次统计</span>} key="shift">
          <Card loading={loading}>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              {shiftStats && Object.entries(shiftStats).map(([key, value]: [string, any]) => {
                const names: any = { morning: '早班', afternoon: '中班', night: '晚班' };
                return (
                  <Col xs={24} sm={8} key={key}>
                    <div className="stat-card">
                      <Statistic title={names[key]} value={value.userCount} suffix="人" />
                      <Row gutter={8} style={{ marginTop: 8 }}>
                        <Col span={8}>
                          <div style={{ fontSize: 12, color: '#8c8c8c' }}>待执行</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: '#faad14' }}>{value.pendingTasks}</div>
                        </Col>
                        <Col span={8}>
                          <div style={{ fontSize: 12, color: '#8c8c8c' }}>进行中</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: '#1890ff' }}>{value.inProgressTasks}</div>
                        </Col>
                        <Col span={8}>
                          <div style={{ fontSize: 12, color: '#8c8c8c' }}>已完成</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: '#52c41a' }}>{value.completedTasks}</div>
                        </Col>
                      </Row>
                    </div>
                  </Col>
                );
              })}
            </Row>
            <ReactECharts option={getShiftChart()} style={{ height: 300 }} />
          </Card>
        </TabPane>

        <TabPane tab={<span><TeamOutlined /> 人员绩效</span>} key="performance">
          <Card loading={loading}>
            <Table
              columns={performanceColumns}
              dataSource={performance}
              rowKey="userId"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><WarningOutlined /> 帮扶进度分析</span>} key="help">
          <Card loading={loading} title="帮扶进度详情">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <div className="stat-card">
                  <Statistic title="总事件数" value={helpProgress?.summary.totalEvents || 0} />
                </div>
              </Col>
              <Col span={12}>
                <div className="stat-card">
                  <Statistic title="已完成+已关闭" value={(helpProgress?.summary.completedEvents || 0) + (helpProgress?.summary.closedEvents || 0)} />
                </div>
              </Col>
            </Row>

            <Card title="影响分析" size="small" style={{ marginTop: 16 }}>
              <p><strong>投票异常影响:</strong> {helpProgress?.impactAnalysis.votingExceptionImpact}</p>
              <p><strong>建议:</strong> {helpProgress?.impactAnalysis.recommendation}</p>
            </Card>

            <Card title="投票资格异常统计" size="small" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="异常总数" value={helpProgress?.summary.votingExceptions || 0} />
                </Col>
                <Col span={8}>
                  <Statistic title="未处理" value={helpProgress?.summary.unresolvedVotingExceptions || 0} valueStyle={{ color: '#ff4d4f' }} />
                </Col>
                <Col span={8}>
                  <Statistic title="影响扣分" value={(helpProgress?.summary.unresolvedVotingExceptions || 0) * 10} suffix="分" />
                </Col>
              </Row>
            </Card>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ReportPage;
