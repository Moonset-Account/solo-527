import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Select,
  DatePicker,
  Input,
  message,
  Drawer,
  Descriptions,
  Badge,
  Row,
  Col,
} from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useReminderStore } from '@/store/reminderStore';
import {
  formatDateTime,
  REMINDER_LEVEL_COLORS,
  REMINDER_LEVEL_NAMES,
} from '@/utils';
import type { Reminder, ReminderLevel, ReminderStatus } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

export default function ReminderList() {
  const navigate = useNavigate();
  const {
    reminders,
    unreadCount,
    overdueCount,
    fetchReminders,
    fetchUnreadCount,
    handleReminder,
    isLoading,
  } = useReminderStore();

  const [filters, setFilters] = useState({
    status: undefined as ReminderStatus | undefined,
    level: undefined as ReminderLevel | undefined,
    search: '',
    date_range: undefined as [dayjs.Dayjs, dayjs.Dayjs] | undefined,
  });
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

  useEffect(() => {
    loadReminders();
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const loadReminders = () => {
    const params: Record<string, unknown> = {};
    if (filters.status) params.status = filters.status;
    if (filters.level) params.level = filters.level;
    if (filters.search) params.search = filters.search;
    if (filters.date_range) {
      params.start_date = filters.date_range[0].format('YYYY-MM-DD');
      params.end_date = filters.date_range[1].format('YYYY-MM-DD');
    }
    fetchReminders(params);
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await handleReminder(id, 'acknowledged');
      message.success('已确认');
      fetchUnreadCount();
    } catch {
      message.error('操作失败');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await handleReminder(id, 'resolved');
      message.success('已解决');
      fetchUnreadCount();
    } catch {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: ReminderLevel) => (
        <Badge
          color={REMINDER_LEVEL_COLORS[level]}
          text={REMINDER_LEVEL_NAMES[level]}
        />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Reminder) => (
        <div className="flex items-center gap-2">
          <span
            className={`font-medium cursor-pointer hover:text-primary-600 ${
              record.status === 'pending' ? 'text-gray-800' : 'text-gray-500'
            } ${record.is_overdue ? 'reminder-overdue' : ''}`}
            onClick={() => {
              setSelectedReminder(record);
              setShowDetailDrawer(true);
            }}
          >
            {text}
          </span>
          {record.is_overdue && (
            <Tag color="red" className="animate-pulse">已逾期</Tag>
          )}
        </div>
      ),
    },
    {
      title: '内容',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ReminderStatus) => {
        const statusMap: Record<ReminderStatus, { color: string; text: string }> = {
          pending: { color: 'red', text: '待处理' },
          acknowledged: { color: 'orange', text: '已确认' },
          resolved: { color: 'green', text: '已解决' },
          escalated: { color: 'purple', text: '已升级' },
        };
        return <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>;
      },
    },
    {
      title: '时限',
      dataIndex: 'due_at',
      key: 'due_at',
      width: 180,
      render: (date: string, record: Reminder) => (
        <div>
          <div className={`text-sm ${record.is_overdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
            <ClockCircleOutlined className="mr-1" />
            {formatDateTime(date)}
          </div>
          {record.is_overdue && (
            <div className="text-xs text-red-500">
              已逾期 {dayjs().diff(dayjs(date), 'hour')} 小时
            </div>
          )}
        </div>
      ),
    },
 {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: Reminder) => (
        <Space>
          {record.status === 'pending' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleAcknowledge(record.id)}
            >
              确认
            </Button>
          )}
          {record.status !== 'resolved' && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => handleResolve(record.id)}
            >
              解决
            </Button>
          )}
          <Button
            type="link"
            onClick={() => {
              setSelectedReminder(record);
              setShowDetailDrawer(true);
            }}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 m-0">
          <BellOutlined className="mr-2" />
          提醒中心
        </h1>
        <Space>
          <Badge count={unreadCount} offset={[-2, 2]}>
            <span className="text-gray-600">待处理: {unreadCount}</span>
          </Badge>
          {overdueCount > 0 && (
            <Badge count={`${overdueCount}逾期`} className="bg-red-500">
              <span className="text-red-600 font-medium"></span>
            </Badge>
          )}
          <Button onClick={() => navigate('/admin/reminders/rules')}>
            <ExclamationCircleOutlined />
            提醒规则
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-red-600 font-medium">1级 - 紧急</div>
                <div className="text-2xl font-bold text-red-700 mt-1">
                  {reminders.filter((r) => r.level === 1 && r.status === 'pending').length}
                </div>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                style={{ backgroundColor: REMINDER_LEVEL_COLORS[1] }}
              >
                !
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="bg-orange-50 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-orange-600 font-medium">2级 - 高</div>
                <div className="text-2xl font-bold text-orange-700 mt-1">
                  {reminders.filter((r) => r.level === 2 && r.status === 'pending').length}
                </div>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                style={{ backgroundColor: REMINDER_LEVEL_COLORS[2] }}
              >
                !!
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="bg-yellow-50 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-yellow-700 font-medium">3级 - 中</div>
                <div className="text-2xl font-bold text-yellow-800 mt-1">
                  {reminders.filter((r) => r.level === 3 && r.status === 'pending').length}
                </div>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                style={{ backgroundColor: REMINDER_LEVEL_COLORS[3] }}
              >
                !
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="状态"
              className="w-full"
              allowClear
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              <Option value="pending">待处理</Option>
              <Option value="acknowledged">已确认</Option>
              <Option value="resolved">已解决</Option>
              <Option value="escalated">已升级</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="级别"
              className="w-full"
              allowClear
              value={filters.level}
              onChange={(value) => setFilters({ ...filters, level: value })}
            >
              <Option value={1}>1级 - 紧急</Option>
              <Option value={2}>2级 - 高</Option>
              <Option value={3}>3级 - 中</Option>
              <Option value={4}>4级 - 低</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              className="w-full"
              value={filters.date_range}
              onChange={(dates) =>
                setFilters({ ...filters, date_range: dates as [dayjs.Dayjs, dayjs.Dayjs] | undefined })
              }
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder="搜索提醒内容"
              allowClear
              onSearch={(value) => setFilters({ ...filters, search: value })}
              enterButton={<FilterOutlined />}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={reminders}
          rowKey="id"
          loading={isLoading}
          rowClassName={(record) =>
            record.is_overdue && record.status === 'pending' ? 'bg-red-50 reminder-overdue' : ''
          }
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条提醒`,
          }}
        />
      </Card>

      <Drawer
        title="提醒详情"
        open={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        width={600}
      >
        {selectedReminder && (
          <div className="space-y-6">
            <div
              className={`p-4 rounded-lg ${selectedReminder.is_overdue ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: REMINDER_LEVEL_COLORS[selectedReminder.level] }}
                    >
                      {selectedReminder.level}
                    </div>
                    <span className="font-medium text-lg">{selectedReminder.title}</span>
                    <Badge
                      color={REMINDER_LEVEL_COLORS[selectedReminder.level]}
                      text={REMINDER_LEVEL_NAMES[selectedReminder.level]}
                    />
                  </div>
                  <p className="text-gray-600">{selectedReminder.message}</p>
                </div>
                {selectedReminder.is_overdue && (
                  <Tag color="red" className="animate-pulse">已逾期</Tag>
                )}
              </div>
            </div>

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="状态">
                {selectedReminder.status === 'pending' && <Tag color="red">待处理</Tag>}
                {selectedReminder.status === 'acknowledged' && <Tag color="orange">已确认</Tag>}
                {selectedReminder.status === 'resolved' && <Tag color="green">已解决</Tag>}
                {selectedReminder.status === 'escalated' && <Tag color="purple">已升级</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="处理时限">
                <div className={selectedReminder.is_overdue ? 'text-red-600 font-medium' : ''}>
                  {formatDateTime(selectedReminder.due_at)}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(selectedReminder.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="关联规则">
                {selectedReminder.rule_name || '-'}
              </Descriptions.Item>
              {selectedReminder.acknowledged_at && (
                <Descriptions.Item label="确认时间" span={2}>
                  {formatDateTime(selectedReminder.acknowledged_at)}
                </Descriptions.Item>
              )}
              {selectedReminder.resolved_at && (
                <Descriptions.Item label="解决时间" span={2}>
                  {formatDateTime(selectedReminder.resolved_at)}
                </Descriptions.Item>
              )}
            </Descriptions>

            <div className="flex justify-end gap-3 pt-4 border-t">
              {selectedReminder.status === 'pending' && (
                <Button
                  type="primary"
                  onClick={() => {
                    handleAcknowledge(selectedReminder.id);
                    setShowDetailDrawer(false);
                  }}
                >
                  确认提醒
                </Button>
              )}
              {selectedReminder.status !== 'resolved' && (
                <Button
                  type="primary"
                  onClick={() => {
                    handleResolve(selectedReminder.id);
                    setShowDetailDrawer(false);
                  }}
                >
                  标记解决
                </Button>
              )}
              <Button onClick={() => setShowDetailDrawer(false)}>关闭</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
