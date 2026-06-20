import { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Space, Input, Select, Tabs, Row, Col, Card, Statistic,
  Empty, Tooltip, App as AntdApp,
} from 'antd';
import {
  ReloadOutlined, ReadOutlined, MailOutlined, PhoneOutlined,
  MessageOutlined, CheckSquareOutlined, SendOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { notificationApi } from '../../../api';
import { useAppStore, formatDate } from '../../../store';
import { Notification, NotificationStatus, NotificationType } from '../../../types';
const { Option } = Select;

const typeIconMap: Record<string, { icon: string; color: string }> = {
  approval_request: { icon: '📝', color: '#1677ff' },
  approval_result: { icon: '✅', color: '#52c41a' },
  material_incomplete: { icon: '⚠️', color: '#fa8c16' },
  material_complete: { icon: '📋', color: '#52c41a' },
  contract_rejected: { icon: '❌', color: '#ff4d4f' },
  contract_approved: { icon: '🎉', color: '#52c41a' },
  conflict_created: { icon: '⚠️', color: '#ff4d4f' },
  conflict_resolved: { icon: '✅', color: '#52c41a' },
  archive_reminder: { icon: '📁', color: '#722ed1' },
  callback_failure: { icon: '⚠️', color: '#ff4d4f' },
  system: { icon: '🔔', color: '#1677ff' },
  custom: { icon: '📢', color: '#8c8c8c' },
};

const channelMap: Record<string, { label: string; icon: any }> = {
  in_app: { label: '站内', icon: <MessageOutlined /> },
  email: { label: '邮件', icon: <MailOutlined /> },
  sms: { label: '短信', icon: <PhoneOutlined /> },
  wechat: { label: '微信', icon: <MessageOutlined /> },
  dingtalk: { label: '钉钉', icon: <MessageOutlined /> },
};

export default function NotificationListPage() {
  const { message } = AntdApp.useApp();
  const { fetchUnread } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | undefined>();
  const [keyword, setKeyword] = useState('');
  const [stats, setStats] = useState<any>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'read' ? 'read' : activeTab === 'unread' ? undefined : undefined;
      const isUnreadOnly = activeTab === 'unread';
      const res: any = await notificationApi.my(page, pageSize, isUnreadOnly ? 'pending' : status === 'read' ? status : undefined, typeFilter);
      let list: Notification[] = res.list || [];
      if (keyword) {
        list = list.filter((n) =>
          n.title.includes(keyword) || (n.content || '').includes(keyword),
        );
      }
      if (isUnreadOnly) {
        list = list.filter((n) => n.status !== 'read');
      }
      if (status === 'read') {
        list = list.filter((n) => n.status === 'read');
      }
      setData(list);
      setTotal(res.total || 0);
      setUnread(res.unread || 0);
    } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const types: Record<string, number> = {};
      Object.keys(typeIconMap).forEach((t) => { types[t] = 0; });
      setStats({
        total,
        unread,
        byType: types,
      });
    } catch {}
  };

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [page, pageSize, activeTab, typeFilter]);

  const handleRead = async (n: Notification) => {
    try {
      await notificationApi.read(n.id);
      setData(data.map((x) => x.id === n.id ? { ...x, status: 'read' as any } : x));
      setUnread(Math.max(0, unread - 1));
      fetchUnread();
    } catch (e: any) { message.error(e.message); }
  };

  const handleReadAll = async () => {
    try {
      await notificationApi.readAll();
      setData(data.map((x) => ({ ...x, status: 'read' as any })));
      setUnread(0);
      fetchUnread();
      message.success('已全部标为已读');
    } catch (e: any) { message.error(e.message); }
  };

  const columns = [
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: string) => (
        <Tag color={v === 'read' ? 'default' : v === 'failed' ? 'red' : v === 'sent' ? 'blue' : 'processing'}>
          {v === 'read' ? '已读' : v === 'pending' ? '未读' : v === 'sent' ? '已发送' : v === 'sending' ? '发送中' : v === 'retrying' ? '重试中' : v === 'failed' ? '失败' : v}
        </Tag>
      ),
    },
    {
      title: '类型', dataIndex: 'type', width: 110,
      render: (v: string) => {
        const t = typeIconMap[v] || typeIconMap.system;
        return <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{t.icon}</span>
          <Tag color={t.color} style={{ margin: 0 }}>{v.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</Tag>
        </span>;
      },
    },
    {
      title: '渠道', dataIndex: 'channel', width: 90,
      render: (v: string) => {
        const c = channelMap[v] || channelMap.in_app;
        return <span><c.icon style={{ marginRight: 4 }} />{c.label}</span>;
      },
    },
    {
      title: '标题', dataIndex: 'title', width: 280,
      render: (v, r: Notification) => (
        <a onClick={() => handleRead(r)} style={{ fontWeight: r.status !== 'read' ? 600 : 400, color: '#1f1f1f' }}>
          {r.status !== 'read' && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ff4d4f', marginRight: 8 }} />}
          {v}
        </a>
      ),
    },
    {
      title: '内容', dataIndex: 'content', ellipsis: true,
      render: (v: string) => v || <span style={{ color: '#bfbfbf' }}>无详细内容</span>,
    },
    {
      title: '失败原因', dataIndex: 'failureReason', width: 200, ellipsis: true,
      render: (v: string) => v
        ? <Tooltip title={v}><span style={{ color: '#ff4d4f' }}>⚠️ {v}</span></Tooltip>
        : '-',
    },
    { title: '发送/读取', dataIndex: 'sentAt', width: 160, render: (_: any, r: Notification) => formatDate(r.readAt || r.sentAt || r.createdAt) },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, render: (v: string) => formatDate(v) },
    {
      title: '操作', width: 140, fixed: 'right' as const,
      render: (_, r: Notification) => (
        <Space size={4}>
          {r.status !== 'read' && (
            <Button size="small" type="link" icon={<ReadOutlined />} onClick={() => handleRead(r)}>标为已读</Button>
          )}
          {r.relatedData?.contractId && (
            <Button size="small" type="link">关联合同</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-title">
        <span>通知中心</span>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
          <Button icon={<CheckSquareOutlined />} onClick={handleReadAll} disabled={unread === 0}>全部标为已读</Button>
          <Button type="primary" icon={<SendOutlined />}>发送通知</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} className="stats-grid">
        <Col xs={12} md={6}><Card bordered={false} size="small" style={{ borderRadius: 10 }}>
          <Statistic title="全部消息" value={total || 0} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false} size="small" style={{ borderRadius: 10 }}>
          <Statistic title="未读消息" value={unread} valueStyle={{ color: unread > 0 ? '#ff4d4f' : undefined }} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false} size="small" style={{ borderRadius: 10 }}>
          <Statistic title="已读消息" value={(total || 0) - unread} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false} size="small" style={{ borderRadius: 10 }}>
          <Statistic title="已阅比例" value={total ? Math.round(((total - unread) / total) * 100) : 0} suffix="%" /></Card></Col>
      </Row>

      <div className="page-container">
        <Space style={{ marginBottom: 16, width: '100%' }} wrap>
          <Input allowClear placeholder="搜索标题/内容"
            style={{ width: 280 }} value={keyword} onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => fetchData()} prefix={<span style={{ color: '#bfbfbf' }}>🔍</span>}
          />
          <Select allowClear placeholder="通知类型" style={{ width: 180 }}
            value={typeFilter} onChange={(v) => setTypeFilter(v)}>
            {Object.entries(typeIconMap).map(([k, v]) => (
              <Option key={k} value={k}>{v.icon} {k.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</Option>
            ))}
          </Select>
        </Space>

        <Tabs
          activeKey={activeTab}
          onChange={(k) => { setActiveTab(k); setPage(1); }}
          items={[
            { key: 'all', label: `全部 (${total})` },
            { key: 'unread', label: `未读 (${unread})` },
            { key: 'read', label: '已读' },
            { key: 'failed', label: '发送失败' },
          ]}
        />

        {activeTab === 'failed' ? (
          <FailedNotificationList />
        ) : (
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={data}
            scroll={{ x: 1400 }}
            locale={{ emptyText: <Empty description={activeTab === 'unread' ? '暂无未读消息 🎉' : '暂无消息'} /> }}
            pagination={{
              current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            }}
          />
        )}
      </div>
    </div>
  );
}

function FailedNotificationList() {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <Empty description={
        <div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>发送失败的通知会在回调日志中记录</div>
          <Button type="primary" onClick={() => window.location.hash = '/callbacks'}>查看回调日志</Button>
        </div>
      } />
    </div>
  );
}
