import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Tag, Input, Select, Modal, Form, InputNumber, message, Spin } from 'antd';
import { 
  AppstoreOutlined, 
  BarChartOutlined, 
  TeamOutlined, 
  UserSwitchOutlined,
  ProjectOutlined,
  PictureOutlined,
  RobotOutlined,
  PlusOutlined
} from '@ant-design/icons';
import type { Plugin, PricingPlan } from '@/types';
import { getPluginList } from '@/api/plugin';
import { createApplication } from '@/api/application';
import { formatMoney, billingCycleMap } from '@/utils';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const iconMap: Record<string, React.ReactNode> = {
  BarChartOutlined: <BarChartOutlined />,
  TeamOutlined: <TeamOutlined />,
  UserSwitchOutlined: <UserSwitchOutlined />,
  ProjectOutlined: <ProjectOutlined />,
  PictureOutlined: <PictureOutlined />,
  RobotOutlined: <RobotOutlined />,
};

const PluginMarketPage: React.FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchPlugins = async () => {
    setLoading(true);
    try {
      const result = await getPluginList({ keyword, category, status: 'ACTIVE', pageSize: 50 });
      setPlugins(result.list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, [keyword, category]);

  const handleApply = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setSelectedPlan(plugin.plans?.[0] || null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedPlugin || !selectedPlan) return;
      
      setSubmitLoading(true);
      await createApplication({
        pluginId: selectedPlugin.id,
        planId: selectedPlan.id,
        reason: values.reason,
        seatCount: values.seatCount,
        trialDays: values.trialDays || 0,
      });
      
      message.success('申请提交成功，请等待审批');
      setModalVisible(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const categories = [...new Set(plugins.map(p => p.category))];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">插件市场</h2>
        <p className="text-gray-500 text-sm">浏览并申请各类插件授权，提升团队工作效率</p>
      </div>

      <Card className="mb-6" variant="borderless">
        <div className="flex items-center gap-4 flex-wrap">
          <Search
            placeholder="搜索插件名称"
            allowClear
            style={{ width: 280 }}
            onSearch={setKeyword}
            onChange={(e) => !e.target.value && setKeyword('')}
          />
          <Select
            placeholder="选择分类"
            allowClear
            style={{ width: 160 }}
            value={category}
            onChange={setCategory}
          >
            {categories.map(cat => (
              <Option key={cat} value={cat}>{cat}</Option>
            ))}
          </Select>
          <div className="text-gray-500 text-sm ml-auto">
            共 <span className="text-blue-500 font-medium">{plugins.length}</span> 个插件
          </div>
        </div>
      </Card>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {plugins.map(plugin => (
            <Col xs={24} sm={12} md={8} lg={6} key={plugin.id}>
              <Card 
                hoverable 
                variant="borderless"
                className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                bodyStyle={{ padding: 20 }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl flex-shrink-0">
                    {iconMap[plugin.icon] || <AppstoreOutlined />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{plugin.name}</h3>
                    <Tag color="blue" className="mt-1">{plugin.category}</Tag>
                  </div>
                </div>
                
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">
                  {plugin.description}
                </p>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <span className="text-xs text-gray-400">起步价</span>
                    <div className="text-blue-600 font-bold text-lg">
                      {plugin.plans?.length ? formatMoney(plugin.plans[0].price) : '--'}
                      <span className="text-xs font-normal text-gray-400 ml-1">/ {plugin.plans?.[0] ? billingCycleMap[plugin.plans[0].billingCycle] : ''}</span>
                    </div>
                  </div>
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => handleApply(plugin)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 border-0"
                  >
                    申请
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      <Modal
        title={`申请 ${selectedPlugin?.name} 授权`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" loading={submitLoading} onClick={handleSubmit}>
            提交申请
          </Button>,
        ]}
        width={560}
      >
        {selectedPlugin && (
          <Form form={form} layout="vertical">
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                  {iconMap[selectedPlugin.icon] || <AppstoreOutlined />}
                </div>
                <div>
                  <div className="font-medium">{selectedPlugin.name}</div>
                  <div className="text-xs text-gray-500">{selectedPlugin.category}</div>
                </div>
              </div>
            </div>

            <Form.Item
              label="选择套餐"
              name="planId"
              rules={[{ required: true, message: '请选择套餐' }]}
            >
              <Select 
                placeholder="请选择套餐"
                onChange={(value) => {
                  const plan = selectedPlugin.plans?.find(p => p.id === value);
                  setSelectedPlan(plan || null);
                }}
              >
                {selectedPlugin.plans?.map(plan => (
                  <Option key={plan.id} value={plan.id}>
                    {plan.name} - {formatMoney(Number(plan.price))}/{billingCycleMap[plan.billingCycle]}（{plan.seatCount}席位）
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {selectedPlan && (
              <div className="p-3 bg-blue-50 rounded-lg mb-4 text-sm">
                <div className="text-blue-800 font-medium mb-2">套餐包含：</div>
                <ul className="text-blue-700 space-y-1">
                  {selectedPlan.features?.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-blue-500">✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Form.Item
              label="申请席位数量"
              name="seatCount"
              initialValue={selectedPlan?.seatCount || 5}
              rules={[{ required: true, message: '请输入席位数量' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="试用天数（0为不申请试用，最多30天）"
              name="trialDays"
              initialValue={7}
            >
              <InputNumber min={0} max={30} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="申请理由"
              name="reason"
              rules={[{ required: true, message: '请填写申请理由' }]}
            >
              <TextArea rows={4} placeholder="请简要描述使用场景和需求..." />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default PluginMarketPage;
