
import { useState, useEffect } from 'react';
import { Table, Card, Form, Select, DatePicker, Input, Button, Space, Tag, Row, Col, Modal, message, App } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined, EyeOutlined, BatchProcessingOutlined, ExportOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { orderApi, storeApi, batchApi, exportApi } from '@/services/api';
import { OrderDto, OrderStatus, StoreDto, BatchOperationType } from '@/types';
import { getOrderStatusText, getOrderStatusColor, formatDate, formatCurrency } from '@/utils/format';

const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderList = () => {
  const navigate = useNavigate();
  const { message: msg } = App.useApp();
  const [form] = Form.useForm();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [batchType, setBatchType] = useState<BatchOperationType | null>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportForm] = Form.useForm();

  useEffect(() => {
    loadStores();
    handleSearch();
  }, []);

  const loadStores = async () => {
    try {
      const res = await storeApi.getList();
      setStores(res.data);
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const params: any = {
        storeId: values.storeId,
        status: values.status,
        searchKeyword: values.keyword
      };
      if (values.dateRange) {
        params.startDate = values.dateRange[0]?.format('YYYY-MM-DD');
        params.endDate = values.dateRange[1]?.format('YYYY-MM-DD');
      }
      const res = await orderApi.getList(params);
      setOrders(res.data);
    } catch (error) {
      msg.error('加载订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    handleSearch();
  };

  const showBatchModal = (type: BatchOperationType) => {
    if (selectedRowKeys.length === 0) {
      msg.warning('请先选择要操作的订单');
      return;
    }
    setBatchType(type);
    setBatchModalVisible(true);
  };

  const handleBatchConfirm = async () => {
    if (!batchType) return;
    setLoading(true);
    try {
      const operationNames: Record<BatchOperationType, string> = {
        [BatchOperationType.StartProduction]: '批量开始生产',
        [BatchOperationType.CompleteProduction]: '批量完成生产',
        [BatchOperationType.MarkAsDelivered]: '批量标记交付',
        [BatchOperationType.UpdateDeliveryDate]: '批量更新交付日期',
        [BatchOperationType.ExportOrders]: '批量导出订单'
      };

      const res = await batchApi.execute({
        operationName: operationNames[batchType],
        operator: 'admin',
        orderIds: selectedRowKeys.map(k => Number(k)),
        operationType: batchType
      });

      if (res.data.failedCount > 0) {
        msg.warning(`批量操作完成，成功 ${res.data.successCount} 条，失败 ${res.data.failedCount} 条`);
        navigate('/batch-operations', { state: { failedItems: res.data.failedItems, batchId: res.data.batchOperationId } });
      } else {
        msg.success(`批量操作完成，成功 ${res.data.successCount} 条`);
      }
      setBatchModalVisible(false);
      setSelectedRowKeys([]);
      handleSearch();
    } catch (error) {
      msg.error('批量操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const values = exportForm.getFieldsValue();
      const params: any = {
        format: values.format || 'xlsx'
      };
      if (values.storeId) params.storeId = values.storeId;
      if (values.status) params.status = values.status;
      if (values.dateRange) {
        params.startDate = values.dateRange[0]?.format('YYYY-MM-DD');
        params.endDate = values.dateRange[1]?.format('YYYY-MM-DD');
      }

      const res = await exportApi.exportOrders(params);
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = values.format === 'csv' ? 'orders.csv' : 'orders.xlsx';
      link.download = `订单导出_${dayjs().format('YYYYMMDDHHmmss')}.${values.format || 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      msg.success('导出成功');
      setExportModalVisible(false);
    } catch (error) {
      msg.error('导出失败');
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      render: (text: string) => <a onClick={() => navigate(`/orders/${orders.find(o => o.orderNo === text)?.id}`)}>{text}</a>
    },
    {
      title: '门店',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 100
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 100
    },
    {
      title: '客户电话',
      dataIndex: 'customerPhone',
      key: 'customerPhone',
      width: 120
    },
    {
      title: '产品名称',
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
      render: (q: number, record: OrderDto) => `${q} ${record.unit}`
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      render: (v: number) => formatCurrency(v)
    },
    {
      title: '订单日期',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 110,
      render: (d: string) => formatDate(d)
    },
    {
      title: '交付日期',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      width: 110,
      render: (d: string, record: OrderDto) => {
        const isOverdue = dayjs(d).isBefore(dayjs()) && record.status !== OrderStatus.Delivered && record.status !== OrderStatus.Cancelled;
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {formatDate(d)}
            {isOverdue && <Tag color="error" style={{ marginLeft: 4 }}>逾期</Tag>}
          </span>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: OrderStatus) => (
        <Tag color={getOrderStatusColor(s)}>{getOrderStatusText(s)}</Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_: any, record: OrderDto) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/orders/${record.id}`)}>
            查看
          </Button>
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>订单管理</h2>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/orders/create')}>
              新增订单
            </Button>
          </Space>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="订单号/客户/产品" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="storeId" label="门店">
            <Select placeholder="全部" allowClear style={{ width: 150 }}>
              {stores.map(store => (
                <Option key={store.id} value={store.id}>{store.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 150 }}>
              {Object.values(OrderStatus).map(status => (
                <Option key={status} value={status}>{getOrderStatusText(status)}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="日期">
            <RangePicker />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        extra={
          <Space>
            <Button icon={<BatchProcessingOutlined />} onClick={() => showBatchModal(BatchOperationType.StartProduction)}>
              批量开始生产
            </Button>
            <Button icon={<BatchProcessingOutlined />} onClick={() => showBatchModal(BatchOperationType.CompleteProduction)}>
              批量完成生产
            </Button>
            <Button icon={<BatchProcessingOutlined />} onClick={() => showBatchModal(BatchOperationType.MarkAsDelivered)}>
              批量标记交付
            </Button>
            <Button icon={<ExportOutlined />} onClick={() => setExportModalVisible(true)}>
              导出
            </Button>
          </Space>
        }
      >
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title="批量操作确认"
        open={batchModalVisible}
        onOk={handleBatchConfirm}
        onCancel={() => setBatchModalVisible(false)}
        okText="确认执行"
        cancelText="取消"
        confirmLoading={loading}
      >
        <p>您确定要对选中的 <strong style={{ color: '#1890ff' }}>{selectedRowKeys.length}</strong> 条订单执行批量操作吗？</p>
        <p style={{ color: '#888', fontSize: 12 }}>此操作将更新订单状态，请谨慎操作。</p>
      </Modal>

      <Modal
        title="导出订单"
        open={exportModalVisible}
        onOk={handleExport}
        onCancel={() => setExportModalVisible(false)}
        okText="导出"
      >
        <Form form={exportForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="storeId" label="门店">
                <Select placeholder="全部" allowClear>
                  {stores.map(store => (
                    <Option key={store.id} value={store.id}>{store.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select placeholder="全部" allowClear>
                  {Object.values(OrderStatus).map(status => (
                    <Option key={status} value={status}>{getOrderStatusText(status)}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="format" label="导出格式" initialValue="xlsx">
            <Select>
              <Option value="xlsx">Excel (.xlsx)</Option>
              <Option value="csv">CSV (.csv)</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderList;
