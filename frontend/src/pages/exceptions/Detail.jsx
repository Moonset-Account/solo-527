import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Descriptions,
  Tabs,
  Tag,
  Timeline,
  List,
  Avatar,
  Input,
  Form,
  Modal,
  Select,
  message,
  Row,
  Col,
  Divider,
  Breadcrumb,
  App as AntdApp,
  FloatButton,
  Upload,
  Empty,
  Spin,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SendOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseOutlined,
  ArrowUpOutlined,
  TeamOutlined,
  SwapOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  InboxOutlined as BatchOutlined,
  MessageOutlined,
  PaperClipOutlined,
  UploadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { exceptionApi, replyApi, userApi } from '@/api/index.js';
import StatusTag from '@/components/StatusTag';
import {
  fmtMoney,
  fmtNum,
  fmtDateTime,
  fmtDuration,
  priorityLabel,
  fromNow,
} from '@/utils/format.js';
import { EXCEPTION_TYPE, EXCEPTION_STATUS } from '@/utils/constants.js';
import { useAppStore } from '@/store/index.js';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const TIMELINE_STEPS = [
  { key: 'CREATED', label: '创建', icon: 'file' },
  { key: 'ASSIGNED', label: '已分配', icon: 'team' },
  { key: 'IN_PROGRESS', label: '处理中', icon: 'sync' },
  { key: 'PENDING_SUPPLIER', label: '待供应商响应', icon: 'supplier' },
  { key: 'RESOLVED', label: '已解决', icon: 'check' },
  { key: 'CLOSED', label: '已关闭', icon: 'close' },
];

const TAB_ITEMS = [
  { key: 'detail', label: '异常详情', icon: <FileTextOutlined /> },
  { key: 'purchase', label: '关联采购', icon: <ShoppingCartOutlined /> },
  { key: 'inbound', label: '入库单', icon: <InboxOutlined /> },
  { key: 'batch', label: '影响批次', icon: <BatchOutlined /> },
  { key: 'records', label: '处理记录', icon: <ClockCircleOutlined /> },
  { key: 'replies', label: '沟通回复', icon: <MessageOutlined /> },
  { key: 'attachments', label: '附件', icon: <PaperClipOutlined /> },
];

