import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Space, Steps, Result, message, Row, Col, Statistic, Tag } from 'antd';
import { DollarOutlined, BankOutlined, AlipayCircleOutlined, WechatOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import request from '../../utils/request.js';
import useAuthStore from '../../store/authStore.js';

const { Option } = Select;
const { Step } = Steps;

const PaymentEntry = () => {
  const [searchParams] = useSearchParams();
  const billId = searchParams.get('billId');
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [bill, setBill] = useState(null);
  const { user } = useAuthStore();
  const isCustomer = user?.role === 'CUSTOMER';

  useEffect(() => {
    if (billId) {
      fetchBillInfo();
    }
  }, [billId]);

  const fetchBillInfo = async () => {
    try {
      const res = await request.get(`/bills/${billId}`);
      setBill(res.bill);
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
    if (isCustomer) {
      message.info('客户侧付款将跳转到支付网关（演示环境模拟）');
      setTimeout(() => {
        setCurrentStep(2);
      }, 1500);
    } else {
      try {
        const values = form.getFieldsValue();
        await request.post('/payments', {
          ...values,
          billId: billId ? parseInt(billId) : null,
          paymentDate: new Date().toISOString(),
        });
        message.success('收款登记成功');
        setCurrentStep(2);
      } catch (error) {
        console.error('付款失败:', error);
      }
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

      <Card>
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
                extra={<Tag color="orange">待付款</Tag>}
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
              {!billId && (
                <Form.Item
                  name="customerId"
                  label="客户"
                  rules={[{ required: true, message: '请选择客户' }]}
                >
                  <Select placeholder="请选择客户">
                    {/* 实际项目中从接口获取 */}
                  </Select>
                </Form.Item>
              )}

              <Form.Item
                name="amount"
                label={isCustomer ? '付款金额' : '收款金额'}
                rules={[{ required: true, message: '请输入金额' }]}
                initialValue={bill?.balanceAmount}
              >
                <Input type="number" prefix="¥" size="large" />
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
              </div>
            </Card>

            {isCustomer && (
              <div style={{ textAlign: 'center', color: '#999', marginBottom: 24 }}>
                <p>点击确认付款后将跳转到支付页面完成支付</p>
              </div>
            )}

            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button type="primary" size="large" onClick={handlePay}>
                {isCustomer ? '确认付款' : '确认登记'}
              </Button>
            </Space>
          </div>
        )}

        {currentStep === 2 && (
          <Result
            status="success"
            title={isCustomer ? '付款成功' : '收款登记成功'}
            subTitle="感谢您的付款，我们将尽快为您处理"
            extra={[
              <Button type="primary" key="view">
                查看付款记录
              </Button>,
              <Button key="back">返回首页</Button>,
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default PaymentEntry;
