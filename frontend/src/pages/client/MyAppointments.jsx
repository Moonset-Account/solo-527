import { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Space, Modal, message, Empty } from 'antd';
import { appointmentApi, refundsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

const { confirm } = Modal;

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

function MyAppointments() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await appointmentApi.getMyAppointments({
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setData(result.items);
      setPagination(prev => ({ ...prev, total: result.total }));
    } catch (error) {
      console.error('加载预约失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (record) => {
    confirm({
      title: '确认取消预约？',
      content: '取消后名额将让给其他有需要的人，确定要取消吗？',
      okText: '确认取消',
      cancelText: '再想想',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await appointmentApi.cancel(record.id, {
            reason: '客户取消',
            cancelledBy: 'client',
          });
          message.success('已取消预约');
          loadData();
        } catch (error) {
          message.error('取消失败');
        }
      },
    });
  };

  const handleRefund = (record) => {
    confirm({
      title: '申请退款',
      content: '确定要申请退款吗？退款将在审核通过后原路返回。',
      okText: '申请退款',
      cancelText: '取消',
      onOk: async () => {
        try {
          await refundsApi.create({
            appointmentId: record.id,
            reason: 'client_cancel',
            description: '客户取消预约申请退款',
            refundAmount: record.amount,
          });
          message.success('退款申请已提交');
          loadData();
        } catch (error) {
          message.error('申请失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '咨询师',
      dataIndex: ['counselor', 'name'],
      key: 'counselor',
      width: 120,
    },
    {
      title: '咨询日期',
      key: 'date',
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
      render: (text) => text || '-',
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
      title: '费用',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{amount}</span>,
    },
    {
      title: '预约时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          {(record.status === 'pending' || record.status === 'confirmed') && (
            <Button size="small" danger onClick={() => handleCancel(record)}>
              取消预约
            </Button>
          )}
          {record.paymentStatus === 'paid' && record.status === 'cancelled' && (
            <Button size="small" type="primary" onClick={() => handleRefund(record)}>
              申请退款
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="我的预约">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: <Empty description="暂无预约记录" /> }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
          }}
        />
      </Card>
    </div>
  );
}

export default MyAppointments;
