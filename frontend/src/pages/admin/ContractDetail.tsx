import { useState, useEffect } from 'react';
import {
  Descriptions, Tag, Card, Row, Col, Button, Table, Space, Modal,
  Form, Input, InputNumber, Select, DatePicker, message, Spin, Result, Progress,
} from 'antd';
import {
  ArrowLeftOutlined, FileTextOutlined, DollarOutlined,
  CheckOutlined, DownloadOutlined, PlusOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { contractApi } from '../../services/api';
import {
  contractStatusLabels, contractStatusColors,
  billStatusLabels, billStatusColors, paymentMethodLabels,
} from '../../utils/enums';
import { useAuthStore } from '../../store/auth';
import { UserRole, ContractStatus, BillStatus, PaymentMethod } from '../../types';
import type { Contract, Bill } from '../../types';

function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Contract | null>(null);
  const [payModal, setPayModal] = useState(false);
  const [billModal, setBillModal] = useState(false);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [payForm] = Form.useForm();
  const [billForm] = Form.useForm();

  const canPay = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Finance);
  const canCreateBill = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Finance);
  const canExport = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Finance);

  useEffect(() => { fetchDetail(); }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await contractApi.detail(id!);
      if (res.success && res.data) setDetail(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (values: any) => {
    if (!currentBill) return;
    try {
      const res = await contractApi.payBill(currentBill.id, values);
      if (res.success) {
        message.success('支付成功');
        setPayModal(false);
        payForm.resetFields();
        fetchDetail();
      }
    } catch { }
  };

  const handleCreateBill = async (values: any) => {
    try {
      const res = await contractApi.createBill({
        contractId: id,
        ...values,
        billingDate: values.billingDate.toDate(),
        dueDate: values.dueDate.toDate(),
      });
      if (res.success) {
        message.success('账单创建成功');
        setBillModal(false);
        billForm.resetFields();
        fetchDetail();
      }
    } catch { }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!detail) return <Result status="404" title="合同不存在" extra={<Button type="primary" onClick={() => navigate('/admin/contracts')}>返回列表</Button>} />;

  const totalAmount = detail.bills.reduce((s, b) => s + b.amount, 0);
  const paidAmount = detail.bills.reduce((s, b) => s + b.paidAmount, 0);
  const unpaidBills = detail.bills.filter(b => b.status === BillStatus.Unpaid || b.status === BillStatus.Overdue).length;

  const billColumns = [
    { title: '账单编号', dataIndex: 'billNo', width: 180 },
    { title: '类型', dataIndex: 'billType', width: 80 },
    { title: '账期', dataIndex: 'period', width: 100 },
    { title: '金额', dataIndex: 'amount', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '已付', dataIndex: 'paidAmount', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '账单日期', dataIndex: 'billingDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
    { title: '到期日期', dataIndex: 'dueDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
    {
      title: '状态', dataIndex: 'status',
      render: (v: BillStatus) => <Tag color={billStatusColors[v]}>{billStatusLabels[v]}</Tag>,
    },
    {
      title: '操作',
      render: (_: any, r: Bill) => canPay && r.status !== BillStatus.Paid && r.status !== BillStatus.Void ? (
        <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => { setCurrentBill(r); setPayModal(true); }}>
          收款
        </Button>
      ) : null,
    },
  ];

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/contracts')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      <Row gutter={16}>
        <Col xs={24} md={16}>
          <Card title={<Space><FileTextOutlined /> 合同详情</Space>} style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="合同编号" span={2}>
                {detail.contractNo}
                <Tag color={contractStatusColors[detail.status]} style={{ marginLeft: 12 }}>
                  {contractStatusLabels[detail.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="租客姓名">{detail.tenantName}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{detail.tenantPhone}</Descriptions.Item>
              <Descriptions.Item label="公司名称" span={2}>{detail.tenantCompany || '-'}</Descriptions.Item>
              <Descriptions.Item label="房源" span={2}>{detail.spaceName}</Descriptions.Item>
              <Descriptions.Item label="租期" span={2}>
                {dayjs(detail.startDate).format('YYYY-MM-DD')} 至 {dayjs(detail.endDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="月租金">¥{detail.monthlyRent.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="押金">¥{detail.depositAmount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="付款方式">{paymentMethodLabels[detail.paymentMethod]} · 每{detail.paymentMonths}个月</Descriptions.Item>
              <Descriptions.Item label="签署人">{detail.signedByName || '-'}</Descriptions.Item>
              <Descriptions.Item label="签署时间" span={2}>
                {detail.signedAt ? dayjs(detail.signedAt).format('YYYY-MM-DD HH:mm') : '未签署'}
              </Descriptions.Item>
              <Descriptions.Item label="合同条款" span={2}>{detail.terms || '-'}</Descriptions.Item>
              <Descriptions.Item label="特殊约定" span={2}>{detail.specialClauses || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title={<Space><DollarOutlined /> 账单列表 ({detail.bills.length}条)</Space>}
            extra={
              <Space>
                {canExport && <Button size="small" icon={<DownloadOutlined />}>导出账单</Button>}
                {canCreateBill && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setBillModal(true)}>创建账单</Button>}
              </Space>
            }
          >
            <Table
              rowKey="id"
              dataSource={detail.bills}
              columns={billColumns}
              size="small"
              pagination={{ pageSize: 8 }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="财务概览">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row gutter={8}>
                <Col span={12}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#999' }}>合同总额</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1677ff' }}>¥{totalAmount.toLocaleString()}</div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#999' }}>已收款</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>¥{paidAmount.toLocaleString()}</div>
                  </Card>
                </Col>
              </Row>
              <Progress
                percent={totalAmount > 0 ? Math.round(paidAmount / totalAmount * 100) : 0}
                status={totalAmount === paidAmount ? 'success' : 'active'}
              />
              <Tag color={unpaidBills > 0 ? 'orange' : 'green'} style={{ textAlign: 'center', fontSize: 14, padding: '4px 0' }}>
                {unpaidBills > 0 ? `⚠️ 有 ${unpaidBills} 笔未支付账单` : '✅ 所有账单已结清'}
              </Tag>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal title="账单收款" open={payModal} onCancel={() => { setPayModal(false); payForm.resetFields(); }} footer={null}>
        {currentBill && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f6ffed', borderRadius: 4 }}>
            <div><strong>账单：</strong>{currentBill.billNo} · {currentBill.billType}</div>
            <div><strong>待收金额：</strong>¥{(currentBill.amount - currentBill.paidAmount).toLocaleString()} / 总额 ¥{currentBill.amount.toLocaleString()}</div>
          </div>
        )}
        <Form form={payForm} layout="vertical" onFinish={handlePay}>
          <Form.Item name="amount" label="收款金额" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入金额" />
          </Form.Item>
          <Form.Item name="paymentMethod" label="收款方式" rules={[{ required: true }]}>
            <Select options={Object.entries(paymentMethodLabels).map(([k, v]) => ({ value: Number(k), label: v }))} />
          </Form.Item>
          <Form.Item name="paymentRefNo" label="流水号"><Input /></Form.Item>
          <Form.Item name="remarks" label="备注"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setPayModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认收款</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="创建账单" open={billModal} onCancel={() => { setBillModal(false); billForm.resetFields(); }} footer={null}>
        <Form form={billForm} layout="vertical" onFinish={handleCreateBill}>
          <Form.Item name="billType" label="账单类型" rules={[{ required: true }]}>
            <Select options={[
              { value: '月租', label: '月租' },
              { value: '押金', label: '押金' },
              { value: '水费', label: '水费' },
              { value: '电费', label: '电费' },
              { value: '物业费', label: '物业费' },
              { value: '其他', label: '其他' },
            ]} />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="period" label="账期"><Input placeholder="如：2024-01" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="billingDate" label="账单日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="到期日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remarks" label="备注"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setBillModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ContractDetail;
