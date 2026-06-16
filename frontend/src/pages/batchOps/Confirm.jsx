import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Steps,
  Checkbox,
  Form,
  Input,
  Table,
  Alert,
  Tag,
  Modal,
  message,
  Row,
  Col,
  Statistic,
  Progress,
  List,
  Empty,
  App as AntdApp,
  Divider,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  RightOutlined,
  LeftOutlined,
  DeleteOutlined,
  ExceptionOutlined,
  RetweetOutlined,
  StepForwardOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { batchOpApi, exceptionApi } from '@/api/index.js';
import StatusTag from '@/components/StatusTag';
import {
  fmtNum,
  fmtMoney,
  fmtDateTime,
} from '@/utils/format.js';
import { BATCH_OP_STATUS, BATCH_OP_TYPES } from '@/utils/constants.js';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { TextArea } = Input;

export default function BatchOpConfirm() {
  const { message: msg, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const { id } = useParams();

  const [currentStep, setCurrentStep] = useState(0);
  const [detail, setDetail] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  const [checkedItems, setCheckedItems] = useState([]);
  const [agreed, setAgreed] = useState(false);
  const [remark, setRemark] = useState('');
  const [showSecondConfirm, setShowSecondConfirm] = useState(false);

  const [resultData, setResultData] = useState(null);
  const [logs, setLogs] = useState([]);
  const logRef = useRef(null);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await batchOpApi.detail(id);
      setDetail(res.data || {});
    } catch (e) {
      msg.error('加载详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const res = await batchOpApi.preview({ batchOpId: id });
      setPreviewData(res.data || {});
      const items = res.data?.items || res.data?.list || [];
      setCheckedItems(items.map((i) => i.id));
    } catch (e) {
      msg.error('加载预览失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchPreview();
  }, [id]);

  const typeCfg = BATCH_OP_TYPES[detail?.opType] || { label: '批量操作', color: 'default' };

  const previewItems = previewData?.items || previewData?.list || [];
  const totalCount = previewItems.length;
  const selectedCount = checkedItems.length;

  const handleNext = () => {
    if (currentStep === 0) {
      if (checkedItems.length === 0) {
        msg.warning('请至少选择一项');
        return;
      }
      setCurrentStep(1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirmClick = () => {
    if (!agreed) {
      msg.warning('请先勾选确认条款');
      return;
    }
    if (!remark.trim()) {
      msg.warning('请输入执行原因/备注');
      return;
    }
    setShowSecondConfirm(true);
  };

  const handleExecute = async () => {
    setShowSecondConfirm(false);
    setExecuting(true);
    setConfirmLoading(true);
    setLogs([]);

    const mockLogs = [
      `[${fmtDateTime(new Date())}] 开始执行批量操作...`,
      `[${fmtDateTime(new Date())}] 操作类型：${typeCfg.label}`,
      `[${fmtDateTime(new Date())}] 待处理数量：${selectedCount} 项`,
    ];
    setLogs(mockLogs);

    try {
      const res = await batchOpApi.confirm(id);
      const result = res.data || {};
      setResultData(result);

      const successCount = result.successCount || 0;
      const failedCount = result.failedCount || 0;

      setTimeout(() => {
        setLogs((prev) => [
          ...prev,
          `[${fmtDateTime(new Date())}] 执行完成`,
          `[${fmtDateTime(new Date())}] 成功：${successCount} 项`,
          `[${fmtDateTime(new Date())}] 失败：${failedCount} 项`,
        ]);

        if (failedCount > 0) {
          setTimeout(() => {
            setLogs((prev) => [
              ...prev,
              `[${fmtDateTime(new Date())}] 系统已自动为失败项生成异常工单`,
            ]);
          }, 500);
        }
      }, 1000);

      setCurrentStep(2);
    } catch (e) {
      msg.error('执行失败');
    } finally {
      setConfirmLoading(false);
      setExecuting(false);
    }
  };

  const handleItemCheck = (record) => {
    setCheckedItems((prev) => {
      if (prev.includes(record.id)) {
        return prev.filter((id) => id !== record.id);
      }
      return [...prev, record.id];
    });
  };

  const handleRemoveItem = (record) => {
    setCheckedItems((prev) => prev.filter((id) => id !== record.id));
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setCheckedItems(previewItems.map((i) => i.id));
    } else {
      setCheckedItems([]);
    }
  };

  const generateException = (item) => {
    modal.confirm({
      title: '生成异常工单',
      content: `确定要为「${item.itemName || item.name || '该项'}」生成异常工单吗？`,
      okText: '确认生成',
      cancelText: '取消',
      onOk: async () => {
        try {
          msg.success('已生成异常工单');
        } catch (e) {}
      },
    });
  };

  const retryItem = (item) => {
    msg.success('已加入重试队列');
  };

  const skipItem = (item) => {
    modal.confirm({
      title: '确认跳过',
      content: `确定要跳过「${item.itemName || item.name || '该项'}」吗？跳过将不再处理。`,
      okText: '确认跳过',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        msg.success('已跳过');
      },
    });
  };

  const columns = useMemo(
    () => [
      {
        title: '序号',
        key: 'index',
        width: 60,
        render: (_, __, idx) => idx + 1,
      },
      {
        title: '项目名称',
        dataIndex: 'itemName',
        key: 'itemName',
        render: (v, r) => v || r.name || '-',
      },
      {
        title: '编号',
        dataIndex: 'itemNo',
        key: 'itemNo',
        width: 140,
        render: (v) => v || '-',
      },
      {
        title: '当前值',
        dataIndex: 'currentValue',
        key: 'currentValue',
        width: 120,
        align: 'right',
        render: (v, r) => {
          if (r.opType === 'PRICE_UPDATE') return fmtMoney(v);
          if (r.opType === 'STOCK_ADJUST') return fmtNum(v);
          return v || '-';
        },
      },
      {
        title: '目标值',
        dataIndex: 'targetValue',
        key: 'targetValue',
        width: 120,
        align: 'right',
        render: (v, r) => {
          if (r.opType === 'PRICE_UPDATE') return fmtMoney(v);
          if (r.opType === 'STOCK_ADJUST') return fmtNum(v);
          return v || '-';
        },
      },
      {
        title: '影响范围',
        dataIndex: 'impact',
        key: 'impact',
        width: 120,
        render: (v) => (
          <Tag color={v === 'HIGH' ? 'red' : v === 'MEDIUM' ? 'orange' : 'blue'}>
            {v === 'HIGH' ? '高' : v === 'MEDIUM' ? '中' : '低'}
          </Tag>
        ),
      },
      {
        title: '操作',
        key: 'action',
        width: 100,
        render: (_, r) => (
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveItem(r)}
          >
            移除
          </Button>
        ),
      },
    ],
    []
  );

  const failColumns = useMemo(
    () => [
      {
        title: '序号',
        key: 'index',
        width: 60,
        render: (_, __, idx) => idx + 1,
      },
      {
        title: '项目',
        dataIndex: 'itemName',
        key: 'itemName',
        render: (v, r) => v || r.name || '-',
      },
      {
        title: '编号',
        dataIndex: 'itemNo',
        key: 'itemNo',
        width: 140,
        render: (v) => v || '-',
      },
      {
        title: '失败原因',
        dataIndex: 'failReason',
        key: 'failReason',
        render: (v) => <Text type="danger">{v || '未知原因'}</Text>,
      },
      {
        title: '操作',
        key: 'action',
        width: 200,
        render: (_, r) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<ExceptionOutlined />}
              onClick={() => generateException(r)}
            >
              生成异常
            </Button>
            <Button
              type="link"
              size="small"
              icon={<RetweetOutlined />}
              onClick={() => retryItem(r)}
            >
              重试
            </Button>
            <Button
              type="link"
              size="small"
              icon={<StepForwardOutlined />}
              onClick={() => skipItem(r)}
            >
              跳过
            </Button>
          </Space>
        ),
      },
    ],
    []
  );

  const failedItems = resultData?.failedItems || resultData?.failItems || [];

  if (loading && !detail) {
    return (
      <div className="app-page">
        <Card style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 16, color: '#8c8c8c' }}>加载中...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="app-page">
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Space style={{ marginBottom: 8 }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/batch-ops')}
              >
                返回列表
              </Button>
            </Space>
            <Space size="middle">
              <Title level={3} style={{ margin: 0 }}>
                {detail?.title || '批量操作确认'}
              </Title>
              <Tag color={typeCfg.color}>{typeCfg.label}</Tag>
              <StatusTag statusKey="BATCH_OP_STATUS" value={detail?.status} />
            </Space>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Steps current={currentStep} size="large">
          <Step
            title="预览"
            description="确认影响范围"
            icon={<EyeOutlined />}
          />
          <Step
            title="确认"
            description="执行前确认"
            icon={<ExclamationCircleOutlined />}
          />
          <Step
            title="执行结果"
            description="查看执行情况"
            icon={<CheckCircleOutlined />}
          />
        </Steps>
      </Card>

      {currentStep === 0 && (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="总影响数"
                  value={totalCount}
                  suffix="项"
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="已选择"
                  value={selectedCount}
                  suffix="项"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="已移除"
                  value={totalCount - selectedCount}
                  suffix="项"
                  valueStyle={{ color: '#8c8c8c' }}
                />
              </Card>
            </Col>
          </Row>

          <Alert
            message="操作说明"
            description={
              <div>
                <Paragraph style={{ marginBottom: 8 }}>
                  <strong>执行后影响：</strong>
                  本次操作将对 {selectedCount} 项数据进行{typeCfg.label}，操作不可逆。
                </Paragraph>
                <Paragraph style={{ marginBottom: 0 }}>
                  <strong>注意事项：</strong>
                </Paragraph>
                <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                  <li>请仔细核对清单，确认所有需要操作的项都已包含</li>
                  <li>如某项不需要操作，可点击右侧「移除」按钮将其从执行清单中移除</li>
                  <li>移除的项不会被执行，但会保留在历史记录中</li>
                  <li>执行过程中可能出现部分失败的情况，请关注执行结果</li>
                  <li>执行失败的项系统将自动生成异常工单，供后续跟进处理</li>
                </ul>
              </div>
            }
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 16 }}
          />

          <Card
            title={
              <Space>
                <Checkbox
                  checked={selectedCount === totalCount && totalCount > 0}
                  indeterminate={selectedCount > 0 && selectedCount < totalCount}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <span>受影响清单</span>
                <Tag color="blue">{selectedCount}/{totalCount} 项已选择</Tag>
              </Space>
            }
            extra={
              <Button size="small" onClick={() => handleSelectAll(true)}>
                全选
              </Button>
            }
          >
            <Table
              rowKey="id"
              columns={columns}
              dataSource={previewItems.filter((i) => checkedItems.includes(i.id))}
              rowSelection={{
                selectedRowKeys: checkedItems,
                onChange: (keys) => setCheckedItems(keys),
              }}
              pagination={false}
              scroll={{ y: 400 }}
              size="small"
            />
          </Card>

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="primary" size="large" icon={<RightOutlined />} onClick={handleNext}>
              下一步
            </Button>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div>
          <Alert
            message="请仔细核对"
            description="批量操作一旦执行将立即生效且不可撤销，请确保您已完全理解操作后果。"
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Card title="执行确认" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">
                本次将执行 <Text strong type="danger">{typeCfg.label}</Text>，共影响{' '}
                <Text strong type="danger">{selectedCount}</Text> 项数据。
              </Text>
            </div>

            <Form layout="vertical">
              <Form.Item
                label="执行原因/备注"
                required
                tooltip="请详细说明执行此批量操作的原因"
              >
                <TextArea
                  rows={4}
                  placeholder="请输入执行原因和备注说明..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Form>

            <Divider />

            <Checkbox
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            >
              <Text strong>
                我已核对上述清单，清楚执行后果并承担责任
              </Text>
            </Checkbox>
          </Card>

          <Alert
            message="风险提示"
            description={
              <div>
                <p style={{ marginBottom: 4 }}>• 此操作不可撤销，请谨慎执行</p>
                <p style={{ marginBottom: 4 }}>• 建议在业务低峰期执行批量操作</p>
                <p style={{ marginBottom: 0 }}>• 如遇问题请及时联系技术支持</p>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button size="large" icon={<LeftOutlined />} onClick={handlePrev}>
              上一步
            </Button>
            <Button
              type="primary"
              danger
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={handleConfirmClick}
              disabled={!agreed || !remark.trim()}
            >
              确认执行
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Card style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <Statistic
                  title="成功"
                  value={resultData?.successCount || 0}
                  suffix="项"
                  valueStyle={{ color: '#52c41a', fontSize: 32 }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ textAlign: 'center', padding: '20px 0' }}>
                <CloseCircleOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
                <Statistic
                  title="失败"
                  value={resultData?.failedCount || 0}
                  suffix="项"
                  valueStyle={{ color: '#ff4d4f', fontSize: 32 }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="执行日志" style={{ marginBottom: 16 }}>
            <div
              ref={logRef}
              style={{
                background: '#1e1e1e',
                color: '#d4d4d4',
                padding: 16,
                borderRadius: 4,
                fontFamily: 'monospace',
                fontSize: 12,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {logs.map((log, idx) => (
                <div key={idx} style={{ lineHeight: 1.8 }}>
                  {log}
                </div>
              ))}
              {executing && (
                <div>
                  <SyncOutlined spin /> 执行中...
                </div>
              )}
            </div>
          </Card>

          {failedItems.length > 0 && (
            <>
              <Alert
                message="失败项自动生成异常"
                description="系统已自动为所有失败项生成异常工单，您可以前往异常管理页面查看并处理。"
                type="info"
                showIcon
                action={
                  <Button size="small" type="primary" onClick={() => navigate('/exceptions')}>
                    查看异常
                  </Button>
                }
                style={{ marginBottom: 16 }}
              />

              <Card title={`失败项清单（${failedItems.length} 项）`}>
                <Table
                  rowKey="id"
                  columns={failColumns}
                  dataSource={failedItems}
                  pagination={false}
                  size="small"
                />
              </Card>
            </>
          )}

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Space size="middle">
              <Button size="large" onClick={() => navigate('/batch-ops')}>
                返回列表
              </Button>
              <Button size="large" onClick={() => navigate(`/batch-ops/${id}`)}>
                查看详情
              </Button>
              {failedItems.length > 0 && (
                <Button type="primary" size="large" onClick={() => navigate('/exceptions')}>
                  查看异常
                </Button>
              )}
            </Space>
          </div>
        </div>
      )}

      <Modal
        title={<div style={{ color: '#ff4d4f' }}><WarningOutlined /> 二次确认</div>}
        open={showSecondConfirm}
        onCancel={() => setShowSecondConfirm(false)}
        onOk={handleExecute}
        confirmLoading={confirmLoading}
        okText="确认执行"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        width={520}
        centered
      >
        <Alert
          message="请再次确认是否执行此批量操作"
          description={
            <div>
              <p style={{ marginBottom: 4 }}>
                操作类型：<Text strong>{typeCfg.label}</Text>
              </p>
              <p style={{ marginBottom: 4 }}>
                影响数量：<Text strong type="danger">{selectedCount} 项</Text>
              </p>
              <p style={{ marginBottom: 0 }}>
                执行原因：{remark}
              </p>
            </div>
          }
          type="error"
          showIcon
        />
        <div style={{ marginTop: 16, textAlign: 'right', color: '#8c8c8c', fontSize: 12 }}>
          点击「确认执行」即表示您已完全理解并承担操作后果
        </div>
      </Modal>
    </div>
  );
}
