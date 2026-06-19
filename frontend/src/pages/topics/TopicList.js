import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Input, Select, Modal, Form, message, Popconfirm, Tag, Row, Col, DatePicker } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { topicsAPI } from '../../services/api';
import { formatDate, getStatusBadge, handleApiError } from '../../utils/helpers';
import DataExportButton from '../../components/DataExportButton';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const TopicList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchText, status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText,
        status: status,
      };
      const response = await topicsAPI.list(params);
      setData(response.data.results || []);
      setPagination(prev => ({ ...prev, total: response.data.count || 0 }));
    } catch (error) {
      message.error(handleApiError(error, '加载议题列表失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      voting_start_date: record.voting_start_date ? record.voting_start_date.split('T')[0] : null,
      voting_end_date: record.voting_end_date ? record.voting_end_date.split('T')[0] : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await topicsAPI.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error(handleApiError(error, '删除失败'));
    }
  };

  const handleSubmit = async (values) => {
    try {
      const submitData = {
        ...values,
        voting_start_date: values.voting_start_date ? values.voting_start_date.format('YYYY-MM-DD') : null,
        voting_end_date: values.voting_end_date ? values.voting_end_date.format('YYYY-MM-DD') : null,
      };
      if (editingRecord) {
        await topicsAPI.update(editingRecord.id, submitData);
        message.success('更新成功');
      } else {
        await topicsAPI.create(submitData);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(handleApiError(error, editingRecord ? '更新失败' : '创建失败'));
    }
  };

  const handleStatusChange = async (record, action) => {
    try {
      await topicsAPI.changeStatus(record.id, action, {});
      message.success('状态更新成功');
      fetchData();
    } catch (error) {
      message.error(handleApiError(error, '状态更新失败'));
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a onClick={() => navigate(`/topics/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => {
        const badge = getStatusBadge(text);
        return <Tag className={badge.class}>{badge.text}</Tag>;
      },
    },
    {
      title: '发起人',
      dataIndex: 'author_name',
      key: 'author_name',
    },
    {
      title: '投票开始',
      dataIndex: 'voting_start_date',
      key: 'voting_start_date',
      render: formatDate,
    },
    {
      title: '投票结束',
      dataIndex: 'voting_end_date',
      key: 'voting_end_date',
      render: formatDate,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: formatDate,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/topics/${record.id}`)}
          >
            详情
          </Button>
          {record.status === 'draft' && (
            <Button 
              type="link" 
              onClick={() => handleStatusChange(record, 'submit')}
            >
              提交审核
            </Button>
          )}
          {record.status === 'pending' && (
            <>
              <Button 
                type="link" 
                onClick={() => handleStatusChange(record, 'approve')}
              >
                通过
              </Button>
              <Button 
                type="link" 
                danger
                onClick={() => handleStatusChange(record, 'reject')}
              >
                拒绝
              </Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button 
              type="link" 
              onClick={() => handleStatusChange(record, 'start_voting')}
            >
              开始投票
            </Button>
          )}
          {record.status === 'draft' && (
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          <Popconfirm
            title="确定要删除这个议题吗？"
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
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>议题管理</h2>
        </Col>
        <Col>
          <Space>
            <DataExportButton exportAPI={topicsAPI.export} filename="议题列表.xlsx" />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增议题
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Search
            placeholder="搜索标题、内容"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            onSearch={handleSearch}
            onChange={(e) => !e.target.value && handleSearch('')}
          />
        </Col>
        <Col xs={24} sm={6}>
          <Select
            placeholder="状态"
            allowClear
            style={{ width: '100%' }}
            value={status || undefined}
            onChange={(value) => { setStatus(value); setPagination(prev => ({ ...prev, current: 1 })); }}
          >
            <Option value="draft">草稿</Option>
            <Option value="pending">待审核</Option>
            <Option value="approved">已通过</Option>
            <Option value="voting">投票中</Option>
            <Option value="completed">已完成</Option>
            <Option value="rejected">已拒绝</Option>
          </Select>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        onChange={(page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))}
      />

      <Modal
        title={editingRecord ? '编辑议题' : '新增议题'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入议题标题" />
          </Form.Item>
          <Form.Item name="description" label="议题内容" rules={[{ required: true, message: '请输入议题内容' }]}>
            <Input.TextArea rows={4} placeholder="请输入议题详细内容" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="voting_start_date" label="投票开始日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="voting_end_date" label="投票结束日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingRecord ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TopicList;
