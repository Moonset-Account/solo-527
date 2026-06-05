import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, Tag, Space, message, Popconfirm, Card, Input, Drawer, List, Descriptions, Badge } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import { bookingsAPI, screeningsAPI, membersAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [memberOptions, setMemberOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        bookingsAPI.list(),
        screeningsAPI.list({ status: 'confirmed' }),
      ]);
      setBookings(bRes.data);
      setScreenings(sRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleConfirm = async (id) => {
    try {
      await bookingsAPI.confirm(id);
      message.success('报名已确认');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleCancel = async (id) => {
    try {
      await bookingsAPI.cancel(id, '前台取消');
      message.success('报名已取消');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleCheckIn = async (id) => {
    try {
      await bookingsAPI.checkIn(id);
      message.success('签到成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleViewDetail = (booking) => {
    setSelectedBooking(booking);
    setDetailVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      await bookingsAPI.create(values);
      message.success('报名创建成功');
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '创建失败');
    }
  };

  const handleMemberSearch = async (value) => {
    if (value && value.length >= 1) {
      setSearching(true);
      try {
        const response = await membersAPI.search(value);
        const options = response.data.map(m => ({
          value: m.id,
          label: `${m.member_no} - ${m.name} (${m.level_name})`,
          disabled: !m.is_active_member,
        }));
        setMemberOptions(options);
      } catch (error) {
        message.error('搜索会员失败');
        setMemberOptions([]);
      } finally {
        setSearching(false);
      }
    } else {
      setMemberOptions([]);
    }
  };

  const statusConfig = {
    confirmed: { color: 'green', label: '已确认' },
    waitlisted: { color: 'orange', label: '候补中' },
    pending: { color: 'default', label: '待确认' },
    cancelled: { color: 'red', label: '已取消' },
    checked_in: { color: 'blue', label: '已签到' },
    no_show: { color: 'default', label: '未到场' },
  };

  const columns = [
    {
      title: '报名编号',
      dataIndex: 'booking_no',
      key: 'booking_no',
      width: 140,
    },
    {
      title: '会员',
      key: 'member',
      render: (_, record) => (
        <div>
          <div>{record.member?.name}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.member?.member_no}</div>
        </div>
      ),
    },
    {
      title: '影片',
      key: 'film',
      render: (_, record) => (
        <div>
          <div>{record.screening?.film?.title}</div>
          <div style={{ color: '#999', fontSize: 12 }}>
            {dayjs(record.screening?.start_time).format('MM-DD HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: '放映厅',
      key: 'hall',
      dataIndex: ['screening', 'hall', 'name'],
    },
    {
      title: '携伴',
      dataIndex: 'guest_count',
      key: 'guest_count',
      width: 80,
      render: (count) => count || 0,
    },
    {
      title: '候补位置',
      dataIndex: 'waitlist_position',
      key: 'waitlist_position',
      width: 100,
      render: (pos) => pos ? `第${pos}位` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const config = statusConfig[status] || {};
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '报名时间',
      dataIndex: 'registered_at',
      key: 'registered_at',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleConfirm(record.id)}
            >
              确认
            </Button>
          )}
          {record.status === 'waitlisted' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleConfirm(record.id)}
            >
              转正
            </Button>
          )}
          {record.status === 'confirmed' && (
            <Button
              type="link"
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleCheckIn(record.id)}
            >
              签到
            </Button>
          )}
          {['confirmed', 'waitlisted', 'pending'].includes(record.status) && (
            <Popconfirm
              title="确定要取消这个报名吗？"
              onConfirm={() => handleCancel(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<CloseOutlined />}>
                取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>报名管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增报名
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新增报名"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="screening_id"
            label="选择场次"
            rules={[{ required: true, message: '请选择场次' }]}
          >
            <Select placeholder="请选择场次">
              {screenings.map(s => (
                <Option key={s.id} value={s.id}>
                  {s.film?.title} - {dayjs(s.start_time).format('MM-DD HH:mm')} ({s.hall?.name})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="member_id"
            label="选择会员"
            rules={[{ required: true, message: '请选择会员' }]}
          >
            <Select
              showSearch
              placeholder="搜索会员编号或姓名"
              defaultActiveFirstOption={false}
              filterOption={false}
              onSearch={handleMemberSearch}
              notFoundContent={searching ? '搜索中...' : '无匹配结果'}
              options={memberOptions}
              loading={searching}
            />
          </Form.Item>

          <Form.Item
            name="guest_count"
            label="携带嘉宾人数"
            initialValue={0}
          >
            <InputNumber min={0} max={3} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="备注信息" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="报名详情"
        placement="right"
        width={500}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {selectedBooking && (
          <div>
            <Descriptions title="基本信息" column={1} bordered size="small">
              <Descriptions.Item label="报名编号">
                {selectedBooking.booking_no}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusConfig[selectedBooking.status]?.color}>
                  {statusConfig[selectedBooking.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="会员">
                {selectedBooking.member?.name} ({selectedBooking.member?.member_no})
              </Descriptions.Item>
              <Descriptions.Item label="会员等级">
                {selectedBooking.member?.level_name}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {selectedBooking.member?.phone || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="场次信息" column={1} bordered size="small" style={{ marginTop: 16 }}>
              <Descriptions.Item label="影片">
                {selectedBooking.screening?.film?.title}
              </Descriptions.Item>
              <Descriptions.Item label="放映时间">
                {dayjs(selectedBooking.screening?.start_time).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="放映厅">
                {selectedBooking.screening?.hall?.name}
              </Descriptions.Item>
              <Descriptions.Item label="携伴人数">
                {selectedBooking.guest_count || 0} 人
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="时间记录" column={1} bordered size="small" style={{ marginTop: 16 }}>
              <Descriptions.Item label="报名时间">
                {selectedBooking.registered_at ? dayjs(selectedBooking.registered_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="确认时间">
                {selectedBooking.confirmed_at ? dayjs(selectedBooking.confirmed_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="签到时间">
                {selectedBooking.checked_in_at ? dayjs(selectedBooking.checked_in_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default Bookings;