export default function ExceptionDetail() {
  const { message: msg, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAppStore((s) => s.user);

  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [activeTab, setActiveTab] = useState('detail');

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [targetStatus, setTargetStatus] = useState(null);

  const [handlerOptions, setHandlerOptions] = useState([]);
  const [assignForm] = Form.useForm();
  const [statusForm] = Form.useForm();

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await exceptionApi.detail(id);
      setDetail(res.data || {});
    } catch (e) {
      msg.error('加载详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    setReplyLoading(true);
    try {
      const res = await replyApi.list.byException(id, { page: 1, pageSize: 50 });
      setReplies(res.data?.list || res.data?.records || []);
    } catch (e) {
    } finally {
      setReplyLoading(false);
    }
  };

  const fetchHandlers = async () => {
    try {
      const res = await userApi.list({ page: 1, pageSize: 100 });
      setHandlerOptions(res.data?.list || res.data?.records || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchDetail();
    fetchHandlers();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'replies') {
      fetchReplies();
    }
  }, [activeTab, id]);

  const currentStepIndex = useMemo(() => {
    if (!detail) return 0;
    const status = detail.status;
    const statusMap = {
      OPEN: 0,
      ASSIGNED: 1,
      IN_PROGRESS: 2,
      PENDING_SUPPLIER: 3,
      RESOLVED: 4,
      CLOSED: 5,
      ESCALATED: 2,
    };
    return statusMap[status] ?? 0;
  }, [detail]);

  const getTimelineColor = (index) => {
    if (index < currentStepIndex) return 'green';
    if (index === currentStepIndex) return 'blue';
    return 'gray';
  };

  const getTimelineDot = (step, index) => {
    const iconMap = {
      file: <FileTextOutlined />,
      team: <TeamOutlined />,
      sync: <SyncOutlined spin={index === currentStepIndex} />,
      supplier: <ShoppingCartOutlined />,
      check: <CheckCircleOutlined />,
      close: <CloseOutlined />,
    };
    return iconMap[step.icon] || <ClockCircleOutlined />;
  };

  const handleAssign = async () => {
    try {
      const values = await assignForm.validateFields();
      setModalLoading(true);
      await exceptionApi.assign(id, values);
      msg.success('分配成功');
      setAssignModalOpen(false);
      assignForm.resetFields();
      fetchDetail();
    } catch (e) {
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusChange = async () => {
    try {
      const values = await statusForm.validateFields();
      setModalLoading(true);
      await exceptionApi.setStatus(id, {
        status: targetStatus,
        ...values,
      });
      msg.success('状态更新成功');
      setStatusModalOpen(false);
      statusForm.resetFields();
      fetchDetail();
    } catch (e) {
    } finally {
      setModalLoading(false);
    }
  };

  const openStatusModal = (status) => {
    setTargetStatus(status);
    setStatusModalOpen(true);
  };

  const handleEscalate = () => {
    modal.confirm({
      title: '确认升级',
      content: '确定要升级此异常吗？升级后将通知上级主管介入处理。',
      okText: '确认升级',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await exceptionApi.setStatus(id, { status: 'ESCALATED' });
          msg.success('已升级');
          fetchDetail();
        } catch (e) {}
      },
    });
  };

  const handleClose = () => {
    modal.confirm({
      title: '确认关闭',
      content: '确定要关闭此异常吗？关闭后不可恢复。',
      okText: '确认关闭',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await exceptionApi.setStatus(id, { status: 'CLOSED' });
          msg.success('已关闭');
          fetchDetail();
        } catch (e) {}
      },
    });
  };

  const handleReopen = () => {
    modal.confirm({
      title: '确认重新打开',
      content: '确定要重新打开此异常吗？',
      okText: '确认打开',
      cancelText: '取消',
      onOk: async () => {
        try {
          await exceptionApi.setStatus(id, { status: 'IN_PROGRESS' });
          msg.success('已重新打开');
          fetchDetail();
        } catch (e) {}
      },
    });
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) return;
    try {
      await replyApi.create({
        exceptionId: id,
        content: replyContent,
        type: 'INTERNAL',
      });
      msg.success('发送成功');
      setReplyContent('');
      fetchReplies();
    } catch (e) {
      msg.error('发送失败');
    }
  };

  const priorityCfg = priorityLabel(detail?.priority);

  const processRecords = useMemo(() => {
    if (!detail) return [];
    const records = [];
    if (detail.createdAt) {
      records.push({
        time: detail.createdAt,
        title: '异常创建',
        description: detail.creatorName
          ? `由 ${detail.creatorName} 创建`
          : '系统自动创建',
        color: 'blue',
      });
    }
    if (detail.assignedAt) {
      records.push({
        time: detail.assignedAt,
        title: '分配处理人',
        description: `分配给 ${detail.handlerName || '未知用户'}`,
        color: 'cyan',
      });
    }
    if (detail.processStartedAt) {
      records.push({
        time: detail.processStartedAt,
        title: '开始处理',
        description: detail.handlerName
          ? `${detail.handlerName} 开始处理`
          : '处理人开始处理',
        color: 'green',
      });
    }
    if (detail.resolvedAt) {
      records.push({
        time: detail.resolvedAt,
        title: '问题解决',
        description: detail.solution
          ? `解决方案：${detail.solution}`
          : '异常已解决',
        color: 'green',
      });
    }
    if (detail.closedAt) {
      records.push({
        time: detail.closedAt,
        title: '异常关闭',
        description: detail.closerName
          ? `由 ${detail.closerName} 关闭`
          : '系统自动关闭',
        color: 'gray',
      });
    }
    return records.sort((a, b) => new Date(a.time) - new Date(b.time));
  }, [detail]);

  if (loading && !detail) {
    return (
      <div className="app-page">
        <Card style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin tip="加载中..." />
        </Card>
      </div>
    );
  }

  return (
    <div className="app-page">
      <Card
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Space style={{ marginBottom: 12 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/exceptions')}
          >
            返回列表
          </Button>
          <Breadcrumb
            items={[
              { title: <Link to="/exceptions">异常管理</Link> },
              { title: '异常详情' },
            ]}
          />
        </Space>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Space size="middle">
              <Title level={3} style={{ margin: 0 }}>
                {detail?.exceptionNo}
              </Title>
              <StatusTag statusKey="EXCEPTION_TYPE" value={detail?.type} />
              <StatusTag statusKey="EXCEPTION_STATUS" value={detail?.status} />
              <Tag color={priorityCfg.c}>
                优先级：{priorityCfg.t}
              </Tag>
            </Space>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">{detail?.title}</Text>
            </div>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchDetail}>
              刷新
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        <Timeline
          mode="horizontal"
          items={TIMELINE_STEPS.map((step, idx) => ({
            color: getTimelineColor(idx),
            dot: getTimelineDot(step, idx),
            children: (
              <div style={{ paddingTop: 8 }}>
                <Text strong={idx === currentStepIndex}>{step.label}</Text>
              </div>
            ),
          }))}
        />
      </Card>

      <Row gutter={16}>
        <Col flex="auto">
          <Card
            tabList={TAB_ITEMS}
            activeTabKey={activeTab}
            onTabChange={setActiveTab}
          >
            {activeTab === 'detail' && (
              <div>
                <Descriptions
                  title="基本信息"
                  column={3}
                  bordered
                  size="small"
                >
                  <Descriptions.Item label="异常类型">
                    <StatusTag statusKey="EXCEPTION_TYPE" value={detail?.type} />
                  </Descriptions.Item>
                  <Descriptions.Item label="优先级">
                    <Tag color={priorityCfg.c}>{priorityCfg.t}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <StatusTag statusKey="EXCEPTION_STATUS" value={detail?.status} />
                  </Descriptions.Item>

                  <Descriptions.Item label="供应商">
                    {detail?.supplierName || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="关联PO">
                    {detail?.poNo ? (
                      <a onClick={() => navigate(`/purchase-orders/${detail.poId}`)}>
                        {detail.poNo}
                      </a>
                    ) : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="入库单">
                    {detail?.inboundNo ? (
                      <a onClick={() => navigate(`/inbound-orders/${detail.inboundId}`)}>
                        {detail.inboundNo}
                      </a>
                    ) : '-'}
                  </Descriptions.Item>

                  <Descriptions.Item label="批次号">
                    {detail?.batchNo || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="产品">
                    {detail?.productName || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="影响数量">
                    {fmtNum(detail?.affectedQty)}
                  </Descriptions.Item>

                  <Descriptions.Item label="损失金额">
                    <Text type="danger">{fmtMoney(detail?.lossAmount)}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="SLA截止时间">
                    <Space>
                      {detail?.slaDeadline ? fmtDateTime(detail.slaDeadline) : '-'}
                      {detail?.slaDeadline && (
                        <Tag color={new Date(detail.slaDeadline) < new Date() ? 'red' : 'blue'}>
                          {fromNow(detail.slaDeadline)}
                        </Tag>
                      )}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="处理时长">
                    {detail?.processDurationMs
                      ? fmtDuration(detail.processDurationMs)
                      : '-'}
                  </Descriptions.Item>

                  <Descriptions.Item label="创建人">
                    {detail?.creatorName || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {fmtDateTime(detail?.createdAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="处理人">
                    {detail?.handlerName || '-'}
                  </Descriptions.Item>
                </Descriptions>

                <Divider />

                <div>
                  <Title level={5}>异常描述</Title>
                  <Paragraph type="secondary">
                    {detail?.description || '暂无描述'}
                  </Paragraph>
                </div>

                {detail?.solution && (
                  <>
                    <Divider />
                    <div>
                      <Title level={5}>处理方案</Title>
                      <Paragraph type="secondary">{detail.solution}</Paragraph>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'purchase' && (
              <div>
                {detail?.poId ? (
                  <Card size="small">
                    <Descriptions column={2} bordered size="small">
                      <Descriptions.Item label="PO号">
                        {detail.poNo || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="状态">
                        {detail.poStatus || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="供应商">
                        {detail.supplierName || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="创建时间">
                        {detail.poCreatedAt ? fmtDateTime(detail.poCreatedAt) : '-'}
                      </Descriptions.Item>
                    </Descriptions>
                    <div style={{ marginTop: 12, textAlign: 'right' }}>
                      <Button
                        type="primary"
                        onClick={() => navigate(`/purchase-orders/${detail.poId}`)}
                      >
                        查看采购单详情
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Empty description="暂无关联采购单" />
                )}
              </div>
            )}

            {activeTab === 'inbound' && (
              <div>
                {detail?.inboundId ? (
                  <Card size="small">
                    <Descriptions column={2} bordered size="small">
                      <Descriptions.Item label="入库单号">
                        {detail.inboundNo || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="状态">
                        {detail.inboundStatus || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="供应商">
                        {detail.supplierName || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="收货时间">
                        {detail.inboundAt ? fmtDateTime(detail.inboundAt) : '-'}
                      </Descriptions.Item>
                    </Descriptions>
                    <div style={{ marginTop: 12, textAlign: 'right' }}>
                      <Button
                        type="primary"
                        onClick={() => navigate(`/inbound-orders/${detail.inboundId}`)}
                      >
                        查看入库单详情
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Empty description="暂无关联入库单" />
                )}
              </div>
            )}

            {activeTab === 'batch' && (
              <div>
                {detail?.batchNo ? (
                  <Card size="small">
                    <Descriptions column={2} bordered size="small">
                      <Descriptions.Item label="批次号">
                        {detail.batchNo}
                      </Descriptions.Item>
                      <Descriptions.Item label="产品">
                        {detail.productName || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="数量">
                        {fmtNum(detail.batchQty)}
                      </Descriptions.Item>
                      <Descriptions.Item label="有效期">
                        {detail.batchExpiryDate ? fmtDateTime(detail.batchExpiryDate) : '-'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                ) : (
                  <Empty description="暂无关联批次" />
                )}
              </div>
            )}

            {activeTab === 'records' && (
              <div>
                {processRecords.length > 0 ? (
                  <Timeline
                    items={processRecords.map((r) => ({
                      color: r.color,
                      children: (
                        <div>
                          <Text strong>{r.title}</Text>
                          <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                            {fmtDateTime(r.time)}
                          </div>
                          <div style={{ marginTop: 8 }}>{r.description}</div>
                        </div>
                      ),
                    }))}
                  />
                ) : (
                  <Empty description="暂无处理记录" />
                )}
              </div>
            )}

            {activeTab === 'replies' && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <TextArea
                    rows={3}
                    placeholder="输入沟通内容..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    showCount
                    maxLength={500}
                  />
                  <div style={{ marginTop: 8, textAlign: 'right' }}>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleSendReply}
                      disabled={!replyContent.trim()}
                    >
                      发送
                    </Button>
                  </div>
                </div>

                <Divider />

                <Spin spinning={replyLoading}>
                  {replies.length > 0 ? (
                    <List
                      dataSource={replies}
                      renderItem={(item) => (
                        <List.Item key={item.id}>
                          <List.Item.Meta
                            avatar={
                              <Avatar
                                icon={<UserOutlined />}
                                style={{
                                  background: item.creatorRole === 'SUPPLIER'
                                    ? '#fa8c16'
                                    : '#1677ff',
                                }}
                              />
                            }
                            title={
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Space>
                                  <Text strong>
                                    {item.creatorName || '未知用户'}
                                  </Text>
                                  <Tag size="small" color={item.creatorRole === 'SUPPLIER' ? 'orange' : 'blue'}>
                                    {item.creatorRole === 'SUPPLIER' ? '供应商' : '内部'}
                                  </Tag>
                                </Space>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {fmtDateTime(item.createdAt)}
                                </Text>
                              </div>
                            }
                            description={
                              <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                                {item.content}
                              </Paragraph>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="暂无沟通记录" />
                  )}
                </Spin>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Upload.Dragger multiple>
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                    <p className="ant-upload-hint">支持图片、PDF、Excel等格式</p>
                  </Upload.Dragger>
                </div>
                {detail?.attachments?.length > 0 ? (
                  <List
                    dataSource={detail.attachments}
                    renderItem={(item) => (
                      <List.Item
                        key={item.id}
                        actions={[
                          <a key="download">下载</a>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<PaperClipOutlined />}
                          title={item.name}
                          description={
                            <Space>
                              <Text type="secondary">{item.size}</Text>
                              <Text type="secondary">
                                {fmtDateTime(item.uploadedAt)}
                              </Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无附件" />
                )}
              </div>
            )}
          </Card>
        </Col>

        <Col span={24} style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Space>
            <Button onClick={() => setAssignModalOpen(true)} icon={<TeamOutlined />}>
              分配处理人
            </Button>
            <Button onClick={() => openStatusModal('IN_PROGRESS')} icon={<SyncOutlined />}>
              开始处理
            </Button>
            <Button onClick={() => setSupplierModalOpen(true)} icon={<SwapOutlined />}>
              转供应商
            </Button>
            <Button danger onClick={handleEscalate} icon={<ArrowUpOutlined />}>
              升级
            </Button>
            {detail?.status === 'CLOSED' ? (
              <Button type="primary" onClick={handleReopen} icon={<SyncOutlined />}>
                重新打开
              </Button>
            ) : (
              <Button danger onClick={handleClose} icon={<CloseOutlined />}>
                关闭
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      <Modal
        title="分配处理人"
        open={assignModalOpen}
        onCancel={() => { setAssignModalOpen(false); assignForm.resetFields(); }}
        onOk={handleAssign}
        confirmLoading={modalLoading}
        okText="确认分配"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="handlerId"
            label="选择处理人"
            rules={[{ required: true, message: '请选择处理人' }]}
          >
            <Select placeholder="请选择处理人" showSearch optionFilterProp="children">
              {handlerOptions.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.name || u.username}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="分配说明（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="更新状态"
        open={statusModalOpen}
        onCancel={() => { setStatusModalOpen(false); statusForm.resetFields(); }}
        onOk={handleStatusChange}
        confirmLoading={modalLoading}
        okText="确认"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item name="remark" label="说明">
            <TextArea rows={3} placeholder="状态变更说明（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="转供应商处理"
        open={supplierModalOpen}
        onCancel={() => setSupplierModalOpen(false)}
        onOk={async () => {
          try {
            setModalLoading(true);
            await exceptionApi.setStatus(id, { status: 'PENDING_SUPPLIER' });
            msg.success('已转供应商处理');
            setSupplierModalOpen(false);
            fetchDetail();
          } catch (e) {
          } finally {
            setModalLoading(false);
          }
        }}
        confirmLoading={modalLoading}
        okText="确认"
        cancelText="取消"
      >
        <p>确定要将此异常转交给供应商处理吗？供应商将收到通知并进行响应。</p>
      </Modal>

      <FloatButton.BackTop />
    </div>
  );
}
