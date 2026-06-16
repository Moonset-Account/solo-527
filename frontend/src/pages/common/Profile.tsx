import { useState } from 'react'
import { Card, Form, Input, Button, Avatar, message, Descriptions, Space } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store/auth'
import axios from '@/utils/request'

export default function Profile() {
  const { user, fetchUser } = useAuthStore()
  const [form] = Form.useForm()
  const [pwdForm] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (values: any) => {
    setLoading(true)
    try {
      await axios.patch(`/api/users/${user?.id}/`, values)
      await fetchUser()
      message.success('个人信息更新成功')
    } finally {
      setLoading(false)
    }
  }

  const changePwd = async (values: any) => {
    setLoading(true)
    try {
      await axios.post('/api/users/change_password/', values)
      message.success('密码修改成功')
      pwdForm.resetFields()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="个人信息">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="头像" span={2}>
            <Avatar size={80} src={user?.avatar} icon={!user?.avatar && <UserOutlined />} />
          </Descriptions.Item>
          <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
          <Descriptions.Item label="角色">{user?.role_display}</Descriptions.Item>
          <Descriptions.Item label="真实姓名">{user?.real_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="学号/工号">{user?.student_id || '-'}</Descriptions.Item>
          <Descriptions.Item label="宿舍楼">{user?.dorm_building || '-'}</Descriptions.Item>
          <Descriptions.Item label="宿舍号">{user?.dorm_room || '-'}</Descriptions.Item>
          <Descriptions.Item label="手机">{user?.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{user?.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="身份认证" span={2}>
            {user?.is_verified ? (
              <span style={{ color: '#52c41a' }}>✓ 已通过审核</span>
            ) : (
              <span style={{ color: '#faad14' }}>⟳ 待审核</span>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="编辑资料">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            real_name: user?.real_name,
            phone: user?.phone,
            dorm_building: user?.dorm_building,
            dorm_room: user?.dorm_room,
            email: user?.email,
          }}
          onFinish={onSubmit}
        >
          <Form.Item label="真实姓名" name="real_name">
            <Input />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="宿舍楼" name="dorm_building">
            <Input />
          </Form.Item>
          <Form.Item label="宿舍号" name="dorm_room">
            <Input />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>保存</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="修改密码">
        <Form form={pwdForm} layout="vertical" onFinish={changePwd}>
          <Form.Item label="原密码" name="old_password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label="新密码" name="new_password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>修改密码</Button>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  )
}
