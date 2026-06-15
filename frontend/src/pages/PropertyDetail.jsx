import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Timeline,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  message,
  Spin,
  Collapse,
} from 'antd';
import { useParams } from 'react-router-dom';
import { getProperty, updateProperty, getPropertyHistory } from '../api';

const STATUS_COLOR = {
  VACANT: 'default',
  RESERVED: 'orange',
  OCCUPIED: 'green',
  UNDER_MAINTENANCE: 'warning',
  PROCESSING: 'blue',
  ANOMALOUS: 'red',
};

const STATUS_LABEL = {
  VACANT: '空置',
  RESERVED: '已预定',
  OCCUPIED: '已入住',
  UNDER_MAINTENANCE: '维护中',
  PROCESSING: '办理中',
  ANOMALOUS: '异常',
};

const STATUS_OPTIONS = Object.keys(STATUS_LABEL).map((key) => ({
  label: STATUS_LABEL[key],
  value: key,
}));

const contractColumns = [
  { title: '合同编号', dataIndex: 'contractNo', key: 'contractNo' },
  { title: '租客', dataIndex: 'tenantName', key: 'tenantName' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status) => <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status] || status}</Tag>,
  },
  { title: '开始日期', dataIndex: 'startDate', key: 'startDate' },
  { title: '结束日期', dataIndex: 'endDate', key: 'endDate' },
  { title: '月租金(元)', dataIndex: 'monthlyRent', key: 'monthlyRent' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
];

const viewingColumns = [
  { title: '租客', dataIndex: 'tenantName', key: 'tenantName' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status) => <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status] || status}</Tag>,
  },
  { title: '预约时间', dataIndex: 'scheduledAt', key: 'scheduledAt' },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
];

