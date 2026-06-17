import { useState } from 'react';
import { Form, Input, Select, DatePicker, Button, Card, Space, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { alertApi, assetApi } from '../api';
import { AlertType, AlertPriority } from '../types';
import { alertTypeText, alertPriorityText } from '../utils';
import { useEffect } from 'react';
import type { Asset } from '../types';

const { TextArea } = Input;

export default function AlertCreate() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const res = await assetApi.getAll();
      setAssets(res.data || []);
    } catch {
      // ignore
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await alertApi.create({
        title: values.title,
        description: values.description,
        type: values.type,
        priority: values.priority,
        assetId: values.assetId || null,
        dueDate: values.dueDate?.toISOString() || null,
      });
      if (res.success) {
        message.success('创建成功');
        navigate(`/alerts/${res.data?.id}`);
      } else {
        message.error(res.message || '创建失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/alerts')}>
          返回列表
        </Button>
      </div>

      <Card title="新建告警">
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 600 }}>
          <Form.Item
            name="title"
            label="告警标题"
            rules={[{ required: true, message: '请输入告警标题' }]}
          >
            <Input placeholder="请输入告警标题" maxLength={200} showCount />
          </Form.Item>

          <Form.Item
            name="description"
            label="告警描述"
            rules={[{ required: true, message: '请输入告警描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述告警情况..." maxLength={2000} showCount />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item
              name="type"
              label="告警类型"
              rules={[{ required: true, message: '请选择告警类型' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择告警类型">
                {Object.entries(alertTypeText).map(([key, value]) => (
                  <Select.Option key={key} value={Number(key)}>
                    {value}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="priority"
              label="优先级"
              rules={[{ required: true, message: '请选择优先级' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择优先级">
                {Object.entries(alertPriorityText).map(([key, value]) => (
                  <Select.Option key={key} value={Number(key)}>
                    {value}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Space>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item name="assetId" label="关联资产" style={{ flex: 1 }}>
              <Select placeholder="请选择关联资产" allowClear showSearch optionFilterProp="children">
                {assets.map((a) => (
                  <Select.Option key={a.id} value={a.id}>
                    {a.name} ({a.assetCode})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="dueDate" label="截止时间" style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                提交
              </Button>
              <Button onClick={() => navigate('/alerts')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
