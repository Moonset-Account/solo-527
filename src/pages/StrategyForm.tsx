import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Space,
  Typography,
  message,
  Divider,
  Select,
  Switch,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { FormInstance } from 'antd/es/form';
import dayjs from 'dayjs';
import { strategiesApi } from '@/api';
import type { Strategy, StrategyStatus } from '../../shared/types';
import { useUserStore } from '@/store/user';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface TriggerCondition {
  alertLevel?: string;
  alertType?: string;
  deviceIds?: string[];
  zoneIds?: string[];
  minDurationMinutes?: number;
  autoProcess?: boolean;
}

interface ActionConfig {
  type: 'NOTIFY' | 'AUTO_PROCESS' | 'WEBHOOK';
  notifyChannels?: string[];
  notifyUsers?: string[];
  webhookUrl?: string;
  autoClose?: boolean;
  remarkTemplate?: string;
}

const StrategyForm: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const currentUser = useUserStore((state) => state.currentUser);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [triggerJson, setTriggerJson] = useState('');
  const [actionJson, setActionJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadStrategy();
    }
  }, [id]);

  useEffect(() => {
    if (strategy) {
      form.setFieldsValue({
        name: strategy.name,
        description: strategy.description,
        status: strategy.status,
      });
      setTriggerJson(JSON.stringify(strategy.triggerCondition, null, 2));
      setActionJson(JSON.stringify(strategy.action, null, 2));
    }
  }, [strategy, form]);

  const loadStrategy = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await strategiesApi.getDetail(id);
      setStrategy(result);
    } catch (error) {
      message.error('加载策略详情失败');
      navigate('/strategies');
    } finally {
      setLoading(false);
    }
  };

  const validateJson = (jsonStr: string): Record<string, any> | null => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('必须是 JSON 对象');
      }
      setJsonError(null);
      return parsed;
    } catch (error: any) {
      setJsonError(`JSON 格式错误: ${error.message}`);
      return null;
    }
  };

  const handleSubmit = async () => {
    setJsonError(null);
    try {
      const values = await form.validateFields();
      
      const triggerCondition = validateJson(triggerJson);
      const action = validateJson(actionJson);
      
      if (!triggerCondition || !action) {
        return;
      }

      setSubmitting(true);

      if (isEdit && id) {
        await strategiesApi.update(id, {
          name: values.name,
          description: values.description,
          triggerCondition,
          action,
          status: values.status,
        });
        message.success('策略更新成功');
      } else {
        if (!currentUser) {
          message.error('请先登录');
          return;
        }
        await strategiesApi.create({
          name: values.name,
          description: values.description,
          triggerCondition,
          action,
          status: values.status || 'INACTIVE',
          createdById: currentUser.id,
        });
        message.success('策略创建成功');
      }

      navigate('/strategies');
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请检查表单填写是否正确');
      } else {
        message.error(error.message || '操作失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillTemplate = (template: 'alert' | 'offline' | 'performance') => {
    const templates: Record<string, { trigger: TriggerCondition; action: ActionConfig }> = {
      alert: {
        trigger: {
          alertLevel: 'CRITICAL',
          autoProcess: true,
          minDurationMinutes: 5,
        },
        action: {
          type: 'NOTIFY',
          notifyChannels: ['SMS', 'EMAIL', 'WECHAT'],
          notifyUsers: ['admin', 'operator'],
          remarkTemplate: '严重告警已自动处理',
        },
      },
      offline: {
        trigger: {
          alertType: 'OFFLINE',
          minDurationMinutes: 10,
          autoProcess: true,
        },
        action: {
          type: 'AUTO_PROCESS',
          autoClose: true,
          remarkTemplate: '设备离线自动重启',
        },
      },
      performance: {
        trigger: {
          alertType: 'PERFORMANCE',
          alertLevel: 'WARNING',
          minDurationMinutes: 30,
        },
        action: {
          type: 'WEBHOOK',
          webhookUrl: 'https://api.example.com/performance-alert',
          notifyChannels: ['EMAIL'],
        },
      },
    };

    const tpl = templates[template];
    setTriggerJson(JSON.stringify(tpl.trigger, null, 2));
    setActionJson(JSON.stringify(tpl.action, null, 2));
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/strategies')}
          >
            返回列表
          </Button>
        </Space>

        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <Space>
                <SettingOutlined style={{ color: '#1890ff' }} />
                {isEdit ? '编辑策略' : '新建策略'}
              </Space>
            </Title>
            <Text type="secondary">
              {isEdit 
                ? `修改策略配置，最后更新于 ${strategy ? dayjs(strategy.updatedAt).format('YYYY-MM-DD HH:mm') : ''}`
                : '创建新的设备告警自动响应策略'}
            </Text>
          </Col>
          <Col>
            <Space>
              <Button onClick={() => navigate('/strategies')}>
                取消
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={submitting}
                onClick={handleSubmit}
              >
                保存策略
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card loading={loading}>
        <Alert
          message="策略配置说明"
          description={
            <div>
              <Paragraph>
                策略由<strong>触发条件</strong>和<strong>执行动作</strong>两部分组成。当设备告警满足触发条件时，系统会自动执行配置的动作。
              </Paragraph>
              <Space wrap>
                <Text type="secondary">快速模板：</Text>
                <Button size="small" type="link" onClick={() => fillTemplate('alert')}>严重告警通知</Button>
                <Button size="small" type="link" onClick={() => fillTemplate('offline')}>设备离线处理</Button>
                <Button size="small" type="link" onClick={() => fillTemplate('performance')}>性能告警回调</Button>
              </Space>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'INACTIVE',
          }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="策略名称"
                rules={[{ required: true, message: '请输入策略名称' }]}
              >
                <Input placeholder="例如：严重告警自动通知策略" maxLength={50} showCount />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="策略状态"
                valuePropName="checked"
                extra="启用后策略将自动匹配符合条件的告警"
              >
                <Switch
                  checkedChildren={<PlayCircleOutlined />}
                  unCheckedChildren={<PauseCircleOutlined />}
                  checked={form.getFieldValue('status') === 'ACTIVE'}
                  onChange={(checked) => {
                    form.setFieldsValue({
                      status: checked ? 'ACTIVE' : 'INACTIVE',
                    });
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="策略描述"
          >
            <TextArea
              placeholder="描述该策略的用途和适用场景"
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Divider orientation="left">
            <Space>
              <CodeOutlined />
              触发条件配置 (JSON)
            </Space>
          </Divider>

          <Alert
            message="触发条件字段说明"
            description={
              <div>
                <Text type="secondary" code>alertLevel</Text>: 告警级别 (INFO/WARNING/ERROR/CRITICAL)，
                <Text type="secondary" code>alertType</Text>: 告警类型，
                <Text type="secondary" code>minDurationMinutes</Text>: 持续时间（分钟），
                <Text type="secondary" code>autoProcess</Text>: 是否自动处理
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
          />

          <Form.Item
            label="触发条件"
            name="triggerCondition"
            rules={[
              {
                validator: (_, value) => {
                  if (!triggerJson.trim()) {
                    return Promise.reject('请输入触发条件 JSON');
                  }
                  try {
                    JSON.parse(triggerJson);
                    return Promise.resolve();
                  } catch {
                    return Promise.reject('JSON 格式不正确');
                  }
                },
              },
            ]}
          >
            <TextArea
              value={triggerJson}
              onChange={(e) => setTriggerJson(e.target.value)}
              placeholder={`{\n  "alertLevel": "CRITICAL",\n  "minDurationMinutes": 5,\n  "autoProcess": true\n}`}
              rows={8}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Divider orientation="left">
            <Space>
              <CodeOutlined />
              执行动作配置 (JSON)
            </Space>
          </Divider>

          <Alert
            message="执行动作字段说明"
            description={
              <div>
                <Text type="secondary" code>type</Text>: 动作类型 (NOTIFY/AUTO_PROCESS/WEBHOOK)，
                <Text type="secondary" code>notifyChannels</Text>: 通知渠道，
                <Text type="secondary" code>webhookUrl</Text>: 回调地址，
                <Text type="secondary" code>autoClose</Text>: 是否自动关闭告警
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
          />

          <Form.Item
            label="执行动作"
            name="action"
            rules={[
              {
                validator: (_, value) => {
                  if (!actionJson.trim()) {
                    return Promise.reject('请输入执行动作 JSON');
                  }
                  try {
                    JSON.parse(actionJson);
                    return Promise.resolve();
                  } catch {
                    return Promise.reject('JSON 格式不正确');
                  }
                },
              },
            ]}
          >
            <TextArea
              value={actionJson}
              onChange={(e) => setActionJson(e.target.value)}
              placeholder={`{\n  "type": "NOTIFY",\n  "notifyChannels": ["SMS", "EMAIL"],\n  "remarkTemplate": "告警已处理"\n}`}
              rows={8}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          {jsonError && (
            <Alert
              message={jsonError}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Divider />

          <Row justify="end">
            <Space>
              <Button onClick={() => navigate('/strategies')}>
                取消
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={submitting}
                onClick={handleSubmit}
              >
                保存策略
              </Button>
            </Space>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default StrategyForm;
