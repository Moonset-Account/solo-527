import React, { useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Card,
  DatePicker,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchConsultations } from '../../store/slices/consultationsSlice';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const ConsultationList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { consultations, loading, pagination } = useSelector(state => state.consultations);

  useEffect(() => {
    dispatch(fetchConsultations());
  }, [dispatch]);

  const getTypeText = (type) => {
    const types = {
      initial: '初诊咨询', followup: '复诊咨询', treatment: '方案咨询',
      price: '价格咨询', other: '其他'
    };
    return types[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      initial: 'blue', followup: 'green', treatment: 'purple',
      price: 'orange', other: 'default'
    };
    return colors[type] || 'default';
  };

  const getIntentionText = (level) => {
    const levels = { high: '高意向', medium: '中意向', low: '低意向', none: '无意向' };
    return levels[level] || level;
  };

  const getIntentionColor = (level) => {
    const colors = { high: 'green', medium: 'gold', low: 'red', none: 'default' };
    return colors[level] || 'default';
  };

  const columns = [
    {
      title: '客户姓名',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (text, record) => (
        <a onClick={() => navigate(`/consultations/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '咨询类型',
      dataIndex: 'consultation_type',
      key: 'consultation_type',
      render: (type) => (
        <Tag color={getTypeColor(type)}>{getTypeText(type)}</Tag>
      ),
    },
    {
      title: '意向等级',
      dataIndex: 'intention_level',
      key: 'intention_level',
      render: (level) => (
        <Tag color={getIntentionColor(level)}>{getIntentionText(level)}</Tag>
      ),
    },
    {
      title: '主诉',
      dataIndex: 'chief_complaint',
      key: 'chief_complaint',
      ellipsis: true,
    },
    {
      title: '预估价格',
      dataIndex: 'estimated_price',
      key: 'estimated_price',
      render: (price) => `¥${Number(price).toFixed(2)}`,
    },
    {
      title: '咨询医生',
      dataIndex: 'consultation_doctor_name',
      key: 'consultation_doctor_name',
      render: (text) => text || '-',
    },
    {
      title: '咨询师',
      dataIndex: 'consultant_name',
      key: 'consultant_name',
      render: (text) => text || '-',
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
          <a onClick={() => navigate(`/consultations/${record.id}`)}>查看</a>
          <a>编辑</a>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Search
            placeholder="搜索客户姓名/主诉"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            style={{ width: 300 }}
          />
          <Select placeholder="咨询类型" allowClear style={{ width: 150 }}>
            <Option value="initial">初诊咨询</Option>
            <Option value="followup">复诊咨询</Option>
            <Option value="treatment">方案咨询</Option>
            <Option value="price">价格咨询</Option>
            <Option value="other">其他</Option>
          </Select>
          <Select placeholder="意向等级" allowClear style={{ width: 150 }}>
            <Option value="high">高意向</Option>
            <Option value="medium">中意向</Option>
            <Option value="low">低意向</Option>
            <Option value="none">无意向</Option>
          </Select>
          <DatePicker.RangePicker />
        </Space>
      </Card>

      <Card
        title="咨询记录"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/consultations/create')}>
            新建咨询
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={consultations}
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
    </div>
  );
};

export default ConsultationList;
