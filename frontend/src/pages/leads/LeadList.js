import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Card,
  Row,
  Col,
  DatePicker,
  Modal,
  Form,
  message,
} from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchLeads,
  fetchLeadSources,
  fetchLeadStatuses,
  assignLead,
} from '../../store/slices/leadsSlice';
import { fetchUsers } from '../../store/slices/commonSlice';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const LeadList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { leads, sources, statuses, loading, pagination } = useSelector(state => state.leads);
  const { users } = useSelector(state => state.common);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({});
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [assignForm] = Form.useForm();

  useEffect(() => {
    dispatch(fetchLeads());
    dispatch(fetchLeadSources());
    dispatch(fetchLeadStatuses());
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleSearch = () => {
    dispatch(fetchLeads({ ...filters, search: searchText }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getQualityColor = (quality) => {
    const colors = { high: 'green', medium: 'gold', low: 'red' };
    return colors[quality] || 'default';
  };

  const getQualityText = (quality) => {
    const texts = { high: '高质量', medium: '中质量', low: '低质量' };
    return texts[quality] || quality;
  };

  const columns = [
    {
      title: '客户姓名',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (text, record) => (
        <a onClick={() => navigate(`/leads/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'customer_phone',
      key: 'customer_phone',
    },
    {
      title: '线索来源',
      dataIndex: 'source_name',
      key: 'source_name',
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status_name',
      key: 'status_name',
      render: (text, record) => (
        <Tag color="blue">{text || '新线索'}</Tag>
      ),
    },
    {
      title: '质量等级',
      dataIndex: 'quality',
      key: 'quality',
      render: (quality) => (
        <Tag color={getQualityColor(quality)}>
          {getQualityText(quality)}
        </Tag>
      ),
    },
    {
      title: '质量评分',
      dataIndex: 'quality_score',
      key: 'quality_score',
      render: (score) => `${score}分`,
    },
    {
      title: '负责人',
      dataIndex: 'assigned_to_name',
      key: 'assigned_to_name',
      render: (text) => text || '未分配',
    },
    {
      title: '预计金额',
      dataIndex: 'expected_amount',
      key: 'expected_amount',
      render: (amount) => `¥${Number(amount).toFixed(2)}`,
    },
    {
      title: '跟进次数',
      dataIndex: 'followup_count',
      key: 'followup_count',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => navigate(`/leads/${record.id}`)}>查看</a>
          <a onClick={() => {
            setSelectedLead(record);
            setAssignModalVisible(true);
          }}>分配</a>
        </Space>
      ),
    },
  ];

  const handleAssignSubmit = async (values) => {
    if (selectedLead) {
      await dispatch(assignLead({ id: selectedLead.id, userId: values.user_id }));
      message.success('分配成功');
      setAssignModalVisible(false);
      dispatch(fetchLeads());
      assignForm.resetFields();
    }
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={6}>
            <Input
              placeholder="搜索客户姓名/电话"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="线索来源"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('source', value)}
            >
              {sources.map(source => (
                <Option key={source.id} value={source.id}>{source.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="线索状态"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('status', value)}
            >
              {statuses.map(status => (
                <Option key={status.id} value={status.id}>{status.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="质量等级"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('quality', value)}
            >
              <Option value="high">高质量</Option>
              <Option value="medium">中质量</Option>
              <Option value="low">低质量</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  handleFilterChange('created_at_start', dates[0].format('YYYY-MM-DD'));
                  handleFilterChange('created_at_end', dates[1].format('YYYY-MM-DD'));
                }
              }}
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button icon={<FilterOutlined />} onClick={() => {
                setFilters({});
                setSearchText('');
                dispatch(fetchLeads());
              }}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        title="线索列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/leads/create')}>
            新建线索
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={leads}
          rowKey="id"
          loading={loading}
          pagination={{
            total: pagination.count,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title="分配线索"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignSubmit}>
          <Form.Item
            name="user_id"
            label="分配给"
            rules={[{ required: true, message: '请选择负责人' }]}
          >
            <Select placeholder="请选择负责人">
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认分配
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeadList;
