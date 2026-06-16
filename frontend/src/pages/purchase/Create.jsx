import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Breadcrumb,
  Table,
  Input,
  Form,
  Select,
  DatePicker,
  Switch,
  App as AntdApp,
  Typography,
  Row,
  Col,
  InputNumber,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { purchaseApi, supplierApi, productApi, userApi } from '@/api/index.js';
import { fmtMoney, fmtNum } from '@/utils/format.js';
import { URGENT_LEVEL } from '@/utils/constants.js';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function Create() {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();

  const [submitting, setSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await supplierApi.list({ page: 1, pageSize: 100 });
      setSuppliers(res.data?.list || res.data?.records || []);
    } catch (e) {}
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await userApi.list({ page: 1, pageSize: 100 });
      setUsers(res.data?.list || res.data?.records || []);
    } catch (e) {}
  }, []);

  const searchProducts = useCallback(async (keyword = '') => {
    setProductSearchLoading(true);
    try {
      const res = await productApi.withSuppliers({ keyword, page: 1, pageSize: 50 });
      const list = res.data?.list || res.data?.records || [];
      setProductOptions(list);
    } catch (e) {
    } finally {
      setProductSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
    fetchUsers();
    searchProducts();
    const supplierId = searchParams.get('supplierId');
    if (supplierId) {
      form.setFieldsValue({ supplierId });
    }
    handleAddItem();
  }, [fetchSuppliers, fetchUsers, searchProducts, searchParams, form]);

  const handleAddItem = () => {
    const newItem = {
      key: Date.now() + Math.random(),
      productId: null,
      productName: '',
      sku: '',
      spec: '',
      expectedQty: 1,
      unitPrice: 0,
      subtotal: 0,
      remark: '',
      expectedDate: null,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (key) => {
    setItems(items.filter((item) => item.key !== key));
  };

  const handleItemChange = (key, field, value) => {
    setItems(
      items.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, [field]: value };
        if (field === 'productId') {
          const product = productOptions.find((p) => p.id === value);
          if (product) {
            updated.productName = product.name;
            updated.sku = product.sku;
            updated.spec = product.spec;
            updated.unitPrice = product.price || 0;
            updated.subtotal = (Number(updated.expectedQty) || 0) * (Number(updated.unitPrice) || 0);
          }
        }
        if (field === 'expectedQty' || field === 'unitPrice') {
          updated.subtotal = (Number(updated.expectedQty) || 0) * (Number(updated.unitPrice) || 0);
        }
        return updated;
      })
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (items.length === 0) {
        message.warning('请至少添加一条采购明细');
        return;
      }
      for (let i = 0; i < items.length; i++) {
        if (!items[i].productId) {
          message.warning(`请选择第 ${i + 1} 行的商品`);
          return;
        }
        if (!items[i].expectedQty || items[i].expectedQty <= 0) {
          message.warning(`第 ${i + 1} 行数量必须大于 0`);
          return;
        }
      }
      setSubmitting(true);
      const payload = {
        ...values,
        expectedDate: values.expectedDate ? values.expectedDate.format('YYYY-MM-DD') : null,
        requireQc: values.requireQc !== undefined ? Boolean(values.requireQc) : false,
        urgentLevel: Number(values.urgentLevel) || 1,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          spec: item.spec,
          expectedQty: Number(item.expectedQty),
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
          remark: item.remark,
          expectedDate: item.expectedDate ? dayjs(item.expectedDate).format('YYYY-MM-DD') : null,
        })),
      };
      const res = await purchaseApi.create(payload);
      message.success('创建成功');
      const newId = res.data?.id || res.data;
      navigate(`/purchase-orders/${newId}`);
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const totalQty = items.reduce((sum, item) => sum + (Number(item.expectedQty) || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);

  const itemColumns = [
    {
      title: '商品',
      dataIndex: 'productId',
      key: 'productId',
      width: 260,
      render: (_, record) => (
        <Select
          showSearch
          allowClear
          placeholder="搜索并选择商品"
          style={{ width: '100%' }}
          value={record.productId}
          onChange={(v) => handleItemChange(record.key, 'productId', v)}
          onSearch={(v) => searchProducts(v)}
          filterOption={false}
          loading={productSearchLoading}
          optionFilterProp="children"
        >
          {productOptions.map((p) => (
            <Option key={p.id} value={p.id}>
              {p.sku ? `[${p.sku}] ` : ''}{p.name} {p.spec ? `(${p.spec})` : ''}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
      render: (v) => v || '-',
    },
    {
      title: '规格',
      dataIndex: 'spec',
      key: 'spec',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: '预期数量',
      dataIndex: 'expectedQty',
      key: 'expectedQty',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <InputNumber
          min={0}
          step={1}
          style={{ width: '100%' }}
          value={record.expectedQty}
          onChange={(v) => handleItemChange(record.key, 'expectedQty', v)}
          precision={2}
        />
      ),
    },
    {
      title: '单价(元)',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <InputNumber
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          value={record.unitPrice}
          onChange={(v) => handleItemChange(record.key, 'unitPrice', v)}
          precision={2}
        />
      ),
    },
    {
      title: '小计(元)',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 120,
      align: 'right',
      render: (v) => <b>{fmtMoney(v)}</b>,
    },
    {
      title: '预期到货日',
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      width: 160,
      render: (_, record) => (
        <DatePicker
          style={{ width: '100%' }}
          value={record.expectedDate ? dayjs(record.expectedDate) : null}
          onChange={(d) => handleItemChange(record.key, 'expectedDate', d)}
        />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 160,
      render: (_, record) => (
        <Input
          placeholder="明细备注"
          value={record.remark}
          onChange={(e) => handleItemChange(record.key, 'remark', e.target.value)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          size="small"
          onClick={() => handleRemoveItem(record.key)}
        />
      ),
    },
  ];

  return (
    <div className="app-page">
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb
          items={[
            { title: <Link to="/purchase-orders">采购订单</Link> },
            { title: '新建采购单' },
          ]}
        />
      </div>

      <div className="page-title">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/purchase-orders')}
            style={{ marginRight: 8 }}
          />
          <Title level={4} style={{ margin: 0 }}>
            新建采购单
          </Title>
        </div>
        <Space>
          <Button onClick={() => navigate('/purchase-orders')}>取消</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={submitting}
            onClick={handleSubmit}
          >
            保存并提交
          </Button>
        </Space>
      </div>

      <Card className="card-section" style={{ marginBottom: 16 }}>
        <div className="section-title">基本信息</div>
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="供应商"
                name="supplierId"
                rules={[{ required: true, message: '请选择供应商' }]}
              >
                <Select
                  placeholder="请选择供应商"
                  showSearch
                  optionFilterProp="children"
                >
                  {suppliers.map((s) => (
                    <Option key={s.id} value={s.id}>
                      {s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="要求到货日期"
                name="expectedDate"
                rules={[{ required: true, message: '请选择要求到货日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="紧急度"
                name="urgentLevel"
                initialValue={1}
                rules={[{ required: true, message: '请选择紧急度' }]}
              >
                <Select placeholder="请选择紧急度">
                  {Object.entries(URGENT_LEVEL).map(([k, v]) => (
                    <Option key={k} value={Number(k)}>
                      {v.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="是否需质检"
                name="requireQc"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="负责人"
                name="assignedToId"
                rules={[{ required: true, message: '请选择负责人' }]}
              >
                <Select
                  placeholder="请选择负责人"
                  showSearch
                  optionFilterProp="children"
                >
                  {users.map((u) => (
                    <Option key={u.id} value={u.id}>
                      {u.name || u.username}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8} />
          </Row>
          <Form.Item label="备注" name="remark">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Card>

      <Card
        className="card-section"
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title" style={{ marginBottom: 0 }}>采购明细</span>
            <Button type="primary" icon={<PlusOutlined />} size="small" onClick={handleAddItem}>
              添加商品
            </Button>
          </div>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          rowKey="key"
          dataSource={items}
          columns={itemColumns}
          pagination={false}
          scroll={{ x: 1300 }}
          size="small"
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3}>
                <Text strong>合计</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">
                <Text strong>{fmtNum(totalQty, 2)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} />
              <Table.Summary.Cell index={5} align="right">
                <Text strong style={{ color: '#cf1322' }}>{fmtMoney(totalAmount)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} colSpan={3} />
            </Table.Summary.Row>
          )}
        />
      </Card>

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Space>
          <Button onClick={() => navigate('/purchase-orders')}>取消</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={submitting}
            onClick={handleSubmit}
          >
            保存并提交
          </Button>
        </Space>
      </div>
    </div>
  );
}
