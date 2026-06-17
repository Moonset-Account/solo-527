import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Tag, Input, Select, Modal, Form,
  InputNumber, Upload, message, Drawer, Descriptions, Image, List, Card, Row, Col
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, UploadOutlined, CommentOutlined
} from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState();
  const [form] = Form.useForm();

  useEffect(() => {
    loadProjects();
  }, [search, statusFilter]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/projects/', { params });
      setProjects(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/projects/${id}/`);
      message.success('删除成功');
      loadProjects();
    } catch (err) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await api.patch(`/projects/${editing.id}/`, values);
        message.success('更新成功');
      } else {
        await api.post('/projects/', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadProjects();
    } catch (err) {
      message.error('保存失败');
    }
  };

  const handleView = async (record) => {
    try {
      const res = await api.get(`/projects/${record.id}/`);
      setCurrentProject(res.data);
      setDetailVisible(true);
    } catch (err) {
      message.error('加载详情失败');
    }
  };

  const columns = [
    { title: '项目编号', dataIndex: 'code', key: 'code' },
    { title: '项目名称', dataIndex: 'name', key: 'name' },
    { title: '地址', dataIndex: 'address', key: 'address' },
    { title: '客户', dataIndex: 'client_name', key: 'client_name' },
    { title: '面积(㎡)', dataIndex: 'area', key: 'area' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v, r) => {
        const colors = { draft: 'default', quoting: 'blue', approved: 'cyan', in_progress: 'processing', inspecting: 'orange', completed: 'success', cancelled: 'default' };
        return <Tag color={colors[v]}>{r.status_display}</Tag>;
      },
    },
    { title: '照片', dataIndex: 'photo_count', key: 'photo_count', render: (v) => v || 0 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (v) => dayjs(v).format('YYYY-MM-DD') },
    {
      title: '操作',
      key: 'action',
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(r)}>详情</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">项目管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建项目</Button>
      </div>

      <Card>
        <div className="filter-bar">
          <Input
            placeholder="搜索项目名称/编号/客户"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="状态筛选"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 150 }}
            options={[
              { value: 'draft', label: '草稿' },
              { value: 'quoting', label: '报价中' },
              { value: 'approved', label: '已确认' },
              { value: 'in_progress', label: '施工中' },
              { value: 'inspecting', label: '验收中' },
              { value: 'completed', label: '已完成' },
              { value: 'cancelled', label: '已取消' },
            ]}
          />
          <Button onClick={loadProjects}>刷新</Button>
        </div>

        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editing ? '编辑项目' : '新建项目'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="code" label="项目编号" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="address" label="项目地址" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="client_name" label="客户姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="client_phone" label="客户电话" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="area" label="面积(㎡)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select options={[
                  { value: 'draft', label: '草稿' },
                  { value: 'quoting', label: '报价中' },
                  { value: 'approved', label: '已确认' },
                  { value: 'in_progress', label: '施工中' },
                  { value: 'inspecting', label: '验收中' },
                  { value: 'completed', label: '已完成' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="项目描述">
                <TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Drawer
        title="项目详情"
        width={720}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentProject && (
          <div>
            <Descriptions title="基本信息" column={2} bordered size="small">
              <Descriptions.Item label="项目编号">{currentProject.code}</Descriptions.Item>
              <Descriptions.Item label="项目名称">{currentProject.name}</Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>{currentProject.address}</Descriptions.Item>
              <Descriptions.Item label="客户">{currentProject.client_name}</Descriptions.Item>
              <Descriptions.Item label="电话">{currentProject.client_phone}</Descriptions.Item>
              <Descriptions.Item label="面积">{currentProject.area} ㎡</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag>{currentProject.status_display}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="项目经理">{currentProject.project_manager_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="材料员">{currentProject.material_staff_name || '-'}</Descriptions.Item>
            </Descriptions>

            <Card title="现场照片" style={{ marginTop: 16 }} size="small">
              <div className="photo-grid">
                {currentProject.photos?.map(p => (
                  <div key={p.id} className="photo-item">
                    <Image src={p.image} />
                    <div className="photo-info">{p.title || '无标题'}</div>
                  </div>
                ))}
                {(!currentProject.photos || currentProject.photos.length === 0) && (
                  <div style={{ color: '#999' }}>暂无照片</div>
                )}
              </div>
            </Card>

            <Card title="附件" style={{ marginTop: 16 }} size="small">
              <List
                dataSource={currentProject.attachments || []}
                renderItem={(a) => (
                  <List.Item>
                    <a href={a.file} target="_blank" rel="noreferrer">{a.name}</a>
                  </List.Item>
                )}
              />
            </Card>

            <Card title="备注记录" style={{ marginTop: 16 }} size="small" extra={<CommentOutlined />}>
              <List
                dataSource={currentProject.notes || []}
                renderItem={(n) => (
                  <List.Item>
                    <List.Item.Meta
                      title={n.created_by_name}
                      description={dayjs(n.created_at).format('YYYY-MM-DD HH:mm')}
                    />
                    <div>{n.content}</div>
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Projects;
