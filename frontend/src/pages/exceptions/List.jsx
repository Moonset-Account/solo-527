import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Table,
  Input,
  Select,
  DatePicker,
  Tag,
  Modal,
  Form,
  InputNumber,
  message,
  Row,
  Col,
  Statistic,
  Tabs,
  Tooltip,
  Divider,
  App as AntdApp,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  ExportOutlined,
  TeamOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  WarningOutlined,
  UserOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { exceptionApi, exportApi, userApi, supplierApi } from '@/api/index.js';
import StatusTag from '@/components/StatusTag';
import {
  fmtMoney,
  fmtNum,
  fmtPct,
  fmtDateTime,
  parsePagination,
  fmtDuration,
  priorityLabel,
} from '@/utils/format.js';
import { EXCEPTION_TYPE, EXCEPTION_STATUS } from '@/utils/constants.js';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const TAB_KEYS = ['all', 'OPEN', 'IN_PROGRESS', 'PENDING_SUPPLIER', 'RESOLVED', 'CLOSED'];
const TAB_LABELS = {
  all: '全部',
  OPEN: '待处理',
  IN_PROGRESS: '处理中',
  PENDING_SUPPLIER: '待供应商',
  RESOLVED: '已解决',
  CLOSED: '已关闭',
};

export default function ExceptionList() {
  const { message: msg, modal } = AntdApp.useApp();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [list, setList] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [handleModalOpen, setHandleModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [batchAssignModal, setBatchAssignModal] = useState(false);

  const [supplierOptions, setSupplierOptions] = useState([]);
  const [handlerOptions, setHandlerOptions] = useState([]);

  const [createForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [handleForm] = Form.useForm();
  const [batchAssignForm] = Form.useForm();

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await exceptionApi.statistics();
      setStats(res.data || {});
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchList = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        ...filters,
      };
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      const res = await exceptionApi.list(params);
      const data = res.data?.list || res.data?.records || [];
      setList(data);
      setPagination(parsePagination(res.data));
    } catch (e) {
      msg.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [supRes, userRes] = await Promise.all([
        supplierApi.list({ page: 1, pageSize: 100 }),
        userApi.list({ page: 1, pageSize: 100 }),
      ]);
      setSupplierOptions(supRes.data?.list || supRes.data?.records || []);
      setHandlerOptions(userRes.data?.list || userRes.data?.records || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchStats();
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchList(pagination.current, pagination.pageSize);
  }, [activeTab, filters]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleSearch = () => {
    setPagination((p) => ({ ...p, current: 1 }));
    fetchList(1, pagination.pageSize);
  };

  const handleReset = () => {
    setFilters({});
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleTableChange = (pag) => {
    fetchList(pag.current, pag.pageSize);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setModalLoading(true);
      await exceptionApi.create(values);
      msg.success('创建成功');
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchList(pagination.current, pagination.pageSize);
      fetchStats();
    } catch (e) {
    } finally {
      setModalLoading(false);
    }
  };

  const handleAssign = async () => {
    try {
      const values = await assignForm.validateFields();
      setModalLoading(true);
      await exceptionApi.assign(currentRecord.id, values);
      msg.success('分配成功');
      setAssignModalOpen(false);
      assignForm.resetFields();
      fetchList(pagination.current, pagination.pageSize);
    } catch (e) {
    } finally {
      setModalLoading(false);
    }
  };

  const handleBatchAssign = async () => {
    try {
      const values = await batchAssignForm.validateFields();
      setModalLoading(true);
      await Promise.all(
        selectedRowKeys.map((id) => exceptionApi.assign(id, values))
      );
      msg.success(`已分配 ${selectedRowKeys.length} 条异常`);
      setBatchAssignModal(false);
      batchAssignForm.resetFields();
      setSelectedRowKeys([]);
      fetchList(pagination.current, pagination.pageSize);
    } catch (e) {
    } finally {
      setModalLoading(false);
    }
  };

  const handleHandle = async () => {
    try {
      const values = await handleForm.validateFields();
      setModalLoading(true);
      await exceptionApi.setStatus(currentRecord.id, {
        status: 'IN_PROGRESS',
        ...values,
      });
      msg.success('处理成功');
      setHandleModalOpen(false);
      handleForm.resetFields();
      fetchList(pagination.current, pagination.pageSize);
      fetchStats();
    } catch (e) {
    } finally {
      setModalLoading(false);
    }
  };

  const handleEscalate = (record) => {
    modal.confirm({
      title: '确认升级',
      content: `确定要将异常「${record.title}」升级吗？升级后将通知上级主管。`,
      okText: '确认升级',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await exceptionApi.setStatus(record.id, { status: 'ESCALATED' });
          msg.success('已升级');
          fetchList(pagination.current, pagination.pageSize);
          fetchStats();
        } catch (e) {}
      },
    });
  };

  const handleClose = (record) => {
    modal.confirm({
      title: '确认关闭',
      content: `确定要关闭异常「${record.title}」吗？关闭后不可恢复。`,
      okText: '确认关闭',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await exceptionApi.setStatus(record.id, { status: 'CLOSED' });
          msg.success('已关闭');
          fetchList(pagination.current, pagination.pageSize);
          fetchStats();
        } catch (e) {}
      },
    });
  };

  const handleExport = async () => {
    try {
      await exportApi.exception(
        { status: activeTab === 'all' ? undefined : activeTab, ...filters },
        `异常列表_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      msg.success('导出成功');
    } catch (e) {}
  };

  const openAssignModal = (record) => {
    setCurrentRecord(record);
    assignForm.setFieldsValue({ handlerId: record.handlerId });
    setAssignModalOpen(true);
  };

  const openHandleModal = (record) => {
    setCurrentRecord(record);
    setHandleModalOpen(true);
  };

  const columns = useMemo(
    () => [
      {
        title: '异常号',
        dataIndex: 'exceptionNo',
        key: 'exceptionNo',
        width: 130,
        render: (v, r) => (
          <a
            onClick={() => navigate(`/exceptions/${r.id}`)}
            style={{ fontWeight: 500 }}
          >
            {v}
          </a>
        ),
      },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        width: 110,
        render: (v) => <StatusTag statusKey="EXCEPTION_TYPE" value={v} />,
      },
      {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        width: 200,
        ellipsis: true,
      },
      {
        title: '优先级',
        dataIndex: 'priority',
        key: 'priority',
        width: 80,
        render: (v) => {
          const p = priorityLabel(v);
          return <Tag color={p.c}>{p.t}</Tag>;
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (v) => <StatusTag statusKey="EXCEPTION_STATUS" value={v} />,
      },
      {
        title: '供应商',
        dataIndex: 'supplierName',
        key: 'supplierName',
        width: 130,
        ellipsis: true,
      },
      {
        title: '关联PO',
        dataIndex: 'poNo',
        key: 'poNo',
        width: 120,
        render: (v) => v || '-',
      },
      {
        title: '关联入库',
        dataIndex: 'inboundNo',
        key: 'inboundNo',
        width: 120,
        render: (v) => v || '-',
      },
      {
        title: '关联批次',
        dataIndex: 'batchNo',
        key: 'batchNo',
        width: 120,
        render: (v) => v || '-',
      },
      {
        title: '产品',
        dataIndex: 'productName',
        key: 'productName',
        width: 150,
        ellipsis: true,
      },
      {
        title: '影响数量',
        dataIndex: 'affectedQty',
        key: 'affectedQty',
        width: 100,
        align: 'right',
        render: (v) => fmtNum(v),
      },
      {
        title: '损失金额',
        dataIndex: 'lossAmount',
        key: 'lossAmount',
        width: 110,
        align: 'right',
        render: (v) => fmtMoney(v),
      },
      {
        title: 'SLA倒计时',
        dataIndex: 'slaDeadline',
        key: 'slaDeadline',
        width: 110,
        render: (v, r) => {
          if (!v) return '-';
          const deadline = new Date(v).getTime();
          const now = Date.now();
          const remaining = deadline - now;
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          if (remaining <= 0) {
            return <Tag color="red">已超时</Tag>;
          }
          if (hours < 24) {
            return <Tag color="orange">剩余{hours}小时</Tag>;
          }
          return <Tag color="blue">剩余{Math.floor(hours / 24)}天</Tag>;
        },
      },
      {
        title: '处理人',
        dataIndex: 'handlerName',
        key: 'handlerName',
        width: 100,
        render: (v) => v || '-',
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 150,
        render: (v) => fmtDateTime(v),
      },
      {
        title: '操作',
        key: 'action',
        width: 240,
        fixed: 'right',
        render: (_, r) => (
          <Space size="small">
            <Button type="link" size="small" onClick={() => openAssignModal(r)}>
              分配
            </Button>
            <Button type="link" size="small" onClick={() => handleEscalate(r)}>
              升级
            </Button>
            <Button type="link" size="small" onClick={() => openHandleModal(r)}>
              处理
            </Button>
            <Button type="link" size="small" danger onClick={() => handleClose(r)}>
              关闭
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => navigate(`/exceptions/${r.id}`)}
            >
              详情
            </Button>
          </Space>
        ),
      },
    ],
    [navigate]
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <div className="app-page">
      <Card
        title={<Title level={4} style={{ margin: 0 }}>异常管理</Title>}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => { fetchStats(); fetchList(); }}>
              刷新
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button
              icon={<TeamOutlined />}
              disabled={selectedRowKeys.length === 0}
              onClick={() => setBatchAssignModal(true)}
            >
              批量分配处理人
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
              新建异常
            </Button>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small" loading={statsLoading}>
              <Statistic
                title="待处理数"
                value={stats?.pending || 0}
                prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" loading={statsLoading}>
              <Statistic
                title="平均处理时长"
                value={stats?.avgDuration || 0}
                suffix="小时"
                prefix={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
                precision={1}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" loading={statsLoading}>
              <Statistic
                title="按时完成率"
                value={stats?.onTimeRate || 0}
                suffix="%"
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                precision={1}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" loading={statsLoading}>
              <Statistic
                title="升级率"
                value={stats?.escalationRate || 0}
                suffix="%"
                prefix={<RiseOutlined style={{ color: '#722ed1' }} />}
                precision={1}
              />
            </Card>
          </Col>
        </Row>

        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={TAB_KEYS.map((k) => ({ key: k, label: TAB_LABELS[k] }))}
        />

        <Card size="small" style={{ marginBottom: 16 }} variant="borderless">
          <Row gutter={[16, 12]}>
            <Col span={6}>
              <Input
                placeholder="关键词搜索"
                prefix={<SearchOutlined />}
                allowClear
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col span={4}>
              <Input
                placeholder="异常号"
                allowClear
                value={filters.exceptionNo}
                onChange={(e) => setFilters({ ...filters, exceptionNo: e.target.value })}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="异常类型"
                allowClear
                style={{ width: '100%' }}
                value={filters.type}
                onChange={(v) => setFilters({ ...filters, type: v })}
              >
                {Object.entries(EXCEPTION_TYPE).map(([k, v]) => (
                  <Option key={k} value={k}>{v.label}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="优先级"
                allowClear
                style={{ width: '100%' }}
                value={filters.priority}
                onChange={(v) => setFilters({ ...filters, priority: v })}
              >
                <Option value={4}>紧急</Option>
                <Option value={3}>高</Option>
                <Option value={2}>中</Option>
                <Option value={1}>低</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="状态"
                allowClear
                style={{ width: '100%' }}
                value={filters.status}
                onChange={(v) => setFilters({ ...filters, status: v })}
              >
                {Object.entries(EXCEPTION_STATUS).map(([k, v]) => (
                  <Option key={k} value={k}>{v.label}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="供应商"
                allowClear
                showSearch
                optionFilterProp="children"
                style={{ width: '100%' }}
                value={filters.supplierId}
                onChange={(v) => setFilters({ ...filters, supplierId: v })}
              >
                {supplierOptions.map((s) => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="处理人"
                allowClear
                showSearch
                optionFilterProp="children"
                style={{ width: '100%' }}
                value={filters.handlerId}
                onChange={(v) => setFilters({ ...filters, handlerId: v })}
              >
                {handlerOptions.map((u) => (
                  <Option key={u.id} value={u.id}>{u.name || u.username}</Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <RangePicker
                style={{ width: '100%' }}
                value={filters.dateRange}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              />
            </Col>
            <Col span={2} style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={handleReset}>重置</Button>
                <Button type="primary" icon={<FilterOutlined />} onClick={handleSearch}>
                  筛选
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          pagination={{ ...pagination, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条` }}
          onChange={handleTableChange}
          rowSelection={rowSelection}
          scroll={{ x: 2000 }}
          size="middle"
        />
      </Card>

      <Modal
        title="新建异常"
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); createForm.resetFields(); }}
        onOk={handleCreate}
        confirmLoading={modalLoading}
        okText="创建"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="异常类型"
                rules={[{ required: true, message: '请选择异常类型' }]}
              >
                <Select placeholder="请选择">
                  {Object.entries(EXCEPTION_TYPE).map(([k, v]) => (
                    <Option key={k} value={k}>{v.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
                initialValue={2}
              >
                <Select placeholder="请选择">
                  <Option value={1}>低</Option>
                  <Option value={2}>中</Option>
                  <Option value={3}>高</Option>
                  <Option value={4}>紧急</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="title"
            label="异常标题"
            rules={[{ required: true, message: '请输入异常标题' }]}
          >
            <Input placeholder="请输入异常标题" maxLength={100} showCount />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="supplierId" label="供应商">
                <Select placeholder="请选择供应商" showSearch optionFilterProp="children">
                  {supplierOptions.map((s) => (
                    <Option key={s.id} value={s.id}>{s.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="handlerId" label="处理人">
                <Select placeholder="请选择处理人" showSearch optionFilterProp="children">
                  {handlerOptions.map((u) => (
                    <Option key={u.id} value={u.id}>{u.name || u.username}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="poNo" label="关联PO号">
                <Input placeholder="PO编号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="inboundNo" label="关联入库号">
                <Input placeholder="入库编号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="batchNo" label="关联批次">
                <Input placeholder="批次号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="productName" label="产品名称">
                <Input placeholder="产品名称" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="affectedQty" label="影响数量">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="数量" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="lossAmount" label="损失金额(¥)">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="金额" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="异常描述">
            <TextArea rows={3} placeholder="请详细描述异常情况" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分配处理人"
        open={assignModalOpen}
        onCancel={() => { setAssignModalOpen(false); assignForm.resetFields(); }}
        onOk={handleAssign}
        confirmLoading={modalLoading}
        okText="确认分配"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="handlerId"
            label="选择处理人"
            rules={[{ required: true, message: '请选择处理人' }]}
          >
            <Select placeholder="请选择处理人" showSearch optionFilterProp="children">
              {handlerOptions.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.name || u.username}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="分配说明（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="处理异常"
        open={handleModalOpen}
        onCancel={() => { setHandleModalOpen(false); handleForm.resetFields(); }}
        onOk={handleHandle}
        confirmLoading={modalLoading}
        okText="提交处理"
        cancelText="取消"
        width={560}
        destroyOnClose
      >
        <Form form={handleForm} layout="vertical">
          <Form.Item
            name="solution"
            label="处理方案"
            rules={[{ required: true, message: '请填写处理方案' }]}
          >
            <TextArea rows={5} placeholder="请详细描述处理方案" maxLength={500} showCount />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="其他说明（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量分配处理人"
        open={batchAssignModal}
        onCancel={() => { setBatchAssignModal(false); batchAssignForm.resetFields(); }}
        onOk={handleBatchAssign}
        confirmLoading={modalLoading}
        okText="确认分配"
        cancelText="取消"
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">已选择 <Text strong>{selectedRowKeys.length}</Text> 条异常</Text>
        </div>
        <Form form={batchAssignForm} layout="vertical">
          <Form.Item
            name="handlerId"
            label="选择处理人"
            rules={[{ required: true, message: '请选择处理人' }]}
          >
            <Select placeholder="请选择处理人" showSearch optionFilterProp="children">
              {handlerOptions.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.name || u.username}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="分配说明（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
