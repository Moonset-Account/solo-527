
import { useState, useEffect } from 'react';
import { Card, Form, Input, Select, InputNumber, DatePicker, Button, Space, Row, Col, App, Divider } from 'antd';
import { SaveOutlined, RollbackOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { orderApi, storeApi } from '@/services/api';
import { CreateOrderDto, StoreDto } from '@/types';

const { Option } = Select;
const { TextArea } = Input;

const OrderCreate = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStores();
    form.setFieldsValue({
      orderDate: dayjs(),
      deliveryDate: dayjs().add(3, 'day'),
      unit: '份'
    });
  }, []);

  const loadStores = async () => {
    try {
      const res = await storeApi.getList();
      setStores(res.data);
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const data: CreateOrderDto = {
        storeId: values.storeId,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        productName: values.productName,
        specifications: values.specifications,
        quantity: values.quantity,
        unit: values.unit,
        unitPrice: values.unitPrice,
        materialRequirements: values.materialRequirements || '',
        specialRequirements: values.specialRequirements || '',
        orderDate: values.orderDate.format('YYYY-MM-DD'),
        deliveryDate: values.deliveryDate.format('YYYY-MM-DD'),
        remarks: values.remarks
      };

      const res = await orderApi.create(data);
      message.success('订单创建成功');
      navigate(`/orders/${res.data.id}`);
    } catch (error) {
      message.error('订单创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    form.setFieldsValue({
      orderDate: dayjs(),
      deliveryDate: dayjs().add(3, 'day'),
      unit: '份'
    });
  };

  const handlePriceCalculate = () => {
    const quantity = form.getFieldValue('quantity');
    const unitPrice = form.getFieldValue('unitPrice');
    if (quantity && unitPrice) {
      form.setFieldsValue({
        totalAmount: (quantity * unitPrice).toFixed(2)
      });
    }
  };

  const commonUnitOptions = ['份', '张', '本', '套', '盒', '个', '箱'];

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>订单录入</h2>
          <Space>
            <Button onClick={() => navigate('/orders')} icon={<RollbackOutlined />}>
              返回列表
            </Button>
          </Space>
        </div>
      </div>

      <Card title="订单信息">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={(changedValues) => {
            if ('quantity' in changedValues || 'unitPrice' in changedValues) {
              handlePriceCalculate();
            }
          }}
        >
          <Divider orientation="left">基本信息</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="storeId"
                label="门店"
                rules={[{ required: true, message: '请选择门店' }]}
              >
                <Select placeholder="请选择门店">
                  {stores.map(store => (
                    <Option key={store.id} value={store.id}>{store.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="customerName"
                label="客户名称"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="customerPhone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">产品信息</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                name="productName"
                label="产品名称"
                rules={[{ required: true, message: '请输入产品名称' }]}
              >
                <Input placeholder="如：宣传单页、名片、画册等" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                name="specifications"
                label="规格"
                rules={[{ required: true, message: '请输入规格' }]}
              >
                <Input placeholder="如：A4 双面彩印 157g铜版纸" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="quantity"
                label="数量"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber
                  min={1}
                  placeholder="数量"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="unit"
                label="单位"
                rules={[{ required: true, message: '请选择或输入单位' }]}
              >
                <Select
                  placeholder="选择单位"
                  mode="tags"
                  tokenSeparators={[',']}
                  style={{ width: '100%' }}
                >
                  {commonUnitOptions.map(u => (
                    <Option key={u} value={u}>{u}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="unitPrice"
                label="单价"
                rules={[{ required: true, message: '请输入单价' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="单价(元)"
                  style={{ width: '100%' }}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="totalAmount"
                label="总金额"
              >
                <InputNumber
                  readOnly
                  precision={2}
                  placeholder="自动计算"
                  style={{ width: '100%' }}
                  prefix="¥"
                  className="readOnly-input"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="orderDate"
                label="下单日期"
                rules={[{ required: true, message: '请选择下单日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="deliveryDate"
                label="要求交付日期"
                rules={[{ required: true, message: '请选择交付日期' }]}
              >
                <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d.isBefore(dayjs().subtract(1, 'day'))} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">要求与备注</Divider>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="materialRequirements"
                label="物料要求"
              >
                <TextArea rows={3} placeholder="请描述纸张、油墨、工艺等物料要求" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="specialRequirements"
                label="特殊要求"
              >
                <TextArea rows={3} placeholder="请描述特殊工艺、包装、送货等特殊要求" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="remarks"
                label="备注"
              >
                <TextArea rows={2} placeholder="其他备注信息" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                保存订单
              </Button>
              <Button onClick={handleReset} icon={<RollbackOutlined />}>
                重置
              </Button>
              <Button onClick={() => navigate('/orders')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default OrderCreate;
