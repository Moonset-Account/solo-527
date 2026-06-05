import { useQuery } from 'react-query';
import { Card, Row, Col, Statistic, Spin, List, Tag, Avatar, Button } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  StarOutlined,
  TrophyOutlined 
} from '@ant-design/icons';
import { dashboardApi, mentorsApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery(
    ['dashboard', user?.role],
    () => {
      if (user?.role === 'admin') return dashboardApi.getAdminStats();
      if (user?.role === 'mentor') return dashboardApi.getMentorStats();
      return dashboardApi.getStudentStats();
    },
    { enabled: !!user }
  );

  const { data: recommendations } = useQuery(
    ['recommendations'],
    () => mentorsApi.getRecommendations(5),
    { enabled: user?.role === 'student' }
  );

  if (isLoading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;

  const renderStats = () => {
    if (user?.role === 'admin') {
      const data = stats?.data as any;
      return (
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Card><Statistic title="总用户数" value={data?.overview?.total_users || 0} prefix={<UserOutlined />} /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card><Statistic title="导师数" value={data?.overview?.total_mentors || 0} prefix={<TeamOutlined />} /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card><Statistic title="预约总数" value={data?.overview?.total_appointments || 0} prefix={<CalendarOutlined />} /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card><Statistic title="平均评分" value={data?.overview?.average_rating || 0} prefix={<StarOutlined />} precision={1} /></Card>
          </Col>
        </Row>
      );
    }
    
    if (user?.role === 'mentor') {
      const data = stats?.data as any;
      return (
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Card><Statistic title="总咨询数" value={data?.stats?.total_meetings || 0} prefix={<TrophyOutlined />} /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card><Statistic title="平均评分" value={data?.stats?.average_rating || 0} prefix={<StarOutlined />} precision={1} /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card><Statistic title="待确认" value={data?.stats?.upcoming_appointments || 0} prefix={<CalendarOutlined />} /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card><Statistic title="已完成" value={data?.stats?.completed_appointments || 0} /></Card>
          </Col>
        </Row>
      );
    }

    const data = stats?.data as any;
    return (
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card><Statistic title="我的预约" value={data?.stats?.total_appointments || 0} prefix={<CalendarOutlined />} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card><Statistic title="待进行" value={data?.stats?.upcoming_appointments || 0} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card><Statistic title="已完成" value={data?.stats?.completed_appointments || 0} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card><Statistic title="已取消" value={data?.stats?.cancelled_appointments || 0} /></Card>
        </Col>
      </Row>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">欢迎回来，{user?.name}</h2>
        {renderStats()}
      </div>

      {user?.role === 'student' && recommendations?.data && recommendations.data.length > 0 && (
        <Card title="为你推荐的导师" extra={<a onClick={() => navigate('/mentors')}>查看全部</a>}>
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 5 }}
            dataSource={recommendations.data.slice(0, 5)}
            renderItem={(item: any) => (
              <List.Item>
                <Card 
                  hoverable 
                  onClick={() => navigate(`/mentors/${item.mentor.id}`)}
                  className="text-center h-full"
                >
                  <Avatar size={64} src={item.mentor.user.avatar_url}>
                    {item.mentor.user.name?.[0]}
                  </Avatar>
                  <div className="font-medium mt-3">{item.mentor.user.name}</div>
                  <div className="text-gray-500 text-sm">{item.mentor.current_position}</div>
                  <div className="text-gray-500 text-sm">{item.mentor.current_company}</div>
                  <Tag color="blue" className="mt-2">匹配度 {item.match_score}%</Tag>
                </Card>
              </List.Item>
            )}
          />
        </Card>
      )}

      {user?.role === 'admin' && (
        <Row gutter={[16, 16]}>
          <Col md={12}>
            <Card title="待审核">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>导师审核</span>
                  <Tag color="orange">{(stats?.data as any)?.pending?.mentors || 0}</Tag>
                </div>
                <div className="flex justify-between items-center">
                  <span>学生审核</span>
                  <Tag color="orange">{(stats?.data as any)?.pending?.students || 0}</Tag>
                </div>
                <Button type="primary" block onClick={() => navigate('/admin/review')}>
                  前往审核
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard;
