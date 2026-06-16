import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Button,
  Table,
  Space,
  Tag,
  Empty,
  App as AntdApp,
  Typography,
  Tabs,
  Timeline,
  Row,
  Col,
  Input,
  List,
  Avatar,
  Form,
  Select,
  Divider,
  Statistic,
} from 'antd';
import {
  ArrowLeftOutlined,
  ScanOutlined,
  CheckCircleOutlined,
  StopOutlined,
  MessageOutlined,
  SendOutlined,
  UserOutlined,
  FileTextOutlined,
  InboxOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  outboundApi,
  replyApi,
  exceptionApi,
} from '@/api/index.js';
import StatusTag from '@/components/StatusTag';
import {
  fmtNum,
  fmtDateTime,
  fmtDate,
  fmtMoney,
  fromNow,
} from '@/utils/format';
import {
  OUTBOUND_STATUS,
  OUTBOUND_TYPES,
  EXCEPTION_TYPE,
  EXCEPTION_STATUS,
} from '@/utils/constants';
import { useAppStore, useCanWrite } from '@/store';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const TIMELINE_STATUS_ORDER = [
  { key: 'CREATED', label: '创建', icon: '📝' },
  { key: 'PICKING', label: '拣货', icon: '📦' },
  { key: 'SHIPPED', label: '发货', icon: '🚚' },
  { key: 'COMPLETED', label: '完成', icon: '✅' },
];

const getTimelineStatus = (status) => {
  const statusMap = {
    PENDING: ['CREATED'],
    PICKING: ['CREATED', 'PICKING'],
    SHIPPED: ['CREATED', 'PICKING', 'SHIPPED'],
    COMPLETED: ['CREATED', 'PICKING', 'SHIPPED', 'COMPLETED'],
    CANCELLED: [],
  };
  return statusMap[status] || [];
};

