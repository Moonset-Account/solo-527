import { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, Select, message, Tooltip } from 'antd';
import { NumberOutlined, PlusOutlined, ReloadOutlined, SafetyOutlined, FileDoneOutlined } from '@ant-design/icons';
import { contractApi, authApi } from '../../../api';
import { formatDate } from '../../../store';
import { ContractNumberPool, NumberPoolStatus } from '../../../types';
const { Option } = Select;

const statusMap: Record<string, { label: string; color: string }> = {
  available: { label: '可用', color: 'green' },
  reserved: { label: '已预留', color: 'orange' },
  used: { label: '已使用', color: 'blue' },
  expired: { label: '已过期', color: 'default' },
  cancelled: { label: '已取消', color: 'default' },
};

export default function NumberPoolPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [data, setData] = useState<ContractNumberPool[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterStatus, setFilterStatus] = useState<NumberPoolStatus | undefined>();
  const [reserveModal, setReserveModal] = useState(false);
  const [form] = Form.useForm();
  const [users, setUsers] = useState<any[]>([]);

  const fetchStats = async () => {
    const res = await contractApi.getNumberStats();
    setStats(res);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await contractApi.listNumberPool(page, pageSize, filterStatus) as any;
      setData(res.list);
      setTotal(res.total);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchStats();
    fetchData();
    authApi.listUsers().then((r: any) => setUsers(r.list || [])).catch(() => {});
  }, [page, pageSize, filterStatus]);

  const handleReserve = async () => {
    try {
      const values = await form.validateFields();
      await contractApi.reserveNumber(values);
      message.success('预留编号成功');
      setReserveModal(false);
      form.resetFields();
      fetchStats();
      fetchData();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const columns = [
    { title: '完整编号', dataIndex: 'contractNo', width: 200, render: (v: string) => <b style={{ color: '#1677ff' }}>{v}</b> },
    { title: '前缀', dataIndex: 'prefix', width: 100 },
    { title: '年份', dataIndex: 'year', width: 100 },
    { title: '序号', dataIndex: 'seqNo', width: 100 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: string) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.label}</Tag>,
    },
    { title: '规则类型', dataIndex: 'ruleType', width: 120 },
    {
      title: '关联合同', dataIndex: 'contractId', width: 140,
      render: (v: string) => v ? <a style={{ color: '#1677ff' }}>跳转合同</a> : '-',
    },
    {
      title: '预留过期时间', dataIndex: 'reservedExpireAt', width: 180,
      render: (v: string, r: any) => {
        if (r.status !== 'reserved') return '-';
        const expired = new Date(v).getTime() < Date.now();
        return <span style={{ color: expired ? '#ff4d4f' : undefined }}>{formatDate(v)}</span>;
      },
    },
    { title: '使用时间', dataIndex: 'usedAt', width: 160, render: (v: string) => v ? formatDate(v) : '-' },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, render: (v: string) => formatDate(v) },
  ];

  return (
    <div>
      <div className="page-title">
        <span>合同编号管理</span>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchStats(); fetchData(); }}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setReserveModal(true)}>
            手动预留编号
          </Button>
        </Space>
      </div>

      <Row gutter={16} className="stats-grid" style={{ marginBottom: 20 }}>
        <Col xs={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic title={<><NumberOutlined /> 编号总数</>} value={stats.total || 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic title={<><SafetyOutlined style={{ color: 'green' }} /> 可用编号</>} value={stats.available || 0} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic title={<><PlusOutlined style={{ color: 'orange' }} /> 已预留</>} value={stats.reserved || 0} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic title={<><FileDoneOutlined style={{ color: 'blue' }} /> 已使用</>} value={stats.used || 0} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
      </Row>

      <div className="page-container">
        <Space style={{ marginBottom: 16 }}>
          <span style={{ color: '#595959' }}>状态筛选：</span>
          <Select
            allowClear
            placeholder="全部"
            style={{ width: 140 }}
            value={filterStatus}
            onChange={(v) => { setFilterStatus(v); setPage(1); }}
          >
            {Object.entries(statusMap).map(([k, v]) => (
              <Option key={k} value={k}>{v.label}</Option>
            ))}
          </Select>
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1400 }}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </div>

      <Modal
        title="手动预留编号"
        open={reserveModal}
        onOk={handleReserve}
        onCancel={() => setReserveModal(false)}
        okText="预留"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="编号前缀" name="prefix" initialValue="HT">
            <Input placeholder="如 HT、HT-XX 等" />
          </Form.Item>
          <Form.Item label="规则类型" name="ruleType" initialValue="standard">
            <Select>
              <Option value="standard">标准规则 (前缀-年份-序号)</Option>
              <Option value="short">简短规则</Option>
              <Option value="custom">自定义规则</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
