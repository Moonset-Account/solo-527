import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Tag, Alert, Spin } from 'antd';
import { WarningOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { getAnomalies } from '../services/api';
import { useFilter } from '../context/FilterContext';
import dayjs from 'dayjs';

const AnomalyPanel = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { handleDrillDown } = useFilter();

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const res = await getAnomalies(dayjs().format('YYYY-MM-DD'));
      setAnomalies(res.data.data || []);
    } catch (error) {
      console.error('获取异常数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#faad14';
      default: return '#52c41a';
    }
  };

  const handleCardClick = (anomaly) => {
    if (anomaly.related_dimension && anomaly.related_id) {
      handleDrillDown(anomaly.related_dimension, anomaly.related_id);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Alert
        message="今天最异常的三件事"
        description="点击卡片可下钻查看详细数据"
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        style={{ marginBottom: 16 }}
      />
      <Row gutter={16}>
        {anomalies.length === 0 ? (
          <Col span={24}>
            <Card>
              <p style={{ textAlign: 'center', color: '#8c8c8c' }}>暂无异常数据</p>
            </Card>
          </Col>
        ) : (
          anomalies.map((item, index) => (
            <Col xs={24} md={8} key={item.id}>
              <Card
                className={`anomaly-card severity-${item.severity}`}
                onClick={() => handleCardClick(item)}
                hoverable
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Tag color={getSeverityColor(item.severity)} style={{ marginBottom: 8 }}>
                      #{index + 1} {item.severity === 'high' ? '高危' : '中等'}异常
                    </Tag>
                    <h4 style={{ margin: '0 0 8px 0' }}>{item.title}</h4>
                    <p style={{ fontSize: 13, color: '#595959', margin: 0 }}>{item.description}</p>
                  </div>
                </div>
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={12}>
                    <Statistic
                      title="当前值"
                      value={item.metric_value}
                      precision={1}
                      suffix="%"
                      valueStyle={{ fontSize: 18, color: getSeverityColor(item.severity) }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="变化率"
                      value={Math.abs(item.change_percent)}
                      precision={1}
                      suffix="%"
                      prefix={item.change_percent > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                      valueStyle={{ 
                        fontSize: 18, 
                        color: item.change_percent > 0 ? '#ff4d4f' : '#52c41a' 
                      }}
                    />
                  </Col>
                </Row>
                <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                  样本量: {item.sample_size} | 基期: 过去30天均值 {item.baseline_value.toFixed(1)}%
                </div>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </div>
  );
};

export default AnomalyPanel;
