import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import {
  Card,
  Button,
  Avatar,
  Descriptions,
  Progress,
  Tag,
  Space,
  Empty,
  List,
  Row,
  Col,
  Spin,
  Breadcrumb,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons';
import { membersApi, MemberDetail } from '../services/api';
import {
  memberStatusMap,
  conversionSourceMap,
  campStatusMap,
  formatDate,
  formatNumber,
} from '../lib/constants';

const MemberDetailPage: React.FC = () => {
  const params = useParams({ from: '/members/$memberId' });
  const memberId = params.memberId!;
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['members', memberId],
    queryFn: () => membersApi.get(memberId),
  });

  const detail: MemberDetail | undefined = data as any;

  if (isLoading) {
    return (
      <div style={{ padding: 100, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div style={{ padding: 60 }}>
        <Empty description="会员不存在" />
        <Button onClick={() => navigate({ to: '/members' } as any)}>返回列表</Button>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <a onClick={() => navigate({ to: '/members' } as any)}>会员管理</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{detail.memberNo}</Breadcrumb.Item>
      </Breadcrumb>

      <Button
        icon={<ArrowLeftOutlined />}
        style={{ marginBottom: 16 }}
        onClick={() => navigate({ to: '/members' } as any)}
      >
        返回会员列表
      </Button>

      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 24,
          }}
        >
          <Avatar style={{ backgroundColor: '#9254DE', width: 72, height: 72, fontSize: 30 }}>
            {detail.user?.name?.slice(0, 1)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Space style={{ marginBottom: 8 }} wrap>
              <h2 style={{ margin: 0 }}>{detail.user?.name}</h2>
              {detail.isFallingBehind && (
                <Tag color="red" className="falling-behind-tag">
                  <WarningOutlined /> 学习掉队
                </Tag>
              )}
              <Tag color={(memberStatusMap[detail.status] || {}).color as any}>
                {(memberStatusMap[detail.status] || {}).label}
              </Tag>
              <Tag color={(conversionSourceMap[detail.conversionSource] || {}).color as any}>
                {(conversionSourceMap[detail.conversionSource] || {}).label}
              </Tag>
            </Space>
            <div style={{ color: '#666' }}>
              {detail.user?.email} · {detail.user?.phone || '无手机'}
            </div>
            <div style={{ color: '#999', marginTop: 4 }}>
              会员号：{detail.memberNo} · 销售：{detail.salesPerson || '—'}
            </div>
          </div>
          <Space>
            <Button icon={<EditOutlined />}>编辑资料</Button>
            <Button type="primary" icon={<SyncOutlined />} onClick={() => { membersApi.refreshProgress(memberId); refetch(); }}>
              刷新进度
            </Button>
          </Space>
        </div>

        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Card size="small" title="基本信息">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="所属营期">
                  <a
                    onClick={() =>
                      navigate({ to: `/camps/${detail.camp?.id}` } as any)
                    }
                  >
                    {detail.camp?.name}
                  </a>
                </Descriptions.Item>
                <Descriptions.Item label="营期状态">
                  <Tag
                    color={(campStatusMap[detail.camp?.status || ''] || {}).color as any}
                  >
                    {(campStatusMap[detail.camp?.status || ''] || {}).label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="营期时间">
                  {formatDate(detail.camp?.startDate)} ~{' '}
                  {formatDate(detail.camp?.endDate)}
                </Descriptions.Item>
                <Descriptions.Item label="入营时间">
                  {formatDate(detail.joinDate)}
                </Descriptions.Item>
                <Descriptions.Item label="过期时间">
                  {detail.expiryDate ? formatDate(detail.expiryDate) : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="最后活跃">
                  {detail.lastActiveAt ? formatDate(detail.lastActiveAt) : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="来源详情">
                  {detail.conversionSourceDetail || '—'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card size="small" title="学习进度">
              <Progress
                percent={parseFloat(detail.progress)}
                size="large"
                status={detail.isFallingBehind ? 'exception' : undefined}
                format={() =>
                  `已完成 ${detail.completedChapters}/${detail.totalChapters} 章 (${formatNumber(detail.progress)}%)`
                }
              />
              <div style={{ marginTop: 16 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="总章节数">{detail.totalChapters}</Descriptions.Item>
                  <Descriptions.Item label="已完成">{detail.completedChapters}</Descriptions.Item>
                  <Descriptions.Item label="未完成">
                    {Math.max(0, detail.totalChapters - detail.completedChapters)}
                  </Descriptions.Item>
                  <Descriptions.Item label="掉队风险">
                    {detail.isFallingBehind ? (
                      <Tag color="red">是，落后超过20%</Tag>
                    ) : (
                      <Tag color="green">正常</Tag>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card title="章节学习明细">
        {detail.progress && detail.progress.length > 0 ? (
          <List
            dataSource={detail.progress}
            renderItem={(p: any) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: p.isCompleted ? '#F6FFED' : '#F5F5F5',
                        color: p.isCompleted ? '#52C41A' : '#888',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                      }}
                    >
                      {detail.progress!.indexOf(p) + 1}
                    </div>
                  }
                  title={p.chapterTitle || `章节 ${detail.progress!.indexOf(p) + 1}`}
                  description={
                    <Space>
                      {p.isCompleted ? (
                        <Tag color="green">已完成 · {formatDate(p.completedAt, 'MM-DD HH:mm')}</Tag>
                      ) : (
                        <Tag color="default">未完成</Tag>
                      )}
                      <span style={{ color: '#999' }}>
                        观看时长：{Math.round(p.watchDuration / 60)} 分钟
                      </span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无学习记录" style={{ padding: 40 }} />
        )}
      </Card>
    </div>
  );
};

export default MemberDetailPage;
