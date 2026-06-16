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
  Breadcrumb,
  Row,
  Col,
  Descriptions,
  Input,
  List,
  Avatar,
  Modal,
  Form,
  Select,
  DatePicker,
  Divider,
  Statistic,
  Progress,
} from 'antd';
import {
  ArrowLeftOutlined,
  ScanOutlined,
  CheckCircleOutlined,
  StopOutlined,
  MessageOutlined,
  WarningOutlined,
  SendOutlined,
  UserOutlined,
  FileTextOutlined,
  InboxOutlined,
  CheckSquareOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  inboundApi,
  replyApi,
  exceptionApi,
  batchApi,
  purchaseApi,
} from '@/api/index.js';
import StatusTag from '@/components/StatusTag';
import {
  fmtNum,
  fmtDateTime,
  fmtDate,
  fmtMoney,
  expiryTag,
  fromNow,
} from '@/utils/format';
import {
  INBOUND_STATUS,
  URGENT_LEVEL,
  QC_STATUS,
  EXCEPTION_TYPE,
  EXCEPTION_STATUS,
  BATCH_STATUS,
} from '@/utils/constants';
import { useAppStore, useCanWrite } from '@/store';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const TIMELINE_STATUS_ORDER = [
  { key: 'ARRIVED', label: '到货', icon: '📦' },
  { key: 'RECEIVED', label: '收货', icon: '✅' },
  { key: 'QC', label: '质检', icon: '🔍' },
  { key: 'COMPLETED', label: '入库完成', icon: '🎉' },
];

const getTimelineStatus = (status) => {
  const statusMap = {
    PENDING: ['ARRIVED'],
    QC_PENDING: ['ARRIVED', 'RECEIVED'],
    QC_PASSED: ['ARRIVED', 'RECEIVED', 'QC'],
    QC_REJECTED: ['ARRIVED', 'RECEIVED', 'QC'],
    COMPLETED: ['ARRIVED', 'RECEIVED', 'QC', 'COMPLETED'],
    CANCELLED: [],
  };
  return statusMap[status] || [];
};

