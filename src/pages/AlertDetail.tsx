import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Space,
  Button,
  Row,
  Col,
  Timeline,
  Tag,
  message,
  Divider,
  Typography,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { alertsApi } from '@/api';
import type { DeviceAlert, AlertStatus } from '../../shared/types';
import { ALERT_STATUS_LABELS } from '../../shared/types';
import { StatusTag } from '@/components/StatusTag';
import { DurationText } from '@/components/DurationText';
import { useUserStore } from '@/store/user';

const { Title, Text, Paragraph } = Typography;

const AlertDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.currentUser);

  const [alert, setAlert] = useState<DeviceAlert | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadDetail();
    }
  }, [id]);

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await alertsApi.getDetail(id);
      setAlert(data);
    } catch (error) {
      message.error('加载详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (targetStatus: AlertStatus, remark: string) => {
    if (!id || !currentUser) return;

    try {
      await alertsApi.updateStatus(id, targetStatus, remark, currentUser.id);
      message.success('状态更新成功');
      loadDetail();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const getNextStatusOptions = (currentStatus: AlertStatus) => {
    const options: { status: AlertStatus; label: string; icon: React.ReactNode; type: string }[] = [];
    
    if (currentStatus === 'PENDING') {
      options.push({
        status: 'PROCESSING',
        label: '接单处理',
        icon: <PlayCircleOutlined />,
        type: 'primary',
      });
    }
    if (currentStatus === 'PROCESSING') {
      options.push({
        status: 'COMPLETED',
        label: '处理完成',
        icon: <CheckCircleOutlined />,
        type: 'primary',
      });
      options.push({
        status: 'ABNORMAL_CLOSED',
        label: '异常关闭',
        icon: <CloseCircleOutlined />,
        type: 'default',
      });
    }
    if (currentStatus === 'COMPLETED' || currentStatus === 'ABNORMAL_CLOSED') {
      options.push({
        status: 'PENDING',
        label: '重新打开',
        icon: <ReloadOutlined />,
        type: 'default',
      });
    }
    return options;
  };

  if (!alert && !loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Empty description="告警不存在" />
        <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate('/alerts')}>
          返回列表
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/alerts')}>
          返回列表
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card loading={loading} title="告警详情">
            <div style={{ marginBottom: 24 }}>
              <Space size={8} style={{ marginBottom: 12 }}>
                {alert && <StatusTag type="alertLevel" value={alert.alertLevel} />}
                {alert && <StatusTag type="alertStatus" value={alert.status} />}
              </Space>
              <Title level={4} style={{ margin: '0 0 8px 0' }}>
                {alert?.title}
              </Title>
              <Text type="secondary">{alert?.alertType}</Text>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="设备名称">{alert?.deviceName}</Descriptions.Item>
              <Descriptions.Item label="设备ID">{alert?.deviceId}</Descriptions.Item>
              <Descriptions.Item label="告警描述">
                <Paragraph>{alert?.description}</Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="处理人">
                {alert?.handlerName || <Tag color="default">未分配</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="响应时长">
                <DurationText seconds={alert?.responseDurationSeconds} />
              </Descriptions.Item>
              <Descriptions.Item label="告警时间">
                {alert ? dayjs(alert.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {alert ? dayjs(alert.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div>
              <Text strong style={{ marginBottom: 12, display: 'block' }}>
                状态操作
              </Text>
              <Space wrap>
                {alert &&
                  getNextStatusOptions(alert.status).map((option) => (
                    <Button
                      key={option.status}
                      type={option.type as 'primary' | 'default'}
                      icon={option.icon}
                      onClick={() => handleStatusChange(option.status, '')}
                    >
                      {option.label}
                    </Button>
                  ))}
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            loading={loading}
            title={
              <Space>
                <ClockCircleOutlined />
                <span>处理记录</span>
              </Space>
            }
          >
            {alert?.processingLogs && alert.processingLogs.length > 0 ? (
              <Timeline
                mode="left"
                items={alert.processingLogs.map((log, index) => ({
                  color:
                    log.action === '处理完成'
                      ? 'green'
                      : log.action === '异常关闭'
                      ? 'purple'
                      : 'blue',
                  children: (
                    <div style={{ padding: '8px 0' }}>
                      <div style={{ marginBottom: 4 }}>
                        <Tag
                          color={
                            log.action === '处理完成'
                              ? 'green'
                              : log.action === '异常关闭'
                              ? 'purple'
                              : 'blue'
                          }
                        >
                          {log.action}
                        </Tag>
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                          {dayjs(log.timestamp).format('MM-DD HH:mm:ss')}
                        </Text>
                      </div>
                      <div style={{ fontSize: 14, color: '#262626', marginBottom: 4 }}>
                        {log.remark}
                      </div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        操作人: {log.operatorName}
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="暂无处理记录" style={{ padding: '40px 0' }} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AlertDetail;
