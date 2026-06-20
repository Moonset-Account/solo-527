import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Tag, Button, Space, Input, Select, DatePicker, Row, Col, Statistic, Card,
  Modal, Form, App as AntdApp, Drawer, Timeline, InputNumber, Avatar, Tooltip, Descriptions,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, PlusOutlined, ExclamationCircleOutlined,
  CheckCircleOutlined, EditOutlined, EyeOutlined, UserOutlined, FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { conflictApi, contractApi, authApi } from '../../../api';
import { conflictStatusMap, conflictSeverityMap, conflictTypeMap, formatDate } from '../../../store';
import { ConflictRecord, ConflictStatus, ConflictSeverity, ConflictType } from '../../../types';
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

export default function ConflictListPage() {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConflictRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [stats, setStats] = useState<any>({});
  const [filters, setFilters] = useState({
    keyword: '',
    status: undefined as ConflictStatus | undefined,
    severity: undefined as ConflictSeverity | undefined,
    conflictType: undefined as ConflictType | undefined,
    dateRange: [] as any[],
  });
  const [createVisible, setCreateVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<ConflictRecord | null>(null);
  const [editForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [contracts, setContracts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page, pageSize,
        keyword: filters.keyword || undefined,
        status: filters.status,
        severity: filters.severity,
        conflictType: filters.conflictType,
      };
      if (filters.dateRange?.length === 2) {
        params.dateRangeStart = filters.dateRange[0].format('YYYY-MM-DD');
        params.dateRangeEnd = filters.dateRange[1].format('YYYY-MM-DD');
      }
      const res = await conflictApi.query(params) as any;
      setData(res.list);
      setTotal(res.total);
    } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await conflictApi.stats();
      setStats(res);
    } catch {}
  };

  useEffect(() => {
    fetchData();
    fetchStats();
    contractApi.query({ page: 1, pageSize: 100 }).then((r: any) => setContracts(r.list || [])).catch(() => {});
    authApi.listUsers().then((r: any) => setUsers(r.list || [])).catch(() => {});
  }, [page, pageSize]);

  useEffect(() => { fetchData(); }, [filters.status, filters.severity, filters.conflictType]);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      await conflictApi.create({
        ...values,
        contractId: values.contractId || undefined,
      });
      message.success('冲突记录创建成功');
      setCreateVisible(false);
      createForm.resetFields();
      fetchData();
      fetchStats();
    } catch (e: any) { message.error(e.message); }
  };

  const handleView = async (c: ConflictRecord) => {
    try {
      const detail = await conflictApi.getById(c.id) as unknown as ConflictRecord;
      setCurrentConflict(detail);
      setDetailVisible(true);
    } catch (e: any) { message.error(e.message); }
  };

  const handleUpdate = async (patch: any) => {
    if (!currentConflict) return;
    try {
      await conflictApi.update(currentConflict.id, patch);
      message.success('更新成功');
      const detail = await conflictApi.getById(currentConflict.id) as unknown as ConflictRecord;
      setCurrentConflict(detail);
      fetchData();
      fetchStats();
    } catch (e: any) { message.error(e.message); }
  };

  const columns = [
    {
      title: '严重度', dataIndex: 'severity', width: 100,
      render: (v) => {
        const info = conflictSeverityMap[v];
        return <Tag color={info.color} icon={v === 'critical' ? '🔥' : v === 'high' ? '⚠️' : null}>{info.label}</Tag>;
      },
      sorter: (a: any, b: any) => ({ critical: 3, high: 2, medium: 1, low: 0 }[a.severity] - { critical: 3, high: 2, medium: 1, low: 0 }[b.severity]),
    },
    {
      title: '标题', dataIndex: 'title', width: 240, ellipsis: true,
      render: (v, r: ConflictRecord) => (
        <a onClick={() => handleView(r)} style={{ color: '#1f1f1f' }}>
          <ExclamationCircleOutlined style={{ color: conflictSeverityMap[r.severity].color, marginRight: 6 }} />
          {v}
        </a>
      ),
    },
    {
      title: '冲突类型', dataIndex: 'conflictType', width: 120,
      render: (v) => conflictTypeMap[v] || v,
    },
    { title: '关联合同', dataIndex: ['contract', 'contractNo'], width: 140,
      render: (v, r) => v ? <a onClick={() => navigate(`/contracts/${r.contractId}`)} style={{ color: '#1677ff' }}>{v}</a> : '-',
    },
    {
      title: '影响范围', dataIndex: 'impactScope', width: 200, ellipsis: true,
      render: (v) => v || <span style={{ color: '#bfbfbf' }}>未填写</span>,
    },
    {
      title: '处理人', dataIndex: ['handler', 'realName'], width: 120,
      render: (v, r) => v
        ? <Space><Avatar size={20} style={{ background: '#1677ff' }}>{v[0]}</Avatar>{v}</Space>
        : <Tag color="warning">未指派</Tag>,
    },
    {
      title: '上报人', dataIndex: ['reporter', 'realName'], width: 120,
      render: (v) => v || '-',
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v) => {
        const info = conflictStatusMap[v];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
      filters: Object.entries(conflictStatusMap).map(([k, v]) => ({ text: v.label, value: k })),
      onFilter: (value, record) => (record as any).status === value,
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, render: (v) => formatDate(v) },
    {
      title: '操作', width: 140, fixed: 'right' as const,
      render: (_, r: ConflictRecord) => (
        <Space size={4}>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleView(r)}>详情</Button>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => navigate(`/conflicts/${r.id}`)}>处理</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-title">
        <span>资源冲突管理</span>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchData(); fetchStats(); }}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>上报冲突</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} className="stats-grid">
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title="总数" value={stats.total || 0} valueStyle={{ fontSize: 22 }} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title="待处理" value={(stats.byStatus?.open || 0) + (stats.byStatus?.assigned || 0)} valueStyle={{ fontSize: 22, color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title="处理中" value={stats.byStatus?.resolving || 0} valueStyle={{ fontSize: 22, color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title="严重" value={stats.bySeverity?.critical || 0} valueStyle={{ fontSize: 22, color: '#ff4d4f' }} prefix={<ExclamationCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title="高危" value={stats.bySeverity?.high || 0} valueStyle={{ fontSize: 22, color: '#fa541c' }} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title="已解决" value={(stats.byStatus?.resolved || 0) + (stats.byStatus?.closed || 0)} valueStyle={{ fontSize: 22, color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <div className="page-container">
        <Space style={{ marginBottom: 16, width: '100%' }} wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="搜索标题/描述/影响范围"
            style={{ width: 280 }} value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            onPressEnter={() => fetchData()}
          />
          <Select allowClear placeholder="状态" style={{ width: 140 }}
            value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })}>
            {Object.entries(conflictStatusMap).map(([k, v]) => (
              <Option key={k} value={k}>{(v as any).label}</Option>
            ))}
          </Select>
          <Select allowClear placeholder="严重程度" style={{ width: 140 }}
            value={filters.severity} onChange={(v) => setFilters({ ...filters, severity: v })}>
            {Object.entries(conflictSeverityMap).map(([k, v]) => (
              <Option key={k} value={k}>{(v as any).label}</Option>
            ))}
          </Select>
          <Select allowClear placeholder="冲突类型" style={{ width: 160 }}
            value={filters.conflictType} onChange={(v) => setFilters({ ...filters, conflictType: v })}>
            {Object.entries(conflictTypeMap).map(([k, v]) => (
              <Option key={k} value={k}>{v}</Option>
            ))}
          </Select>
          <RangePicker value={filters.dateRange as any} onChange={(v) => setFilters({ ...filters, dateRange: v as any })} />
          <Button type="primary" onClick={fetchData}>查询</Button>
        </Space>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1500 }}
          pagination={{
            current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </div>

      <Modal title="上报冲突记录" open={createVisible} onOk={handleCreate} onCancel={() => setCreateVisible(false)}
        okText="提交" width={720} destroyOnClose>
        <Form form={createForm} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} md={14}>
              <Form.Item name="title" label="冲突标题" rules={[{ required: true }]}>
                <Input placeholder="简明描述冲突" maxLength={200} />
              </Form.Item>
            </Col>
            <Col xs={24} md={5}>
              <Form.Item name="conflictType" label="冲突类型" initialValue="other" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(conflictTypeMap).map(([k, v]) => (
                    <Option key={k} value={k}>{v}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={5}>
              <Form.Item name="severity" label="严重程度" initialValue="medium" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(conflictSeverityMap).map(([k, v]) => (
                    <Option key={k} value={k}>{(v as any).label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="description" label="详细描述" rules={[{ required: true }]}>
                <TextArea rows={4} placeholder="详细描述冲突现象、触发场景等" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="impactScope" label="影响范围">
                <TextArea rows={2} placeholder="说明影响的合同、系统、人员等" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="affectedResources" label="涉及资源">
                <TextArea rows={2} placeholder="具体资源/编号/文件" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="contractId" label="关联合同（选填）">
                <Select allowClear showSearch optionFilterProp="children" placeholder="选择合同">
                  {contracts.map((c) => (
                    <Option key={c.id} value={c.id}>{c.contractNo} - {c.title}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="nextSteps" label="建议的下一步">
                <TextArea rows={2} placeholder="建议的处理步骤或方案" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Drawer
        title={<Space>
          <ExclamationCircleOutlined style={{ color: currentConflict ? conflictSeverityMap[currentConflict.severity].color : '#1677ff', fontSize: 20 }} />
          <b>{currentConflict?.title || '冲突详情'}</b>
          <Tag color={currentConflict ? conflictSeverityMap[currentConflict.severity].color : ''}>
            {currentConflict ? conflictSeverityMap[currentConflict.severity].label : ''}
          </Tag>
        </Space>}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={720}
        extra={<Button type="primary" onClick={() => handleUpdate({ status: 'resolving', timelineNote: '开始处理' })}>开始处理</Button>}
      >
        {currentConflict && (
          <div>
            <Descriptions title="基本信息" bordered size="small" column={2} style={{ marginBottom: 20 }}>
              <Descriptions.Item label="类型">{conflictTypeMap[currentConflict.conflictType]}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={conflictStatusMap[currentConflict.status].color}>
                  {conflictStatusMap[currentConflict.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="关联合同" span={2}>
                {currentConflict.contract
                  ? <Space><FileTextOutlined /><a onClick={() => navigate(`/contracts/${currentConflict.contractId}`)} style={{ color: '#1677ff' }}>
                      {currentConflict.contract.contractNo} - {currentConflict.contract.title}
                    </a></Space>
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="上报人">{currentConflict.reporter?.realName || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理人">
                <Select
                  allowClear
                  placeholder="选择处理人"
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="children"
                  value={currentConflict.handlerId || undefined}
                  onChange={(v) => handleUpdate({ handlerId: v, status: v ? 'assigned' : currentConflict.status })}
                >
                  {users.map((u) => (
                    <Option key={u.id} value={u.id}>{u.realName} - {u.department}</Option>
                  ))}
                </Select>
              </Descriptions.Item>
              <Descriptions.Item label="影响范围" span={2}>
                <div style={{ padding: 8, background: '#fffbe6', borderRadius: 6 }}>
                  {currentConflict.impactScope || '未填写'}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="涉及资源" span={2}>
                {currentConflict.affectedResources || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="详细描述" span={2}>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{currentConflict.description}</div>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDate(currentConflict.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="解决时间">{currentConflict.resolvedAt ? formatDate(currentConflict.resolvedAt) : '-'}</Descriptions.Item>
            </Descriptions>

            <div className="section-title">
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <span>下一步计划 / 解决方案</span>
                <Button size="small" icon={<EditOutlined />} onClick={() => {
                  Modal.confirm({
                    title: '编辑处理信息',
                    content: (
                      <Form layout="vertical">
                        <Form.Item label="下一步操作计划" name="nextSteps">
                          <TextArea rows={3} defaultValue={currentConflict.nextSteps || ''} />
                        </Form.Item>
                        <Form.Item label="解决方案" name="resolution">
                          <TextArea rows={4} defaultValue={currentConflict.resolution || ''} />
                        </Form.Item>
                        <Form.Item label="进度备注" name="timelineNote">
                          <TextArea rows={2} placeholder="添加进度时间线记录" />
                        </Form.Item>
                      </Form>
                    ),
                    onOk: async () => {
                      const form = document.querySelectorAll('form') as any;
                      const nextSteps = (document.querySelectorAll('textarea')[0] as any)?.value;
                      const resolution = (document.querySelectorAll('textarea')[1] as any)?.value;
                      const timelineNote = (document.querySelectorAll('textarea')[2] as any)?.value;
                      await handleUpdate({ nextSteps, resolution, timelineNote });
                    },
                  });
                }}>编辑</Button>
              </Space>
            </div>

            <Card size="small" style={{ marginBottom: 20 }} title="下一步操作">
              <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {currentConflict.nextSteps || '尚未填写，请点击右上角编辑'}
              </div>
            </Card>
            {currentConflict.resolution && (
              <Card size="small" style={{ marginBottom: 20, background: '#f6ffed' }} title="解决方案">
                <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{currentConflict.resolution}</div>
                <Space style={{ marginTop: 16 }}>
                  <Button type="primary" onClick={() => handleUpdate({ status: 'resolved', timelineNote: '确认解决' })}>
                    <CheckCircleOutlined /> 确认已解决
                  </Button>
                  <Button onClick={() => handleUpdate({ status: 'closed', timelineNote: '关闭冲突' })}>关闭</Button>
                  <Button danger onClick={() => handleUpdate({ status: 'escalated', timelineNote: '升级处理' })}>升级上报</Button>
                </Space>
              </Card>
            )}

            <div className="section-title">处理时间线</div>
            <Timeline
              items={(currentConflict.timeline || []).map((t) => ({
                color: t.action.includes('创建') ? 'blue' :
                  t.action.includes('解决') || t.action.includes('关闭') ? 'green' :
                  t.action.includes('升级') || t.action.includes('退回') ? 'red' : 'orange',
                children: (
                  <div>
                    <div style={{ marginBottom: 4 }}>
                      <b>{t.action}</b>
                      <span style={{ marginLeft: 12, color: '#8c8c8c', fontSize: 12 }}>{formatDate(t.time)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#595959' }}>处理人：{t.actor}</div>
                    {t.remark && <div style={{ fontSize: 13, marginTop: 6, background: '#fafafa', padding: 8, borderRadius: 6 }}>{t.remark}</div>}
                  </div>
                ),
              }))}
            />

            <Form
              layout="inline"
              style={{ marginTop: 24 }}
              onFinish={(values) => {
                handleUpdate({ timelineNote: values.note });
              }}
            >
              <Form.Item name="note" style={{ flex: 1 }} rules={[{ required: true, message: '请输入' }]}>
                <Input placeholder="添加进度记录..." />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">提交</Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Drawer>
    </div>
  );
}
