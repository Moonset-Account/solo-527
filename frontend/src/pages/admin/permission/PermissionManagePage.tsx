import { useState, useEffect } from 'react';
import {
  Tabs, Table, Tag, Button, Space, Form, Input, Select, Switch, Modal, App as AntdApp,
  Row, Col, Tree, Card, Avatar, Tooltip, Divider,
} from 'antd';
import {
  ReloadOutlined, PlusOutlined, SaveOutlined, TeamOutlined,
  SafetyOutlined, SettingOutlined, UserOutlined, KeyOutlined,
} from '@ant-design/icons';
import { authApi } from '../../../api';
import { useAppStore } from '../../../store';
import { Role, Permission } from '../../../types';
const { Option } = Select;

const deptMap: Record<string, { label: string; color: string }> = {
  legal: { label: '法务部', color: 'blue' },
  finance: { label: '财务部', color: 'gold' },
  admin: { label: '行政部', color: 'purple' },
  business: { label: '业务部', color: 'cyan' },
  hr: { label: '人力资源', color: 'green' },
  other: { label: '其他', color: 'default' },
};

const roleCodeMap: Record<string, string> = {
  super_admin: '超级管理员',
  legal_admin: '法务管理员',
  contract_manager: '合同管理员',
  approver: '审批人',
  applicant: '申请人',
  viewer: '查看者',
};

