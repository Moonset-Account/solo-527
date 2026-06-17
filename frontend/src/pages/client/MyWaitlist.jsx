import { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Space, Modal, message, Empty } from 'antd';
import { waitlistApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

const { confirm } = Modal;

const statusMap = {
  waiting: { text: '等待中', color: 'orange' },
  notified: { text: '已通知', color: 'blue' },
  confirmed: { text: '已确认', color: 'green' },
  cancelled: { text: '已取消', color: 'default' },
  expired: { text: '已过期', color: 'red' },
};

function MyWaitlist() {
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
      const result = await waitlistApi.getMyWaitlist({
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setData(result.items);
      setPagination(prev => ({ ...prev, total: result.total }));
    } catch (error) {
      console.error('加载候补队列失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (record) => {
    confirm({
      title: '确认取消候补？',
      content: '取消后将不再收到空位通知，确定要取消吗？',
      okText: '确认取消',
      cancelText: '再等等',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await waitlistApi.cancel(record.id, { reason: '客户取消' });
          message.success('已取消候补');
          loadData();
        } catch (error) {
          message.error('取消失败');
        }
      },
    });
  };

  const handleConfirm = (record) => {
    confirm({
      title: '确认接受预约？',
      content: '确认后将为您安排此次咨询，请确保您能按时参加。',
      okText: '确认预约',
      cancelText: '再想想',
      onOk: async () => {
        try {
          await waitlistApi.confirm(record.id);
          message.success('已确认预约');
          loadData();
        } catch (error) {
          message.error('确认失败');
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
      title: '期望日期',
      dataIndex: 'preferredDate',
      key: 'preferredDate',
      width: 120,
    },
    {
      title: '期望时间',
      key: 'time',
      width: 140,
      render: (_, record) => (
        <span>
          {record.preferredStartTime || '--'}
          {record.preferredEndTime ? ` - ${record.preferredEndTime}` : ''}
        </span>
      ),
    },
    {
      title: '队列位置',
      dataIndex: 'queuePosition',
      key: 'queuePosition',
      width: 100,
      render: (pos) => <span style={{ fontWeight: 600, color: '#1890ff' }}>第 {pos} 位</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '来访原因',
      dataIndex: 'visitReason',
      key: 'visitReason',
      ellipsis: true,
    },
    {
      title: '加入时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space>
          {record.status === 'notified' && (
            <Button size="small" type="primary" onClick={() => handleConfirm(record)}>
              确认预约
            </Button>
          )}
          {(record.status === 'waiting' || record.status === 'notified') && (
            <Button size="small" danger onClick={() => handleCancel(record)}>
              取消候补
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="我的候补">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: <Empty description="暂无候补记录" /> }}
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

export default MyWaitlist;
