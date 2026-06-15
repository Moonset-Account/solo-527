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
  Badge,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContracts, fetchContractStatuses } from '../../store/slices/contractsSlice';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const ContractList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { contracts, statuses, loading, pagination } = useSelector(state => state.contracts);

  useEffect(() => {
    dispatch(fetchContracts());
    dispatch(fetchContractStatuses());
  }, [dispatch]);

  const getApprovalStatusColor = (status) => {
    const colors = {
      pending: 'gold', approved: 'green', rejected: 'red', revision: 'orange'
    };
    return colors[status] || 'default';
  };

  const getApprovalStatusText = (status) => {
    const texts = {
      pending: '待审批', approved: '已批准', rejected: '已拒绝', revision: '待修改'
    };
    return texts[status] || status;
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      unpaid: 'default', partial: 'orange', paid: 'green', refunded: 'red'
    };
    return colors[status] || 'default';
  };

  const getPaymentStatusText = (status) => {
    const texts = {
      unpaid: '未付款', partial: '部分付款', paid: '已付清', refunded: '已退款'
    };
    return texts[status] || status;
  };

  const columns = [
    {
      title: '合同编号',
      dataIndex: 'contract_no',
      key: 'contract_no',
      render: (text, record) => (
        <a onClick={() => navigate(`/contracts/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '客户姓名',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: '联系电话',
      dataIndex: 'customer_phone',
      key: 'customer_phone',
    },
    {
      title: '合同状态',
      dataIndex: 'status_name',
      key: 'status_name',
      render: (text) => text || '-',
    },
    {
      title: '审批状态',
      dataIndex: 'approval_status',
      key: 'approval_status',
      render: (status) => (
        <Tag color={getApprovalStatusColor(status)}>
          {getApprovalStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '付款状态',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status) => (
        <Tag color={getPaymentStatusColor(status)}>
          {getPaymentStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '合同金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `¥${Number(amount).toFixed(2)}`,
    },
    {
      title: '实付金额',
      dataIndex: 'actual_amount',
      key: 'actual_amount',
      render: (amount) => <span style={{ color: '#52c41a' }}>¥{Number(amount).toFixed(2)}</span>,
    },
    {
      title: '折扣',
      dataIndex: 'discount_percent',
      key: 'discount_percent',
      render: (percent) => `${percent}%`,
    },
    {
      title: '销售',
      dataIndex: 'sales_person_name',
      key: 'sales_person_name',
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
          <a onClick={() => navigate(`/contracts/${record.id}`)}>查看</a>
          {record.approval_status === 'pending' && (
            <Badge dot><a>审批</a></Badge>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Search
            placeholder="搜索合同编号/客户"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            style={{ width: 300 }}
          />
          <Select placeholder="合同状态" allowClear style={{ width: 150 }}>
            {statuses.map(status => (
              <Option key={status.id} value={status.id}>{status.name}</Option>
            ))}
          </Select>
          <Select placeholder="审批状态" allowClear style={{ width: 150 }}>
            <Option value="pending">待审批</Option>
            <Option value="approved">已批准</Option>
            <Option value="rejected">已拒绝</Option>
            <Option value="revision">待修改</Option>
          </Select>
          <Select placeholder="付款状态" allowClear style={{ width: 150 }}>
            <Option value="unpaid">未付款</Option>
            <Option value="partial">部分付款</Option>
            <Option value="paid">已付清</Option>
            <Option value="refunded">已退款</Option>
          </Select>
          <DatePicker.RangePicker />
        </Space>
      </Card>

      <Card
        title="合同列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/contracts/create')}>
            新建合同
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={contracts}
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

export default ContractList;