export default function PermissionManagePage() {
  const { message } = AntdApp.useApp();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [userModal, setUserModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userForm] = Form.useForm();
  const [roleModal, setRoleModal] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [rolePermIds, setRolePermIds] = useState<string[]>([]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await authApi.listUsers(keyword) as any;
      setUsers(res.list || []);
    } finally { setLoading(false); }
  };

  const loadRoles = async () => {
    const res = await authApi.listRoles() as unknown as Role[];
    setRoles(res || []);
  };

  const loadPermissions = async () => {
    const res = await authApi.listPermissions() as unknown as Permission[];
    setPermissions(res || []);
  };

  useEffect(() => { loadUsers(); loadRoles(); loadPermissions(); }, [keyword]);

  const openUserRoleModal = (u: any) => {
    setCurrentUser(u);
    userForm.resetFields();
    userForm.setFieldsValue({
      roleIds: u.roles?.map((r: any) => r.id) || [],
    });
    setUserModal(true);
  };

  const handleSaveUserRoles = async () => {
    try {
      const { roleIds } = await userForm.validateFields();
      await authApi.assignRoles(currentUser.id, roleIds);
      message.success('角色分配成功');
      setUserModal(false);
      loadUsers();
    } catch (e: any) { message.error(e.message); }
  };

  const openRolePermModal = async (r: Role) => {
    setCurrentRole(r);
    try {
      const perms = await authApi.listPermissions() as any;
      setPermissions(perms);
      const userPerms: any = [];
      const existingPerms: any = [];
      setRolePermIds(existingPerms);
    } catch {}
    setRoleModal(true);
  };

  const handleSaveRolePerms = async () => {
    if (!currentRole) return;
    try {
      await authApi.assignPermissions(currentRole.id, rolePermIds);
      message.success('权限分配成功');
      setRoleModal(false);
    } catch (e: any) { message.error(e.message); }
  };

  const permTreeData = permissions.reduce((acc: any[], p) => {
    const moduleIdx = acc.findIndex(x => x.key === 'module_' + p.module);
    if (moduleIdx === -1) {
      acc.push({
        key: 'module_' + p.module,
        title: <b style={{ color: '#1677ff' }}>{p.module}模块</b>,
        children: [{ key: p.id, title: `${p.name} <code style="background:#f5f5f5;padding:0 4px;">${p.code}</code>` }],
      });
    } else {
      acc[moduleIdx].children.push({
        key: p.id,
        title: <span>{p.name} <code style={{ background: '#f5f5f5', padding: '0 4px', fontSize: 12 }}>{p.code}</code></span>,
      });
    }
    return acc;
  }, []);

  const userColumns = [
    {
      title: '用户', width: 180,
      render: (_: any, r: any) => (
        <Space>
          <Avatar style={{ background: '#1677ff' }}>
            {r.realName?.[0] || r.username?.[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{r.realName}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>@{r.username}</div>
          </div>
        </Space>
      ),
    },
    { title: '部门', dataIndex: 'department', width: 120,
      render: (v) => <Tag color={(deptMap[v] || deptMap.other).color}>{(deptMap[v] || deptMap.other).label}</Tag>,
    },
    { title: '邮箱', dataIndex: 'email', width: 200 },
    { title: '手机', dataIndex: 'phone', width: 140 },
    {
      title: '角色', width: 300,
      render: (_: any, r: any) => r.roles?.length ? (
        <Space wrap>
          {r.roles.map((r: any) => (
            <Tag key={r.id} color="blue">{roleCodeMap[r.code] || r.code || r.name}</Tag>
          ))}
        </Space>
      ) : <Tag color="default">无角色</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v) => v === 'active' ? <Tag color="success">正常</Tag> : <Tag color="red">已禁用</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 170, render: (v: string) => new Date(v).toLocaleString('zh-CN') },
    {
      title: '操作', width: 120, fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Button type="link" size="small" icon={<SafetyOutlined />} onClick={() => openUserRoleModal(r)}>
          分配角色
        </Button>
      ),
    },
  ];

  const roleColumns = [
    { title: '角色编码', dataIndex: 'code', width: 180, render: (v) => <code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>{v}</code> },
    { title: '角色名称', dataIndex: 'name', width: 160, render: (v, r: any) => <b>{roleCodeMap[r.code] || v}</b> },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '排序', dataIndex: 'sort', width: 80 },
    {
      title: '状态', dataIndex: 'enabled', width: 100,
      render: (v) => v ? <Tag color="success">启用</Tag> : <Tag color="default">停用</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 170, render: (v: string) => new Date(v).toLocaleString('zh-CN') },
    {
      title: '操作', width: 180, fixed: 'right' as const,
      render: (_: any, r: Role) => (
        <Space>
          <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => openRolePermModal(r)}>分配权限</Button>
          <Button type="link" size="small">编辑</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-title">
        <span>权限管理</span>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { loadUsers(); loadRoles(); loadPermissions(); }}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />}>新建角色</Button>
        </Space>
      </div>

      <div className="page-container">
        <Input.Search
          placeholder="搜索用户名/姓名/手机"
          allowClear
          style={{ width: 320, marginBottom: 16 }}
          onSearch={setKeyword}
          onChange={(e) => !e.target.value && setKeyword('')}
        />

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'users',
              label: <span><TeamOutlined /> 用户管理 ({users.length})</span>,
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  columns={userColumns}
                  dataSource={users}
                  scroll={{ x: 1200 }}
                  pagination={{ pageSize: 20, showSizeChanger: true }}
                />
              ),
            },
            {
              key: 'roles',
              label: <span><SafetyOutlined /> 角色管理 ({roles.length})</span>,
              children: (
                <Table
                  rowKey="id"
                  columns={roleColumns}
                  dataSource={roles}
                  scroll={{ x: 1100 }}
                  pagination={{ pageSize: 20, showSizeChanger: true }}
                />
              ),
            },
            {
              key: 'perms',
              label: <span><KeyOutlined /> 权限列表 ({permissions.length})</span>,
              children: (
                <Row gutter={16}>
                  {Array.from(new Set(permissions.map(p => p.module))).map((mod) => {
                    const modPerms = permissions.filter(p => p.module === mod);
                    return (
                      <Col xs={24} md={12} lg={8} key={mod}>
                        <Card size="small" style={{ marginBottom: 16 }}
                          title={<><SettingOutlined style={{ color: '#1677ff' }} /> {mod}模块 <Tag>{modPerms.length}项权限</Tag></>}
                        >
                          <Space wrap>
                            {modPerms.map(p => (
                              <Tooltip key={p.id} title={p.description || p.name}>
                                <Tag color="blue" style={{ marginBottom: 4 }}>
                                  <code>{p.code}</code>
                                  <span style={{ marginLeft: 6 }}>{p.name}</span>
                                </Tag>
                              </Tooltip>
                            ))}
                          </Space>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title={`分配角色 - ${currentUser?.realName || ''}`}
        open={userModal}
        onOk={handleSaveUserRoles}
        onCancel={() => setUserModal(false)}
        okText="保存"
        destroyOnClose
      >
        <Form form={userForm} layout="vertical">
          <Form.Item name="roleIds" label="选择角色" rules={[{ required: true, message: '至少选择一个角色' }]}>
            <Select mode="multiple" placeholder="选择一个或多个角色" style={{ width: '100%' }}>
              {roles.map((r) => (
                <Option key={r.id} value={r.id}>{roleCodeMap[r.code] || r.name} ({r.code})</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`分配权限 - ${roleCodeMap[currentRole?.code || ''] || currentRole?.name || ''}`}
        open={roleModal}
        onOk={handleSaveRolePerms}
        onCancel={() => setRoleModal(false)}
        okText="保存"
        width={680}
        destroyOnClose
      >
        <div style={{ marginBottom: 12 }}>
          <Space>
            <Button size="small" onClick={() => setRolePermIds(permissions.map(p => p.id))}>全选</Button>
            <Button size="small" onClick={() => setRolePermIds([])}>清空</Button>
            <span style={{ color: '#8c8c8c' }}>已选 {rolePermIds.length} / {permissions.length}</span>
          </Space>
        </div>
        <Divider />
        <Tree
          checkable
          selectable={false}
          expandedKeys={permTreeData.map(x => x.key)}
          treeData={permTreeData}
          checkedKeys={rolePermIds as any}
          onCheck={(keys: any) => {
            const checked = Array.isArray(keys) ? keys : keys.checked;
            setRolePermIds(checked.filter(k => typeof k === 'string' && !k.startsWith('module_')) as string[]);
          }}
          style={{ maxHeight: 500, overflowY: 'auto' }}
        />
      </Modal>
    </div>
  );
}
