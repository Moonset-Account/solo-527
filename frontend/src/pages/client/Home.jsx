import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Statistic, Alert } from 'antd';
import { TeamOutlined, CalendarOutlined, ClockCircleOutlined, SafetyOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { counselorApi } from '../../api';

function Home() {
  const navigate = useNavigate();
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCounselors();
  }, []);

  const loadCounselors = async () => {
    setLoading(true);
    try {
      const data = await counselorApi.getPublicList();
      setCounselors(data.slice(0, 6));
    } catch (error) {
      console.error('加载咨询师失败', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <TeamOutlined style={{ fontSize: 40, color: '#1890ff' }} />, title: '专业咨询师', desc: '多位持证专业咨询师为您服务' },
    { icon: <CalendarOutlined style={{ fontSize: 40, color: '#52c41a' }} />, title: '便捷预约', desc: '在线预约，灵活安排咨询时间' },
    { icon: <ClockCircleOutlined style={{ fontSize: 40, color: '#faad14' }} />, title: '候补队列', desc: '满员自动候补，空位及时通知' },
    { icon: <SafetyOutlined style={{ fontSize: 40, color: '#722ed1' }} />, title: '隐私保护', desc: '严格保密您的个人信息和咨询内容' },
  ];

  const stats = [
    { label: '专业咨询师', value: counselors.length || 20, suffix: '位' },
    { label: '累计服务', value: '1,000+', suffix: '次' },
    { label: '好评率', value: '98', suffix: '%' },
  ];

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 12,
        padding: '60px 40px',
        marginBottom: 40,
        color: '#fff',
      }}>
        <Row align="middle">
          <Col span={14}>
            <h1 style={{ color: '#fff', fontSize: 36, marginBottom: 16 }}>
              专业心理咨询，守护您的心灵健康
            </h1>
            <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 32 }}>
              多位资深心理咨询师，为您提供专业、保密、温暖的心理支持
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              <Button type="primary" size="large" onClick={() => navigate('/counselors')}>
                立即预约咨询
              </Button>
              <Button size="large" ghost onClick={() => navigate('/counselors')}>
                了解更多
              </Button>
            </div>
          </Col>
          <Col span={10}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24 }}>
              {stats.map((stat, index) => (
                <div key={index} style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  padding: '20px 24px',
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                }}>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>
                    {stat.value}
                    <span style={{ fontSize: 14 }}>{stat.suffix}</span>
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.8 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </div>

      <Alert
        message="隐私保护声明"
        description="我们严格遵守心理咨询伦理准则，您的所有个人信息和咨询内容都将严格保密。所有咨询师均签署保密协议，系统采用加密技术保护您的数据安全。"
        type="info"
        showIcon
        style={{ marginBottom: 40 }}
      />

      <div className="card">
        <div className="flex-between mb-16">
          <h2 className="section-title" style={{ margin: 0 }}>我们的服务</h2>
        </div>
        <Row gutter={24}>
          {features.map((feature, index) => (
            <Col span={6} key={index}>
              <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                {feature.icon}
                <h3 style={{ margin: '16px 0 8px', fontSize: 18 }}>{feature.title}</h3>
                <p style={{ color: '#999', fontSize: 14 }}>{feature.desc}</p>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      <div className="card">
        <div className="flex-between mb-24">
          <h2 className="section-title" style={{ margin: 0 }}>推荐咨询师</h2>
          <Button type="link" onClick={() => navigate('/counselors')}>
            查看全部 <ArrowRightOutlined />
          </Button>
        </div>
        <Row gutter={16}>
          {counselors.map((counselor) => (
            <Col span={8} key={counselor.id}>
              <Card
                hoverable
                onClick={() => navigate(`/counselors/${counselor.id}`)}
                bodyStyle={{ padding: 20 }}
              >
                <div className="flex" style={{ gap: 16, alignItems: 'center', marginBottom: 12 }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: '#1890ff',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 600,
                  }}>
                    {counselor.name?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{counselor.name}</div>
                    <div style={{ color: '#faad14', fontSize: 12 }}>
                      ⭐ {counselor.rating} 分 · {counselor.reviewCount} 评价
                    </div>
                  </div>
                </div>
                <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>
                  {counselor.specialties?.slice(0, 3).join('、')}
                </div>
                <div className="flex-between">
                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                    ¥{counselor.hourlyRate}/小时
                  </span>
                  <span style={{ color: '#999', fontSize: 12 }}>
                    {counselor.experienceYears}年经验
                  </span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}

export default Home;
