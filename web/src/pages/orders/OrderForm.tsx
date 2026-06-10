import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  message,
  Row,
  Col,
  Divider,
  Card,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type {
  Order,
  CreateOrderDto,
  UpdateOrderDto,
  Customer,
  User,
} from '@/types';
import { urgentLevelMap } from '@/types';
import {
  createOrder,
  updateOrder,
  getCustomers,
  userApi,
} from '@/api';

interface OrderFormProps {
  initialData?: Order | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const { TextArea } = Input;

const OrderForm: React.FC<OrderFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<{ label: string; value: string }[]>([]);
  const [salespeople, setSalespeople] = useState<{ label: string; value: string }[]>([]);

  const isEdit = !!initialData;

  useEffect(() => {
    getCustomers({ page: 1, pageSize: 999 })
      .then((res) => {
        setCustomers(
          (res.list || []).map((c: Customer) => ({ label: c.name, value: c.id }))
        );
      })
      .catch(() => {});

    userApi
      .findByRole('sales', { page: 1, pageSize: 999 })
      .then((res) => {
        setSalespeople(
          (res.list || []).map((u: User) => ({ label: u.name, value: u.id }))
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialData) {
      const initialValues: any = {
        ...initialData,
        orderDate: initialData.orderDate ? dayjs(initialData.orderDate) : undefined,
        deliveryDate: initialData.deliveryDate ? dayjs(initialData.deliveryDate) : undefined,
        processes: initialData.processes?.length
          ? initialData.processes.map((p) => ({
              processName: p.processName,
              processRequirement: p.processRequirement,
              processParams: p.processParams ? JSON.stringify(p.processParams, null, 2) : '',
              sortOrder: p.sortOrder,
            }))
          : [],
        deliveryRequirements: initialData.deliveryRequirements?.length
          ? initialData.deliveryRequirements.map((r) => ({
              requirementType: r.requirementType,
              requirementContent: r.requirementContent,
              isMandatory: r.isMandatory,
              sortOrder: r.sortOrder,
            }))
          : [],
      };
      form.setFieldsValue(initialValues);
    } else {
      form.setFieldsValue({
        urgentLevel: 0,
        processes: [],
        deliveryRequirements: [],
        orderDate: dayjs(),
      });
    }
  }, [initialData, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const dto: CreateOrderDto | UpdateOrderDto = {
        ...values,
        orderDate: values.orderDate?.toISOString(),
        deliveryDate: values.deliveryDate?.toISOString(),
        processes: (values.processes || []).map((p: any, idx: number) => ({
          processName: p.processName,
          processRequirement: p.processRequirement,
          processParams: p.processParams ? JSON.parse(p.processParams) : undefined,
          sortOrder: p.sortOrder ?? idx,
        })),
        deliveryRequirements: (values.deliveryRequirements || []).map((r: any, idx: number) => ({
          requirementType: r.requirementType,
          requirementContent: r.requirementContent,
          isMandatory: r.isMandatory ?? false,
          sortOrder: r.sortOrder ?? idx,
        })),
      };

      if (isEdit && initialData) {
        await updateOrder(initialData.id, dto as UpdateOrderDto);
        message.success('订单更新成功');
      } else {
        await createOrder(dto as CreateOrderDto);
        message.success('订单创建成功');
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('提交失败:', error);
      message.error(error?.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ urgentLevel: 0 }}
    >
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="customerId"
              label="客户"
              rules={[{ required: true, message: '请选择客户' }]}
            >
              <Select
                placeholder="请选择客户"
                options={customers}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="salespersonId" label="业务员">
              <Select
                placeholder="请选择业务员"
                options={salespeople}
                showSearch
                optionFilterProp="label"
                allowClear
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="productName"
              label="产品名称"
              rules={[{ required: true, message: '请输入产品名称' }]}
            >
              <Input placeholder="请输入产品名称" maxLength={200} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="productSpec" label="产品规格">
              <Input placeholder="请输入产品规格" maxLength={500} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
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
          <Col xs={12} md={6}>
            <Form.Item name="unit" label="单位">
              <Input placeholder="如：件、个" maxLength={50} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="unitPrice" label="单价">
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                placeholder="单价"
                style={{ width: '100%' }}
                addonBefore="¥"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="orderDate"
              label="下单日期"
              rules={[{ required: true, message: '请选择下单日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="deliveryDate"
              label="交货日期"
              rules={[{ required: true, message: '请选择交货日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="urgentLevel"
              label="紧急程度"
              rules={[{ required: true, message: '请选择紧急程度' }]}
            >
              <Select
                options={Object.entries(urgentLevelMap).map(([value, label]) => ({
                  value: Number(value),
                  label,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="deliveryAddress" label="送货地址">
              <Input placeholder="请输入送货地址" maxLength={500} />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="remark" label="备注">
              <TextArea rows={3} placeholder="请输入备注" maxLength={2000} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title="工艺信息"
        style={{ marginBottom: 16 }}
        extra={
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.processes !== cur.processes}>
            {() => (
              <Button
                type="dashed"
                onClick={() => {
                  const list = form.getFieldValue('processes') || [];
                  form.setFieldValue('processes', [
                    ...list,
                    { processName: '', processRequirement: '', processParams: '', sortOrder: list.length },
                  ]);
                }}
                icon={<PlusOutlined />}
              >
                添加工艺
              </Button>
            )}
          </Form.Item>
        }
      >
        <Form.List name="processes">
          {(fields, { remove }) => (
            <>
              {fields.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                  暂无工艺信息，点击右上角按钮添加
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card
                      key={key}
                      size="small"
                      extra={
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        >
                          删除
                        </Button>
                      }
                      title={`工艺 ${name + 1}`}
                    >
                      <Row gutter={16}>
                        <Col xs={24} md={8}>
                          <Form.Item
                            {...restField}
                            name={[name, 'processName']}
                            label="工艺名称"
                            rules={[{ required: true, message: '请输入工艺名称' }]}
                          >
                            <Input placeholder="工艺名称" maxLength={100} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={16}>
                          <Form.Item
                            {...restField}
                            name={[name, 'processRequirement']}
                            label="说明"
                          >
                            <Input placeholder="工艺说明/要求" maxLength={500} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={18}>
                          <Form.Item
                            {...restField}
                            name={[name, 'processParams']}
                            label="参数(JSON格式)"
                          >
                            <TextArea
                              rows={2}
                              placeholder='例如: {"temperature": 180, "pressure": 0.5}'
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                          <Form.Item
                            {...restField}
                            name={[name, 'sortOrder']}
                            label="排序"
                          >
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </Form.List>
      </Card>

      <Card
        title="交付要求"
        style={{ marginBottom: 16 }}
        extra={
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.deliveryRequirements !== cur.deliveryRequirements}>
            {() => (
              <Button
                type="dashed"
                onClick={() => {
                  const list = form.getFieldValue('deliveryRequirements') || [];
                  form.setFieldValue('deliveryRequirements', [
                    ...list,
                    { requirementType: '', requirementContent: '', isMandatory: false, sortOrder: list.length },
                  ]);
                }}
                icon={<PlusOutlined />}
              >
                添加要求
              </Button>
            )}
          </Form.Item>
        }
      >
        <Form.List name="deliveryRequirements">
          {(fields, { remove }) => (
            <>
              {fields.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                  暂无交付要求，点击右上角按钮添加
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card
                      key={key}
                      size="small"
                      extra={
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        >
                          删除
                        </Button>
                      }
                      title={`交付要求 ${name + 1}`}
                    >
                      <Row gutter={16}>
                        <Col xs={24} md={8}>
                          <Form.Item
                            {...restField}
                            name={[name, 'requirementType']}
                            label="类型"
                            rules={[{ required: true, message: '请输入要求类型' }]}
                          >
                            <Input placeholder="如：包装、运输、文档" maxLength={100} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={10}>
                          <Form.Item
                            {...restField}
                            name={[name, 'requirementContent']}
                            label="要求内容"
                            rules={[{ required: true, message: '请输入要求内容' }]}
                          >
                            <Input placeholder="具体要求描述" maxLength={500} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={3}>
                          <Form.Item
                            {...restField}
                            name={[name, 'isMandatory']}
                            label="是否强制"
                            valuePropName="checked"
                          >
                            <Select
                              options={[
                                { value: true, label: '是' },
                                { value: false, label: '否' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={3}>
                          <Form.Item
                            {...restField}
                            name={[name, 'sortOrder']}
                            label="排序"
                          >
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </Form.List>
      </Card>

      <Divider />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
          {isEdit ? '保存修改' : '创建订单'}
        </Button>
      </div>
    </Form>
  );
};

export default OrderForm;
