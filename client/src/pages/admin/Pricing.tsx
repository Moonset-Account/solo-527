import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Form, Select, Input, InputNumber, Switch, message, Spin } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import type { PricingPlan, Plugin } from '@/types';
import { getPlanList, createPlan, updatePlan } from '@/api/pricing';
import { getPluginList } from '@/api/plugin';
import { formatMoney, billingCycleMap } from '@/utils';

const { TextArea } = Input;
const { Option } = Select;

const PricingPage: React.FC = () => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pluginId, setPluginId] = useState<number | undefined>();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansResult, pluginsResult] = await Promise.all([
        getPlanList({ page, pageSize, pluginId }),
        getPluginList({ status: 'ACTIVE', pageSize: 50 }),
      ]);
      setPlans(plansResult.list);
      setTotal(plansResult.total);
      setPlugins(pluginsResult.list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pluginId]);

  const openCreateModal = () => {
    setEditingPlan(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (plan: PricingPlan) => {
    setEditingPlan(plan);
    form.setFieldsValue({
      ...plan,
      features: plan.features || [],
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      if (editingPlan) {
        await updatePlan(editingPlan.id, values);
        message.success('更新成功');
      } else {
        await createPlan(values);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStatusChange = async (plan: PricingPlan, checked: boolean) => {
    try {
      await updatePlan(plan.id, { status: checked ? 'ACTIVE' : 'INACTIVE' });
      message.success('状态已更新');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    {
      title: '插件',
      dataIndex: ['plugin', 'name'],
      key: 'plugin',
      width: 150,
    },
    {
      title: '套餐名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: '套餐编码',
      dataIndex: 'code',
      key: 'code',
      width: 160,
      render: (text: string) => <code className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-sm">{text}</code>,
    },
    {
      title: '账期',
      dataIndex: 'billingCycle',
      key: 'billingCycle',
      width: 80,
      render: (cycle: string) => billingCycleMap[cycle as keyof typeof billingCycleMap] || cycle,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => (
        <span className="text-blue-600 font-bold">{formatMoney(price)}</span>
      ),
    },
    {
      title: '席位数量',
      dataIndex: 'seatCount',
      key: 'seatCount',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: PricingPlan) => (
        <Switch
          checked={status === 'ACTIVE'}
          onChange={(checked) => handleStatusChange(record, checked)}
          size="small"
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: PricingPlan) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">计费配置</h2>
        <p className="text-gray-500 text-sm">管理插件套餐、价格和账期配置</p>
      </div>

      <Card 
        variant="borderless"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新增套餐
          </Button>
        }
      >
        <div className="flex items-center gap-4 mb-4">
          <span className="text-gray-600 text-sm">筛选插件：</span>
          <Select
            placeholder="全部插件"
            allowClear
            style={{ width: 200 }}
            value={pluginId}
            onChange={(val) => { setPluginId(val); setPage(1); }}
          >
            {plugins.map(p => (
              <Option key={p.id} value={p.id}>{p.name}</Option>
            ))}
          </Select>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={plans}
            rowKey="id"
            scroll={{ x: 900 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: setPage,
              showSizeChanger: false,
            }}
          />
        </Spin>
      </Card>

      <Card title="账期设置" className="mt-6" variant="borderless">
        <div className="grid grid-cols-3 gap-4">
          {[
            { cycle: '月付', key: 'MONTHLY', desc: '每月自动续费，灵活便捷' },
            { cycle: '季付', key: 'QUARTERLY', desc: '每季度续费，享一定折扣' },
            { cycle: '年付', key: 'YEARLY', desc: '每年续费，优惠力度最大' },
          ].map(item => (
            <div key={item.key} className="p-4 border rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
              <div className="font-bold text-lg mb-1">{item.cycle}</div>
              <div className="text-sm text-gray-500">{item.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-500">
          提示：账期类型在套餐创建时指定，修改账期需在套餐编辑中调整。
        </div>
      </Card>

      <Modal
        title={editingPlan ? '编辑套餐' : '新增套餐'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" loading={submitLoading} onClick={handleSubmit}>
            保存
          </Button>,
        ]}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="所属插件"
            name="pluginId"
            rules={[{ required: true, message: '请选择插件' }]}
          >
            <Select placeholder="请选择插件" disabled={!!editingPlan}>
              {plugins.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="套餐名称"
              name="name"
              rules={[{ required: true, message: '请输入套餐名称' }]}
            >
              <Input placeholder="如：基础版、专业版" />
            </Form.Item>
            <Form.Item
              label="套餐编码"
              name="code"
              rules={[{ required: true, message: '请输入套餐编码' }]}
            >
              <Input placeholder="英文编码，唯一标识" disabled={!!editingPlan} />
            </Form.Item>
          </div>

          <Form.Item
            label="套餐描述"
            name="description"
          >
            <TextArea rows={2} placeholder="简短描述套餐定位" />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              label="账期类型"
              name="billingCycle"
              rules={[{ required: true, message: '请选择账期' }]}
            >
              <Select>
                <Option value="MONTHLY">月付</Option>
                <Option value="QUARTERLY">季付</Option>
                <Option value="YEARLY">年付</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="价格（元）"
              name="price"
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              label="席位数量"
              name="seatCount"
              rules={[{ required: true, message: '请输入席位数量' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            label="功能特性（用逗号分隔）"
            name="features"
          >
            <Select
              mode="tags"
              placeholder="输入功能特性，回车添加"
              style={{ width: '100%' }}
              tokenSeparators={[',']}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PricingPage;
