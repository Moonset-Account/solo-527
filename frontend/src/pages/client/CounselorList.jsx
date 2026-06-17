import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Input, Select, Button, Spin, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { counselorApi } from '../../api';

const { Search } = Input;
const { Option } = Select;

function CounselorList() {
  const navigate = useNavigate();
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [specialty, setSpecialty] = useState('');

  const specialties = ['情绪管理', '人际关系', '职业发展', '婚姻家庭', '青少年心理', '焦虑抑郁'];

  useEffect(() => {
    loadCounselors();
  }, [specialty]);

  const loadCounselors = async () => {
    setLoading(true);
    try {
      const data = await counselorApi.getPublicList();
      let filtered = data;
      if (keyword) {
        filtered = filtered.filter(c =>
          c.name.includes(keyword) ||
          c.specialties?.some(s => s.includes(keyword))
        );
      }
      if (specialty) {
        filtered = filtered.filter(c => c.specialties?.includes(specialty));
      }
      setCounselors(filtered);
    } catch (error) {
      console.error('加载咨询师失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setKeyword(value);
    loadCounselors();
  };

  return (
    <div>
      <div className="card">
        <h2 className="section-title">选择咨询师</h2>
        <div className="flex gap-16 mb-24">
          <Search
            placeholder="搜索咨询师姓名或专长"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            style={{ width: 400 }}
          />
          <Select
            placeholder="按专长筛选"
            allowClear
            size="large"
            style={{ width: 200 }}
            onChange={(value) => setSpecialty(value)}
            value={specialty || undefined}
          >
            {specialties.map(s => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>
          <Button size="large" onClick={loadCounselors}>重置</Button>
        </div>

        <Spin spinning={loading}>
          {counselors.length > 0 ? (
            <Row gutter={[16, 16]}>
              {counselors.map((counselor) => (
                <Col span={8} key={counselor.id}>
                  <Card
                    hoverable
                    onClick={() => navigate(`/counselors/${counselor.id}`)}
                    bodyStyle={{ padding: 20 }}
                  >
                    <div className="flex" style={{ gap: 16, alignItems: 'center', marginBottom: 12 }}>
                      <div style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        fontWeight: 600,
                      }}>
                        {counselor.name?.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{counselor.name}</div>
                        <div style={{ color: '#faad14', fontSize: 12 }}>
                          ⭐ {counselor.rating} 分 · {counselor.reviewCount} 评价 · {counselor.appointmentCount} 次服务
                        </div>
                      </div>
                    </div>
                    <div style={{
                      background: '#f5f7fa',
                      borderRadius: 4,
                      padding: '8px 12px',
                      marginBottom: 12,
                      minHeight: 60,
                    }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>擅长领域</div>
                      <div style={{ color: '#666', fontSize: 13, lineHeight: 1.5 }}>
                        {counselor.specialties?.slice(0, 4).join('、')}
                      </div>
                    </div>
                    <div className="flex-between">
                      <div>
                        <span style={{ color: '#999', fontSize: 12 }}>咨询费用</span>
                        <div style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 700 }}>
                          ¥{counselor.hourlyRate}
                          <span style={{ fontSize: 12, fontWeight: 400 }}>/小时</span>
                        </div>
                      </div>
                      <Button type="primary" size="small" onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/appointment/new?counselorId=${counselor.id}`);
                      }}>
                        立即预约
                      </Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty description="暂无符合条件的咨询师" />
          )}
        </Spin>
      </div>
    </div>
  );
}

export default CounselorList;
