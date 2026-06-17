import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  message,
  Drawer,
  Descriptions,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { usersApi } from '../../api';

const { Option } = Select;

const roleMap = {
  client: { text: '客户', color: 'blue' },
  counselor: { text: '咨询师', color: 'green' },
  dispatcher: { text: '调度员', color: 'orange' },
  admin: { text: '管理员', color: 'purple' },
};

function UserManage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await usersApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setData(result.items);
      setPagination(prev => ({ ...prev, total: result.total }));
    } catch (error) {
      console.error('加载用户失败', error);
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

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ role: 'client', isActive: true });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除？',
      content: '删除后用户将无法登录，确定要删除吗？',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await usersApi.remove(record.id);
          message.success('已删除');
          loadData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleViewDetail = async (record) => {
    try {
      const detail = await usersApi.getDetail(record.id);
      setCurrentRecord(detail);
      setDetailVisible(true);
    } catch (error) {
      message.error('加载详情失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await usersApi.update(editingRecord.id, values);
        message.success('更新成功');
      } else {
        await usersApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      if (error.errorFields) return;
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (v) => v || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => {
        const info = roleMap[role] || { text: role, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (active) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="用户管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增用户
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="搜索用户名/姓名"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="角色"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => handleSearch({ role: value })}
            >
              {Object.entries(roleMap).map(([key, value]) => (
                <Option key={key} value={key}>{value.text}</Option>
              ))}
            </Select>
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
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
          }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={500}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingRecord} />
          </Form.Item>

          {!editingRecord && (
            <Form.Item
              label="初始密码"
              name="password"
              rules={[{ required: true, message: '请输入初始密码' }]}
            >
              <Input.Password placeholder="默认123456" />
            </Form.Item>
          )}

          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="手机号" name="phone" style={{ flex: 1 }}>
              <Input placeholder="请输入手机号" />
            </Form.Item>
            <Form.Item label="邮箱" name="email" style={{ flex: 1 }}>
              <Input placeholder="请输入邮箱" />
            </Form.Item>
          </div>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Option value="client">客户</Option>
              <Option value="counselor">咨询师</Option>
              <Option value="dispatcher">调度员</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item label="备注" name="remarks">
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="用户详情"
        placement="right"
        width={400}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="用户名">{currentRecord.username}</Descriptions.Item>
            <Descriptions.Item label="姓名">{currentRecord.name}</Descriptions.Item>
            <Descriptions.Item label="手机号">{currentRecord.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{currentRecord.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="角色">
              <Tag color={roleMap[currentRecord.role]?.color}>
                {roleMap[currentRecord.role]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={currentRecord.isActive ? 'green' : 'default'}>
                {currentRecord.isActive ? '正常' : '禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="备注">{currentRecord.remarks || '-'}</Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {new Date(currentRecord.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}

export default UserManage;
