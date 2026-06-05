import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, DatePicker, InputNumber, Switch, Tag, Space, message, Popconfirm, Card, Tabs, Badge, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { screeningsAPI, filmsAPI, hallsAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = require('antd/es/input');

function Screenings() {
  const [screenings, setScreenings] = useState([]);
  const [films, setFilms] = useState([]);
  const [halls, setHalls] = useState([]);
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
      const [sRes, fRes, hRes] = await Promise.all([
        screeningsAPI.list(),
        filmsAPI.list({ status: 'active' }),
        hallsAPI.list(),
      ]);
      setScreenings(sRes.data);
      setFilms(fRes.data.filter(f => f.is_license_valid));
      setHalls(hRes.data);
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
    form.setFieldsValue({
      ...item,
      start_time: dayjs(item.start_time),
      end_time: dayjs(item.end_time),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await screeningsAPI.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleConfirm = async (id) => {
    try {
      await screeningsAPI.confirm(id);
      message.success('场次已确认');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleCancel = async (id) => {
    try {
      await screeningsAPI.cancel(id);
      message.success('场次已取消');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleComplete = async (id) => {
    try {
      await screeningsAPI.complete(id);
      message.success('场次已完成');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        start_time: values.start_time.toISOString(),
        end_time: values.end_time.toISOString(),
      };

      if (editingItem) {
        await screeningsAPI.update(editingItem.id, data);
        message.success('更新成功');
      } else {
        await screeningsAPI.create(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const statusColors = {
    draft: 'default',
    confirmed: 'blue',
    cancelled: 'red',
    completed: 'green',
  };

  const statusLabels = {
    draft: '草稿',
    confirmed: '已确认',
    cancelled: '已取消',
    completed: '已完成',
  };

  const columns = [
    {
      title: '影片',
      dataIndex: ['film', 'title'],
      key: 'film',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ color: '#999', fontSize: 12 }}>
            {record.film?.director} · {record.film?.duration}分钟
          </div>
        </div>
      ),
    },
    {
      title: '放映厅',
      dataIndex: ['hall', 'name'],
      key: 'hall',
    },
    {
      title: '放映时间',
      key: 'time',
      render: (_, record) => (
        <div>
          <div>{dayjs(record.start_time).format('YYYY-MM-DD HH:mm')}</div>
          <div style={{ color: '#999', fontSize: 12 }}>
            至 {dayjs(record.end_time).format('HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: '报名情况',
      key: 'booking',
      width: 120,
      render: (_, record) => (
        <div>
          <div>{record.confirmed_count}/{record.capacity}人</div>
          {record.waitlist_count > 0 && (
            <span className="waitlist-badge">候补{record.waitlist_count}人</span>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: '类型',
      key: 'type',
      width: 100,
      render: (_, record) => (
        <Space>
          {record.is_member_only && <Tag color="purple">会员专享</Tag>}
          {record.allow_waitlist && <Tag color="orange">可候补</Tag>}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'draft' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleConfirm(record.id)}
            >
              确认
            </Button>
          )}
          {record.status === 'confirmed' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleComplete(record.id)}
              >
                完成
              </Button>
              <Popconfirm
                title="确定要取消这个场次吗？所有已报名的会员将收到通知。"
                onConfirm={() => handleCancel(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<CloseCircleOutlined />}>
                  取消
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status !== 'cancelled' && record.status !== 'completed' && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {record.status === 'draft' && (
            <Popconfirm
              title="确定要删除这个场次吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
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
        <h2 style={{ margin: 0 }}>排片管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增排片
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={screenings}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑排片' : '新增排片'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            is_member_only: true,
            allow_waitlist: true,
            status: 'draft',
          }}
        >
          <Form.Item
            name="film_id"
            label="选择影片"
            rules={[{ required: true, message: '请选择影片' }]}
          >
            <Select placeholder="请选择影片">
              {films.map(film => (
                <Option key={film.id} value={film.id}>
                  {film.title} ({film.duration}分钟)
                  {!film.is_license_valid && ' - 授权已过期'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="hall_id"
            label="选择放映厅"
            rules={[{ required: true, message: '请选择放映厅' }]}
          >
            <Select placeholder="请选择放映厅">
              {halls.map(hall => (
                <Option key={hall.id} value={hall.id}>
                  {hall.name} (容量: {hall.capacity}人)
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_time"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder="选择开始时间"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_time"
                label="结束时间"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder="选择结束时间"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="capacity"
            label="售票容量"
            tooltip="不超过放映厅容量"
          >
            <InputNumber style={{ width: '100%' }} placeholder="默认为放映厅容量" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="is_member_only"
                label="仅会员可报名"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="allow_waitlist"
                label="接受候补报名"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="curator_notes" label="策展备注">
            <TextArea rows={3} placeholder="策展备注、影片介绍等" />
          </Form.Item>

          <Form.Item name="status" label="保存为">
            <Select>
              <Option value="draft">草稿</Option>
              <Option value="confirmed">直接确认发布</Option>
            </Select>
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

export default Screenings;
