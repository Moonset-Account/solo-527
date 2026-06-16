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
  Modal,
  Form,
  Select,
  Divider,
  Statistic,
  Progress,
  Rate,
  Radio,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  StopOutlined,
  MessageOutlined,
  WarningOutlined,
  SendOutlined,
  UserOutlined,
  FileTextOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  StarOutlined,
  MessageFilled,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  purchaseApi,
  replyApi,
  exceptionApi,
  inboundApi,
  supplierApi,
} from '@/api/index.js';
import StatusTag from '@/components/StatusTag';
import {
  fmtNum,
  fmtDateTime,
  fmtDate,
  fmtMoney,
  fromNow,
  levelLabel,
} from '@/utils/format';
import {
  PURCHASE_STATUS,
  URGENT_LEVEL,
  QC_STATUS,
  EXCEPTION_TYPE,
  EXCEPTION_STATUS,
} from '@/utils/constants';
import { useAppStore, useCanWrite } from '@/store';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const TIMELINE_STATUS_ORDER = [
  { key: 'CREATED', label: '创建', icon: '📝' },
  { key: 'SUBMITTED', label: '提交', icon: '📤' },
  { key: 'CONFIRMED', label: '供应商确认', icon: '✅' },
  { key: 'DELIVERED', label: '到货', icon: '📦' },
  { key: 'COMPLETED', label: '完成', icon: '🎉' },
];

const getTimelineStatus = (status) => {
  const statusMap = {
    DRAFT: ['CREATED'],
    PENDING_SUPPLIER: ['CREATED', 'SUBMITTED'],
    SUPPLIER_CONFIRMED: ['CREATED', 'SUBMITTED', 'CONFIRMED'],
    PARTIAL_DELIVERED: ['CREATED', 'SUBMITTED', 'CONFIRMED', 'DELIVERED'],
    FULLY_DELIVERED: ['CREATED', 'SUBMITTED', 'CONFIRMED', 'DELIVERED'],
    COMPLETED: ['CREATED', 'SUBMITTED', 'CONFIRMED', 'DELIVERED', 'COMPLETED'],
    CANCELLED: [],
  };
  return statusMap[status] || [];
};

