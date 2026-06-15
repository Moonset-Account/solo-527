import React from 'react';
import { Card, Tabs, Form, Input, Button, Table, Space, Tag, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { TextArea } = Input;

const SystemSettings = () => {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [form] = Form.useForm();

  const sources = [
    { id: 1, name: '线上咨询', is_active: true, sort_order: 1 },
    { id: 2, name: '电话咨询', is_active: true, sort_order: 2 },
    { id: 3, name: '到店咨询', is_active: true, sort_order: 3 },
    { id: 4, name: '老客户转介绍', is_active: true, sort_order: 4 },
    { id: 5, name: '美团/大众点评', is_active: true, sort_order: 5 },
    { id: 6, name: '抖音/小红书', is_active: true, sort_order: 6 },
  ];

  const publicSeaRules = [
    { id: 1, name: '默认公海规则', timeout_days: 7, is_active: true, description: '7天未跟进自动进入公海' },
  ];

  const handleAddSource = () => {
    setModalVisible(true);
    form.resetFields();
  };

  const handleSaveSource = async () => {
    try {
      const values = await form.validateFields();
      message.success('保存成功');
      setModalVisible(false);
    } catch (error) {
      message.error('保存失败');
    }
  };

  const sourceColumns = [
    { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 80 },
    { title: '来源名称', dataIndex: 'name', key: 'name' },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      ),
    },
  ];

  const ruleColumns = [
    { title: '规则名称', dataIndex: 'name', key: 'name' },
    { title: '超时天数', dataIndex: 'timeout_days', key: 'timeout_days', render: (d) => `${d}天` },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane tab="线索来源" key="1">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSource}>
                新增来源
              </Button>
            </div>
            <Table
              columns={sourceColumns}
              dataSource={sources}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </TabPane>

          <TabPane tab="公海规则" key="2">
            <Table
              columns={ruleColumns}
              dataSource={publicSeaRules}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </TabPane>

          <TabPane tab="跟进超时设置" key="3">
            <Form layout="vertical" style={{ maxWidth: 400 }}>
              <Form.Item
                label="跟进超时时长(小时)"
                name="followup_timeout_hours"
                initialValue={24}
              >
                <InputNumber min={1} max={168} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="超时提醒方式" name="remind_type" initialValue="system">
                <Select>
                  <Option value="system">系统消息</Option>
                  <Option value="email">邮件提醒</Option>
                  <Option value="sms">短信提醒</Option>
                  <Option value="all">全部</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary">保存设置</Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="系统参数" key="4">
            <Form layout="vertical" style={{ maxWidth: 500 }}>
              <Form.Item label="诊所名称" name="clinic_name" initialValue="齿悦口腔诊所">
                <Input />
              </Form.Item>
              <Form.Item label="联系电话" name="clinic_phone" initialValue="400-888-8888">
                <Input />
              </Form.Item>
              <Form.Item label="诊所地址" name="clinic_address">
                <TextArea rows={3} />
              </Form.Item>
              <Form.Item label="默认跟进时长(天)" name="default_followup_days" initialValue={3}>
                <InputNumber min={1} max={30} />
              </Form.Item>
              <Form.Item>
                <Button type="primary">保存设置</Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="新增线索来源"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSaveSource}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="来源名称"
            rules={[{ required: true, message: '请输入来源名称' }]}
          >
            <Input placeholder="请输入来源名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_active" label="状态" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemSettings;
