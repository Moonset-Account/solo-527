import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Table,
  Divider,
  Row,
  Col,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Timeline,
  List,
  Upload,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  DollarOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchContractDetail,
  submitApproval,
  approveContract,
  rejectContract,
  addContractItem,
  removeContractItem,
  recordPayment,
  clearContractDetail,
} from '../../store/slices/contractsSlice';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { contractDetail, detailLoading } = useSelector(state => state.contracts);
  const { user } = useSelector(state => state.auth);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [itemForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [approvalForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [actionType, setActionType] = useState('approve');

  useEffect(() => {
    dispatch(fetchContractDetail(id));
    return () => dispatch(clearContractDetail());
  }, [dispatch, id]);

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

  const getPaymentStatusText = (status) => {
    const texts = {
      unpaid: '未付款', partial: '部分付款', paid: '已付清', refunded: '已退款'
    };
    return texts[status] || status;
  };

  const handleAddItem = async (values) => {
    const result = await dispatch(addContractItem({ id, data: values }));
    if (addContractItem.fulfilled.match(result)) {
      message.success('添加成功');
      setItemModalVisible(false);
      itemForm.resetFields();
      dispatch(fetchContractDetail(id));
    }
  };

  const handleRemoveItem = async (itemId) => {
    const result = await dispatch(removeContractItem({ contractId: id, itemId }));
    if (removeContractItem.fulfilled.match(result)) {
      message.success('删除成功');
      dispatch(fetchContractDetail(id));
    }
  };

  const handlePayment = async (values) => {
    const result = await dispatch(recordPayment({ id, data: values }));
    if (recordPayment.fulfilled.match(result)) {
      message.success('收款记录成功');
      setPaymentModalVisible(false);
      paymentForm.resetFields();
      dispatch(fetchContractDetail(id));
    }
  };

  const handleSubmitApproval = async () => {
    const values = await approvalForm.validateFields();
    const result = await dispatch(submitApproval({ id, comments: values.comments }));
    if (submitApproval.fulfilled.match(result)) {
      message.success('已提交审批');
      setApprovalModalVisible(false);
      dispatch(fetchContractDetail(id));
    }
  };

  const handleApprove = async () => {
    const values = await approvalForm.validateFields();
    const result = await dispatch(approveContract({ id, comments: values.comments }));
    if (approveContract.fulfilled.match(result)) {
      message.success('审批通过');
      setApprovalModalVisible(false);
      dispatch(fetchContractDetail(id));
    }
  };

  const handleReject = async () => {
    const values = await rejectForm.validateFields();
    const result = await dispatch(rejectContract({ id, comments: values.comments }));
    if (rejectContract.fulfilled.match(result)) {
      message.success('已拒绝');
      setRejectModalVisible(false);
      dispatch(fetchContractDetail(id));
    }
  };

  const itemColumns = [
    { title: '项目名称', dataIndex: 'item_name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price) => `¥${Number(price).toFixed(2)}`,
    },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '折扣', dataIndex: 'discount', key: 'discount', render: (d) => `${d}%` },
    {
      title: '小计',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (price) => `¥${Number(price).toFixed(2)}`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleRemoveItem(record.id)}>
          删除
        </Button>
      ),
    },
  ];

  if (detailLoading || !contractDetail) {
    return <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>;
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <Button icon={<EditOutlined />}>编辑</Button>
        {contractDetail.approval_status === 'pending' && (
          <>
            <Button type="primary" icon={<CheckOutlined />} onClick={() => {
              setActionType('approve');
              setApprovalModalVisible(true);
            }}>
              批准
            </Button>
            <Button danger icon={<CloseOutlined />} onClick={() => setRejectModalVisible(true)}>
              拒绝
            </Button>
          </>
        )}
        {(contractDetail.approval_status === 'rejected' || contractDetail.approval_status === 'revision') && (
          <Button type="primary" onClick={() => setApprovalModalVisible(true)}>
            提交审批
          </Button>
        )}
        <Button type="primary" icon={<DollarOutlined />} onClick={() => setPaymentModalVisible(true)}>
          收款
        </Button>
      </Space>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="合同信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2}>
              <Descriptions.Item label="合同编号">
                {contractDetail.contract_no}
              </Descriptions.Item>
              <Descriptions.Item label="合同类型">
                {contractDetail.contract_type_display}
              </Descriptions.Item>
              <Descriptions.Item label="客户姓名">
                {contractDetail.customer_name}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {contractDetail.customer_phone}
              </Descriptions.Item>
              <Descriptions.Item label="合同状态">
                {contractDetail.status_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="审批状态">
                <Tag color={getApprovalStatusColor(contractDetail.approval_status)}>
                  {getApprovalStatusText(contractDetail.approval_status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="付款状态">
                <Tag color="green">
                  {getPaymentStatusText(contractDetail.payment_status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="销售">
                {contractDetail.sales_person_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="主治医生">
                {contractDetail.doctor_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {contractDetail.created_by_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(contractDetail.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="审批人">
                {contractDetail.approved_by_name || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title="合同项目"
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setItemModalVisible(true)}>
                添加项目
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            <Table
              columns={itemColumns}
              dataSource={contractDetail.items || []}
              rowKey="id"
              pagination={false}
              size="small"
              footer={() => (
                <div style={{ textAlign: 'right' }}>
                  <Space direction="vertical" size="small" style={{ textAlign: 'left' }}>
                    <div>原价：¥{Number(contractDetail.total_amount).toFixed(2)}</div>
                    <div>折扣：{contractDetail.discount_percent}% (-¥{Number(contractDetail.discount_amount).toFixed(2)})</div>
                    <div style={{ fontWeight: 'bold', color: '#1890ff', fontSize: 16 }}>
                      实收：¥{Number(contractDetail.actual_amount).toFixed(2)}
                    </div>
                  </Space>
                </div>
              )}
            />
            {(!contractDetail.items || contractDetail.items.length === 0) && (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                暂无合同项目
              </div>
            )}
          </Card>

          <Card title="治疗方案" style={{ marginBottom: 16 }}>
            <Descriptions column={1}>
              <Descriptions.Item label="治疗方案">
                {contractDetail.treatment_plan || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="治疗周期">
                {contractDetail.treatment_cycle || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="质保信息">
                {contractDetail.warranty_info || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="开始日期">
                {contractDetail.start_date ? dayjs(contractDetail.start_date).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="结束日期">
                {contractDetail.end_date ? dayjs(contractDetail.end_date).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="折扣申请">
            <Descriptions column={1}>
              <Descriptions.Item label="折扣比例">
                <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 18 }}>
                  {contractDetail.discount_percent}%
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="申请理由">
                {contractDetail.discount_reason || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="审批意见">
                {contractDetail.approval_comments || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="财务概览" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <div style={{ color: '#999', marginBottom: 4 }}>合同金额</div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                  ¥{Number(contractDetail.total_amount).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ color: '#999', marginBottom: 4 }}>折扣金额</div>
                <div style={{ fontSize: 18, color: '#ff4d4f' }}>
                  -¥{Number(contractDetail.discount_amount).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ color: '#999', marginBottom: 4 }}>实收金额</div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                  ¥{Number(contractDetail.actual_amount).toFixed(2)}
                </div>
              </div>
              <Divider style={{ margin: 0 }} />
              <div>
                <div style={{ color: '#999', marginBottom: 4 }}>已收款</div>
                <div style={{ fontSize: 18, color: '#1890ff' }}>
                  ¥{Number(contractDetail.paid_amount).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ color: '#999', marginBottom: 4 }}>待收款</div>
                <div style={{ fontSize: 18, color: '#faad14' }}>
                  ¥{(Number(contractDetail.actual_amount) - Number(contractDetail.paid_amount)).toFixed(2)}
                </div>
              </div>
            </Space>
          </Card>

          <Card title="审批记录" style={{ marginBottom: 16 }}>
            <Timeline
              items={contractDetail.approval_records?.map(record => ({
                color: record.action === 'approve' ? 'green' : record.action === 'reject' ? 'red' : 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {record.action_display}
                      <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
                        {record.approved_by_name} · {dayjs(record.created_at).format('MM-DD HH:mm')}
                      </span>
                    </div>
                    {record.comments && <div style={{ color: '#666' }}>{record.comments}</div>}
                  </div>
                ),
              })) || []}
            />
            {(!contractDetail.approval_records || contractDetail.approval_records.length === 0) && (
              <div style={{ textAlign: 'center', color: '#999', padding: 10 }}>
                暂无审批记录
              </div>
            )}
          </Card>

          <Card title="合同附件" extra={<Button size="small" icon={<PlusOutlined />}>上传</Button>}>
            <List
              size="small"
              dataSource={contractDetail.attachments || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<FileTextOutlined />}
                    title={<a>{item.file_name}</a>}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
            {(!contractDetail.attachments || contractDetail.attachments.length === 0) && (
              <div style={{ textAlign: 'center', color: '#999', padding: 10 }}>
                暂无附件
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="添加合同项目"
        open={itemModalVisible}
        onCancel={() => setItemModalVisible(false)}
        footer={null}
      >
        <Form form={itemForm} layout="vertical" onFinish={handleAddItem}>
          <Form.Item
            name="item_name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Input placeholder="请输入分类" />
          </Form.Item>
          <Form.Item
            name="unit_price"
            label="单价"
            rules={[{ required: true, message: '请输入单价' }]}
          >
            <InputNumber prefix="¥" min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
            initialValue={1}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="discount"
            label="折扣(%)"
            initialValue={0}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              添加
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="收款登记"
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={null}
      >
        <Form form={paymentForm} layout="vertical" onFinish={handlePayment}>
          <Form.Item
            name="amount"
            label="收款金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber prefix="¥" min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="payment_method"
            label="收款方式"
            rules={[{ required: true, message: '请选择收款方式' }]}
            initialValue="wechat"
          >
            <Select>
              <Option value="cash">现金</Option>
              <Option value="wechat">微信</Option>
              <Option value="alipay">支付宝</Option>
              <Option value="bank">银行转账</Option>
              <Option value="card">刷卡</Option>
              <Option value="installment">分期付款</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="receipt_no" label="收据编号">
            <Input placeholder="请输入收据编号" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认收款
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={actionType === 'approve' ? '批准合同' : '提交审批'}
        open={approvalModalVisible}
        onCancel={() => setApprovalModalVisible(false)}
        onOk={actionType === 'approve' ? handleApprove : handleSubmitApproval}
        okText="确认"
      >
        <Form form={approvalForm} layout="vertical">
          <Form.Item name="comments" label="审批意见">
            <TextArea rows={4} placeholder="请输入审批意见" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="拒绝合同"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onOk={handleReject}
        okText="确认拒绝"
        okButtonProps={{ danger: true }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="comments"
            label="拒绝理由"
            rules={[{ required: true, message: '请填写拒绝理由' }]}
          >
            <TextArea rows={4} placeholder="请输入拒绝理由" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractDetail;
