import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Switch,
  Select, InputNumber, message, Row, Col
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SettingOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { VoteRule } from '../types';
import { voteApi } from '../services/api';

const VoteRuleConfig: React.FC = () => {
  const [rules, setRules] = useState<VoteRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<VoteRule | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await voteApi.getRules() as any;
      setRules(data);
    } catch (error) {
      message.error('加载投票规则失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      if (editingRule) {
        await voteApi.updateRule(editingRule.id, values);
        message.success('更新成功');
      } else {
        await voteApi.createRule(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingRule(null);
      loadRules();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleEdit = (rule: VoteRule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      name: rule.name,
      description: rule.description,
      passThreshold: rule.passThreshold,
      quorumThreshold: rule.quorumThreshold,
      votingDurationHours: rule.votingDurationHours,
      allowProxyVoting: rule.allowProxyVoting,
      isDefault: rule.isDefault,
      eligibleRoles: rule.eligibleRoles || [],
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      onOk: async () => {
        try {
          await voteApi.deleteRule(id);
          message.success('删除成功');
          loadRules();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSetDefault = async (id: string) => {
    try {
      await voteApi.updateRule(id, { isDefault: true });
      message.success('已设为默认规则');
      loadRules();
    } catch (error) {
      message.error('设置失败');
    }
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: VoteRule) => (
        <Space>
          <strong>{text}</strong>
          {record.isDefault && <Tag color="gold"><CheckCircleOutlined /> 默认</Tag>}
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '通过门槛',
      dataIndex: 'passThreshold',
      key: 'passThreshold',
      render: (value: number) => <Tag color="green">{value}% 同意</Tag>,
    },
    {
      title: '法定人数',
      dataIndex: 'quorumThreshold',
      key: 'quorumThreshold',
      render: (value: number) => <Tag color="blue">{value}% 参与</Tag>,
    },
    {
      title: '投票时长',
      dataIndex: 'votingDurationHours',
      key: 'votingDurationHours',
      render: (value: number) => `${value} 小时`,
    },
    {
      title: '允许代理',
      dataIndex: 'allowProxyVoting',
      key: 'allowProxyVoting',
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'default'}>{value ? '是' : '否'}</Tag>
      ),
    },
    {
      title: '适用角色',
      dataIndex: 'eligibleRoles',
      key: 'eligibleRoles',
      render: (roles: string[]) => (
        <Space>
          {roles?.map(role => {
            const names: any = { admin: '管理员', manager: '管理岗', worker: '网格员', resident: '居民' };
            return <Tag key={role}>{names[role] || role}</Tag>;
          }) || <Tag>全部</Tag>}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: VoteRule) => (
        <Space size="middle">
          {!record.isDefault && (
            <Button type="link" onClick={() => handleSetDefault(record.id)}>
              设为默认
            </Button>
          )}
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">投票规则配置</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRule(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          新建规则
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <div className="stat-card">
            <SettingOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }} />
            <div className="stat-value">{rules.length}</div>
            <div className="stat-label">规则总数</div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="stat-card">
            <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
            <div className="stat-value">{rules.filter(r => r.isDefault).length}</div>
            <div className="stat-label">默认规则</div>
          </div>
        </Col>
      </Row>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </div>

      <Modal
        title={editingRule ? '编辑投票规则' : '新建投票规则'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRule(null);
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="例如：普通投票规则" />
          </Form.Item>
          <Form.Item name="description" label="规则描述" rules={[{ required: true, message: '请输入规则描述' }]}>
            <Input.TextArea rows={3} placeholder="描述投票规则的适用场景和说明" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="passThreshold"
                label="通过门槛 (%)"
                initialValue={50}
                rules={[{ required: true, message: '请输入通过门槛' }]}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quorumThreshold"
                label="法定人数 (%)"
                initialValue={30}
                rules={[{ required: true, message: '请输入法定人数' }]}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="votingDurationHours"
                label="投票时长 (小时)"
                initialValue={24}
                rules={[{ required: true, message: '请输入投票时长' }]}
              >
                <InputNumber min={1} max={720} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isDefault"
                label="设为默认规则"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="allowProxyVoting"
            label="允许代理投票"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="eligibleRoles"
            label="适用角色（不选则全部适用）"
          >
            <Select mode="multiple" placeholder="选择适用角色">
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="manager">管理岗</Select.Option>
              <Select.Option value="worker">网格员</Select.Option>
              <Select.Option value="resident">居民</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingRule(null);
              }}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingRule ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VoteRuleConfig;
