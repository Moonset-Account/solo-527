import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Statistic, List, Tag, Avatar, Empty, Spin, Progress } from 'antd';
import {
  ScheduleOutlined,
  TeamOutlined,
  CheckSquareOutlined,
  DollarOutlined,
  WarningOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { statsApi, todosApi, campsApi, membersApi } from '../services/api';
import {
  campStatusMap,
  todoPriorityMap,
  todoTypeMap,
  todoStatusMap,
  formatDate,
  formatNumber,
} from '../lib/constants';
import ReactECharts from 'echarts-for-react';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: statsApi.overview,
  });

  const { data: todoStats } = useQuery({
    queryKey: ['todos', 'stats'],
    queryFn: () => todosApi.getStats(),
  });

  const { data: recentCamps } = useQuery({
    queryKey: ['camps', 'recent'],
    queryFn: () => campsApi.list({ pageSize: 3, page: 1 }),
  });

  const { data: fallBehind } = useQuery({
    queryKey: ['members', 'fall-behind'],
    queryFn: () => membersApi.getFallingBehind(),
  });

  const { data: todos } = useQuery({
    queryKey: ['todos', 'urgent'],
    queryFn: () => todosApi.list({ pageSize: 5, page: 1, status: 'pending' }),
  });

  const { data: completion } = useQuery({
    queryKey: ['stats', 'completion'],
    queryFn: () => statsApi.completion(),
  });

  const completionChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: (completion || []).map((c: any) => c.campName).slice(0, 3) },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: (completion && completion[0]?.byDate) ? completion[0].byDate.map((d: any) => d.date.slice(5)) : [],
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' },
    },
    series: (completion || []).slice(0, 3).map((c: any, i: number) => ({
      name: c.campName,
      type: 'line',
      smooth: true,
      data: c.byDate ? c.byDate.map((d: any) => d.completionRate) : [],
      color: ['#722ED1', '#13C2C2', '#FA8C16'][i],
    })),
  };

  return (
    <Spin spinning={overviewLoading}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-label">营期总数</div>
                <div className="stat-value">{overview?.camps?.total || 0}</div>
                <div style={{ marginTop: 8, color: '#52c41a', fontSize: 13 }}>
                  进行中 {overview?.camps?.ongoing || 0} 个
                </div>
              </div>
              <div className="stat-icon" style={{ background: '#F9F0FF', color: '#722ED1' }}>
                <ScheduleOutlined />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-label">会员总数</div>
                <div className="stat-value">{overview?.members?.total || 0}</div>
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  <span style={{ color: '#52c41a' }}>活跃 {overview?.members?.active || 0}</span>
                  <span style={{ color: '#999', marginLeft: 12 }}>|</span>
                  <span style={{ color: '#ff4d4f', marginLeft: 12 }}>
                    掉队 {overview?.members?.fallingBehind || 0}
                  </span>
                </div>
              </div>
              <div className="stat-icon" style={{ background: '#E6FFFB', color: '#13C2C2' }}>
                <TeamOutlined />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-label">待办事项</div>
                <div className="stat-value">{todoStats?.pending || 0}</div>
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  <span style={{ color: '#ff4d4f' }}>
                    逾期 {todoStats?.overdue || 0}
                  </span>
                  <span style={{ color: '#999', marginLeft: 12 }}>|</span>
                  <span style={{ color: '#fa8c16', marginLeft: 12 }}>
                    掉队预警 {todoStats?.byType?.fallBehindWarning || 0}
                  </span>
                </div>
              </div>
              <div className="stat-icon" style={{ background: '#FFF7E6', color: '#FA8C16' }}>
                <SolutionOutlined />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-label">待处理</div>
                <div className="stat-value">
                  {(overview?.pending?.checkins || 0) +
                    (overview?.pending?.refunds || 0) +
                    (overview?.pending?.todos || 0)}
                </div>
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  <span>
                    <CheckSquareOutlined style={{ color: '#1890ff' }} /> 打卡 {overview?.pending?.checkins || 0}
                  </span>
                  <span style={{ marginLeft: 12 }}>
                    <DollarOutlined style={{ color: '#fa8c16' }} /> 退款 {overview?.pending?.refunds || 0}
                  </span>
                </div>
              </div>
              <div className="stat-icon" style={{ background: '#FFF1F0', color: '#FF4D4F' }}>
                <CheckSquareOutlined />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title="营期完课率趋势"
            extra={
              <a onClick={() => navigate({ to: '/stats' as any })}>查看详情 →</a>
            }
          >
            {completion && completion.length > 0 ? (
              <ReactECharts option={completionChartOption} style={{ height: 320 }} />
            ) : (
              <Empty description="暂无数据" style={{ padding: '60px 0' }} />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={<span><WarningOutlined style={{ color: '#ff4d4f' }} /> 学员掉队预警</span>}
            extra={
              <a onClick={() => navigate({ to: '/members', search: { isFallingBehind: 'true' } } as any)}>
                全部 →
              </a>
            }
          >
            {fallBehind && fallBehind.length > 0 ? (
              <List
                dataSource={fallBehind.slice(0, 5)}
                renderItem={(item: any) => (
                  <List.Item
                    onClick={() => navigate({ to: `/members/${item.id}` } as any)}
                    style={{ cursor: 'pointer' }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: '#ffccc7', color: '#cf1322' }}>
                          {item.userName?.slice(0, 1)}
                        </Avatar>
                      }
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{item.userName}</span>
                          <Tag color="red" className="falling-behind-tag">
                            掉队
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div>{item.campName}</div>
                          <Progress
                            percent={parseFloat(item.progress)}
                            size="small"
                            status="exception"
                            style={{ width: 200, marginTop: 4 }}
                          />
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无掉队学员 🎉" style={{ padding: '40px 0' }} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title="近期营期"
            extra={
              <a onClick={() => navigate({ to: '/camps' as any })}>全部营期 →</a>
            }
          >
            {recentCamps?.items && recentCamps.items.length > 0 ? (
              <List
                dataSource={recentCamps.items}
                renderItem={(camp: any) => {
                  const status = campStatusMap[camp.status] || {};
                  const percent =
                    camp.maxMembers > 0 ? (camp.currentMembers / camp.maxMembers) * 100 : 0;
                  return (
                    <List.Item
                      onClick={() => navigate({ to: `/camps/${camp.id}` } as any)}
                      style={{ cursor: 'pointer' }}
                    >
                      <List.Item.Meta
                        avatar={
                          <div
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: 8,
                              background: camp.coverImageUrl
                                ? `url(${camp.coverImageUrl}) center/cover`
                                : 'linear-gradient(135deg, #9254DE 0%, #722ED1 100%)',
                            }}
                          />
                        }
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span>{camp.name}</span>
                            <Tag color={status.color as any}>{status.label}</Tag>
                          </div>
                        }
                        description={
                          <div>
                            <div style={{ color: '#666' }}>
                              {formatDate(camp.startDate, 'MM-DD')} ~ {formatDate(camp.endDate, 'MM-DD')}
                              {' · '}售价 ¥{formatNumber(camp.price, 0)}
                            </div>
                            <div style={{ marginTop: 6 }}>
                              <Progress
                                percent={Math.round(percent)}
                                size="small"
                                format={() =>
                                  `${camp.currentMembers}/${camp.maxMembers} 人`
                                }
                                style={{ width: 240 }}
                              />
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            ) : (
              <Empty description="暂无营期" style={{ padding: '40px 0' }} />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="紧急待办"
            extra={
              <a onClick={() => navigate({ to: '/todos' as any })}>全部 →</a>
            }
          >
            {todos?.items && todos.items.length > 0 ? (
              <List
                dataSource={todos.items}
                renderItem={(item: any) => {
                  const priority = todoPriorityMap[item.priority] || {};
                  const type = todoTypeMap[item.type] || {};
                  return (
                    <List.Item
                      onClick={() => navigate({ to: '/todos' as any })}
                      style={{ cursor: 'pointer' }}
                    >
                      <List.Item.Meta
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 16 }}>{type.icon}</span>
                            <span style={{ fontWeight: 500 }}>{item.title}</span>
                            <Tag color={priority.color as any}>{priority.label}</Tag>
                          </div>
                        }
                        description={
                          <div style={{ color: '#999', fontSize: 13 }}>
                            {item.assigneeName && `处理人：${item.assigneeName} · `}
                            {item.dueDate && `截止：${formatDate(item.dueDate, 'MM-DD HH:mm')}`}
                          </div>
                        }
                      />
                      <Tag color={(todoStatusMap[item.status] || {}).color as any}>
                        {(todoStatusMap[item.status] || {}).label}
                      </Tag>
                    </List.Item>
                  );
                }}
              />
            ) : (
              <Empty description="暂无待办 🎉" style={{ padding: '40px 0' }} />
            )}
          </Card>
        </Col>
      </Row>
    </Spin>
  );
};

export default DashboardPage;
