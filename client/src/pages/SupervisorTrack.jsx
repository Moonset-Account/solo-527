import React, { useState, useEffect } from 'react';
import {
  Tabs, Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Space, Tag,
  message, Row, Col, Statistic, Card, Divider, Descriptions, List, Alert, BarChartOutlined
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, WarningOutlined, CheckOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { stores, users, cashFlow, shifts, inspections } from '../api/index.js';

function SupervisorTrack({ activeTab = 'cashflow' }) {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">区域督导追踪</h2>
        <p className="page-desc">追踪现金流水、班次排班和巡店任务，关联后续动作</p>
      </div>
      <Tabs
        defaultActiveKey={activeTab}
        activeKey={activeTab}
        items={[
          { key: 'cashflow', label: '现金流水', children: <CashFlowTab /> },
          { key: 'shifts', label: '班次排班', children: <ShiftsTab /> },
          { key: 'inspections', label: '巡店任务', children: <InspectionsTab /> },
        ]}
      />
    </div>
  );
}

function CashFlowTab() {
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState({});
  const [storeList, setStoreList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({});

  const loadData = () => {
    setLoading(true);
    Promise.all([cashFlow.list(filters), cashFlow.summary(filters)]).then(([data, sum]) => {
      setList(data);
      setSummary(sum);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
    stores.list().then(setStoreList);
  }, [filters]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await cashFlow.create({ ...values, occurredAt: values.occurredAt.toISOString() });
      message.success('保存成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (err) {
      message.error('保存失败');
    }
  };

  const flowTypeOptions = [
    { label: '营业收入', value: 'INCOME' },
    { label: '运营支出', value: 'EXPENSE' },
    { label: '备用金存入', value: 'PETTY_CASH_IN' },
    { label: '备用金支取', value: 'PETTY_CASH_OUT' },
  ];

  const columns = [
    { title: '门店', dataIndex: ['store', 'name'], key: 'store' },
    {
      title: '类型',
      dataIndex: 'flowType',
      key: 'flowType',
      render: (v) => {
        const colors = { INCOME: 'green', EXPENSE: 'red', PETTY_CASH_IN: 'blue', PETTY_CASH_OUT: 'orange' };
        const labels = { INCOME: '营业收入', EXPENSE: '运营支出', PETTY_CASH_IN: '备用金存入', PETTY_CASH_OUT: '备用金支取' };
        return <Tag color={colors[v]}>{labels[v]}</Tag>;
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v, r) => {
        const sign = ['INCOME', 'PETTY_CASH_IN'].includes(r.flowType) ? '+' : '-';
        const color = ['INCOME', 'PETTY_CASH_IN'].includes(r.flowType) ? 'green' : 'red';
        return <span style={{ color, fontWeight: 'bold' }}>{sign}¥{v.toFixed(2)}</span>;
      },
    },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '操作人', dataIndex: 'operator', key: 'operator' },
    {
      title: '发生时间',
      dataIndex: 'occurredAt',
      key: 'occurredAt',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={async () => {
          await cashFlow.delete(record.id);
          message.success('删除成功');
          loadData();
        }}>删除</Button>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总收入" value={summary.totalIncome || 0} prefix="¥" valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="总支出" value={summary.totalExpense || 0} prefix="¥" valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="备用金存入" value={summary.pettyCashIn || 0} prefix="¥" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="净现金流" value={summary.netCashFlow || 0} prefix="¥" />
          </Card>
        </Col>
      </Row>

      <div className="filter-bar">
        <Space>
          <Select
            placeholder="选择门店"
            style={{ width: 200 }}
            allowClear
            onChange={(v) => setFilters({ ...filters, storeId: v })}
            options={storeList.map((s) => ({ label: s.name, value: s.id }))}
          />
          <Select
            placeholder="流水类型"
            style={{ width: 150 }}
            allowClear
            onChange={(v) => setFilters({ ...filters, flowType: v })}
            options={flowTypeOptions}
          />
          <DatePicker.RangePicker
            onChange={(dates) => {
              if (dates) {
                setFilters({ ...filters, startDate: dates[0].toISOString(), endDate: dates[1].toISOString() });
              } else {
                const { startDate, endDate, ...rest } = filters;
                setFilters(rest);
              }
            }}
          />
          <Button type="primary" onClick={loadData}>查询</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>
            登记流水
          </Button>
        </Space>
      </div>

      <Table columns={columns} dataSource={list} rowKey="id" loading={loading} />

      <Modal title="登记现金流水" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={handleSubmit}>
        <Form form={form} layout="vertical">
          <Form.Item name="storeId" label="门店" rules={[{ required: true }]}>
            <Select options={storeList.map((s) => ({ label: s.name, value: s.id }))} />
          </Form.Item>
          <Form.Item name="flowType" label="流水类型" rules={[{ required: true }]}>
            <Select options={flowTypeOptions} />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="occurredAt" label="发生时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="operator" label="操作人">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function ShiftsTab() {
  const [list, setList] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [repurchaseStats, setRepurchaseStats] = useState([]);
  const [storeList, setStoreList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [conflictModal, setConflictModal] = useState(false);
  const [statsModal, setStatsModal] = useState(false);
  const [form] = Form.useForm();
  const [resolveForm] = Form.useForm();
  const [currentConflict, setCurrentConflict] = useState(null);
  const [filters, setFilters] = useState({});

  const loadData = () => {
    setLoading(true);
    shifts.list(filters).then((data) => {
      setList(data);
      setLoading(false);
    });
    shifts.conflicts(filters).then(setConflicts);
    shifts.repurchaseStats(filters).then(setRepurchaseStats);
  };

  useEffect(() => {
    loadData();
    stores.list().then(setStoreList);
  }, [filters]);

  const handleStoreChange = async (storeId) => {
    if (storeId) {
      const store = await stores.get(storeId);
      setEmployeeList(store.employees || []);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await shifts.create({ ...values, shiftDate: values.shiftDate.toISOString() });
      message.success('排班创建成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '创建失败');
    }
  };

  const handleResolveConflict = (record) => {
    setCurrentConflict(record);
    resolveForm.resetFields();
    setConflictModal(true);
  };

  const handleResolveSubmit = async () => {
    try {
      const values = await resolveForm.validateFields();
      await shifts.resolve(currentConflict.id, values);
      message.success('冲突已处理');
      setConflictModal(false);
      loadData();
    } catch (err) {
      message.error('处理失败');
    }
  };

  const shiftTypeOptions = [
    { label: '早班', value: '早班' },
    { label: '中班', value: '中班' },
    { label: '晚班', value: '晚班' },
    { label: '全天', value: '全天' },
  ];

  const columns = [
    { title: '门店', dataIndex: ['store', 'name'], key: 'store' },
    { title: '员工', dataIndex: ['employee', 'name'], key: 'employee' },
    {
      title: '排班日期',
      dataIndex: 'shiftDate',
      key: 'shiftDate',
      render: (t) => dayjs(t).format('YYYY-MM-DD'),
    },
    { title: '班次', dataIndex: 'shiftType', key: 'shiftType' },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime' },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime' },
    {
      title: '冲突',
      dataIndex: 'hasConflict',
      key: 'hasConflict',
      render: (v, record) => v ? (
        <Space>
          <Tag color="red" icon={<WarningOutlined />}>有冲突</Tag>
          <Button size="small" type="primary" onClick={() => handleResolveConflict(record)}>处理</Button>
        </Space>
      ) : <Tag color="green">正常</Tag>,
    },
    { title: '冲突说明', dataIndex: 'conflictNote', key: 'conflictNote', render: (v) => v || '-' },
    { title: '处理结果', dataIndex: 'resolution', key: 'resolution', render: (v) => v || '-' },
    {
      title: '复购贡献',
      dataIndex: 'repurchaseContribution',
      key: 'repurchase',
      render: (v) => v ? `¥${v.toFixed(2)}` : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button size="small" danger onClick={async () => {
          await shifts.delete(record.id);
          loadData();
          message.success('删除成功');
        }}>删除</Button>
      ),
    },
  ];

  return (
    <div>
      {conflicts.length > 0 && (
        <Alert
          message={`当前有 ${conflicts.length} 个排班冲突待处理`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" type="primary" onClick={() => setFilters({ ...filters, hasConflict: 'true' })}>
              查看全部
            </Button>
          }
        />
      )}

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>
          新建排班
        </Button>
        <Button icon={<BarChartOutlined />} onClick={() => setStatsModal(true)}>
          复购贡献统计
        </Button>
      </Space>

      <div className="filter-bar">
        <Space>
          <Select
            placeholder="选择门店"
            style={{ width: 200 }}
            allowClear
            onChange={(v) => { setFilters({ ...filters, storeId: v }); handleStoreChange(v); }}
            options={storeList.map((s) => ({ label: s.name, value: s.id }))}
          />
          <Select
            placeholder="仅显示冲突"
            style={{ width: 150 }}
            allowClear
            onChange={(v) => setFilters({ ...filters, hasConflict: v })}
            options={[{ label: '是', value: 'true' }]}
          />
          <DatePicker.RangePicker
            onChange={(dates) => {
              if (dates) {
                setFilters({ ...filters, startDate: dates[0].toISOString(), endDate: dates[1].toISOString() });
              } else {
                const { startDate, endDate, ...rest } = filters;
                setFilters(rest);
              }
            }}
          />
          <Button type="primary" onClick={loadData}>查询</Button>
        </Space>
      </div>

      <Table columns={columns} dataSource={list} rowKey="id" loading={loading} />

      <Modal title="新建排班" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={handleSubmit}>
        <Form form={form} layout="vertical">
          <Form.Item name="storeId" label="门店" rules={[{ required: true }]}>
            <Select
              options={storeList.map((s) => ({ label: s.name, value: s.id }))}
              onChange={handleStoreChange}
            />
          </Form.Item>
          <Form.Item name="employeeId" label="员工" rules={[{ required: true }]}>
            <Select options={employeeList.map((e) => ({ label: e.name, value: e.id }))} />
          </Form.Item>
          <Form.Item name="shiftDate" label="排班日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="shiftType" label="班次" rules={[{ required: true }]}>
            <Select options={shiftTypeOptions} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label="开始时间" rules={[{ required: true }]}>
                <Input placeholder="HH:mm 如 08:00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label="结束时间" rules={[{ required: true }]}>
                <Input placeholder="HH:mm 如 16:00" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="repurchaseContribution" label="复购贡献金额(可选)">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="处理排班冲突" open={conflictModal} onCancel={() => setConflictModal(false)} onOk={handleResolveSubmit}>
        {currentConflict && (
          <>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="员工">{currentConflict.employee?.name}</Descriptions.Item>
              <Descriptions.Item label="日期">{dayjs(currentConflict.shiftDate).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="时间">{currentConflict.startTime} - {currentConflict.endTime}</Descriptions.Item>
              <Descriptions.Item label="冲突说明">{currentConflict.conflictNote}</Descriptions.Item>
            </Descriptions>
            <Form form={resolveForm} layout="vertical">
              <Form.Item name="resolution" label="处理结果/备注" rules={[{ required: true, message: '请输入处理结果' }]}>
                <Input.TextArea rows={3} placeholder="请输入冲突处理方式、备注说明..." />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      <Modal
        title="复购贡献统计"
        open={statsModal}
        onCancel={() => setStatsModal(false)}
        footer={[<Button key="close" onClick={() => setStatsModal(false)}>关闭</Button>]}
        width={600}
      >
        <Table
          size="small"
          dataSource={repurchaseStats}
          rowKey="employeeId"
          pagination={false}
          columns={[
            { title: '排名', key: 'rank', render: (_, __, i) => i + 1 },
            { title: '员工', dataIndex: 'employeeName', key: 'name' },
            { title: '排班数', dataIndex: 'shiftCount', key: 'count' },
            { title: '复购贡献总额', dataIndex: 'totalContribution', key: 'total', render: (v) => `¥${v.toFixed(2)}` },
            {
              title: '人均贡献',
              key: 'avg',
              render: (_, r) => r.shiftCount > 0 ? `¥${(r.totalContribution / r.shiftCount).toFixed(2)}` : '-',
            },
          ]}
        />
      </Modal>
    </div>
  );
}

function InspectionsTab() {
  const [list, setList] = useState([]);
  const [storeList, setStoreList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentDetail, setCurrentDetail] = useState(null);
  const [filters, setFilters] = useState({});

  const loadData = () => {
    setLoading(true);
    inspections.list(filters).then((data) => {
      setList(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
    stores.list().then(setStoreList);
    users.list({ role: 'SUPERVISOR' }).then(setUserList);
  }, [filters]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await inspections.create({
        ...values,
        inspectionDate: values.inspectionDate.toISOString(),
        followUpDue: values.followUpDue ? values.followUpDue.toISOString() : null,
      });
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (err) {
      message.error('创建失败');
    }
  };

  const handleViewDetail = async (record) => {
    const detail = await inspections.get(record.id);
    setCurrentDetail(detail);
    setDetailVisible(true);
  };

  const statusOptions = [
    { label: '待执行', value: 'PENDING' },
    { label: '进行中', value: 'IN_PROGRESS' },
    { label: '已完成', value: 'COMPLETED' },
    { label: '需跟进', value: 'FOLLOW_UP' },
  ];

  const columns = [
    { title: '巡店单号', dataIndex: 'inspectionNo', key: 'no' },
    { title: '门店', dataIndex: ['store', 'name'], key: 'store' },
    { title: '督导', dataIndex: ['inspector', 'name'], key: 'inspector' },
    {
      title: '巡店日期',
      dataIndex: 'inspectionDate',
      key: 'date',
      render: (t) => dayjs(t).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        const colors = { PENDING: 'gold', IN_PROGRESS: 'blue', COMPLETED: 'green', FOLLOW_UP: 'red' };
        const labels = { PENDING: '待执行', IN_PROGRESS: '进行中', COMPLETED: '已完成', FOLLOW_UP: '需跟进' };
        return <Tag color={colors[s]}>{labels[s]}</Tag>;
      },
    },
    { title: '问题', dataIndex: 'issues', key: 'issues', render: (v) => v ? v.slice(0, 20) + '...' : '-' },
    {
      title: '跟进截止',
      dataIndex: 'followUpDue',
      key: 'due',
      render: (t) => t ? dayjs(t).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleViewDetail(record)}>详情</Button>
          <Button size="small" danger onClick={async () => {
            await inspections.delete(record.id);
            message.success('删除成功');
            loadData();
          }}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="filter-bar">
        <Space>
          <Select
            placeholder="选择门店"
            style={{ width: 200 }}
            allowClear
            onChange={(v) => setFilters({ ...filters, storeId: v })}
            options={storeList.map((s) => ({ label: s.name, value: s.id }))}
          />
          <Select
            placeholder="任务状态"
            style={{ width: 150 }}
            allowClear
            onChange={(v) => setFilters({ ...filters, status: v })}
            options={statusOptions}
          />
          <Button type="primary" onClick={loadData}>查询</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>
            新建巡店任务
          </Button>
        </Space>
      </div>

      <Table columns={columns} dataSource={list} rowKey="id" loading={loading} />

      <Modal title="新建巡店任务" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={handleSubmit}>
        <Form form={form} layout="vertical">
          <Form.Item name="storeId" label="门店" rules={[{ required: true }]}>
            <Select options={storeList.map((s) => ({ label: s.name, value: s.id }))} />
          </Form.Item>
          <Form.Item name="inspectorId" label="执行督导" rules={[{ required: true }]}>
            <Select options={userList.map((u) => ({ label: u.name, value: u.id }))} />
          </Form.Item>
          <Form.Item name="inspectionDate" label="巡店日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="issues" label="发现问题">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="followUp" label="跟进要求">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="followUpDue" label="跟进截止日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="巡店详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[<Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>]}
        width={600}
      >
        {currentDetail && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="巡店单号">{currentDetail.inspectionNo}</Descriptions.Item>
            <Descriptions.Item label="门店">{currentDetail.store?.name}</Descriptions.Item>
            <Descriptions.Item label="执行督导">{currentDetail.inspector?.name}</Descriptions.Item>
            <Descriptions.Item label="巡店日期">{dayjs(currentDetail.inspectionDate).format('YYYY-MM-DD')}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={currentDetail.status === 'COMPLETED' ? 'green' : currentDetail.status === 'FOLLOW_UP' ? 'red' : 'gold'}>
                {currentDetail.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="发现问题">{currentDetail.issues || '-'}</Descriptions.Item>
            <Descriptions.Item label="跟进要求">{currentDetail.followUp || '-'}</Descriptions.Item>
            <Descriptions.Item label="跟进截止">
              {currentDetail.followUpDue ? dayjs(currentDetail.followUpDue).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default SupervisorTrack;
