import { Button, Card, Form, InputNumber, Select, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { Threshold } from '../types';

const mockData: Threshold[] = [];

const parameterOptions = [
  { label: '温度', value: 'temperature' },
  { label: '湿度', value: 'humidity' },
  { label: '土壤湿度', value: 'soilMoisture' },
  { label: '光照强度', value: 'lightIntensity' },
  { label: 'CO2浓度', value: 'co2Level' },
];

const Thresholds: React.FC = () => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const columns: ColumnsType<Threshold> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '地块',
      dataIndex: 'plotId',
      key: 'plotId',
      width: 100,
      render: (plotId: number) => `地块 #${plotId}`,
    },
    {
      title: '参数类型',
      dataIndex: 'parameterType',
      key: 'parameterType',
      render: (type: string, record) =>
        editingId === record.id ? (
          <Form.Item name="parameterType" style={{ margin: 0 }}>
            <Select options={parameterOptions} />
          </Form.Item>
        ) : (
          parameterOptions.find((o) => o.value === type)?.label || type
        ),
    },
    {
      title: '最小值',
      dataIndex: 'minValue',
      key: 'minValue',
      render: (val: number, record) =>
        editingId === record.id ? (
          <Form.Item name="minValue" style={{ margin: 0 }}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        ) : (
          val
        ),
    },
    {
      title: '最大值',
      dataIndex: 'maxValue',
      key: 'maxValue',
      render: (val: number, record) =>
        editingId === record.id ? (
          <Form.Item name="maxValue" style={{ margin: 0 }}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        ) : (
          val
        ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {editingId === record.id ? (
            <>
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                onClick={() => setEditingId(null)}
              >
                保存
              </Button>
              <Button size="small" onClick={() => setEditingId(null)}>
                取消
              </Button>
            </>
          ) : (
            <>
              <a
                onClick={() => {
                  setEditingId(record.id);
                  form.setFieldsValue(record);
                }}
              >
                编辑
              </a>
              <a style={{ color: '#ff4d4f' }}>删除</a>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="阈值配置（运营后台）"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          新增阈值
        </Button>
      }
    >
      <Form form={form} component={false}>
        <Table<Threshold>
          columns={columns}
          dataSource={mockData}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Form>
    </Card>
  );
};

export default Thresholds;
