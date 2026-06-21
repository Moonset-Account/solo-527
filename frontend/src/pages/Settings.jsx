import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Tabs, Table, message, Descriptions } from 'antd'
import { useAuthStore } from '@/store'
import { authApi, userApi, approvalApi } from '@/api/endpoints'

function Settings() {
  const { user } = useAuthStore()
  const [users, setUsers] = useState([])
  const [approvalLevels, setApprovalLevels] = useState([])
  const [flows, setFlows] = useState([])
  const [passwordForm] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    userApi.list({ page_size: 500 }).then(res => setUsers(res.data.results || res.data)).catch(() => {})
    approvalApi.levels.list().then(res => setApprovalLevels(res.data.results || res.data)).catch(() => {})
    approvalApi.flows.list().then(res => setFlows(res.data.results || res.data)).catch(() => {})
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleChangePassword = async (values) => {
    try {
      setLoading(true)
      await authApi.changePassword(values)
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (e) {
      message.error('密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">系统设置</h2>
      </div>
      <Tabs
        items={[
          {
            key: 'profile',
            label: '个人信息',
            children: (
              <Card style={{ maxWidth: 600 }}>
                <Descriptions title="个人信息" column={1} bordered>
                  <Descriptions.Item label="邮箱">{user?.email}</Descriptions.Item>
                  <Descriptions.Item label="姓名">{user?.full_name}</Descriptions.Item>
                  <Descriptions.Item label="角色">{user?.role_display}</Descriptions.Item>
                  <Descriptions.Item label="部门">{user?.department || '-'}</Descriptions.Item>
                  <Descriptions.Item label="手机号">{user?.phone || '-'}</Descriptions.Item>
                </Descriptions>

                <h3 style={{ marginTop: 24, marginBottom: 16 }}>修改密码</h3>
                <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
                  <Form.Item label="原密码" name="old_password" rules={[{ required: true, message: '请输入原密码' }]}>
                    <Input.Password />
                  </Form.Item>
                  <Form.Item label="新密码" name="new_password" rules={[{ required: true, message: '请输入新密码' }]}>
                    <Input.Password />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>修改密码</Button>
                  </Form.Item>
                </Form>
              </Card>
            )
          },
          user?.role === 'admin' && {
            key: 'users',
            label: '用户管理',
            children: (
              <Card>
                <Table
                  rowKey="id"
                  dataSource={users}
                  columns={[
                    { title: '邮箱', dataIndex: 'email', key: 'email' },
                    { title: '姓名', dataIndex: 'full_name', key: 'full_name' },
                    { title: '角色', dataIndex: 'role_display', key: 'role' },
                    { title: '部门', dataIndex: 'department', key: 'department' },
                    { title: '状态', dataIndex: 'is_active', key: 'is_active', render: v => v ? '正常' : '停用' }
                  ]}
                  pagination={{ pageSize: 20 }}
                />
              </Card>
            )
          },
          user?.role === 'admin' && {
            key: 'approval',
            label: '审批流程',
            children: (
              <Tabs
                items={[
                  {
                    key: 'levels',
                    label: '审批层级',
                    children: (
                      <Card>
                        <Table
                          rowKey="id"
                          dataSource={approvalLevels}
                          columns={[
                            { title: '层级名称', dataIndex: 'name', key: 'name' },
                            { title: '审批顺序', dataIndex: 'level_order', key: 'level_order' },
                            { title: '描述', dataIndex: 'description', key: 'description', render: v => v || '-' }
                          ]}
                          pagination={{ pageSize: 20 }}
                        />
                      </Card>
                    )
                  },
                  {
                    key: 'flows',
                    label: '审批流程',
                    children: (
                      <Card>
                        <Table
                          rowKey="id"
                          dataSource={flows}
                          columns={[
                            { title: '流程名称', dataIndex: 'name', key: 'name' },
                            { title: '流程类型', dataIndex: 'flow_type_display', key: 'flow_type' },
                            { title: '描述', dataIndex: 'description', key: 'description', render: v => v || '-' },
                            { title: '状态', dataIndex: 'is_active', key: 'is_active', render: v => v ? '启用' : '停用' }
                          ]}
                          pagination={{ pageSize: 20 }}
                          expandable={{
                            expandedRowRender: record => (
                              <Table
                                size="small"
                                rowKey="id"
                                dataSource={record.levels_with_order || []}
                                columns={[
                                  { title: '顺序', dataIndex: 'order', key: 'order' },
                                  { title: '层级名称', dataIndex: 'level_name', key: 'level_name' },
                                  { title: '审批人', dataIndex: 'required_approvers_info', key: 'approvers',
                                    render: v => v?.map(a => a.full_name || a.email).join(', ') || '-'
                                  }
                                ]}
                                pagination={false}
                              />
                            )
                          }}
                        />
                      </Card>
                    )
                  }
                ]}
              />
            )
          }
        ].filter(Boolean)}
      />
    </div>
  )
}

export default Settings
