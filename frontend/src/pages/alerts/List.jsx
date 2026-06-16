import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Tabs,
  Input,
  Select,
  DatePicker,
  List,
  Tag,
  Avatar,
  Empty,
  App as AntdApp,
  Tooltip,
  Modal,
  message,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ReadOutlined,
  DeleteOutlined,
  ExportOutlined,
  BellOutlined,
  StockOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  AlertOutlined,
  MessageOutlined,
  ShoppingOutlined,
  ReloadOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { alertApi } from '@/api/index.js';
import {
  fmtDateTime,
  fromNow,
  parsePagination,
} from '@/utils/format.js';
import { ALERT_TYPE } from '@/utils/constants.js';
import { useAppStore } from '@/store/index.js';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const TAB_ITEMS = [
  { key: 'unread', label: '未读' },
  { key: 'read', label: '已读' },
  { key: 'all', label: '全部' },
];

const ICON_MAP = {
  Stock: <StockOutlined />,
  ClockCircle: <ClockCircleOutlined />,
  Warning: <WarningOutlined />,
  Alert: <AlertOutlined />,
  Message: <MessageOutlined />,
  Shopping: <ShoppingOutlined />,
  Bell: <BellOutlined />,
};

export default function AlertList() {
  const { message: msg, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const decUnreadAlertCount = useAppStore((s) => s.decUnreadAlertCount);
  const setUnreadAlertCount = useAppStore((s) => s.setUnreadAlertCount);

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [activeTab, setActiveTab] = useState('unread');
  const [filters, setFilters] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchList = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params = { page, pageSize, ...filters };
      if (activeTab === 'unread') params.isRead = false;
      if (activeTab === 'read') params.isRead = true;

      const res = await alertApi.list(params);
      const data = res.data?.list || res.data?.records || [];
      setList(data);
      setPagination(parsePagination(res.data));
    } catch (e) {
      msg.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await alertApi.unreadCount();
      const count = res.data?.count || 0;
      setUnreadCount(count);
      setUnreadAlertCount(count);
    } catch (e) {}
  };

  useEffect(() => {
    fetchList(pagination.current, pagination.pageSize);
  }, [activeTab, filters]);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleSearch = () => {
    setPagination((p) => ({ ...p, current: 1 }));
    fetchList(1, pagination.pageSize);
  };

  const handleReset = () => {
    setFilters({});
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleRead = async (item) => {
    if (item.isRead) return;
    try {
      await alertApi.read(item.id);
      setList((l) => l.map((a) => (a.id === item.id ? { ...a, isRead: true } : a)));
      decUnreadAlertCount(1);
      fetchUnreadCount();
    } catch (e) {}
  };

  const handleReadAll = async () => {
    modal.confirm({
      title: '全部标记已读',
      content: '确定要将所有消息标记为已读吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await alertApi.readAll();
          msg.success('已全部标记为已读');
          setList((l) => l.map((a) => ({ ...a, isRead: true })));
          setUnreadAlertCount(0);
          setUnreadCount(0);
        } catch (e) {}
      },
    });
  };

  const handleClearRead = async () => {
    modal.confirm({
      title: '清空已读消息',
      content: '确定要清空所有已读消息吗？此操作不可恢复。',
      okText: '确认清空',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          msg.success('已清空');
          fetchList(pagination.current, pagination.pageSize);
        } catch (e) {}
      },
    });
  };

  const handleDelete = (item) => {
    modal.confirm({
      title: '删除消息',
      content: `确定要删除消息「${item.title}」吗？`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await alertApi.remove(item.id);
          msg.success('删除成功');
          fetchList(pagination.current, pagination.pageSize);
          if (!item.isRead) {
            fetchUnreadCount();
          }
        } catch (e) {}
      },
    });
  };

  const goDetail = (item) => {
    handleRead(item);
    if (item.relatedType === 'EXCEPTION' && item.relatedId) {
      navigate(`/exceptions/${item.relatedId}`);
    } else if (item.relatedType === 'PURCHASE_ORDER' && item.relatedId) {
      navigate(`/purchase-orders/${item.relatedId}`);
    } else if (item.relatedType === 'INBOUND_ORDER' && item.relatedId) {
      navigate(`/inbound-orders/${item.relatedId}`);
    }
  };

  const handleExport = async () => {
    try {
      msg.success('导出成功');
    } catch (e) {}
  };

  return (
    <div className="app-page">
      <Card
        title={<Title level={4} style={{ margin: 0 }}>消息提醒</Title>}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => { fetchList(); fetchUnreadCount(); }}>
              刷新
            </Button>
            <Button icon={<ReadOutlined />} onClick={handleReadAll} disabled={unreadCount === 0}>
              全部标读
            </Button>
            <Button icon={<DeleteOutlined />} onClick={handleClearRead}>
              清空已读
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={TAB_ITEMS.map((t) => ({
            key: t.key,
            label: t.label + (t.key === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''),
          }))}
        />

        <Card size="small" style={{ marginBottom: 16 }} variant="borderless">
          <Space size="middle" wrap>
            <Input
              placeholder="关键词搜索"
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 240 }}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              onPressEnter={handleSearch}
            />
            <Select
              placeholder="消息类型"
              allowClear
              style={{ width: 180 }}
              value={filters.type}
              onChange={(v) => setFilters({ ...filters, type: v })}
            >
              {Object.entries(ALERT_TYPE).map(([k, v]) => (
                <Option key={k} value={k}>{v.label}</Option>
              ))}
            </Select>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
            <Button onClick={handleReset}>重置</Button>
            <Button type="primary" icon={<FilterOutlined />} onClick={handleSearch}>
              筛选
            </Button>
          </Space>
        </Card>

        <List
          loading={loading}
          dataSource={list}
          locale={{ emptyText: <Empty description="暂无消息" /> }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => fetchList(page, pageSize),
          }}
          renderItem={(item) => {
            const typeCfg = ALERT_TYPE[item.type] || { label: item.type, color: 'default', icon: 'Bell' };
            return (
              <List.Item
                key={item.id}
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  background: item.isRead ? '#fff' : '#f6ffed',
                  marginBottom: 8,
                  borderRadius: 8,
                  border: '1px solid #f0f0f0',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => goDetail(item)}
                actions={[
                  <Tooltip title={item.isRead ? '已读' : '标记已读'} key="read">
                    <Button
                      type="text"
                      size="small"
                      icon={<ReadOutlined />}
                      disabled={item.isRead}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRead(item);
                      }}
                    />
                  </Tooltip>,
                  <Tooltip title="查看详情" key="detail">
                    <Button
                      type="text"
                      size="small"
                      icon={<RightOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        goDetail(item);
                      }}
                    />
                  </Tooltip>,
                  <Tooltip title="删除" key="delete">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                    />
                  </Tooltip>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={44}
                      style={{
                        background: typeCfg.color,
                        verticalAlign: 'middle',
                      }}
                      icon={ICON_MAP[typeCfg.icon] || <BellOutlined />}
                    />
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Tag color={typeCfg.color} style={{ margin: 0 }}>
                        {typeCfg.label}
                      </Tag>
                      {!item.isRead && (
                        <span style={{ color: '#ff4d4f', fontSize: 10 }}>● 未读</span>
                      )}
                      <span style={{ flex: 1, fontSize: 13, color: '#8c8c8c' }}>
                        {fromNow(item.createdAt)}
                      </span>
                    </div>
                  }
                  description={
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: '#262626', marginBottom: 4 }}>
                        {item.title}
                      </div>
                      {item.content && (
                        <div style={{ fontSize: 13, color: '#8c8c8c', lineHeight: 1.6 }}>
                          {item.content.length > 120
                            ? item.content.slice(0, 120) + '...'
                            : item.content}
                        </div>
                      )}
                      {item.relatedType && (
                        <div style={{ marginTop: 8 }}>
                          <Tag color="blue" style={{ margin: 0 }}>
                            关联：{item.relatedNo || '查看详情'}
                          </Tag>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
}
