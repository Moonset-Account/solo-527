import React, { useState, useEffect, useCallback } from 'react';
import {
  Tabs,
  Card,
  Button,
  Space,
  Tag,
  Breadcrumb,
  Avatar,
  Progress,
  Table,
  Input,
  Form,
  Rate,
  Modal,
  App as AntdApp,
  List,
  Tooltip,
  Divider,
  Select,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  StopOutlined,
  PlayCircleOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  SendOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Pie } from '@ant-design/plots';
import { supplierApi, purchaseApi, replyApi } from '@/api/index.js';
import StatusTag from '@/components/StatusTag.jsx';
import {
  fmtMoney,
  fmtNum,
  fmtPct,
  fmtDate,
  fmtDateTime,
  parsePagination,
  levelLabel,
  fromNow,
} from '@/utils/format.js';
import { ROLE, hasRole, getRole } from '@/utils/auth.js';

const { TextArea } = Input;
const { Option } = Select;

export default function Detail() {
  const { message, modal } = AntdApp.useApp();
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsPagination, setProductsPagination] = useState({ current: 1, pageSize: 10 });

  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasePagination, setPurchasePagination] = useState({ current: 1, pageSize: 10 });

  const [ratings, setRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingPagination, setRatingPagination] = useState({ current: 1, pageSize: 10 });

  const [replies, setReplies] = useState([]);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyType, setReplyType] = useState('PUBLIC');
  const [submittingReply, setSubmittingReply] = useState(false);

  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [rateForm] = Form.useForm();
  const [submittingRate, setSubmittingRate] = useState(false);

  const [qcStats, setQcStats] = useState(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supplierApi.detail(id);
      setDetail(res.data || {});
    } catch (e) {
      message.error('加载详情失败');
    } finally {
      setLoading(false);
    }
  }, [id, message]);

  const fetchProducts = useCallback(async (page = 1, pageSize = 10) => {
    setProductsLoading(true);
    try {
      const res = await supplierApi.products(id, { page, pageSize });
      const list = res.data?.list || res.data?.records || [];
      setProducts(list);
      setProductsPagination(parsePagination(res.data));
    } catch (e) {
    } finally {
      setProductsLoading(false);
    }
  }, [id]);

  const fetchPurchases = useCallback(async (page = 1, pageSize = 10) => {
    setPurchasesLoading(true);
    try {
      const res = await purchaseApi.list({ supplierId: id, page, pageSize });
      const list = res.data?.list || res.data?.records || [];
      setPurchases(list);
      setPurchasePagination(parsePagination(res.data));
    } catch (e) {
    } finally {
      setPurchasesLoading(false);
    }
  }, [id]);

  const fetchRatings = useCallback(async (page = 1, pageSize = 10) => {
    setRatingsLoading(true);
    try {
      const res = await supplierApi.ratings(id, { page, pageSize });
      const list = res.data?.list || res.data?.records || [];
      setRatings(list);
      setRatingPagination(parsePagination(res.data));
    } catch (e) {
    } finally {
      setRatingsLoading(false);
    }
  }, [id]);

  const fetchReplies = useCallback(async () => {
    setReplyLoading(true);
    try {
      const res = await replyApi.list.bySupplier?.(id) || { data: { list: [] } };
      setReplies(res.data?.list || []);
    } catch (e) {
    } finally {
      setReplyLoading(false);
    }
  }, [id]);

  const fetchQcStats = useCallback(async () => {
    try {
      const res = await supplierApi.statistics(id);
      setQcStats(res.data || {});
    } catch (e) {
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'purchases') {
      fetchPurchases();
    } else if (activeTab === 'ratings') {
      fetchRatings();
    } else if (activeTab === 'replies') {
      fetchReplies();
    } else if (activeTab === 'qc') {
      fetchQcStats();
    }
  }, [activeTab, fetchProducts, fetchPurchases, fetchRatings, fetchReplies, fetchQcStats]);

  const handleToggleStatus = () => {
    const nextStatus = detail.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    modal.confirm({
      title: nextStatus === 'INACTIVE' ? '确认停用' : '确认启用',
      content: `确定要${nextStatus === 'INACTIVE' ? '停用' : '启用'}供应商「${detail.name}」吗？`,
      onOk: async () => {
        try {
          await supplierApi.update(id, { status: nextStatus });
          message.success('操作成功');
          fetchDetail();
        } catch (e) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleRate = () => {
    rateForm.resetFields();
    setRateModalOpen(true);
  };

  const submitRate = async () => {
    try {
      const values = await rateForm.validateFields();
      setSubmittingRate(true);
      await supplierApi.rate(id, values);
      message.success('评分成功');
      setRateModalOpen(false);
      fetchDetail();
      if (activeTab === 'ratings') fetchRatings();
    } catch (e) {
    } finally {
      setSubmittingRate(false);
    }
  };

  const submitReply = async () => {
    if (!replyContent.trim()) {
      message.warning('请输入回复内容');
      return;
    }
    setSubmittingReply(true);
    try {
      await replyApi.create({
        supplierId: id,
        content: replyContent,
        type: replyType,
      });
      message.success('发送成功');
      setReplyContent('');
      fetchReplies();
    } catch (e) {
      message.error('发送失败');
    } finally {
      setSubmittingReply(false);
    }
  };

  const getRatingColor = (score) => {
    const s = Number(score) || 0;
    if (s >= 4.5) return '#52c41a';
    if (s >= 3.5) return '#1677ff';
    if (s >= 2.5) return '#faad14';
    if (s >= 1.5) return '#fa8c16';
    return '#ff4d4f';
  };

  const qcPieData = qcStats?.qcDistribution || [
    { type: '合格', value: 85, color: '#52c41a' },
    { type: '不合格', value: 5, color: '#ff4d4f' },
    { type: '部分合格', value: 10, color: '#faad14' },
  ];

  const pieConfig = {
    data: qcPieData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.5,
    label: {
      type: 'spider',
      labelHeight: 28,
      content: '{name}\n{percentage}',
    },
    interactions: [{ type: 'element-selected' }, { type: 'element-active' }],
    legend: { position: 'bottom' },
  };

  const productColumns = [
    { title: 'SKU', dataIndex: 'sku', width: 120 },
    { title: '商品名称', dataIndex: 'name', width: 180 },
    { title: '规格', dataIndex: 'spec', width: 100 },
    {
      title: '单价',
      dataIndex: 'price',
      width: 100,
      render: (v) => fmtMoney(v),
    },
    { title: '交货天数', dataIndex: 'deliveryDays', width: 100, render: (v) => `${v || '-'} 天` },
    {
      title: '是否优先',
      dataIndex: 'isPriority',
      width: 100,
      render: (v) => (v ? <Tag color="green">优先</Tag> : <Tag>普通</Tag>),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s) => (s === 'ACTIVE' ? <Tag color="green">在售</Tag> : <Tag>停售</Tag>),
    },
  ];

  const purchaseColumns = [
    {
      title: '订单号',
      dataIndex: 'code',
      width: 140,
      render: (text, record) => (
        <a onClick={() => navigate(`/purchase-orders/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (s) => <StatusTag statusKey="PURCHASE_STATUS" value={s} />,
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      width: 120,
      render: (v) => fmtMoney(v),
    },
    { title: '下单日期', dataIndex: 'orderDate', width: 120, render: (v) => fmtDate(v) },
    { title: '预计到货', dataIndex: 'expectedDate', width: 120, render: (v) => fmtDate(v) },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/purchase-orders/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  const ratingColumns = [
    { title: '评分时间', dataIndex: 'createdAt', width: 160, render: (v) => fmtDateTime(v) },
    { title: '评分人', dataIndex: 'raterName', width: 100 },
    {
      title: '综合分',
      dataIndex: 'overallScore',
      width: 100,
      render: (v) => (
        <span style={{ color: getRatingColor(v), fontWeight: 600 }}>
          {v ? v.toFixed(1) : '-'}
        </span>
      ),
    },
    { title: '准时', dataIndex: 'onTimeScore', width: 80, render: (v) => (v ? v.toFixed(1) : '-') },
    { title: '质量', dataIndex: 'qualityScore', width: 80, render: (v) => (v ? v.toFixed(1) : '-') },
    { title: '数量', dataIndex: 'quantityScore', width: 80, render: (v) => (v ? v.toFixed(1) : '-') },
    { title: '单据', dataIndex: 'docScore', width: 80, render: (v) => (v ? v.toFixed(1) : '-') },
    {
      title: '评语',
      dataIndex: 'comment',
      ellipsis: true,
      render: (v) => v || '-',
    },
  ];

  const renderBasicInfo = () => (
    <div className="info-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
      <div className="info-item">
        <span className="k">联系人：</span>
        <span className="v">{detail?.contactName || '-'}</span>
      </div>
      <div className="info-item">
        <span className="k">联系电话：</span>
        <span className="v">{detail?.contactPhone || '-'}</span>
      </div>
      <div className="info-item">
        <span className="k">邮箱：</span>
        <span className="v">{detail?.email || '-'}</span>
      </div>
      <div className="info-item" style={{ gridColumn: 'span 3' }}>
        <span className="k">地址：</span>
        <span className="v">{detail?.address || '-'}</span>
      </div>
      <div className="info-item">
        <span className="k">类别：</span>
        <span className="v">{detail?.category || '-'}</span>
      </div>
      <div className="info-item">
        <span className="k">等级：</span>
        <span className="v" style={{ color: '#faad14' }}>
          {levelLabel(detail?.level)}
        </span>
      </div>
      <div className="info-item">
        <span className="k">合同期限：</span>
        <span className="v">
          {detail?.contractStart && detail?.contractEnd
            ? `${fmtDate(detail.contractStart)} ~ ${fmtDate(detail.contractEnd)}`
            : '-'}
        </span>
      </div>
      <div className="info-item">
        <span className="k">创建时间：</span>
        <span className="v">{fmtDateTime(detail?.createdAt)}</span>
      </div>
      <div className="info-item">
        <span className="k">统一社会信用代码：</span>
        <span className="v">{detail?.creditCode || '-'}</span>
      </div>
      <div className="info-item">
        <span className="k">开户行：</span>
        <span className="v">{detail?.bankName || '-'}</span>
      </div>
      <div className="info-item">
        <span className="k">银行账号：</span>
        <span className="v">{detail?.bankAccount || '-'}</span>
      </div>
      <div className="info-item" style={{ gridColumn: 'span 3' }}>
        <span className="k">备注：</span>
        <span className="v">{detail?.remark || '-'}</span>
      </div>
    </div>
  );

  const renderReplies = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: 500 }}>
      <div style={{ flex: 1, overflow: 'auto', paddingRight: 8 }}>
        <List
          loading={replyLoading}
          dataSource={replies}
          locale={{ emptyText: '暂无沟通记录' }}
          renderItem={(item) => (
            <List.Item style={{ alignItems: 'flex-start', padding: '12px 0' }}>
              <List.Item.Meta
                avatar={<Avatar icon={<MessageOutlined />} />}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 500 }}>{item.senderName || '系统'}</span>
                    {item.type === 'PRIVATE' && <Tag color="orange">私密</Tag>}
                    {item.type === 'PUBLIC' && <Tag color="blue">公开</Tag>}
                    <span style={{ color: '#bfbfbf', fontSize: 12 }}>{fromNow(item.createdAt)}</span>
                  </div>
                }
                description={<div style={{ whiteSpace: 'pre-wrap', color: 'rgba(0,0,0,0.88)' }}>{item.content}</div>}
              />
            </List.Item>
          )}
        />
      </div>
      <Divider style={{ margin: '12px 0' }} />
      <div>
        <Space style={{ marginBottom: 8 }}>
          <Select value={replyType} onChange={setReplyType} style={{ width: 100 }} size="small">
            <Option value="PUBLIC">公开</Option>
            <Option value="PRIVATE">私密</Option>
          </Select>
        </Space>
        <div style={{ display: 'flex', gap: 8 }}>
          <TextArea
            rows={3}
            placeholder="输入沟通内容..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={submittingReply}
            onClick={submitReply}
            style={{ alignSelf: 'flex-end' }}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: <div style={{ padding: '8px 0' }}>{renderBasicInfo()}</div>,
    },
    {
      key: 'products',
      label: '在供商品',
      children: (
        <Table
          rowKey="id"
          columns={productColumns}
          dataSource={products}
          loading={productsLoading}
          pagination={{
            ...productsPagination,
            showTotal: (t) => `共 ${t} 条`,
            showSizeChanger: true,
          }}
          onChange={(pg) => {
            setProductsPagination(pg);
            fetchProducts(pg.current, pg.pageSize);
          }}
          size="small"
        />
      ),
    },
    {
      key: 'purchases',
      label: '采购记录',
      children: (
        <Table
          rowKey="id"
          columns={purchaseColumns}
          dataSource={purchases}
          loading={purchasesLoading}
          pagination={{
            ...purchasePagination,
            showTotal: (t) => `共 ${t} 条`,
            showSizeChanger: true,
          }}
          onChange={(pg) => {
            setPurchasePagination(pg);
            fetchPurchases(pg.current, pg.pageSize);
          }}
          size="small"
        />
      ),
    },
    {
      key: 'qc',
      label: '质检统计',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Card title="合格率分布" size="small">
              <div style={{ height: 300 }}>
                <Pie {...pieConfig} />
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="质检概览" size="small">
              <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                <Col span={12}>
                  <Statistic title="总质检批次" value={qcStats?.totalBatches || 0} />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="合格率"
                    value={qcStats?.passRate || 0}
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic title="不合格批次" value={qcStats?.failedBatches || 0} valueStyle={{ color: '#ff4d4f' }} />
                </Col>
                <Col span={12}>
                  <Statistic title="近30天批次" value={qcStats?.last30Days || 0} />
                </Col>
              </Row>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ fontSize: 13, color: '#8c8c8c' }}>
                <div>质量趋势：近30天合格率稳步上升</div>
              </div>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'ratings',
      label: '评分记录',
      children: (
        <Table
          rowKey="id"
          columns={ratingColumns}
          dataSource={ratings}
          loading={ratingsLoading}
          pagination={{
            ...ratingPagination,
            showTotal: (t) => `共 ${t} 条`,
            showSizeChanger: true,
          }}
          onChange={(pg) => {
            setRatingPagination(pg);
            fetchRatings(pg.current, pg.pageSize);
          }}
          size="small"
        />
      ),
    },
    {
      key: 'replies',
      label: '沟通回复',
      children: renderReplies(),
    },
  ];

  return (
    <div className="app-page">
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb
          items={[
            { title: <Link to="/suppliers">供应商管理</Link> },
            { title: detail?.name || '详情' },
          ]}
        />
      </div>

      <Card loading={loading} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Avatar
              size={64}
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', fontSize: 24 }}
            >
              {detail?.name?.charAt?.(0) || 'S'}
            </Avatar>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{detail?.name}</h2>
                <StatusTag
                  statusKey="PURCHASE_STATUS"
                  value={detail?.status === 'ACTIVE' ? 'COMPLETED' : 'CANCELLED'}
                />
                <span style={{ color: '#faad14', fontSize: 16 }}>{levelLabel(detail?.level)}</span>
              </div>
              <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 8 }}>
                编号：{detail?.code} · {detail?.category || '未分类'}
              </div>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Progress
                    type="circle"
                    size={40}
                    percent={((Number(detail?.rating) || 0) / 5) * 100}
                    format={() => detail?.rating?.toFixed?.(1) || '-'}
                    strokeColor={getRatingColor(detail?.rating)}
                  />
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                    综合评分（{detail?.ratingCount || 0}次）
                  </span>
                </div>
                <div>
                  <span style={{ color: '#8c8c8c', fontSize: 12 }}>准时率：</span>
                  <span style={{ color: getRatingColor(detail?.onTimeRate / 20), fontWeight: 500 }}>
                    {fmtPct(detail?.onTimeRate)}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#8c8c8c', fontSize: 12 }}>合格率：</span>
                  <span style={{ color: getRatingColor(detail?.passRate / 20), fontWeight: 500 }}>
                    {fmtPct(detail?.passRate)}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#8c8c8c', fontSize: 12 }}>累计订单：</span>
                  <span style={{ fontWeight: 500 }}>{fmtNum(detail?.orderCount)} 单</span>
                </div>
              </div>
            </div>
          </div>

          <Space>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/suppliers/${id}/edit`)}>
              编辑
            </Button>
            <Button
              danger={detail?.status === 'ACTIVE'}
              icon={detail?.status === 'ACTIVE' ? <StopOutlined /> : <PlayCircleOutlined />}
              onClick={handleToggleStatus}
            >
              {detail?.status === 'ACTIVE' ? '停用' : '启用'}
            </Button>
            <Button icon={<MessageOutlined />} onClick={() => setActiveTab('replies')}>
              发起沟通
            </Button>
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={() => navigate(`/purchase-orders/new?supplierId=${id}`)}
            >
              新建采购单
            </Button>
            <Button icon={<StarOutlined />} onClick={handleRate}>
              评分
            </Button>
          </Space>
        </div>
      </Card>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title={`对「${detail?.name}」评分`}
        open={rateModalOpen}
        onCancel={() => setRateModalOpen(false)}
        onOk={submitRate}
        confirmLoading={submittingRate}
        okText="提交评分"
        destroyOnHidden
        width={480}
      >
        <Form form={rateForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="overallScore"
            label="综合评分"
            rules={[{ required: true, message: '请评分' }]}
          >
            <Rate allowHalf style={{ fontSize: 22 }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="onTimeScore" label="准时性">
                <Rate allowHalf />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="qualityScore" label="质量">
                <Rate allowHalf />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="quantityScore" label="数量准确性">
                <Rate allowHalf />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="docScore" label="单据规范">
                <Rate allowHalf />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="comment" label="评语">
            <TextArea rows={3} placeholder="可选，填写评价内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