function JsonDiff({ before, after }) {
  const allKeys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));
  const diffs = allKeys
    .filter((key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]))
    .map((key) => ({
      key,
      before: before?.[key] ?? '-',
      after: after?.[key] ?? '-',
    }));

  if (diffs.length === 0) return <span style={{ color: '#999' }}>无变化</span>;

  return (
    <div style={{ fontSize: 12 }}>
      {diffs.map((d) => (
        <div key={d.key} style={{ marginBottom: 4 }}>
          <strong>{d.key}</strong>：{' '}
          <span style={{ color: '#f5222d', textDecoration: 'line-through' }}>
            {JSON.stringify(d.before)}
          </span>{' '}
          →{' '}
          <span style={{ color: '#52c41a' }}>{JSON.stringify(d.after)}</span>
        </div>
      ))}
    </div>
  );
}

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    Promise.all([getProperty(id), getPropertyHistory(id)])
      .then(([prop, hist]) => {
        setProperty(prop);
        setHistory(hist);
      })
      .catch((err) => message.error(err.message || '加载房源详情失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!property) return null;

  const handleEdit = () => {
    form.setFieldsValue({
      title: property.title,
      address: property.address,
      layout: property.layout,
      area: property.area,
      monthlyRent: property.monthlyRent,
      status: property.status,
      landlordName: property.landlordName,
      escrowManagerId: property.escrowManagerId || undefined,
      escrowManagerName: property.escrowManagerName || undefined,
    });
    setEditOpen(true);
  };

  const handleSave = () => {
    form
      .validateFields()
      .then((values) => {
        const isClosingEscrow =
          property.escrowManagerId && !values.escrowManagerId;

        if (isClosingEscrow && !values.escrowCloseReason) {
          message.error('关闭托管必须填写关闭原因');
          return;
        }

        setConfirmLoading(true);
        const payload = { ...values };
        if (!isClosingEscrow) {
          delete payload.escrowCloseReason;
        }
        return updateProperty(id, payload);
      })
      .then(() => {
        message.success('更新成功');
        setEditOpen(false);
        form.resetFields();
        fetchData();
      })
      .catch((err) => {
        if (err.message) message.error(err.message);
      })
      .finally(() => setConfirmLoading(false));
  };

  const escrowManagerIdValue = Form.useWatch('escrowManagerId', form);

  const timelineItems = history.map((log, index) => ({
    key: log.id || index,
    children: (
      <div>
        <div style={{ marginBottom: 4 }}>
          <Tag color="blue">{log.action}</Tag>
          <span style={{ margin: '0 8px', fontWeight: 500 }}>{log.operatorName || '系统'}</span>
          {log.remark && <span style={{ color: '#666' }}>{log.remark}</span>}
        </div>
        <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>{log.createdAt}</div>
        {(log.beforeSnapshot || log.afterSnapshot) && (
          <Collapse
            size="small"
            items={[
              {
                key: 'diff',
                label: '变更详情',
                children: (
                  <JsonDiff
                    before={log.beforeSnapshot}
                    after={log.afterSnapshot}
                  />
                ),
              },
            ]}
          />
        )}
      </div>
    ),
  }));

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card
        title="房源基本信息"
        extra={
          <Button type="primary" onClick={handleEdit}>
            编辑
          </Button>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="房源标题">{property.title}</Descriptions.Item>
          <Descriptions.Item label="地址">{property.address}</Descriptions.Item>
          <Descriptions.Item label="户型">{property.layout}</Descriptions.Item>
          <Descriptions.Item label="面积(㎡)">{property.area}</Descriptions.Item>
          <Descriptions.Item label="月租金(元)">{property.monthlyRent}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={STATUS_COLOR[property.status]}>{STATUS_LABEL[property.status] || property.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="空置天数">{property.vacancyDays ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="房东">{property.landlordName}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="托管经理">
        {property.escrowManagerId ? (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="托管经理ID">{property.escrowManagerId}</Descriptions.Item>
            <Descriptions.Item label="托管经理姓名">{property.escrowManagerName || '-'}</Descriptions.Item>
            {property.escrowCloseReason && (
              <Descriptions.Item label="关闭原因" span={2}>
                {property.escrowCloseReason}
              </Descriptions.Item>
            )}
          </Descriptions>
        ) : (
          <span style={{ color: '#999' }}>未指定托管经理</span>
        )}
      </Card>

      <Card title="关联合同">
        <Table
          rowKey="id"
          dataSource={property.contracts || []}
          columns={contractColumns}
          pagination={false}
          size="small"
        />
      </Card>

      <Card title="关联看房记录">
        <Table
          rowKey="id"
          dataSource={property.viewings || []}
          columns={viewingColumns}
          pagination={false}
          size="small"
        />
      </Card>

      <Card title="变更历史">
        {timelineItems.length > 0 ? (
          <Timeline items={timelineItems} />
        ) : (
          <span style={{ color: '#999' }}>暂无变更记录</span>
        )}
      </Card>

      <Modal
        title="编辑房源"
        open={editOpen}
        onOk={handleSave}
        onCancel={() => {
          setEditOpen(false);
          form.resetFields();
        }}
        confirmLoading={confirmLoading}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="房源标题" rules={[{ required: true, message: '请输入房源标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址" rules={[{ required: true, message: '请输入地址' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="layout" label="户型" rules={[{ required: true, message: '请输入户型' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="area" label="面积(㎡)" rules={[{ required: true, message: '请输入面积' }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="monthlyRent" label="月租金(元)" rules={[{ required: true, message: '请输入月租金' }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item name="landlordName" label="房东姓名" rules={[{ required: true, message: '请输入房东姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="escrowManagerId" label="托管经理ID">
            <Input placeholder="清空则关闭托管" allowClear />
          </Form.Item>
          <Form.Item name="escrowManagerName" label="托管经理姓名">
            <Input />
          </Form.Item>
          {property.escrowManagerId && !escrowManagerIdValue && (
            <Form.Item
              name="escrowCloseReason"
              label="关闭托管原因"
              rules={[{ required: true, message: '关闭托管必须填写原因' }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Space>
  );
}
