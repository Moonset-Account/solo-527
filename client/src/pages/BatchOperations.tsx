import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Select,
  Row,
  Col,
  Statistic,
  message,
  Modal,
  Form,
  Input,
  Alert,
  Tooltip,
  Checkbox
} from 'antd';
import {
  BatchOperationOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  SendOutlined,
  RedoOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { batchApi, orderApi } from '@/services/api';
import {
  OrderDto,
  OrderStatus,
  BatchOperationType,
  BatchProcessRequest,
  BatchProcessResult,
  BatchOperationItemDto,
  BatchItemStatus
} from '@/types';
import { formatDate, formatCurrency, getStatusText, getStatusColor } from '@/utils/format';

const { Option } = Select;
const { TextArea } = Input;
const { confirm } = Modal;

const getBatchTypeText = (type: BatchOperationType) => {
  const map: Record<BatchOperationType, string> = {
    [BatchOperationType.StartProduction]: '开始生产',
    [BatchOperationType.CompleteProduction]: '完成生产',
    [BatchOperationType.MarkAsDelivered]: '标记交付',
    [BatchOperationType.UpdateDeliveryDate]: '更新交付日期',
    [BatchOperationType.ExportOrders]: '导出订单'
  };
  return map[type] || type;
};

const getBatchItemStatusConfig = (status: BatchItemStatus) => {
  const configs: Record<BatchItemStatus, { color: string; text: string; icon: React.ReactNode }> = {
    [BatchItemStatus.Pending]: {
      color: 'default',
      text: '待处理',
      icon: <ReloadOutlined />
    },
    [BatchItemStatus.Processing]: {
      color: 'processing',
      text: '处理中',
      icon: <PlayCircleOutlined />
    },
    [BatchItemStatus.Success]: {
      color: 'success',
      text: '成功',
      icon: <CheckCircleOutlined />
    },
    [BatchItemStatus.Failed]: {
      color: 'error',
      text: '失败',
      icon: <CloseCircleOutlined />
    }
  };
  return configs[status] || configs[BatchItemStatus.Pending];
};

const BatchOperations: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchType, setBatchType] = useState<BatchOperationType>(BatchOperationType.StartProduction);
  const [operator, setOperator] = useState('');
  const [remarks, setRemarks] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchProcessResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await orderApi.getList({ pageSize: 100 });
      setOrders(response.data);
    } catch (error) {
      message.error('加载订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchExecute = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要批量操作的订单');
      return;
    }

    confirm({
      title: '确认批量操作',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>您即将对 <strong style={{ color: '#1890ff' }}>{selectedRowKeys.length}</strong> 个订单执行以下操作：</p>
          <p>
            <Tag color="blue">{getBatchTypeText(batchType)}</Tag>
          </p>
          <p style={{ color: '#faad14' }}>
            <WarningOutlined /> 此操作不可撤销，请确认后继续。
          </p>
        </div>
      ),
      okText: '确认执行',
      cancelText: '取消',
      onOk: () => {
        setModalVisible(true);
      }
    });
  };

  const executeBatchOperation = async () => {
    if (!operator.trim()) {
      message.warning('请输入操作人员');
      return;
    }

    setProcessing(true);
    try {
      const request: BatchProcessRequest = {
        operationName: getBatchTypeText(batchType),
        operator: operator.trim(),
        orderIds: selectedRowKeys.map(Number),
        operationType: batchType,
        remarks: remarks.trim() || null
      };

      const response = await batchApi.execute(request);
      setBatchResult(response.data);
      setShowResult(true);
      setModalVisible(false);
      
      if (response.data.failedCount === 0) {
        message.success(`批量操作成功，共处理 ${response.data.successCount} 个订单`);
      } else {
        message.warning(`批量操作完成，成功 ${response.data.successCount} 个，失败 ${response.data.failedCount} 个`);
      }
      
      loadOrders();
      setSelectedRowKeys([]);
    } catch (error) {
      message.error('批量操作执行失败');
    } finally {
      setProcessing(false);
    }
  };

  const handleRetry = async (item: BatchOperationItemDto) => {
    if (!item.canRetry) {
      message.warning('此项无法重试');
      return;
    }

    if (item.retryCount >= 3) {
      message.warning('重试次数已达上限（最多3次）');
      return;
    }

    confirm({
      title: '确认重试',
      icon: <RedoOutlined />,
      content: (
        <div>
          <p>订单编号: <strong>{item.orderNo}</strong></p>
          <p>错误原因: <span style={{ color: '#ff4d4f' }}>{item.errorMessage}</span></p>
          <p>已重试次数: {item.retryCount}/3</p>
        </div>
      ),
      okText: '确认重试',
      cancelText: '取消',
      onOk: async () => {
        setRetrying(true);
        try {
          await batchApi.retry(item.id, batchType);
          message.success(`订单 ${item.orderNo} 重试成功`);
          if (batchResult) {
            const updatedItems = batchResult.failedItems.map(i => 
              i.id === item.id ? { ...i, status: BatchItemStatus.Success } : i
            );
            setBatchResult({
              ...batchResult,
              successCount: batchResult.successCount + 1,
              failedCount: batchResult.failedCount - 1,
              failedItems: updatedItems.filter(i => i.status === BatchItemStatus.Failed)
            });
          }
        } catch (error) {
          message.error('重试失败');
        } finally {
          setRetrying(false);
        }
      }
    });
  };

  const handleRetryAll = async () => {
    if (!batchResult || batchResult.failedItems.length === 0) return;

    const retryableItems = batchResult.failedItems.filter(item => item.canRetry && item.retryCount < 3);
    if (retryableItems.length === 0) {
      message.warning('没有可重试的失败项');
      return;
    }

    confirm({
      title: '批量重试',
      icon: <RedoOutlined />,
      content: <p>即将对 <strong>{retryableItems.length}</strong> 个失败项进行重试</p>,
      okText: '确认重试',
      cancelText: '取消',
      onOk: async () => {
        setRetrying(true);
        let successCount = 0;
        for (const item of retryableItems) {
          try {
            await batchApi.retry(item.id, batchType);
            successCount++;
          } catch (error) {
            console.error(`重试订单 ${item.orderNo} 失败`, error);
          }
        }
        if (successCount > 0) {
          message.success(`成功重试 ${successCount} 个订单`);
          loadOrders();
        }
        if (successCount < retryableItems.length) {
          message.warning(`还有 ${retryableItems.length - successCount} 个订单重试失败`);
        }
        setShowResult(false);
        setBatchResult(null);
        setRetrying(false);
      }
    });
  };

  const availableOrders = orders.filter(order => {
    switch (batchType) {
      case BatchOperationType.StartProduction:
        return order.status === OrderStatus.Pending;
      case BatchOperationType.CompleteProduction:
        return order.status === OrderStatus.InProduction;
      case BatchOperationType.MarkAsDelivered:
        return order.status === OrderStatus.Completed;
      default:
        return true;
    }
  });

  const columns: ColumnsType<OrderDto> = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      fixed: 'left',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '门店',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 120
    },
    {
      title: '产品',
      dataIndex: 'productName',
      key: 'productName',
      width: 150
    },
    {
      title: '规格',
      dataIndex: 'specifications',
      key: 'specifications',
      width: 150
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (val, record) => `${val} ${record.unit}`
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (val) => <strong style={{ color: '#52c41a' }}>{formatCurrency(val)}</strong>
    },
    {
      title: '交付日期',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      width: 120,
      render: formatDate
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/orders/${record.id}`)}
        >
          详情
        </Button>
      )
    }
  ];

  const failedColumns: ColumnsType<BatchOperationItemDto> = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BatchItemStatus) => {
        const config = getBatchItemStatusConfig(status);
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '错误原因',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          <span style={{ color: '#ff4d4f' }}>{text}</span>
        </Tooltip>
      )
    },
    {
      title: '重试次数',
      dataIndex: 'retryCount',
      key: 'retryCount',
      width: 100,
      render: (count) => `${count}/3`
    },
    {
      title: '处理时间',
      dataIndex: 'processedAt',
      key: 'processedAt',
      width: 160,
      render: (date) => date ? formatDate(date) : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<RedoOutlined />}
          disabled={!record.canRetry || record.retryCount >= 3}
          onClick={() => handleRetry(record)}
        >
          重试
        </Button>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: OrderDto) => ({
      disabled: !availableOrders.some(o => o.id === record.id),
      name: record.orderNo
    })
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        bordered={false}
        title={
          <Space>
            <BatchOperationOutlined style={{ color: '#1890ff' }} />
            <span>批量处理</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadOrders} loading={loading}>
              刷新
            </Button>
          </Space>
        }
      >
        <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col span={6}>
              <Space>
                <span>操作类型:</span>
                <Select
                  value={batchType}
                  onChange={(val) => {
                    setBatchType(val);
                    setSelectedRowKeys([]);
                  }}
                  style={{ width: 160 }}
                >
                  <Option value={BatchOperationType.StartProduction}>开始生产</Option>
                  <Option value={BatchOperationType.CompleteProduction}>完成生产</Option>
                  <Option value={BatchOperationType.MarkAsDelivered}>标记交付</Option>
                </Select>
              </Space>
            </Col>
            <Col span={6}>
              <Space>
                <span>已选择:</span>
                <Tag color="blue">{selectedRowKeys.length} 项</Tag>
                <span>（可操作: {availableOrders.length} 项）</span>
              </Space>
            </Col>
            <Col span={6}>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleBatchExecute}
                disabled={selectedRowKeys.length === 0}
              >
                执行批量操作
              </Button>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Checkbox
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRowKeys(availableOrders.map(o => o.id));
                  } else {
                    setSelectedRowKeys([]);
                  }
                }}
                checked={selectedRowKeys.length === availableOrders.length && availableOrders.length > 0}
                disabled={availableOrders.length === 0}
              >
                全选可操作项
              </Checkbox>
            </Col>
          </Row>
        </Card>

        <Alert
          message="操作说明"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li><strong>开始生产</strong>: 仅可选择状态为"待处理"的订单</li>
              <li><strong>完成生产</strong>: 仅可选择状态为"生产中"的订单</li>
              <li><strong>标记交付</strong>: 仅可选择状态为"已完成"的订单</li>
              <li>批量操作前会进行二次确认，确认后将不可逆</li>
              <li>操作失败的项目会单独列出，支持最多3次重试</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title="批量操作确认"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form layout="vertical">
          <Alert
            message={
              <Space>
                <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                即将执行 {getBatchTypeText(batchType)} 操作
              </Space>
            }
            description={`共 ${selectedRowKeys.length} 个订单将被处理，请填写以下信息`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form.Item
            label="操作人员"
            required
          >
            <Input
              placeholder="请输入操作人员姓名"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="备注">
            <TextArea
              rows={3}
              placeholder="请输入操作备注（可选）"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                onClick={executeBatchOperation}
                loading={processing}
                icon={<SendOutlined />}
              >
                确认执行
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <BatchOperationOutlined />
            批量操作结果
          </Space>
        }
        open={showResult}
        onCancel={() => {
          setShowResult(false);
          setBatchResult(null);
        }}
        width={800}
        footer={[
          batchResult && batchResult.failedCount > 0 && (
            <Button
              key="retryAll"
              icon={<RedoOutlined />}
              onClick={handleRetryAll}
              loading={retrying}
              type="primary"
            >
              重试全部失败项
            </Button>
          ),
          <Button
            key="close"
            onClick={() => {
              setShowResult(false);
              setBatchResult(null);
            }}
          >
            关闭
          </Button>
        ]}
      >
        {batchResult && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" style={{ background: '#f6ffed' }}>
                  <Statistic
                    title="成功数量"
                    value={batchResult.successCount}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ background: batchResult.failedCount > 0 ? '#fff1f0' : '#f5f5f5' }}>
                  <Statistic
                    title="失败数量"
                    value={batchResult.failedCount}
                    valueStyle={{ color: batchResult.failedCount > 0 ? '#ff4d4f' : '#999' }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {batchResult.failedCount > 0 && (
              <Card
                title={
                  <Space>
                    <WarningOutlined style={{ color: '#ff4d4f' }} />
                    失败项列表
                  </Space>
                }
                size="small"
                type="inner"
              >
                <Table
                  columns={failedColumns}
                  dataSource={batchResult.failedItems}
                  rowKey="id"
                  size="small"
                  pagination={false}
                />
              </Card>
            )}

            {batchResult.failedCount === 0 && (
              <Alert
                message="所有订单处理成功！"
                type="success"
                showIcon
              />
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default BatchOperations;
