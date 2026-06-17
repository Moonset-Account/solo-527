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
import { counselorApi } from '../../api';

const { Option } = Select;
const { TextArea } = Input;

const statusMap = {
  active: { text: '在职', color: 'green' },
  inactive: { text: '离职', color: 'default' },
  leave: { text: '休假', color: 'orange' },
};

function CounselorManage() {
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
      const result = await counselorApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setData(result.items);
      setPagination(prev => ({ ...prev, total: result.total }));
    } catch (error) {
      console.error('加载咨询师失败', error);
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
    form.setFieldsValue({ status: 'active', experienceYears: 0 });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      specialties: record.specialties || [],
      certifications: record.certifications || [],
    });
    setModalVisible(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除？',
      content: '删除咨询师将同时删除其关联账户，确定要删除吗？',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await counselorApi.remove(record.id);
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
      const detail = await counselorApi.getDetail(record.id);
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
        await counselorApi.update(editingRecord.id, values);
        message.success('更新成功');
      } else {
        await counselorApi.create(values);
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
      title: '咨询师',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 100,
    },
    {
      title: '专长',
      dataIndex: 'specialties',
      key: 'specialties',
      render: (specialties) => (
        <span>
          {specialties?.slice(0, 3).map((s, i) => (
            <Tag key={i} color="blue" style={{ marginBottom: 4 }}>{s}</Tag>
          ))}
        </span>
      ),
    },
    {
      title: '从业年限',
      dataIndex: 'experienceYears',
      key: 'experienceYears',
      width: 100,
      render: (years) => `${years}年`,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 100,
      render: (rating) => <span style={{ color: '#faad14' }}>⭐ {rating}</span>,
    },
    {
      title: '咨询费用',
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      width: 100,
      render: (rate) => <span style={{ color: '#ff4d4f' }}>¥{rate}/小时</span>,
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
        title="咨询师管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增咨询师
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="搜索姓名/用户名"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              allowClear
              onPressEnter={(e) => handleSearch({ keyword: e.target.value })}
            />
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => handleSearch({ status: value })}
            >
              {Object.entries(statusMap).map(([key, value]) => (
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
        title={editingRecord ? '编辑咨询师' : '新增咨询师'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          {!editingRecord && (
            <>
              <Form.Item
                label="登录用户名"
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入登录用户名" />
              </Form.Item>
              <Form.Item
                label="初始密码"
                name="password"
                rules={[{ required: !editingRecord, message: '请输入初始密码' }]}
              >
                <Input.Password placeholder="默认123456" />
              </Form.Item>
            </>
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

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="从业年限" name="experienceYears" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="咨询费用(元/小时)" name="hourlyRate" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} prefix="¥" />
            </Form.Item>
          </div>

          <Form.Item label="专长领域" name="specialties">
            <Select mode="tags" placeholder="输入后回车添加">
              <Option value="情绪管理">情绪管理</Option>
              <Option value="人际关系">人际关系</Option>
              <Option value="职业发展">职业发展</Option>
              <Option value="婚姻家庭">婚姻家庭</Option>
              <Option value="青少年心理">青少年心理</Option>
              <Option value="焦虑抑郁">焦虑抑郁</Option>
            </Select>
          </Form.Item>

          <Form.Item label="资质证书" name="certifications">
            <Select mode="tags" placeholder="输入后回车添加">
              <Option value="心理咨询师二级">心理咨询师二级</Option>
              <Option value="心理咨询师三级">心理咨询师三级</Option>
              <Option value="注册心理师">注册心理师</Option>
              <Option value="精神科医师">精神科医师</Option>
            </Select>
          </Form.Item>

          <Form.Item label="个人简介" name="introduction">
            <TextArea rows={3} placeholder="请输入个人简介" />
          </Form.Item>

          <Form.Item label="状态" name="status">
            <Select>
              <Option value="active">在职</Option>
              <Option value="inactive">离职</Option>
              <Option value="leave">休假</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="咨询师详情"
        placement="right"
        width={500}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="姓名">{currentRecord.name}</Descriptions.Item>
            <Descriptions.Item label="用户名">{currentRecord.username || '-'}</Descriptions.Item>
            <Descriptions.Item label="手机号">{currentRecord.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{currentRecord.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[currentRecord.status]?.color}>
                {statusMap[currentRecord.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="从业年限">{currentRecord.experienceYears}年</Descriptions.Item>
            <Descriptions.Item label="咨询费用">¥{currentRecord.hourlyRate}/小时</Descriptions.Item>
            <Descriptions.Item label="评分">⭐ {currentRecord.rating}（{currentRecord.reviewCount}条评价）</Descriptions.Item>
            <Descriptions.Item label="服务次数">{currentRecord.appointmentCount}次</Descriptions.Item>
            <Descriptions.Item label="专长领域">
              {currentRecord.specialties?.join('、') || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="资质证书">
              {currentRecord.certifications?.join('、') || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="个人简介">{currentRecord.introduction || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(currentRecord.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}

export default CounselorManage;
