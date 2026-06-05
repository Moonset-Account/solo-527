import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, MailOutlined } from '@ant-design/icons';
import { guestsAPI, screeningsAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

function Guests() {
  const [guests, setGuests] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gRes, sRes] = await Promise.all([
        guestsAPI.list(),
        screeningsAPI.list({ status: 'confirmed' }),
      ]);
      setGuests(gRes.data);
      setScreenings(sRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await guestsAPI.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleConfirm = async (id) => {
    try {
      await guestsAPI.confirm(id);
      message.success('已确认出席');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleDecline = async (id) => {
    try {
      await guestsAPI.decline(id);
      message.success('已婉拒');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleCheckIn = async (id) => {
    try {
      await guestsAPI.checkIn(id);
      message.success('签到成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleSendInvitation = async (id) => {
    try {
      await guestsAPI.sendInvitation(id);
      message.success('邀请已发送');
    } catch (error) {
      message.error(error.response?.data?.message || '发送失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await guestsAPI.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await guestsAPI.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const statusColors = {
    invited: { color: 'blue', label: '已邀请' },
    confirmed: { color: 'green', label: '已确认' },
    declined: { color: 'red', label: '已婉拒' },
    checked_in: { color: 'blue', label: '已签到' },
    no_show: { color: 'default', label: '未到场' },
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '头衔/职位',
      dataIndex: 'title',
      key: 'title',
      width: 150,
    },
    {
      title: '单位',
      dataIndex: 'organization',
      key: 'organization',
    },
    {
      title: '场次',
      key: 'screening',
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
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const config = statusColors[status] || {};
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 320,
      render: (_, record) => (
        <Space size="small" wrap>
          {record.email && record.status === 'invited' && (
            <Button
              type="link"
              size="small"
              icon={<MailOutlined />}
              onClick={() => handleSendInvitation(record.id)}
            >
              发邀请
            </Button>
          )}
          {record.status === 'invited' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleConfirm(record.id)}
              >
                确认
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleDecline(record.id)}
              >
                婉拒
              </Button>
            </>
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
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个嘉宾吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>嘉宾管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加嘉宾
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={guests}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑嘉宾' : '添加嘉宾'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'invited' }}
        >
          <Form.Item
            name="screening_id"
            label="选择场次"
            rules={[{ required: true, message: '请选择场次' }]}
          >
            <Select placeholder="请选择场次">
              {screenings.map(s => (
                <Option key={s.id} value={s.id}>
                  {s.film?.title} - {dayjs(s.start_time).format('MM-DD HH:mm')}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="title" label="头衔/职位" style={{ flex: 1 }}>
              <Input placeholder="如：导演、影评人" />
            </Form.Item>
            <Form.Item name="organization" label="单位" style={{ flex: 1 }}>
              <Input placeholder="所属单位" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="phone" label="联系电话" style={{ flex: 1 }}>
              <Input placeholder="联系电话" />
            </Form.Item>
            <Form.Item name="email" label="邮箱" style={{ flex: 1 }}>
              <Input placeholder="邮箱地址" />
            </Form.Item>
          </div>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="备注信息" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingItem ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Guests;
