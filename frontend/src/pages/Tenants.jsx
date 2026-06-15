import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Drawer,
  Descriptions,
  Tag,
  Timeline,
  Space,
  message,
  Spin,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getTenants, createTenant } from '../api';

const VIEWING_STATUS_COLOR = {
  SCHEDULED: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

const VIEWING_STATUS_LABEL = {
  SCHEDULED: '已预约',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

const CONTRACT_STATUS_COLOR = {
  PENDING_REVIEW: 'default',
  APPROVED: 'blue',
  SIGNING: 'orange',
  ACTIVE: 'green',
  EXPIRED: 'red',
  TERMINATED: 'volcano',
};

const CONTRACT_STATUS_LABEL = {
  PENDING_REVIEW: '待审核',
  APPROVED: '已审批',
  SIGNING: '签署中',
  ACTIVE: '生效中',
  EXPIRED: '已到期',
  TERMINATED: '已终止',
};

export default function Tenants() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [current, setCurrent] = useState(null);

  const fetchData = () => {
    setLoading(true);
    getTenants()
      .then((res) => setData(res))
      .catch((err) => message.error(err.message || '加载租客列表失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    form
      .validateFields()
      .then((values) => {
        setConfirmLoading(true);
        return createTenant(values);
      })
      .then(() => {
        message.success('新增租客成功');
        setModalOpen(false);
        form.resetFields();
        fetchData();
      })
      .catch((err) => {
        if (err.message) message.error(err.message);
      })
      .finally(() => setConfirmLoading(false));
  };

  const openDrawer = (record) => {
    setCurrent(record);
    setDrawerOpen(true);
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '身份证号', dataIndex: 'idCard', key: 'idCard' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '近期看房次数',
      dataIndex: 'recentViewingCount',
      key: 'recentViewingCount',
    },
    {
      title: '近期合同数',
      dataIndex: 'recentContractCount',
      key: 'recentContractCount',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => openDrawer(record)}>
          查看
        </Button>
      ),
    },
  ];

  const viewingColumns = [
    { title: '房源', dataIndex: 'propertyTitle', key: 'propertyTitle' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={VIEWING_STATUS_COLOR[status]}>{VIEWING_STATUS_LABEL[status] || status}</Tag>
      ),
    },
    { title: '预约时间', dataIndex: 'scheduledAt', key: 'scheduledAt' },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
  ];

  const contractColumns = [
    { title: '合同编号', dataIndex: 'contractNo', key: 'contractNo' },
    { title: '房源', dataIndex: 'propertyTitle', key: 'propertyTitle' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={CONTRACT_STATUS_COLOR[status]}>{CONTRACT_STATUS_LABEL[status] || status}</Tag>
      ),
    },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate' },
    { title: '结束日期', dataIndex: 'endDate', key: 'endDate' },
    { title: '月租金(元)', dataIndex: 'monthlyRent', key: 'monthlyRent' },
  ];

  const timelineItems = (current?.changeHistory || []).map((log, index) => ({
    key: log.id || index,
    children: (
      <div>
        <div style={{ marginBottom: 4 }}>
          <Tag color="blue">{log.action}</Tag>
          <span style={{ margin: '0 8px', fontWeight: 500 }}>{log.operatorName || '系统'}</span>
          {log.remark && <span style={{ color: '#666' }}>{log.remark}</span>}
        </div>
        <div style={{ color: '#999', fontSize: 12 }}>{log.createdAt}</div>
      </div>
    ),
  }));

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
        新增租客
      </Button>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        onRow={(record) => ({ onClick: () => openDrawer(record), style: { cursor: 'pointer' } })}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
      />

      <Modal
        title="新增租客"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={confirmLoading}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="idCard" label="身份证号" rules={[{ required: true, message: '请输入身份证号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="租客详情"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setCurrent(null);
        }}
        width={640}
      >
        {current ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="姓名">{current.name}</Descriptions.Item>
              <Descriptions.Item label="手机号">{current.phone}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{current.idCard}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{current.email}</Descriptions.Item>
            </Descriptions>

            <div>
              <h4 style={{ marginBottom: 12 }}>关联看房记录</h4>
              <Table
                rowKey="id"
                dataSource={current.viewings || []}
                columns={viewingColumns}
                pagination={false}
                size="small"
              />
            </div>

            <div>
              <h4 style={{ marginBottom: 12 }}>关联合同</h4>
              <Table
                rowKey="id"
                dataSource={current.contracts || []}
                columns={contractColumns}
                pagination={false}
                size="small"
              />
            </div>

            <div>
              <h4 style={{ marginBottom: 12 }}>变更历史</h4>
              {timelineItems.length > 0 ? (
                <Timeline items={timelineItems} />
              ) : (
                <span style={{ color: '#999' }}>暂无变更记录</span>
              )}
            </div>
          </Space>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        )}
      </Drawer>
    </Space>
  );
}
