import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Space, Steps, Result, message, Row, Col, Statistic, Tag } from 'antd';
import { DollarOutlined, BankOutlined, AlipayCircleOutlined, WechatOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import request from '../../utils/request.js';
import useAuthStore from '../../store/authStore.js';

const { Option } = Select;
const { Step } = Steps;

const PaymentEntry = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const billId = searchParams.get('billId');
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [bill, setBill] = useState(null);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [billOptions, setBillOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const { user } = useAuthStore();
  const isCustomer = user?.role === 'CUSTOMER';

  useEffect(() => {
    if (billId) {
      fetchBillInfo();
    }
    if (!isCustomer) {
      fetchCustomerOptions();
    }
  }, [billId]);

  useEffect(() => {
    if (!isCustomer && form.getFieldValue('customerId')) {
      fetchBillOptions(form.getFieldValue('customerId'));
    }
  }, [form.getFieldValue('customerId')]);

  const fetchCustomerOptions = async () => {
    try {
      const res = await request.get('/customers/options/list');
      setCustomerOptions(res.list || []);
    } catch (error) {
      console.error('获取客户列表失败:', error);
    }
  };

  const fetchBillOptions = async (customerId) => {
    try {
      const res = await request.get('/bills/options/list', {
        params: { customerId, status: 'UNPAID,PARTIAL_PAID,OVERDUE' },
      });
      setBillOptions(res.list || []);
    } catch (error) {
      console.error('获取账单列表失败:', error);
    }
  };

  const fetchBillInfo = async () => {
    try {
      const res = await request.get(`/bills/${billId}`);
      setBill(res.bill);
      form.setFieldsValue({
        amount: res.bill.balanceAmount,
      });
    } catch (error) {
      console.error('获取账单信息失败:', error);
    }
  };

  const handleNext = async () => {
    try {
      await form.validateFields();
      setCurrentStep(1);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const values = form.getFieldsValue();
      const resolvedCustomerId = isCustomer
        ? bill?.customerId
        : (bill?.customerId || values.customerId);
      if (!resolvedCustomerId) {
        message.error('无法获取客户信息，请返回账单列表重试');
        setPaying(false);
        return;
      }
      const payload = {
        billId: billId ? parseInt(billId) : values.billId ? parseInt(values.billId) : null,
        customerId: parseInt(resolvedCustomerId),
        amount: parseFloat(values.amount),
        paymentMethod: values.paymentMethod,
        remark: values.remark || '',
        paymentDate: new Date().toISOString(),
      };

      if (isCustomer) {
        message.loading({ content: '正在处理支付...', key: 'paying', duration: 0 });
        await new Promise(resolve => setTimeout(resolve, 1200));
      }

      await request.post('/payments', payload);

      if (isCustomer) {
        message.destroy('paying');
      }
      message.success(isCustomer ? '付款成功' : '收款登记成功');
      setCurrentStep(2);
    } catch (error) {
      if (isCustomer) {
        message.destroy('paying');
      }
      console.error('付款失败:', error);
      message.error(isCustomer ? '付款失败，请重试' : '收款登记失败');
    } finally {
      setPaying(false);
    }
  };

  const paymentMethods = [
    { value: 'BANK_TRANSFER', label: '银行转账', icon: <BankOutlined style={{ fontSize: 24 }} /> },
    { value: 'ALIPAY', label: '支付宝', icon: <AlipayCircleOutlined style={{ fontSize: 24, color: '#1677ff' }} /> },
    { value: 'WECHAT', label: '微信支付', icon: <WechatOutlined style={{ fontSize: 24, color: '#07c160' }} /> },
  ];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="page-header">
        <h2>{isCustomer ? '付款入口' : '收款登记'}</h2>
      </div>

      <Card loading={loading}>
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Step title={isCustomer ? '确认订单' : '登记信息'} />
          <Step title={isCustomer ? '确认支付' : '确认信息'} />
          <Step title="完成" />
        </Steps>

        {currentStep === 0 && (
          <div>
            {bill && (
              <Card
                type="inner"
                title="待付账单"
                style={{ marginBottom: 24 }}
                extra={<Tag color="orange">{bill.status === 'OVERDUE' ? '已逾期' : '待付款'}</Tag>}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="账单编号"
                      value={bill.billNo}
                      valueStyle={{ fontSize: 14, fontWeight: 'normal' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="账期"
                      value={bill.billPeriod}
                      valueStyle={{ fontSize: 14, fontWeight: 'normal' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="账单金额"
                      value={Number(bill.totalAmount).toLocaleString()}
                      prefix="¥"
                      valueStyle={{ fontSize: 14, fontWeight: 'normal' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="已付金额"
                      value={Number(bill.paidAmount).toLocaleString()}
                      prefix="¥"
                      valueStyle={{ fontSize: 14, fontWeight: 'normal', color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={24}>
                    <Statistic
                      title="待付金额"
                      value={Number(bill.balanceAmount).toLocaleString()}
                      prefix="¥"
                      valueStyle={{ color: '#ff4d4f', fontSize: 28 }}
                    />
                  </Col>
                </Row>
              </Card>
            )}

            <Form
              form={form}
              layout="vertical"
              initialValues={{ paymentMethod: 'BANK_TRANSFER' }}
            >
              {!isCustomer && !billId && (
                <>
                  <Form.Item
                    name="customerId"
                    label="客户"
                    rules={[{ required: true, message: '请选择客户' }]}
                  >
                    <Select
                      placeholder="请选择客户"
                      showSearch
                      optionFilterProp="children"
                      onChange={(value) => {
                        form.setFieldsValue({ billId: undefined });
                        fetchBillOptions(value);
                      }}
                    >
                      {customerOptions.map(c => (
                        <Option key={c.id} value={c.id}>
                          {c.customerNo} - {c.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="billId"
                    label="关联账单（可选）"
                  >
                    <Select
                      placeholder="请选择账单"
                      showSearch
                      optionFilterProp="children"
                      onChange={(value) => {
                        const selected = billOptions.find(b => b.id === value);
                        if (selected) {
                          form.setFieldsValue({ amount: selected.balanceAmount });
                          setBill({
                            id: selected.id,
                            billNo: selected.billNo,
                            billPeriod: selected.billPeriod,
                            totalAmount: selected.totalAmount,
                            balanceAmount: selected.balanceAmount,
                            paidAmount: parseFloat(selected.totalAmount) - parseFloat(selected.balanceAmount),
                            customerId: selected.customer?.id,
                            status: selected.status,
                          });
                        }
                      }}
                      allowClear
                    >
                      {billOptions.map(b => (
                        <Option key={b.id} value={b.id}>
                          {b.billNo} ({b.billPeriod}) - 待收 ¥{Number(b.balanceAmount).toLocaleString()}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </>
              )}

              <Form.Item
                name="amount"
                label={isCustomer ? '付款金额' : '收款金额'}
                rules={[{ required: true, message: '请输入金额' }]}
              >
                <Input type="number" prefix="¥" size="large" step="0.01" min="0" />
              </Form.Item>

              <Form.Item
                name="paymentMethod"
                label={isCustomer ? '付款方式' : '收款方式'}
                rules={[{ required: true, message: '请选择付款方式' }]}
              >
                <Select size="large">
                  {paymentMethods.map((method) => (
                    <Option key={method.value} value={method.value}>
                      <Space>
                        {method.icon}
                        {method.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder={isCustomer ? '如有付款备注请填写' : '如有备注请填写'} />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Button type="primary" size="large" icon={<DollarOutlined />} onClick={handleNext}>
                  {isCustomer ? '下一步：确认付款' : '下一步'}
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <Card
              type="inner"
              title="确认信息"
              style={{ marginBottom: 24 }}
            >
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>
                  {isCustomer ? '应付金额' : '应收金额'}
                </div>
                <div style={{ fontSize: 36, fontWeight: 'bold', color: '#ff4d4f' }}>
                  ¥{Number(form.getFieldValue('amount') || bill?.balanceAmount || 0).toLocaleString()}
                </div>
                <div style={{ color: '#999', marginTop: 8 }}>
                  付款方式：{paymentMethods.find(m => m.value === form.getFieldValue('paymentMethod'))?.label || '银行转账'}
                </div>
                {bill && (
                  <div style={{ color: '#666', marginTop: 4 }}>
                    账单：{bill.billNo} ({bill.billPeriod})
                  </div>
                )}
              </div>
            </Card>

            {isCustomer && (
              <div style={{ textAlign: 'center', color: '#999', marginBottom: 24 }}>
                <p>点击确认付款后将模拟支付网关处理</p>
              </div>
            )}

            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button
                type="primary"
                size="large"
                onClick={handlePay}
                loading={paying}
              >
                {isCustomer ? '确认付款' : '确认登记'}
              </Button>
            </Space>
          </div>
        )}

        {currentStep === 2 && (
          <Result
            status="success"
            title={isCustomer ? '付款成功' : '收款登记成功'}
            subTitle={`已${isCustomer ? '支付' : '登记'}金额 ¥${Number(form.getFieldValue('amount')).toLocaleString()}，账单余额已自动更新，时间轴已写入操作记录`}
            extra={[
              <Button
                type="primary"
                key="view"
                onClick={() => navigate('/payments')}
              >
                查看付款记录
              </Button>,
              billId ? (
                <Button
                  key="bill"
                  onClick={() => navigate(`/bills/${billId}`)}
                >
                  查看账单详情
                </Button>
              ) : null,
              <Button key="back" onClick={() => navigate('/dashboard')}>
                返回首页
              </Button>,
            ].filter(Boolean)}
          />
        )}
      </Card>
    </div>
  );
};

export default PaymentEntry;
