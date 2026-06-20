import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Tag, Button, Space, Input, Select, Modal, Form, App as AntdApp,
  Drawer, Timeline, Avatar, Divider, Descriptions, Row, Col, Statistic, Card,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ArrowsAltOutlined, EyeOutlined, SendOutlined, SwapOutlined
} from '@ant-design/icons';
import { approvalApi, contractApi, authApi } from '../../../api';
import { contractStatusMap, urgencyMap, contractTypeMap, formatDate, approvalStatusMap, useAppStore } from '../../../store';
import { ApprovalTask, ApprovalStatus } from '../../../types';
const { Option } = Select;
const { TextArea } = Input;

export default function ApprovalTasksPage() {
  const navigate = useNavigate();
  const { message, modal } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApprovalTask[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | undefined>('pending');
  const [keyword, setKeyword] = useState('');
  const [stats, setStats] = useState<any>({});
  const [historyVisible, setHistoryVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<ApprovalTask | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'transfer' | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await approvalApi.myTasks(page, pageSize, statusFilter) as any;
      let list = res.list || [];
      if (keyword) {
        list = list.filter((t: ApprovalTask) =>
          t.nodeName.includes(keyword) ||
          t.contract.contractNo.includes(keyword) ||
          t.contract.title.includes(keyword),
        );
      }
      setData(list);
      setTotal(res.total || 0);
    } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const all = await approvalApi.myTasks(1, 9999, undefined) as any;
      const list = all.list || [];
      setStats({
        total: list.length,
        pending: list.filter((t: ApprovalTask) => t.status === 'pending').length,
        approved: list.filter((t: ApprovalTask) => t.status === 'approved').length,
        rejected: list.filter((t: ApprovalTask) => t.status === 'rejected' || t.status === 'returned').length,
      });
    } catch {}
  };

  useEffect(() => {
    fetchData();
    fetchStats();
    authApi.listUsers().then((r: any) => setUsers(r.list || [])).catch(() => {});
  }, [page, pageSize, statusFilter]);

  const openAction = (task: ApprovalTask, type: 'approve' | 'reject' | 'transfer') => {
    setCurrentTask(task);
    setActionType(type);
    form.resetFields();
  };

  const doAction = async () => {
    if (!currentTask) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      switch (actionType) {
        case 'approve':
          await approvalApi.approve(currentTask.id, values.opinion);
          message.success('已通过');
          break;
        case 'reject':
          await approvalApi.reject(currentTask.id, values.rejectionReason, values.opinion);
          message.success('已退回');
          break;
        case 'transfer':
          await approvalApi.transfer(currentTask.id, values.newApproverId, values.reason);
          message.success('已转交');
          break;
      }
      setActionType(null);
      fetchData();
      fetchStats();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const showHistory = async (task: ApprovalTask) => {
    setCurrentTask(task);
    try {
      const res = await approvalApi.history(task.contract.id);
      setHistory((res as unknown as any[]) || []);
      setHistoryVisible(true);
    } catch (e: any) { message.error(e.message); }
  };

  const columns = [
    {
      title: '审批节点', dataIndex: 'nodeName', width: 150,
      render: (v, r: ApprovalTask) => (
        <div>
          <div style={{ fontWeight: 500 }}>{v}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{r.contract.contractNo}</div>
        </div>
      ),
    },
    {
      title: '合同信息', dataIndex: ['contract', 'title'], width: 280,
      render: (_, r: ApprovalTask) => (
        <div>
          <div style={{ color: '#1677ff', cursor: 'pointer' }} onClick={() => navigate(`/m/progress/${r.contract.id}`)}>
            {r.contract.title}
          </div>
          <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>
            {contractTypeMap[r.contract.contractType]} · {r.contract.partyA} ↔ {r.contract.partyB}
          </div>
        </div>
      ),
    },
    {
      title: '合同金额', dataIndex: ['contract', 'amount'], width: 130, align: 'right' as const,
      render: (v) => <b style={{ color: '#ff4d4f' }}>¥{v?.toLocaleString() || 0}</b>,
    },
    {
      title: '紧急度', dataIndex: ['contract', 'urgency'], width: 100,
      render: (v) => <Tag color={(urgencyMap as any)[v].color}>{(urgencyMap as any)[v].label}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v) => {
        const info = approvalStatusMap[v] || { label: v, color: '#8c8c8c' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    { title: '审批意见', dataIndex: 'opinion', width: 160, ellipsis: true, render: (v) => v || '-' },
    { title: '审批时间', dataIndex: 'approvedAt', width: 160, render: (v, r) => formatDate(v || r.createdAt) },
    {
      title: '操作', width: 260, fixed: 'right' as const,
      render: (_, r: ApprovalTask) => (
        <Space size={4}>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => navigate(`/contracts/${r.contract.id}`)}>合同详情</Button>
          <Button size="small" type="link" onClick={() => showHistory(r)}>审批历史</Button>
          {r.status === 'pending' && (
            <>
              <Button size="small" type="primary" ghost icon={<CheckCircleOutlined />} onClick={() => openAction(r, 'approve')}>通过</Button>
              <Button size="small" danger ghost icon={<CloseCircleOutlined />} onClick={() => openAction(r, 'reject')}>退回</Button>
              <Button size="small" icon={<SwapOutlined />} onClick={() => openAction(r, 'transfer')}>转交</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-title">
        <span>我的审批任务</span>
        <Button icon={<ReloadOutlined />} onClick={() => { fetchData(); fetchStats(); }}>刷新</Button>
      </div>

      <Row gutter={[16, 16]} className="stats-grid">
        <Col xs={12} md={6}><Card bordered={false} size="small" style={{ borderRadius: 10 }}>
          <Statistic title="全部任务" value={stats.total || 0} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false} size="small" style={{ borderRadius: 10 }}>
          <Statistic title="待处理" value={stats.pending || 0} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false} size="small" style={{ borderRadius: 10 }}>
          <Statistic title="已通过" value={stats.approved || 0} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false} size="small" style={{ borderRadius: 10 }}>
          <Statistic title="已退回" value={stats.rejected || 0} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
      </Row>

      <div className="page-container">
        <Space style={{ marginBottom: 16, width: '100%' }} wrap>
          <Input
            allowClear prefix={<SearchOutlined />} placeholder="搜索节点/编号/标题"
            style={{ width: 280 }} value={keyword} onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => fetchData()}
          />
          <Select
            style={{ width: 160 }} value={statusFilter} allowClear
            placeholder="状态筛选" onChange={(v) => { setStatusFilter(v); setPage(1); }}
          >
            {Object.entries(approvalStatusMap).map(([k, v]) => (
              <Option key={k} value={k}>{v.label}</Option>
            ))}
          </Select>
          <Button type="primary" onClick={fetchData}>查询</Button>
        </Space>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1300 }}
          pagination={{
            current: page, pageSize, total, showSizeChanger: true,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </div>

      <Drawer
        title={`审批历史 - ${currentTask?.contract.contractNo || ''}`}
        open={historyVisible}
        onClose={() => setHistoryVisible(false)}
        width={560}
        extra={<Button type="primary" onClick={() => navigate(`/contracts/${currentTask?.contract.id}`)}>查看合同</Button>}
      >
        {currentTask && (
          <div>
            <Descriptions title="合同摘要" size="small" column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="编号">{currentTask.contract.contractNo}</Descriptions.Item>
              <Descriptions.Item label="标题">{currentTask.contract.title}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={(contractStatusMap as any)[currentTask.contract.status].color}>
                  {(contractStatusMap as any)[currentTask.contract.status].label}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            <Divider orientation="left" orientationMargin={0}>完整流程</Divider>
            <Timeline
              items={history.map((h: any) => {
                const info = approvalStatusMap[h.status] || { label: h.status, color: 'blue' };
                return {
                  color: info.color,
                  children: (
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ marginBottom: 4 }}>
                        <Tag color={info.color}>{info.label}</Tag>
                        <b style={{ marginLeft: 8 }}>{h.nodeName}</b>
                        <span style={{ marginLeft: 12, color: '#8c8c8c', fontSize: 12 }}>
                          {formatDate(h.approvedAt || h.createdAt, 'MM-DD HH:mm')}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#595959', marginBottom: 4 }}>
                        审批人：{h.approver?.realName || '-'}
                        {h.transferredTo && <span style={{ color: '#722ed1' }}> → 转交 {h.transferredTo.realName}</span>}
                      </div>
                      {h.opinion && <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 6, fontSize: 13 }}>💬 {h.opinion}</div>}
                      {h.rejectionReason && <div style={{ background: '#fff1f0', padding: 8, borderRadius: 6, fontSize: 13, color: '#cf1322' }}>❌ {h.rejectionReason}</div>}
                    </div>
                  ),
                };
              })}
            />
          </div>
        )}
      </Drawer>

      <Modal
        title={{
          approve: '审批通过',
          reject: '退回申请',
          transfer: '转交审批',
        }[actionType || 'approve']}
        open={!!actionType}
        onOk={doAction}
        onCancel={() => setActionType(null)}
        confirmLoading={submitting}
        okText={actionType === 'reject' ? '确认退回' : actionType === 'transfer' ? '确认转交' : '确认通过'}
        okButtonProps={{ danger: actionType === 'reject' }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {actionType === 'reject' && (
            <Form.Item name="rejectionReason" label="退回原因" rules={[{ required: true, message: '请填写退回原因' }]}>
              <TextArea rows={3} placeholder="请详细说明退回原因，方便申请人修改" />
            </Form.Item>
          )}
          {actionType === 'transfer' && (
            <Form.Item name="newApproverId" label="新审批人" rules={[{ required: true, message: '请选择新审批人' }]}>
              <Select placeholder="选择新的审批人" showSearch optionFilterProp="children">
                {users.map((u) => (
                  <Option key={u.id} value={u.id}>{u.realName} - {u.department}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          {actionType === 'transfer' && (
            <Form.Item name="reason" label="转交原因" rules={[{ required: true }]}>
              <TextArea rows={2} placeholder="说明转交理由" />
            </Form.Item>
          )}
          <Form.Item name="opinion" label={actionType === 'reject' ? '补充说明' : '审批意见（选填）'}>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
