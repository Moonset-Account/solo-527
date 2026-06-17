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
import { SearchOutlined, EyeOutlined, BellOutlined, CheckOutlined, CloseOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { waitlistApi } from '../../api';

const { Option } = Select;
const { confirm } = Modal;

const statusMap = {
  waiting: { text: '等待中', color: 'orange' },
  notified: { text: '已通知', color: 'blue' },
  confirmed: { text: '已确认', color: 'green' },
  cancelled: { text: '已取消', color: 'default' },
  expired: { text: '已过期', color: 'red' },
};

function WaitlistManage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await waitlistApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setData(result.items);
      setPagination(prev => ({ ...prev, total: result.total }));
    } catch (error) {
      console.error('加载候补队列失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    setFilters(prev => ({ ...prev, ...values }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleViewDetail = async (record) => {
    try {
      const detail = await waitlistApi.getDetail(record.id);
      setCurrentRecord(detail);
      setDetailVisible(true);
    } catch (error) {
      message.error('加载详情失败');
    }
  };

  const handleNotify = (record) => {
    confirm({
      title: '通知候补客户？',
      content: '通知后客户将有一定时间确认是否接受预约，请确保有空位。',
      onOk: async () => {
        try {
          await waitlistApi.notify(record.id);
          message.success('已发送通知');
          loadData();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleConfirm = (record) => {
    confirm({
      title: '确认候补转为预约？',
      content: '确认后将为该客户创建正式预约，候补记录将标记为已确认。',
      onOk: async () => {
        try {
          await waitlistApi.confirm(record.id);
          message.success('已确认并创建预约');
          loadData();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleCancel = (record) => {
    Modal.confirm({
      title: '取消候补',
      content: '请输入取消原因：',
      onOk: async () => {
        try {
          await waitlistApi.cancel(record.id, { reason: '调度员取消' });
          message.success('已取消候补');
          loadData();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleExpire = (record) => {
    confirm({
      title: '标记为过期？',
      content: '客户超时未确认，将该候补标记为过期并释放名额。',
      onOk: async () => {
        try {
          await waitlistApi.expire(record.id);
          message.success('已标记为过期');
          loadData();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '队列位置',
      dataIndex: 'queuePosition',
      key: 'queuePosition',
      width: 80,
      render: (pos) => (
        <span style={{ fontWeight: 700, color: '#1890ff' }}>第 {pos} 位</span>
      ),
    },
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
      title: '期望日期',
      dataIndex: 'preferredDate',
      key: 'preferredDate',
      width: 110,
    },
    {
      title: '期望时间',
      key: 'time',
      width: 130,
      render: (_, record) => (
        <span>
          {record.preferredStartTime || '--'}
          {record.preferredEndTime ? ` - ${record.preferredEndTime}` : ''}
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
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'waiting' && (
            <Button size="small" type="primary" icon={<BellOutlined />} onClick={() => handleNotify(record)}>
              通知
            </Button>
          )}
          {record.status === 'notified' && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleConfirm(record)}>
                确认
              </Button>
              <Button size="small" icon={<ClockCircleOutlined />} onClick={() => handleExpire(record)}>
                过期
              </Button>
            </>
          )}
          {(record.status === 'waiting' || record.status === 'notified') && (
            <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleCancel(record)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="候补队列管理">
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="搜索客户/咨询师"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 140 }}
              onChange={(value) => handleSearch({ status: value })}
            >
              {Object.entries(statusMap).map(([key, value]) => (
                <Option key={key} value={key}>{value.text}</Option>
              ))}
            </Select>
            <DatePicker
              placeholder="期望日期"
              onChange={(date) => handleSearch({ preferredDate: date?.format('YYYY-MM-DD') })}
              allowClear
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
        title="候补详情"
        placement="right"
        width={500}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="状态">
              <Tag color={statusMap[currentRecord.status]?.color}>
                {statusMap[currentRecord.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="队列位置">第 {currentRecord.queuePosition} 位</Descriptions.Item>
            <Descriptions.Item label="客户姓名">{currentRecord.client?.name}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{currentRecord.client?.phone}</Descriptions.Item>
            <Descriptions.Item label="咨询师">{currentRecord.counselor?.name}</Descriptions.Item>
            <Descriptions.Item label="期望日期">{currentRecord.preferredDate}</Descriptions.Item>
            <Descriptions.Item label="期望时间">
              {currentRecord.preferredStartTime || '--'}
              {currentRecord.preferredEndTime ? ` - ${currentRecord.preferredEndTime}` : ''}
            </Descriptions.Item>
            <Descriptions.Item label="服务项目">{currentRecord.service?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="来访原因">{currentRecord.visitReason || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注">{currentRecord.remarks || '-'}</Descriptions.Item>
            <Descriptions.Item label="通知时间">
              {currentRecord.notifiedAt ? new Date(currentRecord.notifiedAt).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="确认时间">
              {currentRecord.confirmedAt ? new Date(currentRecord.confirmedAt).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="加入时间">
              {new Date(currentRecord.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}

export default WaitlistManage;
