import { useEffect, useState } from 'react';
import {
  Card, Row, Col, Statistic, Tag, Table, Button, Space, Select,
  Input, Modal, Form, message, Drawer, Avatar, Divider, Descriptions,
  Popconfirm, Empty, Alert, Badge, Switch, Tooltip
} from 'antd';
import {
  UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, SearchOutlined, SafetyOutlined, TeamOutlined,
  CrownOutlined, HistoryOutlined, CheckCircleOutlined,
  PhoneOutlined, MailOutlined
} from '@ant-design/icons';
import { userApi, logApi } from '../../services/api';
import dayjs from 'dayjs';
import { roleLabel, roleColor } from '../../types';
import type { ColumnsType } from 'antd/es/table';

export default function UserManagement() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [filters, setFilters] = useState<any>({ role: undefined, keyword: '', activeOnly: false });
  const [stats, setStats] = useState<any>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [detailLogs, setDetailLogs] = useState<any[]>([]);
  const [detailLogsLoading, setDetailLogsLoading] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await userApi.list({
        page: pagination.current, pageSize: pagination.pageSize,
        role: filters.role, keyword: filters.keyword, activeOnly: filters.activeOnly
      });
      setData(res.list);
      setTotal(res.total);
      const roleCount: Record<string, number> = {};
      res.list?.forEach((u: any) => { roleCount[u.role] = (roleCount[u.role] || 0) + 1; });
      setStats({
        total: res.total,
        admins: roleCount['ADMIN'] || 0,
        teachers: roleCount['TEACHER'] || 0,
        operators: roleCount['OPERATOR'] || 0,
        active: res.list?.filter((u: any) => u.isActive).length || 0
      });
    } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditData(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (user: any) => {
    setEditData(user);
    form.setFieldsValue({
      username: user.username, name: user.name, email: user.email,
      phone: user.phone, role: user.role, isActive: user.isActive
    });
    setModalOpen(true);
  };

  const openDetail = async (user: any) => {
    setDetail(user);
    setDetailOpen(true);
    try {
      setDetailLogsLoading(true);
      const res = await logApi.list({ operatorId: user.id, pageSize: 30 });
      setDetailLogs(res.list || []);
    } finally { setDetailLogsLoading(false); }
  };

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      if (editData) {
        await userApi.update(editData.id, values);
        message.success('更新成功');
      } else {
        await userApi.create({ ...values, password: values.password || '123456' });
        message.success('创建成功，初始密码：123456');
      }
      setModalOpen(false);
      form.resetFields();
      setEditData(null);
      loadData();
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (user: any) => {
    try {
      await userApi.delete(user.id);
      message.success('删除成功');
      loadData();
    } catch {}
  };

  const handleToggleStatus = async (user: any, checked: boolean) => {
    try {
      await userApi.update(user.id, { isActive: checked });
      message.success(`已${checked ? '启用' : '停用'}`);
      loadData();
    } catch {}
  };

  const columns: ColumnsType<any> = [
    {
      title: '用户',
      dataIndex: 'name',
      width: 220,
      fixed: 'left',
      render: (n, r) => (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Badge dot status={r.isActive ? 'success' : 'default'} offset={[0, 2]}>
            <Avatar size={40} style={{
              backgroundColor: r.role === 'ADMIN' ? '#ff4d4f' : r.role === 'TEACHER' ? '#1677ff' : '#52c41a'
            }} onClick={() => openDetail(r)}>
              {n?.charAt(0)}
            </Avatar>
          </Badge>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 500 }}>{n}</div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              @{r.username}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      render: role => (
        <Tag color={roleColor[role as keyof typeof roleColor]} style={{ width: 70, textAlign: 'center' }}>
          {roleLabel[role as keyof typeof roleLabel]}
        </Tag>
      ),
      filters: [
        { text: '管理员', value: 'ADMIN' },
        { text: '课程老师', value: 'TEACHER' },
        { text: '运营人员', value: 'OPERATOR' }
      ]
    },
    {
      title: '联系方式',
      width: 260,
      render: (_, r) => (
        <div style={{ lineHeight: 1.6 }}>
          {r.phone && <div style={{ fontSize: 12 }}><PhoneOutlined style={{ color: '#999', marginRight: 4 }} />{r.phone}</div>}
          {r.email && <div style={{ fontSize: 12 }}><MailOutlined style={{ color: '#999', marginRight: 4 }} />{r.email}</div>}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 100,
      render: a => <Tag color={a ? 'success' : 'default'}>{a ? '启用' : '已停用'}</Tag>,
      filters: [
        { text: '启用', value: true }, { text: '停用', value: false }
      ]
    },
    {
      title: '最近登录',
      dataIndex: 'lastLoginAt',
      width: 150,
      render: t => t ? (
        <div>
          <div style={{ fontSize: 12 }}>{dayjs(t).format('YYYY-MM-DD')}</div>
          <div style={{ fontSize: 11, color: '#999' }}>{dayjs(t).format('HH:mm')} · {dayjs(t).fromNow()}</div>
        </div>
      ) : <Tag color="default">从未登录</Tag>
    },
    {
      title: '创建',
      dataIndex: 'createdAt',
      width: 100,
      render: t => <span style={{ fontSize: 12 }}>{dayjs(t).format('YYYY-MM-DD')}</span>
    },
    {
      title: '操作',
      key: 'op',
      width: 240,
      fixed: 'right',
      render: (_, r) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Tooltip title={r.isActive ? '停用账号' : '启用账号'}>
            <Switch size="small" checked={r.isActive} onChange={v => handleToggleStatus(r, v)} />
          </Tooltip>
          {r.role !== 'ADMIN' && (
            <Popconfirm title={`确认删除用户「${r.name}」？`} onConfirm={() => handleDelete(r)} description="删除后该账号将无法登录">
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const StatBox = ({ icon, label, value, color, bg }: any) => (
    <Card size="small" bordered={false} style={{ background: bg }} styles={{ body: { padding: 14 } }}>
      <Row align="middle" gutter={12}>
        <Col span={6}><div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>{icon}</div></Col>
        <Col span={18}>
          <div style={{ color: '#666', fontSize: 12 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 600, color, lineHeight: 1.2, marginTop: 2 }}>{value}</div>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div>
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafetyOutlined style={{ color: '#1677ff' }} />
          用户与权限管理
        </h2>
        <Space>
          <Alert type="info" showIcon message="仅系统管理员可访问此页面" style={{ margin: 0 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增用户</Button>
        </Space>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <StatBox icon={<TeamOutlined />} label="用户总数" value={stats.total || total} color="#1677ff"
            bg="linear-gradient(135deg, #e6f4ff, #bae0ff)" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatBox icon={<CrownOutlined />} label="管理员" value={stats.admins || 0} color="#ff4d4f"
            bg="linear-gradient(135deg, #fff2f0, #ffccc7)" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatBox icon={<UserOutlined />} label="课程老师" value={stats.teachers || 0} color="#722ed1"
            bg="linear-gradient(135deg, #f9f0ff, #efdbff)" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatBox icon={<CheckCircleOutlined />} label="运营人员" value={stats.operators || 0} color="#52c41a"
            bg="linear-gradient(135deg, #f6ffed, #b7eb8f)" />
        </Col>
      </Row>

      <Card bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <Space>
            <Input allowClear prefix={<SearchOutlined />} placeholder="搜索姓名/账号/邮箱/手机" style={{ width: 280 }}
              value={filters.keyword} onChange={e => setFilters({ ...filters, keyword: e.target.value })} />
            <Select allowClear placeholder="角色筛选" style={{ width: 150 }} value={filters.role}
              onChange={v => setFilters({ ...filters, role: v })}
              options={[
                { label: '管理员', value: 'ADMIN' },
                { label: '课程老师', value: 'TEACHER' },
                { label: '运营人员', value: 'OPERATOR' }
              ]} />
          </Space>
          <Space>
            <Switch checkedChildren="只看启用" unCheckedChildren="全部" checked={filters.activeOnly}
              onChange={v => setFilters({ ...filters, activeOnly: v })} />
          </Space>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{
            ...pagination, total, showSizeChanger: true, showQuickJumper: true,
            showTotal: t => `共 ${t} 位用户`,
            onChange: (p, ps) => setPagination({ current: p, pageSize: ps })
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal title={editData ? '编辑用户' : '新增用户'} open={modalOpen} width={560}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditData(null); }}
        onOk={() => form.submit()} confirmLoading={submitting}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="username" label="登录账号" rules={[
                { required: true, message: '请输入账号' },
                { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: '3-20位字母/数字/下划线' }
              ]}>
                <Input placeholder="登录用账号，创建后不可修改" disabled={!!editData} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="显示姓名" rules={[{ required: true }]}>
                <Input placeholder="真实姓名或称呼" />
              </Form.Item>
            </Col>
          </Row>
          {!editData && (
            <Alert
              type="info"
              showIcon
              message="初始密码默认为 123456，用户首次登录后建议修改。如需自定义请在下方输入。"
              style={{ marginBottom: 16 }}
            />
          )}
          {!editData && (
            <Form.Item name="password" label="初始密码（可选）">
              <Input.Password placeholder="留空则使用默认密码 123456" />
            </Form.Item>
          )}
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="role" label="角色权限" rules={[{ required: true }]}>
                <Select options={[
                  {
                    label: <span><CrownOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />管理员（全部权限）</span>,
                    value: 'ADMIN'
                  },
                  {
                    label: <span><UserOutlined style={{ color: '#1677ff', marginRight: 4 }} />课程老师（营期/打卡）</span>,
                    value: 'TEACHER'
                  },
                  {
                    label: <span><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />运营人员（会员/转化/待办）</span>,
                    value: 'OPERATOR'
                  }
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="账号状态" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="启用" unCheckedChildren="停用" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="方便同事联系" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="接收通知用" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" plain style={{ margin: '8px 0 12px', fontSize: 12 }}>权限说明</Divider>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
            <div><b style={{ color: '#ff4d4f' }}>管理员：</b>所有功能权限，含用户管理、操作日志、删除数据</div>
            <div><b style={{ color: '#1677ff' }}>课程老师：</b>营期、课程、打卡台、交接班查看</div>
            <div><b style={{ color: '#52c41a' }}>运营人员：</b>会员管理、转化统计、待办中心、掉队学员、留存报表、交接班</div>
          </div>
        </Form>
      </Modal>

      <Drawer
        title={detail && (
          <Space>
            <Avatar size={44} style={{ backgroundColor: detail.role === 'ADMIN' ? '#ff4d4f' : detail.role === 'TEACHER' ? '#1677ff' : '#52c41a' }}>
              {detail.name?.charAt(0)}
            </Avatar>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{detail.name}</div>
              <div style={{ fontSize: 12, color: '#999' }}>@{detail.username}
                <Tag color={roleColor[detail.role as keyof typeof roleColor]} style={{ marginLeft: 6 }}>
                  {roleLabel[detail.role as keyof typeof roleLabel]}
                </Tag>
              </div>
            </div>
          </Space>
        )}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetail(null); setDetailLogs([]); }}
        width={640}
        extra={<Button icon={<EditOutlined />} onClick={() => openEdit(detail)}>编辑</Button>}
      >
        {detail && (
          <div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="账号">@{detail.username}</Descriptions.Item>
              <Descriptions.Item label="角色">
                <Tag color={roleColor[detail.role as keyof typeof roleColor]}>
                  {roleLabel[detail.role as keyof typeof roleLabel]}
                </Tag>
                <Tag color={detail.isActive ? 'success' : 'default'} style={{ marginLeft: 4 }}>
                  {detail.isActive ? '启用中' : '已停用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="手机号">{detail.phone || '—'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{detail.email || '—'}</Descriptions.Item>
              <Descriptions.Item label="最近登录">
                {detail.lastLoginAt
                  ? <span>{dayjs(detail.lastLoginAt).format('YYYY-MM-DD HH:mm')} <span style={{ color: '#999' }}>（{dayjs(detail.lastLoginAt).fromNow()}）</span></span>
                  : '从未登录'}
              </Descriptions.Item>
              <Descriptions.Item label="注册IP">{detail.lastLoginIp || '—'}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>{dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" plain style={{ margin: '8px 0 12px' }}>
              <HistoryOutlined /> 近期操作日志（{detailLogs.length}条）
            </Divider>
            {detailLogsLoading ? <Empty description="加载中..." /> : !detailLogs.length ? (
              <Empty description="暂无操作记录" />
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {detailLogs.map((log: any) => (
                  <Card key={log.id} size="small" bordered={false} style={{ marginBottom: 6, background: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Space size={6}>
                        <Tag color={log.action === 'CREATE' ? 'green' : log.action === 'DELETE' ? 'red' : log.action === 'CHECK_IN' ? 'cyan' : 'blue'} style={{ margin: 0, fontSize: 11 }}>
                          {log.action}
                        </Tag>
                        <Tag color="default" style={{ margin: 0, fontSize: 11 }}>{log.targetType}</Tag>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{log.targetName || log.targetId}</span>
                      </Space>
                      <span style={{ fontSize: 11, color: '#999' }}>{dayjs(log.createdAt).format('MM-DD HH:mm:ss')}</span>
                    </div>
                    {log.detail && <div style={{ fontSize: 12, color: '#666' }}>{log.detail}</div>}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