export default function PurchaseDetail() {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAppStore((s) => s.user);
  const canWrite = useCanWrite(user);

  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyType, setReplyType] = useState('INTERNAL');
  const [replyLoading, setReplyLoading] = useState(false);
  const [exceptions, setExceptions] = useState([]);
  const [inboundOrders, setInboundOrders] = useState([]);
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [exceptionForm] = Form.useForm();
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingForm] = Form.useForm();
  const [generateInboundModalOpen, setGenerateInboundModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('items');
  const [supplierRating, setSupplierRating] = useState(null);
  const replyEndRef = useRef(null);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await purchaseApi.detail(id);
      setDetail(res.data);
    } catch (e) {
      message.error(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const res = await replyApi.list.byPurchase(id, { page: 1, pageSize: 100 });
      const list = res.data?.list || res.data?.records || [];
      setReplies(list);
    } catch (e) {}
  };

  const fetchExceptions = async () => {
    try {
      const res = await exceptionApi.list({ purchaseOrderId: id, page: 1, pageSize: 100 });
      const list = res.data?.list || res.data?.records || [];
      setExceptions(list);
    } catch (e) {}
  };

  const fetchInboundOrders = async () => {
    try {
      const res = await inboundApi.list({ purchaseOrderId: id, page: 1, pageSize: 100 });
      const list = res.data?.list || res.data?.records || [];
      setInboundOrders(list);
    } catch (e) {}
  };

  const fetchSupplierRating = async () => {
    try {
      const res = await supplierApi.ratings(detail?.supplierId, { purchaseOrderId: id });
      const list = res.data?.list || res.data?.records || [];
      if (list.length > 0) {
        setSupplierRating(list[0]);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
      fetchReplies();
      fetchExceptions();
      fetchInboundOrders();
    }
  }, [id]);

  useEffect(() => {
    if (detail?.supplierId) {
      fetchSupplierRating();
    }
  }, [detail?.supplierId]);

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
        purchaseOrderId: id,
        content: replyText.trim(),
        type: replyType,
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
        purchaseOrderId: id,
      });
      message.success('创建成功');
      setExceptionModalOpen(false);
      exceptionForm.resetFields();
      fetchExceptions();
    } catch (e) {
      message.error(e?.message || '创建失败');
    }
  };

  const handleSubmit = async () => {
    modal.confirm({
      title: '确认提交',
      content: `确定要提交采购单 ${detail?.orderNo} 给供应商吗？`,
      okText: '确认提交',
      cancelText: '取消',
      onOk: async () => {
        try {
          await purchaseApi.submit(id);
          message.success('已提交');
          fetchDetail();
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const handleConfirm = async () => {
    modal.confirm({
      title: '确认供应商已确认',
      content: '确定要标记为供应商已确认吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await purchaseApi.confirm(id);
          message.success('已确认');
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
      content: `确定要取消采购单 ${detail?.orderNo} 吗？`,
      okText: '确认取消',
      cancelText: '返回',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await purchaseApi.cancel(id, { reason: '手动取消' });
          message.success('已取消');
          fetchDetail();
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const handleComplete = async () => {
    modal.confirm({
      title: '确认完成',
      content: `确定要完成采购单 ${detail?.orderNo} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await purchaseApi.setStatus(id, { status: 'COMPLETED' });
          message.success('已完成');
          fetchDetail();
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const handleGenerateInbound = async () => {
    setGenerateInboundModalOpen(true);
  };

  const confirmGenerateInbound = async () => {
    try {
      const res = await inboundApi.create({
        purchaseOrderId: id,
        supplierId: detail?.supplierId,
        items: detail?.items?.map((item) => ({
          productId: item.productId,
          sku: item.sku,
          productName: item.productName,
          spec: item.spec,
          expectedQty: item.confirmedQty || item.expectedQty,
          actualQty: item.confirmedQty || item.expectedQty,
        })),
      });
      message.success('入库单已创建');
      setGenerateInboundModalOpen(false);
      navigate(`/inbound-orders/${res.data?.id || res.data}`);
    } catch (e) {
      message.error(e?.message || '创建失败');
    }
  };

  const handleSubmitRating = async () => {
    try {
      const values = await ratingForm.validateFields();
      await supplierApi.rate(detail?.supplierId, {
        ...values,
        purchaseOrderId: id,
      });
      message.success('评分提交成功');
      setRatingModalOpen(false);
      ratingForm.resetFields();
      fetchSupplierRating();
    } catch (e) {
      message.error(e?.message || '提交失败');
    }
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
      title: '预计量',
      dataIndex: 'expectedQty',
      key: 'expectedQty',
      width: 100,
      align: 'right',
      render: (v) => fmtNum(v, 2),
    },
    {
      title: '确认量',
      dataIndex: 'confirmedQty',
      key: 'confirmedQty',
      width: 100,
      align: 'right',
      render: (v) => <span style={{ color: '#1677ff' }}>{fmtNum(v, 2)}</span>,
    },
    {
      title: '已到量',
      dataIndex: 'deliveredQty',
      key: 'deliveredQty',
      width: 100,
      align: 'right',
      render: (v) => <span style={{ color: '#52c41a' }}>{fmtNum(v, 2)}</span>,
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
      title: '小计(元)',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 120,
      align: 'right',
      render: (v) => <b>{fmtMoney(v)}</b>,
    },
    {
      title: '要求到货日',
      dataIndex: 'expectedDeliveryDate',
      key: 'expectedDeliveryDate',
      width: 120,
      render: (v) => fmtDate(v) || '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 140,
      render: (v) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v) => v || '-',
    },
  ];

  const qcSummary = () => {
    const items = detail?.items || [];
    const totalQty = items.reduce((sum, item) => sum + (Number(item.deliveredQty) || 0), 0);
    const passedQty = items.reduce((sum, item) => sum + (Number(item.qcPassedQty) || 0), 0);
    const failedQty = items.reduce((sum, item) => sum + (Number(item.qcFailedQty) || 0), 0);
    const passRate = totalQty > 0 ? (passedQty / totalQty) * 100 : 0;
    return { totalQty, passedQty, failedQty, passRate };
  };

  const qcInfo = detail ? qcSummary() : null;

  const tabItems = [
    {
      key: 'items',
      label: (
        <span>
          <FileTextOutlined /> 采购明细
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
          summary={() => {
            const items = detail?.items || [];
            const totalExp = items.reduce((s, i) => s + (Number(i.expectedQty) || 0), 0);
            const totalConf = items.reduce((s, i) => s + (Number(i.confirmedQty) || 0), 0);
            const totalDel = items.reduce((s, i) => s + (Number(i.deliveredQty) || 0), 0);
            const totalAmount = items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <Text strong>合计</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Text strong>{fmtNum(totalExp, 2)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <Text strong style={{ color: '#1677ff' }}>{fmtNum(totalConf, 2)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <Text strong style={{ color: '#52c41a' }}>{fmtNum(totalDel, 2)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} />
                <Table.Summary.Cell index={7} align="right">
                  <Text strong style={{ color: '#cf1322' }}>{fmtMoney(totalAmount)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} colSpan={3} />
              </Table.Summary.Row>
            );
          }}
        />
      ),
    },
    {
      key: 'inbound',
      label: (
        <span>
          <InboxOutlined /> 关联入库单
          {inboundOrders.length > 0 && <Tag color="blue">{inboundOrders.length}</Tag>}
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          dataSource={inboundOrders}
          columns={[
            { title: '入库单号', dataIndex: 'orderNo', width: 160, render: (t, r) => <a onClick={() => navigate(`/inbound-orders/${r.id}`)}>{t}</a> },
            { title: '状态', dataIndex: 'status', width: 100, render: (v) => <StatusTag statusKey="INBOUND_STATUS" value={v} /> },
            { title: '供应商', dataIndex: 'supplierName', width: 180, ellipsis: true },
            { title: '到货时间', dataIndex: 'arrivalTime', width: 160, render: (v) => fmtDateTime(v) },
            { title: '总量(kg)', dataIndex: 'totalQty', width: 100, align: 'right', render: (v) => fmtNum(v, 2) },
            { title: '合格量', dataIndex: 'passedQty', width: 100, align: 'right', render: (v) => <span style={{ color: '#52c41a' }}>{fmtNum(v, 2)}</span> },
            { title: '创建人', dataIndex: 'creatorName', width: 100, render: (v) => v || '-' },
          ]}
          pagination={false}
          size="small"
          locale={{ emptyText: <Empty description="暂无关联入库单" /> }}
        />
      ),
    },
    {
      key: 'replies',
      label: (
        <span>
          <MessageOutlined /> 沟通回复
        </span>
      ),
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', height: 550 }}>
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
                        <Avatar
                          style={{
                            background: item.type === 'SUPPLIER' ? '#fa8c16' : '#1677ff',
                          }}
                          icon={<UserOutlined />}
                        >
                          {item.creatorName?.charAt(0)}
                        </Avatar>
                      }
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text strong>{item.creatorName || '系统'}</Text>
                          <Tag color={item.type === 'SUPPLIER' ? 'orange' : 'default'} style={{ fontSize: 12 }}>
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
              <div style={{ marginBottom: 8 }}>
                <Radio.Group value={replyType} onChange={(e) => setReplyType(e.target.value)} size="small">
                  <Radio.Button value="INTERNAL">内部沟通</Radio.Button>
                  <Radio.Button value="SUPPLIER">发给供应商</Radio.Button>
                </Radio.Group>
              </div>
              <Space.Compact style={{ width: '100%' }}>
                <TextArea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={replyType === 'SUPPLIER' ? '输入消息发送给供应商...' : '输入消息...'}
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
                  value={qcInfo.failedQty}
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
              { title: '到货量', dataIndex: 'deliveredQty', align: 'right', render: (v) => fmtNum(v, 2) },
              { title: '合格量', dataIndex: 'qcPassedQty', align: 'right', render: (v) => <span style={{ color: '#52c41a' }}>{fmtNum(v, 2)}</span> },
              { title: '不合格量', dataIndex: 'qcFailedQty', align: 'right', render: (v) => <span style={{ color: '#ff4d4f' }}>{fmtNum(v, 2)}</span> },
              { title: '质检结果', dataIndex: 'qcStatus', width: 100, render: (v) => <StatusTag statusKey="QC_STATUS" value={v} /> },
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
    {
      key: 'rating',
      label: (
        <span>
          <StarOutlined /> 评分
        </span>
      ),
      children: supplierRating ? (
        <Card size="small">
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Rate disabled value={supplierRating.overallScore || 0} style={{ fontSize: 24 }} />
            <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>
              {supplierRating.overallScore || 0} 分
            </div>
          </div>
          <Divider style={{ margin: '12px 0' }} />
          <Row gutter={16}>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">商品质量</Text>
                <div>
                  <Rate disabled value={supplierRating.qualityScore || 0} />
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">交货时效</Text>
                <div>
                  <Rate disabled value={supplierRating.deliveryScore || 0} />
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">服务态度</Text>
                <div>
                  <Rate disabled value={supplierRating.serviceScore || 0} />
                </div>
              </div>
            </Col>
          </Row>
          {supplierRating.comment && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text type="secondary">评语：</Text>
                <div style={{ marginTop: 4 }}>{supplierRating.comment}</div>
              </div>
            </>
          )}
        </Card>
      ) : (
        <div>
          {canWrite && (
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Button
                type="primary"
                icon={<StarOutlined />}
                size="small"
                onClick={() => setRatingModalOpen(true)}
              >
                去评分
              </Button>
            </div>
          )}
          <Empty description="暂无评分" />
        </div>
      ),
    },
  ];

  const actionButtons = () => {
    const btns = [];
    if (!canWrite) return btns;

    if (detail?.status === 'DRAFT') {
      btns.push(
        <Button key="submit" type="primary" onClick={handleSubmit}>
          提交
        </Button>
      );
    }
    if (detail?.status === 'PENDING_SUPPLIER') {
      btns.push(
        <Button key="confirm" type="primary" onClick={handleConfirm}>
          供应商确认
        </Button>
      );
    }
    if (['SUPPLIER_CONFIRMED', 'PARTIAL_DELIVERED', 'FULLY_DELIVERED'].includes(detail?.status)) {
      btns.push(
        <Button key="generate-inbound" icon={<InboxOutlined />} onClick={handleGenerateInbound}>
          生成入库单
        </Button>
      );
      btns.push(
        <Button key="complete" type="primary" onClick={handleComplete}>
          完成
        </Button>
      );
    }
    if (detail?.status !== 'CANCELLED' && detail?.status !== 'COMPLETED') {
      btns.push(
        <Button key="message" icon={<MessageFilled />} onClick={() => setActiveTab('replies')}>
          发起沟通
        </Button>
      );
    }
    if (detail?.status === 'COMPLETED' && !supplierRating) {
      btns.push(
        <Button key="rating" icon={<StarOutlined />} onClick={() => setRatingModalOpen(true)}>
          评分
        </Button>
      );
    }
    if (['DRAFT', 'PENDING_SUPPLIER'].includes(detail?.status)) {
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
          <Empty description="采购单不存在" />
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
          onClick={() => navigate('/purchase-orders')}
        >
          返回列表
        </Button>
      </Space>

      <div className="page-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Title level={3} style={{ margin: 0 }}>
            {detail.orderNo}
          </Title>
          <StatusTag statusKey="PURCHASE_STATUS" value={detail.status} style={{ fontSize: 14, padding: '4px 12px' }} />
          <Tag color={urgentCfg.color}>{urgentCfg.label}</Tag>
        </div>
        <Space>{actionButtons()}</Space>
      </div>

      <Row gutter={16}>
        <Col span={18}>
          <Card className="card-section" style={{ marginBottom: 16 }}>
            <div className="section-title">采购进度</div>
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
                <span className="k">供应商：</span>
                <span className="v">
                  <a onClick={() => navigate(`/suppliers/${detail.supplierId}`)}>
                    {detail.supplierName || '-'}
                  </a>
                </span>
              </div>
              <div className="info-item">
                <span className="k">创建人：</span>
                <span className="v">{detail.creatorName || '-'}</span>
              </div>
              <div className="info-item">
                <span className="k">负责人：</span>
                <span className="v">{detail.assignedToName || '-'}</span>
              </div>
              <div className="info-item">
                <span className="k">要求到货日：</span>
                <span className="v">{fmtDate(detail.expectedDeliveryDate) || '-'}</span>
              </div>
              <div className="info-item">
                <span className="k">实际到货：</span>
                <span className="v">
                  {detail.actualDeliveryDate ? fmtDate(detail.actualDeliveryDate) : '-'}
                </span>
              </div>
              <div className="info-item">
                <span className="k">紧急度：</span>
                <span className="v">
                  <Tag color={urgentCfg.color}>{urgentCfg.label}</Tag>
                </span>
              </div>
              <div className="info-item">
                <span className="k">是否需要质检：</span>
                <span className="v">{detail.needQc ? '是' : '否'}</span>
              </div>
              <div className="info-item">
                <span className="k">总金额：</span>
                <span className="v" style={{ color: '#cf1322', fontWeight: 600 }}>
                  {fmtMoney(detail.totalAmount)}
                </span>
              </div>
              <div className="info-item">
                <span className="k">总数量：</span>
                <span className="v">{fmtNum(detail.totalQty, 2)}</span>
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
                    {fmtNum(detail.deliveredQty || 0, 2)}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>已到货</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>
                    {fmtMoney(detail.totalAmount)}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>总金额</div>
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

      <Modal
        title="供应商评分"
        open={ratingModalOpen}
        onCancel={() => {
          setRatingModalOpen(false);
          ratingForm.resetFields();
        }}
        onOk={handleSubmitRating}
        okText="提交评分"
        cancelText="取消"
        destroyOnHidden
        width={500}
      >
        <Form form={ratingForm} layout="vertical">
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Text strong style={{ fontSize: 16 }}>总体评分</Text>
            <div>
              <Form.Item
                name="overallScore"
                rules={[{ required: true, message: '请评分' }]}
                style={{ marginBottom: 0 }}
              >
                <Rate style={{ fontSize: 28 }} />
              </Form.Item>
            </div>
          </div>
          <Divider style={{ margin: '12px 0' }} />
          <Row gutter={16}>
            <Col span={8} style={{ textAlign: 'center' }}>
              <Text type="secondary">商品质量</Text>
              <Form.Item name="qualityScore" style={{ marginTop: 4, marginBottom: 0 }}>
                <Rate />
              </Form.Item>
            </Col>
            <Col span={8} style={{ textAlign: 'center' }}>
              <Text type="secondary">交货时效</Text>
              <Form.Item name="deliveryScore" style={{ marginTop: 4, marginBottom: 0 }}>
                <Rate />
              </Form.Item>
            </Col>
            <Col span={8} style={{ textAlign: 'center' }}>
              <Text type="secondary">服务态度</Text>
              <Form.Item name="serviceScore" style={{ marginTop: 4, marginBottom: 0 }}>
                <Rate />
              </Form.Item>
            </Col>
          </Row>
          <Divider style={{ margin: '12px 0' }} />
          <Form.Item name="comment" label="评语">
            <TextArea rows={4} placeholder="请输入您的评价..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="生成入库单"
        open={generateInboundModalOpen}
        onCancel={() => setGenerateInboundModalOpen(false)}
        onOk={confirmGenerateInbound}
        okText="确认生成"
        cancelText="取消"
      >
        <div>
          <p>确定要根据采购单 <b>{detail.orderNo}</b> 生成入库单吗？</p>
          <p style={{ color: '#8c8c8c', fontSize: 13 }}>
            将自动带入采购明细和供应商信息，您可以在入库单中调整实际到货数量。
          </p>
          <div style={{ marginTop: 12, padding: '12px', background: '#f5f5f5', borderRadius: 6 }}>
            <div>供应商：{detail.supplierName}</div>
            <div>品项数：{detail.items?.length || 0} 种</div>
            <div>预计数量：{fmtNum(detail.totalQty, 2)} kg</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
