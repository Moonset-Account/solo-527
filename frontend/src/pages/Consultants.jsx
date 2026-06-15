import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  message,
  Tabs,
  Timeline,
  Collapse,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getConsultants,
  getFollowUps,
  createFollowUp,
  getProperties,
  getTenants,
} from '../api';

const FOLLOWUP_TYPE_LABEL = {
  PHONE_CALL: '电话跟进',
  SITE_VISIT: '上门拜访',
  CONTRACT_DISCUSSION: '合同洽谈',
  ISSUE_RESOLUTION: '问题处理',
  RENT_REMINDER: '催租提醒',
  OTHER: '其他',
};

const FOLLOWUP_TYPE_COLOR = {
  PHONE_CALL: 'blue',
  SITE_VISIT: 'green',
  CONTRACT_DISCUSSION: 'purple',
  ISSUE_RESOLUTION: 'orange',
  RENT_REMINDER: 'red',
  OTHER: 'default',
};

const FOLLOWUP_TYPE_OPTIONS = Object.keys(FOLLOWUP_TYPE_LABEL).map((key) => ({
  label: FOLLOWUP_TYPE_LABEL[key],
  value: key,
}));

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

export default function Consultants() {
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [activeTab, setActiveTab] = useState('list');

  const fetchConsultants = () => {
    setLoading(true);
    getConsultants()
      .then((res) => {
        setConsultants(Array.isArray(res) ? res : []);
      })
      .catch((err) => message.error(err.message || '加载顾问列表失败'))
      .finally(() => setLoading(false));
  };

  const fetchFollowUps = (consultantId) => {
    setFollowUpLoading(true);
    getFollowUps(consultantId)
      .then((res) => {
        setFollowUps(Array.isArray(res) ? res : []);
      })
      .catch((err) => message.error(err.message || '加载跟进记录失败'))
      .finally(() => setFollowUpLoading(false));
  };

  useEffect(() => {
    fetchConsultants();
  }, []);

  useEffect(() => {
    if (selectedConsultant) {
      fetchFollowUps(selectedConsultant);
    }
  }, [selectedConsultant]);

  const openModal = () => {
    if (!selectedConsultant) {
      message.warning('请先选择一个顾问');
      return;
    }
    getTenants()
      .then((res) => setTenants(Array.isArray(res) ? res : []))
      .catch(() => {});
    getProperties()
      .then((res) => setProperties(Array.isArray(res) ? res : []))
      .catch(() => {});
    setModalOpen(true);
  };

  const handleCreate = () => {
    form
      .validateFields()
      .then((values) => {
        const payload = {
          ...values,
          nextFollowUpAt: values.nextFollowUpAt
            ? values.nextFollowUpAt.toISOString()
            : undefined,
        };
        setConfirmLoading(true);
        return createFollowUp(selectedConsultant, payload);
      })
      .then(() => {
        message.success('跟进记录创建成功');
        setModalOpen(false);
        form.resetFields();
        fetchFollowUps(selectedConsultant);
      })
      .catch((err) => {
        if (err.message) message.error(err.message);
      })
      .finally(() => setConfirmLoading(false));
  };

  const consultantColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '角色', dataIndex: 'role', key: 'role' },
    {
      title: '跟进记录数',
      key: 'followUpCount',
      render: (_, record) => record.followUps?.length || 0,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button
          type={selectedConsultant === record.id ? 'primary' : 'link'}
          size="small"
          onClick={() => {
            setSelectedConsultant(record.id);
            setActiveTab('followups');
          }}
        >
          查看跟进
        </Button>
      ),
    },
  ];

  const followUpColumns = [
    {
      title: '租客',
      key: 'tenant',
      render: (_, record) => record.tenant?.name || '-',
    },
    {
      title: '房源',
      key: 'property',
      render: (_, record) => record.property?.title || '-',
    },
    {
      title: '跟进类型',
      dataIndex: 'followUpType',
      key: 'followUpType',
      render: (type) => (
        <Tag color={FOLLOWUP_TYPE_COLOR[type]}>{FOLLOWUP_TYPE_LABEL[type] || type}</Tag>
      ),
    },
    { title: '跟进内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '下次跟进',
      dataIndex: 'nextFollowUpAt',
      key: 'nextFollowUpAt',
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ];

  const timelineItems = followUps.map((item, index) => ({
    key: item.id || index,
    color: FOLLOWUP_TYPE_COLOR[item.followUpType] || 'blue',
    children: (
      <div>
        <div style={{ marginBottom: 4 }}>
          <Tag color={FOLLOWUP_TYPE_COLOR[item.followUpType]}>
            {FOLLOWUP_TYPE_LABEL[item.followUpType] || item.followUpType}
          </Tag>
          <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
            {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
          </span>
        </div>
        <div style={{ marginBottom: 4 }}>
          <strong>租客：</strong>
          {item.tenant?.name || '-'}
          {item.property && (
            <>
              <strong style={{ marginLeft: 16 }}>房源：</strong>
              {item.property.title}
            </>
          )}
        </div>
        <div style={{ color: '#333' }}>{item.content}</div>
        {item.nextFollowUpAt && (
          <div style={{ color: '#fa8c16', fontSize: 12, marginTop: 4 }}>
            下次跟进：{dayjs(item.nextFollowUpAt).format('YYYY-MM-DD HH:mm')}
          </div>
        )}
      </div>
    ),
  }));

  const tabItems = [
    {
      key: 'list',
      label: '顾问列表',
      children: (
        <Table
          rowKey="id"
          loading={loading}
          dataSource={consultants}
          columns={consultantColumns}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      ),
    },
    {
      key: 'followups',
      label: '跟进记录',
      children: selectedConsultant ? (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
              新增跟进
            </Button>
            <Button
              type={activeTab === 'followups' ? 'default' : 'default'}
              onClick={() => setActiveTab(activeTab === 'followups' ? 'timeline' : 'followups')}
            >
              {activeTab === 'followups' ? '切换时间线视图' : '切换列表视图'}
            </Button>
          </Space>

          {activeTab === 'followups' ? (
            <Table
              rowKey="id"
              loading={followUpLoading}
              dataSource={followUps}
              columns={followUpColumns}
              pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
            />
          ) : (
            <Card title="跟进时间线（复盘视图）">
              {timelineItems.length > 0 ? (
                <Timeline items={timelineItems} />
              ) : (
                <span style={{ color: '#999' }}>暂无跟进记录</span>
              )}
            </Card>
          )}
        </Space>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          请从左侧顾问列表选择一个顾问查看跟进记录
        </div>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      <Modal
        title="新增跟进记录"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={confirmLoading}
        destroyOnClose
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="tenantId" label="租客" rules={[{ required: true, message: '请选择租客' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={tenants.map((t) => ({ value: t.id, label: t.name }))}
              placeholder="请选择租客"
            />
          </Form.Item>
          <Form.Item name="propertyId" label="房源">
            <Select
              showSearch
              allowClear
              optionFilterProp="label"
              options={properties.map((p) => ({ value: p.id, label: p.title }))}
              placeholder="请选择房源（可选）"
            />
          </Form.Item>
          <Form.Item name="followUpType" label="跟进类型" rules={[{ required: true, message: '请选择跟进类型' }]}>
            <Select options={FOLLOWUP_TYPE_OPTIONS} placeholder="请选择跟进类型" />
          </Form.Item>
          <Form.Item name="content" label="跟进内容" rules={[{ required: true, message: '请输入跟进内容' }]}>
            <Input.TextArea rows={4} placeholder="请输入跟进内容" />
          </Form.Item>
          <Form.Item name="nextFollowUpAt" label="下次跟进时间">
            <DatePicker showTime style={{ width: '100%' }} placeholder="请选择下次跟进时间（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
