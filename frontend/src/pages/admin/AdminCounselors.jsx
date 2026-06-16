import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Modal,
  Form,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Avatar,
  Checkbox,
} from 'antd';
import { counselorApi } from '../../services/api.js';

const { Title } = Typography;

export default function AdminCounselors() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await counselorApi.list();
      if (res.success) setData(res.data);
    } catch (e) {
      message.error('加载咨询师列表失败');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    form.setFieldsValue({
      name: c.name,
      title: c.title,
      specialty: c.specialty,
      avatar: c.avatar,
      isActive: c.isActive,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      let res;
      if (editingId) {
        res = await counselorApi.update(editingId, values);
      } else {
        res = await counselorApi.create(values);
      }
      if (res.success) {
        message.success(editingId ? '已更新' : '已创建');
        setModalVisible(false);
        form.resetFields();
        loadData();
      }
    } catch (e) {
      message.error(e.message || '操作失败');
    }
  };

  const handleToggleActive = async (c) => {
    try {
      const res = await counselorApi.update(c.id, { isActive: !c.isActive });
      if (res.success) {
        message.success(c.isActive ? '已停用' : '已启用');
        loadData();
      }
    } catch (e) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '咨询师',
      dataIndex: 'name',
      render: (v, r) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1677ff' }}>
            {v.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{v}</div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>{r.title || '-'}</div>
          </div>
        </Space>
      ),
      width: 200,
    },
    {
      title: '专长领域',
      dataIndex: 'specialty',
      render: (v) => v || '-',
    },
    {
      title: '时段数',
      dataIndex: ['_count', 'timeSlots'],
      width: 100,
      align: 'center',
    },
    {
      title: '累计预约',
      dataIndex: ['_count', 'appointments'],
      width: 100,
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 100,
      render: (v) => (v ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>),
    },
    {
      title: '操作',
      width: 200,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>编辑</Button>
          <Button size="small" onClick={() => handleToggleActive(r)}>
            {r.isActive ? '停用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card>
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Title level={5} style={{ margin: 0 }}>咨询师管理</Title>
            <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
              管理咨询师信息，设置专长与启用状态
            </div>
          </Col>
          <Col>
            <Space>
              <Button onClick={loadData}>刷新</Button>
              <Button type="primary" onClick={openCreate}>新增咨询师</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          loading={loading}
          dataSource={data}
          rowKey="id"
          columns={columns}
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: '暂无咨询师，请先新增或执行数据库 seed 初始化' }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑咨询师' : '新增咨询师'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入咨询师姓名" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="职称" name="title">
                <Input placeholder="例：主任医师、心理咨询师" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="头像 URL（选填）" name="avatar">
                <Input placeholder="头像图片地址" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="专长领域" name="specialty">
            <Input.TextArea
              rows={2}
              placeholder="例：焦虑抑郁、青少年心理、婚姻家庭"
            />
          </Form.Item>
          <Form.Item label="启用状态" name="isActive" valuePropName="checked" initialValue={true}>
            <Checkbox>启用该咨询师（停用后客户端将无法选择）</Checkbox>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingId ? '保存' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
