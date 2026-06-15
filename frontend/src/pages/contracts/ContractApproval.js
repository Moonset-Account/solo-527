import React, { useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Modal,
  Form,
  Input,
  message,
} from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPendingApprovals,
  approveContract,
  rejectContract,
  requestRevision,
} from '../../store/slices/contractsSlice';
import dayjs from 'dayjs';

const { TextArea } = Input;

const ContractApproval = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pendingApprovals, loading } = useSelector(state => state.contracts);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [actionType, setActionType] = React.useState('');
  const [selectedContract, setSelectedContract] = React.useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchPendingApprovals());
  }, [dispatch]);

  const handleAction = (record, type) => {
    setSelectedContract(record);
    setActionType(type);
    setModalVisible(true);
    form.resetFields();
  };

  const handleConfirm = async () => {
    try {
      const values = await form.validateFields();
      let result;

      if (actionType === 'approve') {
        result = await dispatch(approveContract({ id: selectedContract.id, comments: values.comments }));
        message.success('审批通过');
      } else if (actionType === 'reject') {
        result = await dispatch(rejectContract({ id: selectedContract.id, comments: values.comments }));
        message.success('已拒绝');
      } else if (actionType === 'revision') {
        result = await dispatch(requestRevision({ id: selectedContract.id, comments: values.comments }));
        message.success('已要求修改');
      }

      setModalVisible(false);
      dispatch(fetchPendingApprovals());
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getActionTitle = () => {
    const titles = {
      approve: '批准合同',
      reject: '拒绝合同',
      revision: '要求修改',
    };
    return titles[actionType] || '审批';
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
      title: '合同金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `¥${Number(amount).toFixed(2)}`,
    },
    {
      title: '折扣',
      dataIndex: 'discount_percent',
      key: 'discount_percent',
      render: (percent) => (
        <Tag color="orange">{percent}%</Tag>
      ),
    },
    {
      title: '实收金额',
      dataIndex: 'actual_amount',
      key: 'actual_amount',
      render: (amount) => <span style={{ color: '#52c41a' }}>¥{Number(amount).toFixed(2)}</span>,
    },
    {
      title: '销售',
      dataIndex: 'sales_person_name',
      key: 'sales_person_name',
      render: (text) => text || '-',
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleAction(record, 'approve')}
          >
            批准
          </Button>
          <Button
            size="small"
            onClick={() => handleAction(record, 'revision')}
          >
            修改
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleAction(record, 'reject')}
          >
            拒绝
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/contracts/${record.id}`)}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="待审批合同"
        extra={<Tag color="gold">{pendingApprovals.length} 份待审批</Tag>}
      >
        <Table
          columns={columns}
          dataSource={pendingApprovals}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title={getActionTitle()}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleConfirm}
        okText="确认"
        okButtonProps={{
          danger: actionType === 'reject',
          type: actionType === 'reject' ? 'primary' : 'primary',
        }}
      >
        {selectedContract && (
          <div style={{ marginBottom: 16 }}>
            <p>合同编号：<strong>{selectedContract.contract_no}</strong></p>
            <p>客户：{selectedContract.customer_name}</p>
            <p>实收金额：<span style={{ color: '#52c41a' }}>¥{Number(selectedContract.actual_amount).toFixed(2)}</span></p>
            <p>折扣：<span style={{ color: '#ff4d4f' }}>{selectedContract.discount_percent}%</span></p>
          </div>
        )}
        <Form form={form} layout="vertical">
          <Form.Item
            name="comments"
            label={actionType === 'reject' ? '拒绝理由' : actionType === 'revision' ? '修改意见' : '审批意见'}
            rules={actionType !== 'approve' ? [{ required: true, message: '请填写意见' }] : []}
          >
            <TextArea rows={4} placeholder="请输入意见..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractApproval;
