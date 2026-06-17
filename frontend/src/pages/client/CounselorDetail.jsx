import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Tag, Descriptions, Alert, Spin } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, SafetyOutlined } from '@ant-design/icons';
import { counselorApi, servicesApi } from '../../api';

function CounselorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [counselor, setCounselor] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCounselor();
    loadServices();
  }, [id]);

  const loadCounselor = async () => {
    setLoading(true);
    try {
      const data = await counselorApi.getDetail(id);
      setCounselor(data);
    } catch (error) {
      console.error('加载咨询师详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const data = await servicesApi.getByCounselor(id);
      setServices(data);
    } catch (error) {
      console.error('加载服务项目失败', error);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!counselor) {
    return <div className="card">咨询师不存在</div>;
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/counselors')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <div className="card">
        <Row gutter={24}>
          <Col span={6}>
            <div style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 80,
              fontWeight: 600,
            }}>
              {counselor.name?.charAt(0)}
            </div>
          </Col>
          <Col span={18}>
            <div style={{ marginBottom: 16 }}>
              <h1 style={{ fontSize: 28, marginBottom: 8 }}>{counselor.name}</h1>
              <div style={{ color: '#999', marginBottom: 16 }}>
                ⭐ {counselor.rating} 分 · {counselor.reviewCount} 条评价 · 从业{counselor.experienceYears}年
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {counselor.specialties?.map(s => (
                  <Tag color="blue" key={s}>{s}</Tag>
                ))}
              </div>
              <div style={{ color: '#ff4d4f', fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
                ¥{counselor.hourlyRate}
                <span style={{ fontSize: 14, fontWeight: 400, color: '#999' }}>/小时</span>
              </div>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate(`/appointment/new?counselorId=${id}`)}
              >
                立即预约
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      <Alert
        message="隐私保护提醒"
        description="您的所有个人信息和咨询内容都将严格保密，咨询师将遵守专业伦理规范，保护您的隐私安全。"
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        style={{ marginBottom: 24 }}
      />

      <div className="card">
        <h2 className="section-title">个人简介</h2>
        <p style={{ color: '#666', lineHeight: 1.8 }}>{counselor.introduction || '暂无介绍'}</p>
      </div>

      <div className="card">
        <h2 className="section-title">资质证书</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {counselor.certifications?.length > 0 ? (
            counselor.certifications.map((cert, index) => (
              <Tag color="green" key={index}>{cert}</Tag>
            ))
          ) : (
            <span style={{ color: '#999' }}>暂无资质信息</span>
          )}
        </div>
      </div>

      {services.length > 0 && (
        <div className="card">
          <h2 className="section-title">服务项目</h2>
          <Row gutter={[16, 16]}>
            {services.map(service => (
              <Col span={12} key={service.id}>
                <Card size="small">
                  <div className="flex-between mb-8">
                    <span style={{ fontWeight: 600 }}>{service.name}</span>
                    <span style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{service.price}</span>
                  </div>
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>
                    时长：{service.duration}分钟
                  </div>
                  <div style={{ color: '#666', fontSize: 13 }}>{service.description}</div>
                  <Button
                    type="primary"
                    size="small"
                    block
                    style={{ marginTop: 12 }}
                    onClick={() => navigate(`/appointment/new?counselorId=${id}&serviceId=${service.id}`)}
                  >
                    预约此服务
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
}

export default CounselorDetail;
