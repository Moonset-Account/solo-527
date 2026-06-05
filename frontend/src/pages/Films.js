import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, Select, Tag, Space, message, Popconfirm, Card, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { filmsAPI } from '../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

function Films() {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFilm, setEditingFilm] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadFilms();
  }, []);

  const loadFilms = async () => {
    setLoading(true);
    try {
      const response = await filmsAPI.list();
      setFilms(response.data);
    } catch (error) {
      message.error('加载影片列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingFilm(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (film) => {
    setEditingFilm(film);
    form.setFieldsValue({
      ...film,
      license_start_date: film.license_start_date ? dayjs(film.license_start_date) : null,
      license_end_date: film.license_end_date ? dayjs(film.license_end_date) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await filmsAPI.delete(id);
      message.success('删除成功');
      loadFilms();
    } catch (error) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        license_start_date: values.license_start_date.format('YYYY-MM-DD'),
        license_end_date: values.license_end_date.format('YYYY-MM-DD'),
      };

      if (editingFilm) {
        await filmsAPI.update(editingFilm.id, data);
        message.success('更新成功');
      } else {
        await filmsAPI.create(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadFilms();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    {
      title: '影片名称',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          {record.original_title && (
            <div style={{ color: '#999', fontSize: 12 }}>{record.original_title}</div>
          )}
        </div>
      ),
    },
    {
      title: '导演',
      dataIndex: 'director',
      key: 'director',
    },
    {
      title: '年份',
      dataIndex: 'year',
      key: 'year',
      width: 80,
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (val) => `${val}分钟`,
    },
    {
      title: '授权期限',
      key: 'license',
      width: 220,
      render: (_, record) => {
        const isExpired = !record.is_license_valid;
        return (
          <div>
            <div>
              {record.license_start_date} ~ {record.license_end_date}
            </div>
            {isExpired ? (
              <Tag color="red">已过期</Tag>
            ) : (
              <Tag color="green">有效</Tag>
            )}
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colors = {
          active: 'green',
          inactive: 'default',
          expired: 'red',
        };
        const labels = {
          active: '启用',
          inactive: '停用',
          expired: '已过期',
        };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这部影片吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
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
        <h2 style={{ margin: 0 }}>影片管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加影片
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={films}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingFilm ? '编辑影片' : '添加影片'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="影片名称"
                rules={[{ required: true, message: '请输入影片名称' }]}
              >
                <Input placeholder="请输入影片名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="original_title" label="原名">
                <Input placeholder="请输入原名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="director" label="导演">
                <Input placeholder="请输入导演" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="year" label="年份">
                <InputNumber placeholder="年份" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="duration"
                label="时长(分钟)"
                rules={[{ required: true, message: '请输入时长' }]}
              >
                <InputNumber placeholder="时长" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="country" label="国家">
                <Input placeholder="请输入国家" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="license_start_date"
                label="授权开始日期"
                rules={[{ required: true, message: '请选择授权开始日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="license_end_date"
                label="授权结束日期"
                rules={[{ required: true, message: '请选择授权结束日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="distributor" label="发行方">
                <Input placeholder="请输入发行方" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="license_number" label="授权编号">
                <Input placeholder="请输入授权编号" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="synopsis" label="剧情简介">
            <TextArea rows={3} placeholder="请输入剧情简介" />
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Select>
              <Option value="active">启用</Option>
              <Option value="inactive">停用</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingFilm ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Films;