export default function OutboundDetail() {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAppStore((s) => s.user);
  const canWrite = useCanWrite(user);

  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [exceptions, setExceptions] = useState([]);
  const [activeTab, setActiveTab] = useState('items');
  const replyEndRef = useRef(null);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await outboundApi.detail(id);
      setDetail(res.data);
    } catch (e) {
      message.error(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const res = await replyApi.list({ page: 1, pageSize: 100 });
      const list = res.data?.list || res.data?.records || [];
      setReplies(list.filter((r) => r.outboundOrderId === id));
    } catch (e) {}
  };

  const fetchExceptions = async () => {
    try {
      const res = await exceptionApi.list({ outboundOrderId: id, page: 1, pageSize: 100 });
      const list = res.data?.list || res.data?.records || [];
      setExceptions(list);
    } catch (e) {}
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
      fetchReplies();
      fetchExceptions();
    }
  }, [id]);

  useEffect(() => {
    if (replyEndRef.current) {
      replyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setReplyLoading(true);
    try {
      await replyApi.create({
        outboundOrderId: id,
        content: replyText.trim(),
        type: 'INTERNAL',
      });
      setReplyText('');
      fetchReplies();
      message.success('发送成功');
    } catch (e) {
      message.error(e?.message || '发送失败');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleComplete = async () => {
    modal.confirm({
      title: '确认完成',
      content: `确定要完成出库单 ${detail?.orderNo} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await outboundApi.complete(id);
          message.success('出库已完成');
          fetchDetail();
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const handleCancel = async () => {
    modal.confirm({
      title: '确认取消',
      content: `确定要取消出库单 ${detail?.orderNo} 吗？`,
      okText: '确认取消',
      cancelText: '返回',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await outboundApi.setStatus(id, { status: 'CANCELLED' });
          message.success('已取消');
          fetchDetail();
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const handleStartPicking = async () => {
    modal.confirm({
      title: '确认开始拣货',
      content: '确定要开始拣货吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await outboundApi.setStatus(id, { status: 'PICKING' });
          message.success('已开始拣货');
          fetchDetail();
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const handleShip = async () => {
    modal.confirm({
      title: '确认发货',
      content: '确定要发货吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await outboundApi.setStatus(id, { status: 'SHIPPED' });
          message.success('已发货');
          fetchDetail();
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const timelineStatus = getTimelineStatus(detail?.status);

  const itemColumns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
      ellipsis: true,
    },
    {
      title: '规格',
      dataIndex: 'spec',
      key: 'spec',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: '申请量',
      dataIndex: 'requestedQty',
      key: 'requestedQty',
      width: 100,
      align: 'right',
      render: (v) => fmtNum(v, 2),
    },
    {
      title: '已拣量',
      dataIndex: 'pickedQty',
      key: 'pickedQty',
      width: 100,
      align: 'right',
      render: (v) => <span style={{ color: '#1677ff' }}>{fmtNum(v, 2)}</span>,
    },
    {
      title: '已发量',
      dataIndex: 'shippedQty',
      key: 'shippedQty',
      width: 100,
      align: 'right',
      render: (v) => <span style={{ color: '#52c41a' }}>{fmtNum(v, 2)}</span>,
    },
    {
      title: '批次号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 140,
      render: (v) => v || '-',
    },
    {
      title: '库位',
      dataIndex: 'location',
      key: 'location',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: '单价(元)',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 100,
      align: 'right',
      render: (v) => fmtMoney(v),
    },
    {
      title: '金额(元)',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (v) => <b>{fmtMoney(v)}</b>,
    },
  ];

  const batchUsageColumns = [
    {
      title: '批次号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 160,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '商品',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
      ellipsis: true,
    },
    {
      title: '消耗数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'right',
      render: (v) => fmtNum(v, 2),
    },
    {
      title: '生产日期',
      dataIndex: 'produceDate',
      key: 'produceDate',
      width: 120,
      render: (v) => fmtDate(v),
    },
    {
      title: '到期日',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
      render: (v) => fmtDate(v),
    },
    {
      title: '出库前库存',
      dataIndex: 'stockBefore',
      key: 'stockBefore',
      width: 120,
      align: 'right',
      render: (v) => fmtNum(v, 2),
    },
    {
      title: '出库后库存',
      dataIndex: 'stockAfter',
      key: 'stockAfter',
      width: 120,
      align: 'right',
      render: (v) => fmtNum(v, 2),
    },
  ];

  const tabItems = [
    {
      key: 'items',
      label: (
        <span>
          <FileTextOutlined /> 明细
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          dataSource={detail?.items || []}
          columns={itemColumns}
          pagination={false}
          scroll={{ x: 1300 }}
          size="small"
          locale={{ emptyText: <Empty description="暂无明细" /> }}
          summary={() => {
            const items = detail?.items || [];
            const totalReq = items.reduce((s, i) => s + (Number(i.requestedQty) || 0), 0);
            const totalPicked = items.reduce((s, i) => s + (Number(i.pickedQty) || 0), 0);
            const totalShipped = items.reduce((s, i) => s + (Number(i.shippedQty) || 0), 0);
            const totalAmount = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <Text strong>合计</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Text strong>{fmtNum(totalReq, 2)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <Text strong style={{ color: '#1677ff' }}>{fmtNum(totalPicked, 2)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <Text strong style={{ color: '#52c41a' }}>{fmtNum(totalShipped, 2)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} colSpan={3} />
                <Table.Summary.Cell index={9} align="right">
                  <Text strong style={{ color: '#cf1322' }}>{fmtMoney(totalAmount)}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      ),
    },
    {
      key: 'batches',
      label: (
        <span>
          <InboxOutlined /> 批次消耗
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          dataSource={detail?.batchUsages || []}
          columns={batchUsageColumns}
          pagination={false}
          scroll={{ x: 1000 }}
          size="small"
          locale={{ emptyText: <Empty description="暂无批次消耗记录" /> }}
        />
      ),
    },
    {
      key: 'replies',
      label: (
        <span>
          <MessageOutlined /> 沟通
        </span>
      ),
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', height: 500 }}>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 8px 16px',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            {replies.length === 0 ? (
              <Empty description="暂无沟通记录" style={{ marginTop: 60 }} />
            ) : (
              <List
                dataSource={replies}
                renderItem={(item) => (
                  <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ background: '#1677ff' }} icon={<UserOutlined />}>
                          {item.creatorName?.charAt(0)}
                        </Avatar>
                      }
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text strong>{item.creatorName || '系统'}</Text>
                          <Tag color="default" style={{ fontSize: 12 }}>
                            {item.type === 'SUPPLIER' ? '供应商' : '内部'}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {fromNow(item.createdAt)}
                          </Text>
                        </div>
                      }
                      description={
                        <div style={{ marginTop: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {item.content}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
            <div ref={replyEndRef} />
          </div>
          {canWrite && (
            <div style={{ padding: '12px 8px 0' }}>
              <Space.Compact style={{ width: '100%' }}>
                <TextArea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="输入消息..."
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleSendReply();
                    }
                  }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendReply}
                  loading={replyLoading}
                  style={{ height: 'auto' }}
                >
                  发送
                </Button>
              </Space.Compact>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Ctrl+Enter 发送
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'exceptions',
      label: (
        <span>
          <WarningOutlined /> 异常
          {exceptions.length > 0 && <Tag color="red">{exceptions.length}</Tag>}
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          dataSource={exceptions}
          columns={[
            { title: '异常编号', dataIndex: 'exceptionNo', width: 140, render: (t, r) => <a onClick={() => navigate(`/exceptions/${r.id}`)}>{t}</a> },
            { title: '类型', dataIndex: 'type', width: 120, render: (v) => <StatusTag statusKey="EXCEPTION_TYPE" value={v} /> },
            { title: '标题', dataIndex: 'title', width: 200, ellipsis: true },
            { title: '状态', dataIndex: 'status', width: 100, render: (v) => <StatusTag statusKey="EXCEPTION_STATUS" value={v} /> },
            { title: '创建时间', dataIndex: 'createdAt', width: 160, render: (v) => fmtDateTime(v) },
          ]}
          pagination={false}
          size="small"
          locale={{ emptyText: <Empty description="暂无异常" /> }}
        />
      ),
    },
  ];

  const actionButtons = () => {
    const btns = [];
    if (!canWrite) return btns;

    if (detail?.status === 'PENDING') {
      btns.push(
        <Button key="scan" icon={<ScanOutlined />}>
          扫码拣货
        </Button>
      );
      btns.push(
        <Button key="picking" type="primary" onClick={handleStartPicking}>
          开始拣货
        </Button>
      );
    }
    if (detail?.status === 'PICKING') {
      btns.push(
        <Button key="ship" type="primary" onClick={handleShip}>
          发货
        </Button>
      );
    }
    if (detail?.status === 'SHIPPED') {
      btns.push(
        <Button key="complete" type="primary" onClick={handleComplete}>
          完成
        </Button>
      );
    }
    if (['PENDING', 'PICKING'].includes(detail?.status)) {
      btns.push(
        <Button key="cancel" danger onClick={handleCancel}>
          取消
        </Button>
      );
    }
    return btns;
  };

  if (loading && !detail) {
    return (
      <div className="app-page">
        <Card loading={true} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="app-page">
        <Card>
          <Empty description="出库单不存在" />
        </Card>
      </div>
    );
  }

  const outboundTypeLabel = OUTBOUND_TYPES[detail.outboundType] || detail.outboundType || '-';

  return (
    <div className="app-page">
      <Space style={{ marginBottom: 12 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/outbound-orders')}
        >
          返回列表
        </Button>
      </Space>

      <div className="page-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Title level={3} style={{ margin: 0 }}>
            {detail.orderNo}
          </Title>
          <StatusTag statusKey="OUTBOUND_STATUS" value={detail.status} style={{ fontSize: 14, padding: '4px 12px' }} />
          <Tag color="blue">{outboundTypeLabel}</Tag>
        </div>
        <Space>{actionButtons()}</Space>
      </div>

      <Row gutter={16}>
        <Col span={18}>
          <Card className="card-section" style={{ marginBottom: 16 }}>
            <div className="section-title">出库进度</div>
            <Timeline
              className="status-timeline"
              mode="horizontal"
              items={TIMELINE_STATUS_ORDER.map((item) => ({
                color: timelineStatus.includes(item.key) ? 'green' : 'gray',
                children: (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
                    <div>{item.label}</div>
                  </div>
                ),
              }))}
            />
          </Card>

          <Card
            className="card-section"
            style={{ marginBottom: 16 }}
            styles={{ body: { padding: 0 } }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              style={{ padding: '0 16px' }}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card className="card-section" style={{ marginBottom: 16 }}>
            <div className="section-title">基本信息</div>
            <div className="info-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="info-item">
                <span className="k">类型：</span>
                <span className="v">{outboundTypeLabel}</span>
              </div>
              <div className="info-item">
                <span className="k">目的地：</span>
                <span className="v">{detail.destination || '-'}</span>
              </div>
              <div className="info-item">
                <span className="k">联系人：</span>
                <span className="v">{detail.contactName || '-'}</span>
              </div>
              <div className="info-item">
                <span className="k">电话：</span>
                <span className="v">{detail.contactPhone || '-'}</span>
              </div>
              <div className="info-item">
                <span className="k">参考号：</span>
                <span className="v">{detail.referenceNo || '-'}</span>
              </div>
              <div className="info-item">
                <span className="k">创建人：</span>
                <span className="v">{detail.creatorName || '-'}</span>
              </div>
              <div className="info-item">
                <span className="k">拣货人：</span>
                <span className="v">{detail.pickerName || '-'}</span>
              </div>
              <div className="info-item">
                <span className="k">备注：</span>
                <span className="v">{detail.remark || '-'}</span>
              </div>
            </div>
          </Card>

          <Card className="card-section">
            <div className="section-title">统计信息</div>
            <Row gutter={12}>
              <Col span={12}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#1677ff' }}>
                    {detail.items?.length || 0}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>品项数</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#722ed1' }}>
                    {fmtNum(detail.totalQty, 2)}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>总数量</div>
                </div>
              </Col>
            </Row>
            <Divider style={{ margin: '8px 0' }} />
            <Row gutter={12}>
              <Col span={12}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                    {fmtNum(detail.pickedQty, 2)}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>已拣量</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#13c2c2' }}>
                    {fmtNum(detail.shippedQty, 2)}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>已发量</div>
                </div>
              </Col>
            </Row>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#cf1322' }}>
                {fmtMoney(detail.totalAmount)}
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>总金额</div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
