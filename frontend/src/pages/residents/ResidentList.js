import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Input, Select, Modal, Form, message, Popconfirm, Tag, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { residentsAPI } from '../../services/api';
import { formatDate, getHouseholdTypeText, handleApiError } from '../../utils/helpers';
import DataExportButton from '../../components/DataExportButton';

const { Search } = Input;
const { Option } = Select;

const ResidentList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [householdType, setHouseholdType] = useState('');
  const [votingEligibility, setVotingEligibility] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchText, householdType, votingEligibility]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText,
        household_type: householdType,
        voting_eligibility: votingEligibility,
      };
      const response = await residentsAPI.list(params);
      setData(response.data.results || []);
      setPagination(prev => ({ ...prev, total: response.data.count || 0 }));
    } catch (error) {
      message.error(handleApiError(error, '加载居民列表失败'));
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
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await residentsAPI.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error(handleApiError(error, '删除失败'));
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingRecord) {
        await residentsAPI.update(editingRecord.id, values);
        message.success('更新成功');
      } else {
        await residentsAPI.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(handleApiError(error, editingRecord ? '更新失败' : '创建失败'));
    }
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => navigate(`/residents/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '身份证号',
      dataIndex: 'id_card',
      key: 'id_card',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '楼号门牌号',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: '家庭类型',
      dataIndex: 'household_type',
      key: 'household_type',
      render: (text) => <Tag>{getHouseholdTypeText(text)}</Tag>,
    },
    {
      title: '投票资格',
      dataIndex: 'voting_eligibility',
      key: 'voting_eligibility',
      render: (text) => (
        <Tag color={text ? 'green' : 'red'}>
          {text ? '有资格' : '无资格'}
        </Tag>
      ),
    },
    {
      title: '登记日期',
      dataIndex: 'registration_date',
      key: 'registration_date',
      render: formatDate,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/residents/${record.id}`)}
          >
            详情
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个居民吗？"
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
          <h2>居民台账</h2>
        </Col>
        <Col>
          <Space>
            <DataExportButton exportAPI={residentsAPI.export} filename="居民台账.xlsx" />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增居民
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Search
            placeholder="搜索姓名、电话、身份证"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            onSearch={handleSearch}
            onChange={(e) => !e.target.value && handleSearch('')}
          />
        </Col>
        <Col xs={24} sm={6}>
          <Select
            placeholder="家庭类型"
            allowClear
            style={{ width: '100%' }}
            value={householdType || undefined}
            onChange={(value) => { setHouseholdType(value); setPagination(prev => ({ ...prev, current: 1 })); }}
          >
            <Option value="ordinary">普通家庭</Option>
            <Option value="low_income">低收入家庭</Option>
            <Option value="elderly_only">空巢老人</Option>
            <Option value="disabled">残疾人家庭</Option>
            <Option value="single_parent">单亲家庭</Option>
            <Option value="needy">特困家庭</Option>
          </Select>
        </Col>
        <Col xs={24} sm={6}>
          <Select
            placeholder="投票资格"
            allowClear
            style={{ width: '100%' }}
            value={votingEligibility || undefined}
            onChange={(value) => { setVotingEligibility(value); setPagination(prev => ({ ...prev, current: 1 })); }}
          >
            <Option value="true">有资格</Option>
            <Option value="false">无资格</Option>
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
        title={editingRecord ? '编辑居民' : '新增居民'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="id_card" label="身份证号" rules={[{ required: true, message: '请输入身份证号' }]}>
                <Input placeholder="请输入身份证号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
                <Select placeholder="请选择性别">
                  <Option value="male">男</Option>
                  <Option value="female">女</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="birth_date" label="出生日期">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="household_type" label="家庭类型" rules={[{ required: true, message: '请选择家庭类型' }]}>
                <Select placeholder="请选择家庭类型">
                  <Option value="ordinary">普通家庭</Option>
                  <Option value="low_income">低收入家庭</Option>
                  <Option value="elderly_only">空巢老人</Option>
                  <Option value="disabled">残疾人家庭</Option>
                  <Option value="single_parent">单亲家庭</Option>
                  <Option value="needy">特困家庭</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="address" label="楼号门牌号" rules={[{ required: true, message: '请输入地址' }]}>
                <Input placeholder="例如：1号楼1单元101室" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="voting_eligibility" label="投票资格" valuePropName="checked">
                <Select defaultValue={true}>
                  <Option value={true}>有资格</Option>
                  <Option value={false}>无资格</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="registration_date" label="登记日期">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="notes" label="备注">
                <Input.TextArea rows={3} placeholder="请输入备注信息" />
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

export default ResidentList;
