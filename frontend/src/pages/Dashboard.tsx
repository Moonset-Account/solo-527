import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space, Button } from 'antd';
import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { alertApi, vulnerabilityApi, assetApi } from '../api';
import type { Alert, Vulnerability, Asset } from '../types';
import { AlertStatus, AlertPriority } from '../types';
import { alertStatusText, alertStatusColor, alertPriorityText, alertPriorityColor, formatDate } from '../utils';
import { useAuthStore } from '../store';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    resolved: 0,
    overdue: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [overdueVulns, setOverdueVulns] = useState<Vulnerability[]>([]);
  const [syncAssets, setSyncAssets] = useState<Asset[]>([]);

  useEffect(() => {
    loadStats();
    loadRecentAlerts();
    loadOverdueVulns();
    loadSyncAssets();
  }, []);

  const loadStats = async () => {
    try {
      const [pendingRes, processingRes, resolvedRes] = await Promise.all([
        alertApi.getCount(AlertStatus.Pending),
        alertApi.getCount(AlertStatus.Processing),
        alertApi.getCount(AlertStatus.Resolved),
      ]);
      setStats({
        pending: pendingRes.data || 0,
        processing: processingRes.data || 0,
        resolved: resolvedRes.data || 0,
        overdue: 0,
      });
    } catch {
      // ignore
    }
  };

  const loadRecentAlerts = async () => {
    try {
      const res = await alertApi.getList({ page: 1, pageSize: 5 });
      if (res.success) {
        setRecentAlerts(res.data?.items || []);
      }
    } catch {
      // ignore
    }
  };

  const loadOverdueVulns = async () => {
    try {
      const res = await vulnerabilityApi.getList({ page: 1, pageSize: 5, isOverdue: true });
      if (res.success) {
        setOverdueVulns(res.data?.items || []);
      }
    } catch {
      // ignore
    }
  };

  const loadSyncAssets = async () => {
    try {
      const res = await assetApi.getList({ page: 1, pageSize: 5, syncRequired: true });
      if (res.success) {
        setSyncAssets(res.data?.items || []);
      }
    } catch {
      // ignore
    }
  };

  const alertColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Alert) => (
        <a onClick={() => navigate(`/alerts/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p: AlertPriority) => (
        <Tag color={alertPriorityColor[p]}>{alertPriorityText[p]}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: AlertStatus) => (
        <Tag color={alertStatusColor[s]}>{alertStatusText[s]}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (t: string) => formatDate(t),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理告警"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="处理中告警"
              value={stats.processing}
              prefix={<AlertOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已解决告警"
              value={stats.resolved}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="超期漏洞"
              value={overdueVulns.length}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card
            title="最新告警"
            extra={
              <Button type="link" onClick={() => navigate('/alerts')}>
                查看全部
              </Button>
            }
          >
            <Table
              dataSource={recentAlerts}
              columns={alertColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="需要关注"
            extra={
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/alerts/create')}>
                  新建告警
                </Button>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {syncAssets.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0' }}>
                    <ExclamationCircleOutlined style={{ color: '#faad14' }} /> 待同步资产 ({syncAssets.length})
                  </h4>
                  <div style={{ paddingLeft: 20 }}>
                    {syncAssets.slice(0, 3).map((asset) => (
                      <div key={asset.id} style={{ padding: '4px 0' }}>
                        <a onClick={() => navigate(`/assets/${asset.id}`)}>
                          {asset.name} ({asset.assetCode})
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {overdueVulns.length > 0 && (
                <div>
                  <h4 style={{ margin: '8px 0' }}>
                    <WarningOutlined style={{ color: '#ff4d4f' }} /> 超期漏洞 ({overdueVulns.length})
                  </h4>
                  <div style={{ paddingLeft: 20 }}>
                    {overdueVulns.slice(0, 3).map((v) => (
                      <div key={v.id} style={{ padding: '4px 0' }}>
                        <a onClick={() => navigate(`/vulnerabilities/${v.id}`)}>
                          {v.name} ({v.cveId})
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {syncAssets.length === 0 && overdueVulns.length === 0 && (
                <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                  暂无需要关注的事项
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
