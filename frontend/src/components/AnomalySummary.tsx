import React, { useEffect, useState } from 'react';
import { Alert, Tag, Statistic, Row, Col, Spin } from 'antd';
import { WarningOutlined, CheckCircleOutlined, FireOutlined, UserOutlined, LineChartOutlined, StarOutlined } from '@ant-design/icons';
import { useFilterStore } from '@/store/useFilterStore';
import { apiService } from '@/services/api';
import { AnomalySummary as AnomalySummaryType } from '@/types';

const AnomalySummary: React.FC = () => {
  const { filters } = useFilterStore();
  const [data, setData] = useState<AnomalySummaryType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await apiService.getAnomalySummary(filters);
      setData(result);
    } catch (error) {
      console.error('加载异常摘要失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#faad14';
      case 'low': return '#1890ff';
      default: return '#8c8c8c';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <FireOutlined style={{ color: '#ff4d4f' }} />;
      case 'medium': return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'low': return <CheckCircleOutlined style={{ color: '#1890ff' }} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="card-section" style={{ textAlign: 'center', padding: '40px' }}>
        <Spin />
      </div>
    );
  }

  return (
    <div className="card-section">
      <div className="card-header">
        <div className="card-title">
          <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
          异常摘要
          {data?.warnings?.length > 0 && (
            <span className="warning-badge">{data.warnings.length} 条提示</span>
          )}
        </div>
      </div>

      {data?.warnings?.map((warning, idx) => (
        <div key={idx} className="sample-warning">
          ⚠️ {warning}
        </div>
      ))}

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Statistic
            title="活跃会员数"
            value={data?.summary_stats?.active_members || 0}
            prefix={<UserOutlined />}
            valueStyle={{ fontSize: 20 }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="30天签到量"
            value={data?.summary_stats?.checkins_30d || 0}
            prefix={<LineChartOutlined />}
            valueStyle={{ fontSize: 20 }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="月流失率"
            value={data?.summary_stats?.churn_rate || 0}
            precision={1}
            suffix="%"
            valueStyle={{ 
              fontSize: 20, 
              color: (data?.summary_stats?.churn_rate || 0) > 0.2 ? '#ff4d4f' : '#52c41a' 
            }}
            formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="平均评分"
            value={data?.summary_stats?.avg_rating || 0}
            precision={1}
            prefix={<StarOutlined />}
            valueStyle={{ fontSize: 20 }}
          />
        </Col>
      </Row>

      {data?.anomalies?.length === 0 ? (
        <Alert
          message="数据正常"
          description="当前未检测到异常指标，所有数据均在正常范围内。"
          type="success"
          showIcon
        />
      ) : (
        data?.anomalies?.map((anomaly, idx) => (
          <div 
            key={idx} 
            className={`anomaly-item anomaly-${anomaly.severity}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {getSeverityIcon(anomaly.severity)}
              <Tag color={getSeverityColor(anomaly.severity)}>
                {anomaly.severity === 'high' ? '严重' : anomaly.severity === 'medium' ? '中等' : '轻微'}
              </Tag>
              <span style={{ fontWeight: 500 }}>{anomaly.message}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AnomalySummary;