export default function InboundDetail() {
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
  const [batches, setBatches] = useState([]);
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [exceptionForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('items');
  const replyEndRef = useRef(null);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await inboundApi.detail(id);
      setDetail(res.data);
    } catch (e) {
      message.error(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const res = await replyApi.list.byInbound(id, { page: 1, pageSize: 100 });
      const list = res.data?.list || res.data?.records || [];
      setReplies(list);
    } catch (e) {}
  };

  const fetchExceptions = async () => {
    try {
      const res = await exceptionApi.list({ inboundOrderId: id, page: 1, pageSize: 100 });
      const list = res.data?.list || res.data?.records || [];
      setExceptions(list);
    } catch (e) {}
  };

  const fetchBatches = async () => {
    try {
      const res = await batchApi.list({ inboundOrderId: id, page: 1, pageSize: 100 });
      const list = res.data?.list || res.data?.records || [];
      setBatches(list);
    } catch (e) {}
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
      fetchReplies();
      fetchExceptions();
      fetchBatches();
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
        inboundOrderId: id,
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

  const handleCreateException = async () => {
    try {
      const values = await exceptionForm.validateFields();
      await exceptionApi.create({
        ...values,
        inboundOrderId: id,
      });
      message.success('创建成功');
      setExceptionModalOpen(false);
      exceptionForm.resetFields();
      fetchExceptions();
    } catch (e) {
      message.error(e?.message || '创建失败');
    }
  };

  const handleComplete = async () => {
    modal.confirm({
      title: '确认完成入库',
      content: `确定要完成入库单 ${detail?.orderNo} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await inboundApi.complete(id);
          message.success('入库已完成');
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
      content: `确定要取消入库单 ${detail?.orderNo} 吗？`,
      okText: '确认取消',
      cancelText: '返回',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await inboundApi.setStatus(id, { status: 'CANCELLED' });
          message.success('已取消');
          fetchDetail();
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const handleStartQC = async () => {
    modal.confirm({
      title: '确认开始质检',
      content: '确定要开始质检吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await inboundApi.setStatus(id, { status: 'QC_PENDING' });
          message.success('已开始质检');
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
      width: 180,
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
      title: '预计量(kg)',
      dataIndex: 'expectedQty',
      key: 'expectedQty',
      width: 100,
      align: 'right',
      render: (v) => fmtNum(v, 2),
    },
    {
      title: '实到量(kg)',
      dataIndex: 'actualQty',
      key: 'actualQty',
      width: 100,
      align: 'right',
      render: (v) => fmtNum(v, 2),
    },
    {
      title: '合格量(kg)',
      dataIndex: 'passedQty',
      key: 'passedQty',
      width: 100,
      align: 'right',
      render: (v) => <span style={{ color: '#52c41a' }}>{fmtNum(v, 2)}</span>,
    },
    {
      title: '不合格量(kg)',
      dataIndex: 'rejectedQty',
      key: 'rejectedQty',
      width: 110,
      align: 'right',
      render: (v) => <span style={{ color: '#ff4d4f' }}>{fmtNum(v, 2)}</span>,
    },
    {
      title: '拒收原因',
      dataIndex: 'rejectReason',
      key: 'rejectReason',
      width: 120,
      render: (v) => v || '-',
    },
    {
      title: '效期检查',
      dataIndex: 'expiryCheck',
      key: 'expiryCheck',
      width: 100,
      render: (v) => {
        if (v === true) return <Tag color="success">通过</Tag>;
        if (v === false) return <Tag color="error">不通过</Tag>;
        return '-';
      },
    },
    {
      title: '温度检查',
      dataIndex: 'tempCheck',
      key: 'tempCheck',
      width: 100,
      render: (v) => {
        if (v === true) return <Tag color="success">通过</Tag>;
        if (v === false) return <Tag color="error">不通过</Tag>;
        return '-';
      },
    },
    {
      title: '包装检查',
      dataIndex: 'packageCheck',
      key: 'packageCheck',
      width: 100,
      render: (v) => {
        if (v === true) return <Tag color="success">通过</Tag>;
        if (v === false) return <Tag color="error">不通过</Tag>;
        return '-';
      },
    },
    {
      title: '质检备注',
      dataIndex: 'qcRemark',
      key: 'qcRemark',
      width: 140,
      render: (v) => v || '-',
    },
    {
      title: '批次号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 140,
      render: (v) => v || '-',
    },
  ];

  const batchColumns = [
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
      width: 180,
      ellipsis: true,
    },
    {
      title: '数量(kg)',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (v) => fmtNum(v, 2),
    },
    {
      title: '剩余库存',
      dataIndex: 'remaining',
      key: 'remaining',
      width: 100,
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
      render: (v) => {
        const tag = expiryTag(v);
        return (
          <Tag color={tag.color}>
            {fmtDate(v)} ({tag.label})
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <StatusTag statusKey="BATCH_STATUS" value={status} />,
    },
  ];

  const qcSummary = () => {
    const items = detail?.items || [];
    const totalQty = items.reduce((sum, item) => sum + (Number(item.actualQty) || 0), 0);
    const passedQty = items.reduce((sum, item) => sum + (Number(item.passedQty) || 0), 0);
    const rejectedQty = items.reduce((sum, item) => sum + (Number(item.rejectedQty) || 0), 0);
    const passRate = totalQty > 0 ? (passedQty / totalQty) * 100 : 0;
    return { totalQty, passedQty, rejectedQty, passRate };
  };

  const qcInfo = detail ? qcSummary() : null;

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
          scroll={{ x: 1400 }}
          size="small"
          locale={{ emptyText: <Empty description="暂无明细" /> }}
        />
      ),
    },
    {
      key: 'batches',
      label: (
        <span>
          <InboxOutlined /> 批次
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          dataSource={batches}
          columns={batchColumns}
          pagination={false}
          scroll={{ x: 900 }}
          size="small"
          locale={{ emptyText: <Empty description="暂无批次" /> }}
        />
      ),
    },
    {
      key: 'po',
      label: (
        <span>
          <CheckSquareOutlined /> 关联PO
        </span>
      ),
      children: detail?.purchaseOrderId ? (
        <Card size="small">
          <Space>
            <Text>关联采购单：</Text>
            <Link to={`/purchase-orders/${detail.purchaseOrderId}`}>
              {detail.purchaseOrderNo || '查看PO'}
            </Link>
          </Space>
        </Card>
      ) : (
        <Empty description="暂无关联采购单" />
      ),
    },
    {
      key: 'qc',
      label: (
        <span>
          <ExclamationCircleOutlined /> 质检情况
        </span>
      ),
      children: qcInfo ? (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic title="总到货量(kg)" value={qcInfo.totalQty} precision={2} />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="合格量(kg)"
                  value={qcInfo.passedQty}
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="不合格量(kg)"
                  value={qcInfo.rejectedQty}
                  precision={2}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">合格率</Text>
                </div>
                <Progress
                  percent={qcInfo.passRate}
                  status={qcInfo.passRate >= 90 ? 'success' : qcInfo.passRate >= 70 ? 'normal' : 'exception'}
                />
              </Card>
            </Col>
          </Row>
          <Table
            rowKey="id"
            dataSource={detail?.items || []}
            columns={[
              { title: '商品名称', dataIndex: 'productName', width: 200 },
              { title: '实到量', dataIndex: 'actualQty', align: 'right', render: (v) => fmtNum(v, 2) },
              { title: '合格量', dataIndex: 'passedQty', align: 'right', render: (v) => <span style={{ color: '#52c41a' }}>{fmtNum(v, 2)}</span> },
              { title: '不合格量', dataIndex: 'rejectedQty', align: 'right', render: (v) => <span style={{ color: '#ff4d4f' }}>{fmtNum(v, 2)}</span> },
              { title: '质检备注', dataIndex: 'qcRemark', render: (v) => v || '-' },
            ]}
            pagination={false}
            size="small"
            locale={{ emptyText: <Empty description="暂无质检记录" /> }}
          />
        </div>
      ) : (
        <Empty description="暂无质检数据" />
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
        <div>
          {canWrite && (
            <div style={{ marginBottom: 12, textAlign: 'right' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={() => setExceptionModalOpen(true)}
              >
                创建异常
              </Button>
            </div>
          )}
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
        </div>
      ),
    },
  ];

  const actionButtons = () => {
    const btns = [];
    if (!canWrite) return btns;
    
    if (detail?.status === 'PENDING') {
      btns.push(
        <Button key="scan" icon={<ScanOutlined />}>
          扫码添加商品
        </Button>
      );
      btns.push(
        <Button key="qc" type="primary" onClick={handleStartQC}>
          开始质检
        </Button>
      );
    }
    if (detail?.status === 'QC_PENDING') {
      btns.push(
        <Button key="qc-submit" type="primary">
          提交质检
        </Button>
      );
    }
    if (detail?.status === 'QC_PASSED') {
      btns.push(
        <Button key="complete" type="primary" onClick={handleComplete}>
          完成入库
        </Button>
      );
    }
    if (['PENDING', 'QC_PENDING'].includes(detail?.status)) {
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
          <Empty description="入库单不存在" />
        </Card>
      </div>
    );
  }

  const urgentCfg = URGENT_LEVEL[detail.urgentLevel] || URGENT_LEVEL[1];

  return (
    <div className="app-page">
      <Space style={{ marginBottom: 12 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/inbound-orders')}
        >
          返回列表
        </Button>
      </Space>

      <div className="page-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Title level={3} style={{ margin: 0 }}>
            {detail.orderNo}
          </Title>
          <StatusTag statusKey="INBOUND_STATUS" value={detail.status} style={{ fontSize: 14, padding: '4px 12px' }} />
          <Tag color={urgentCfg.color}>{urgentCfg.label}</Tag>
        </div>
        <Space>{actionButtons()}</Space>
      </div>

      <Row gutter={16}>
        <Col span={18}>
          <Card className="card-section" style={{ marginBottom: 16 }}>
            <div className="section-title">入库进度</div>
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
                <span className="k">PO单号：</span>
                <span className="v">
                  {detail.purchaseOrderNo ? (
                    <a onClick={() => navigate(`/purchase-orders/${detail.purchaseOrderId}`)}>
                      {detail.purchaseOrderNo}
                    </a>
                  ) : (
                    '-'
                  )}
                </span>
              </div>
              <div className="info-item">
                <span className="k">供应商：</span>
                <span className="v">{detail.supplierName || '-'}</span>
              </div>
              <div className="info-item">
                <span className="k">车辆牌号：</span>
                <span className="v">{detail.plateNumber || '-'}</span>
              </div>
              <div className="info-item">
                <span className="k">司机：</span>
                <span className="v">{detail.driverName || '-'}</span>
              </div>
              <div className="info-item">
                <span className="k">司机电话：</span>
                <span className="v">{detail.driverPhone || '-'}</span>
              </div>
              <div className="info-item">
                <span className="k">到货时间：</span>
                <span className="v">{fmtDateTime(detail.arrivalTime)}</span>
              </div>
              <div className="info-item">
                <span className="k">温度：</span>
                <span className="v">
                  {detail.temperature !== null && detail.temperature !== undefined
                    ? `${detail.temperature}°C`
                    : '-'}
                </span>
              </div>
              <div className="info-item">
                <span className="k">创建人：</span>
                <span className="v">{detail.creatorName || '-'}</span>
              </div>
              <div className="info-item">
                <span className="k">质检人：</span>
                <span className="v">{detail.qcOperatorName || '-'}</span>
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
                    {fmtNum(detail.totalQty, 2)}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>总量(kg)</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                    {fmtNum(detail.passedQty, 2)}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>合格量(kg)</div>
                </div>
              </Col>
            </Row>
            <Divider style={{ margin: '8px 0' }} />
            <Row gutter={12}>
              <Col span={12}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>
                    {fmtNum(detail.rejectedQty, 2)}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>不合格量(kg)</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#722ed1' }}>
                    {detail.items?.length || 0}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>品项数</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Modal
        title="创建异常工单"
        open={exceptionModalOpen}
        onCancel={() => {
          setExceptionModalOpen(false);
          exceptionForm.resetFields();
        }}
        onOk={handleCreateException}
        okText="创建"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={exceptionForm} layout="vertical">
          <Form.Item
            name="type"
            label="异常类型"
            rules={[{ required: true, message: '请选择异常类型' }]}
          >
            <Select placeholder="请选择">
              {Object.entries(EXCEPTION_TYPE).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="异常标题"
            rules={[{ required: true, message: '请输入异常标题' }]}
          >
            <Input placeholder="请输入异常标题" />
          </Form.Item>
          <Form.Item name="description" label="详细描述">
            <TextArea rows={4} placeholder="请输入详细描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
