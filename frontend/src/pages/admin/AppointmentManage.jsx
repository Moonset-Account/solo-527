import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  message,
  Drawer,
  Descriptions,
} from 'antd';
import { SearchOutlined, EyeOutlined, CheckOutlined, CloseOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { appointmentApi, refundsApi } from '../../api';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { confirm } = Modal;
const { TextArea } = Input;

const statusMap = {
  pending: { text: '待确认', color: 'orange' },
  confirmed: { text: '已确认', color: 'blue' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'default' },
  no_show: { text: '爽约', color: 'red' },
  in_waitlist: { text: '候补中', color: 'purple' },
};

const paymentStatusMap = {
  unpaid: { text: '未支付', color: 'orange' },
  paid: { text: '已支付', color: 'green' },
  failed: { text: '支付失败', color: 'red' },
  refunded: { text: '已退款', color: 'default' },
  partial_refund: { text: '部分退款', color: 'blue' },
};

function AppointmentManage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [refundVisible, setRefundVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await appointmentApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setData(result.items);
      setPagination(prev => ({ ...prev, total: result.total }));
    } catch (error) {
      console.error('加载预约失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    setFilters(prev => ({
      ...prev,
      ...values,
      startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleViewDetail = async (record) => {
    try {
      const detail = await appointmentApi.getDetail(record.id);
      setCurrentRecord(detail);
      setDetailVisible(true);
    } catch (error) {
      message.error('加载详情失败');
    }
  };

  const handleConfirm = (record) => {
    confirm({
      title: '确认预约？',
      content: '确认后该预约将生效，请确保已与客户沟通确认。',
      onOk: async () => {
        try {
          await appointmentApi.confirm(record.id);
          message.success('已确认预约');
          loadData();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleCancel = (record) => {
    Modal.confirm({
      title: '取消预约',
      content: (
        <Form form={form} layout="vertical">
          <Form.Item
            label="取消原因"
            name="reason"
            rules={[{ required: true, message: '请输入取消原因' }]}
          >
            <TextArea rows={3} placeholder="请输入取消原因" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        try {
          const values = await form.validateFields();
          await appointmentApi.cancel(record.id, {
            reason: values.reason,
            cancelledBy: 'dispatcher',
          });
          message.success('已取消预约');
          loadData();
          form.resetFields();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleComplete = (record) => {
    Modal.confirm({
      title: '完成预约',
      content: (
        <Form form={form} layout="vertical">
          <Form.Item label="咨询师备注" name="counselorNotes">
            <TextArea rows={3} placeholder="请输入咨询小结（选填）" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        try {
          const values = await form.validateFields();
          await appointmentApi.complete(record.id, { counselorNotes: values.counselorNotes || '' });
          message.success('已完成预约');
          loadData();
          form.resetFields();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleNoShow = (record) => {
    confirm({
      title: '标记为爽约？',
      content: '标记后该记录将计入爽约率统计，确定吗？',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await appointmentApi.noShow(record.id);
          message.success('已标记为爽约');
          loadData();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleRefund = (record) => {
    setCurrentRecord(record);
    setRefundVisible(true);
  };

  const handleRefundSubmit = async (values) => {
    try {
      await refundsApi.create({
        appointmentId: currentRecord.id,
        reason: values.reason,
        description: values.description,
        refundAmount: values.refundAmount,
      });
      message.success('退款申请已创建');
      setRefundVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '客户',
      dataIndex: ['client', 'name'],
      key: 'client',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: ['client', 'phone'],
      key: 'phone',
      width: 120,
    },
    {
      title: '咨询师',
      dataIndex: ['counselor', 'name'],
      key: 'counselor',
      width: 100,
    },
    {
      title: '咨询时间',
      key: 'time',
      width: 180,
      render: (_, record) => (
        <span>
          {record.appointmentDate}
          <br />
          <span style={{ color: '#999', fontSize: 12 }}>
            {record.startTime} - {record.endTime}
          </span>
        </span>
      ),
    },
    {
      title: '服务项目',
      dataIndex: ['service', 'name'],
      key: 'service',
      render: (v) => v || '-',
    },
    {
      title: '预约状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '支付状态',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 100,
      render: (status) => {
        const info = paymentStatusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => <span style={{ color: '#ff4d4f' }}>¥{amount}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleConfirm(record)}>
                确认
              </Button>
              <Button size="small" danger onClick={() => handleCancel(record)}>
                取消
              </Button>
            </>
          )}
          {record.status === 'confirmed' && (
            <>
              <Button size="small" type="primary" onClick={() => handleComplete(record)}>
                完成
              </Button>
              <Button size="small" danger icon={<ClockCircleOutlined />} onClick={() => handleNoShow(record)}>
                爽约
              </Button>
            </>
          )}
          {record.paymentStatus === 'paid' && record.status === 'cancelled' && (
            <Button size="small" onClick={() => handleRefund(record)}>
              退款
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="预约管理">
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="搜索客户/咨询师"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              allowClear
              onPressEnter={(e) => handleSearch({ keyword: e.target.value })}
            />
            <Select
              placeholder="预约状态"
              allowClear
              style={{ width: 140 }}
              onChange={(value) => handleSearch({ status: value })}
            >
              {Object.entries(statusMap).map(([key, value]) => (
                <Option key={key} value={key}>{value.text}</Option>
              ))}
            </Select>
            <Select
              placeholder="支付状态"
              allowClear
              style={{ width: 140 }}
              onChange={(value) => handleSearch({ paymentStatus: value })}
            >
              {Object.entries(paymentStatusMap).map(([key, value]) => (
                <Option key={key} value={key}>{value.text}</Option>
              ))}
            </Select>
            <RangePicker
              onChange={(dates) => handleSearch({ dateRange: dates })}
            />
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
          }}
        />
      </Card>

      <Drawer
        title="预约详情"
        placement="right"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="预约状态">
              <Tag color={statusMap[currentRecord.status]?.color}>
                {statusMap[currentRecord.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="支付状态">
              <Tag color={paymentStatusMap[currentRecord.paymentStatus]?.color}>
                {paymentStatusMap[currentRecord.paymentStatus]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="客户姓名">{currentRecord.client?.name}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{currentRecord.client?.phone}</Descriptions.Item>
            <Descriptions.Item label="咨询师">{currentRecord.counselor?.name}</Descriptions.Item>
            <Descriptions.Item label="咨询日期">{currentRecord.appointmentDate}</Descriptions.Item>
            <Descriptions.Item label="咨询时间">
              {currentRecord.startTime} - {currentRecord.endTime}
            </Descriptions.Item>
            <Descriptions.Item label="服务项目">{currentRecord.service?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="费用">¥{currentRecord.amount}</Descriptions.Item>
            <Descriptions.Item label="来访原因">{currentRecord.visitReason || '-'}</Descriptions.Item>
            <Descriptions.Item label="客户备注">{currentRecord.clientNotes || '-'}</Descriptions.Item>
            <Descriptions.Item label="咨询师备注">{currentRecord.counselorNotes || '-'}</Descriptions.Item>
            <Descriptions.Item label="取消原因">{currentRecord.cancelReason || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(currentRecord.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      <Modal
        title="创建退款申请"
        open={refundVisible}
        onCancel={() => setRefundVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleRefundSubmit}>
          <Form.Item
            label="退款金额"
            name="refundAmount"
            rules={[{ required: true, message: '请输入退款金额' }]}
            initialValue={currentRecord?.amount}
          >
            <Input type="number" prefix="¥" />
          </Form.Item>
          <Form.Item
            label="退款原因"
            name="reason"
            rules={[{ required: true, message: '请选择退款原因' }]}
          >
            <Select>
              <Option value="client_cancel">客户取消</Option>
              <Option value="counselor_cancel">咨询师取消</Option>
              <Option value="no_show">爽约退款</Option>
              <Option value="service_issue">服务问题</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item label="详细说明" name="description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交</Button>
              <Button onClick={() => setRefundVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AppointmentManage;
