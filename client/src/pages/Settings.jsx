import React, { useState, useEffect } from 'react';
import {
  Tabs, Table, Button, Modal, Form, Input, Select, InputNumber, Space, Tag, message, Switch, Divider, Row, Col
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import { stores, ingredients, lossReasons, safetyStock, inventory } from '../api/index.js';

function Settings() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">内部管理设置</h2>
        <p className="page-desc">配置安全库存阈值、报损原因分类等基础数据</p>
      </div>
      <Tabs
        defaultActiveKey="safetyStock"
        items={[
          { key: 'safetyStock', label: '安全库存设置', children: <SafetyStockTab /> },
          { key: 'lossReasons', label: '报损原因管理', children: <LossReasonsTab /> },
          { key: 'inventory', label: '食材库存', children: <InventoryTab /> },
        ]}
      />
    </div>
  );
}

function SafetyStockTab() {
  const [list, setList] = useState([]);
  const [storeList, setStoreList] = useState([]);
  const [ingredientList, setIngredientList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const loadData = () => {
    setLoading(true);
    safetyStock.list().then((data) => {
      setList(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
    stores.list().then(setStoreList);
    ingredients.list().then(setIngredientList);
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await safetyStock.create(values);
      message.success('保存成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (err) {
      message.error('保存失败');
    }
  };

  const handleDelete = async (id) => {
    await safetyStock.delete(id);
    message.success('删除成功');
    loadData();
  };

  const columns = [
    { title: '门店', dataIndex: ['store', 'name'], key: 'store' },
    { title: '食材', dataIndex: ['ingredient', 'name'], key: 'ingredient' },
    { title: '单位', dataIndex: ['ingredient', 'unit'], key: 'unit' },
    { title: '最小库存', dataIndex: 'minQuantity', key: 'min' },
    { title: '最大库存', dataIndex: 'maxQuantity', key: 'max' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
          删除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)} style={{ marginBottom: 16 }}>
        设置安全库存
      </Button>
      <Table columns={columns} dataSource={list} rowKey="id" loading={loading} />

      <Modal title="设置安全库存" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={handleSubmit}>
        <Form form={form} layout="vertical">
          <Form.Item name="storeId" label="门店" rules={[{ required: true }]}>
            <Select options={storeList.map((s) => ({ label: s.name, value: s.id }))} />
          </Form.Item>
          <Form.Item name="ingredientId" label="食材" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="children"
              options={ingredientList.map((i) => ({ label: i.name, value: i.id }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="minQuantity" label="最小库存" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maxQuantity" label="最大库存" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

function LossReasonsTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const loadData = () => {
    setLoading(true);
    lossReasons.list().then((data) => {
      setList(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await lossReasons.update(editing.id, values);
      } else {
        await lossReasons.create(values);
      }
      message.success('保存成功');
      setModalVisible(false);
      loadData();
    } catch (err) {
      message.error('保存失败');
    }
  };

  const handleDelete = async (id) => {
    await lossReasons.delete(id);
    message.success('删除成功');
    loadData();
  };

  const toggleActive = async (record, checked) => {
    await lossReasons.update(record.id, { isActive: checked });
    loadData();
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '启用状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v, record) => (
        <Switch checked={v} onChange={(c) => toggleActive(record, c)} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        新增报损原因
      </Button>
      <Table columns={columns} dataSource={list} rowKey="id" loading={loading} />

      <Modal title={editing ? '编辑报损原因' : '新增报损原因'} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={handleSubmit}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="原因名称" rules={[{ required: true }]}>
            <Input placeholder="如：过期变质" />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Input placeholder="如：质量问题、操作失误" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="isActive" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function InventoryTab() {
  const [list, setList] = useState([]);
  const [storeList, setStoreList] = useState([]);
  const [ingredientList, setIngredientList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filters, setFilters] = useState({});
  const [form] = Form.useForm();

  const loadData = () => {
    setLoading(true);
    inventory.list(filters).then((data) => {
      setList(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
    stores.list().then(setStoreList);
    ingredients.list().then(setIngredientList);
  }, [filters]);

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await inventory.create(values);
      message.success('保存成功');
      setModalVisible(false);
      loadData();
    } catch (err) {
      message.error('保存失败');
    }
  };

  const columns = [
    { title: '门店', dataIndex: ['store', 'name'], key: 'store' },
    { title: '食材', dataIndex: ['ingredient', 'name'], key: 'ingredient' },
    { title: '分类', dataIndex: ['ingredient', 'category'], key: 'category' },
    {
      title: '库存数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (v, record) => (
        <Space>
          <span>{v}</span>
          <span style={{ color: '#999' }}>{record.unit}</span>
        </Space>
      ),
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      render: (t) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="选择门店"
          style={{ width: 200 }}
          allowClear
          onChange={(v) => setFilters({ ...filters, storeId: v })}
          options={storeList.map((s) => ({ label: s.name, value: s.id }))}
        />
        <Select
          placeholder="仅显示低库存"
          style={{ width: 160 }}
          allowClear
          onChange={(v) => setFilters({ ...filters, lowStock: v })}
          options={[{ label: '是', value: 'true' }]}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增/调整库存
        </Button>
      </Space>
      <Table columns={columns} dataSource={list} rowKey="id" loading={loading} />

      <Modal title="调整库存" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={handleSubmit}>
        <Form form={form} layout="vertical">
          <Form.Item name="storeId" label="门店" rules={[{ required: true }]}>
            <Select options={storeList.map((s) => ({ label: s.name, value: s.id }))} />
          </Form.Item>
          <Form.Item name="ingredientId" label="食材" rules={[{ required: true }]}>
            <Select options={ingredientList.map((i) => ({ label: i.name, value: i.id }))} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
                <Input placeholder="kg/个等" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

export default Settings;
