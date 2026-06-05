import { useEffect, useState } from 'react'
import { Table, Tag, Typography, Card, Avatar, Rate } from 'antd'
import { UserOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function CoachList() {
  const [coaches, setCoaches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setCoaches([
      { id: 1, name: '张教练', phone: '138****0001', specialty: '增肌、力量训练', active: true, level: '高级教练' },
      { id: 2, name: '李教练', phone: '138****0002', specialty: '减脂、普拉提', active: true, level: '中级教练' },
      { id: 3, name: '王教练', phone: '138****0003', specialty: '瑜伽、康复', active: false, level: '初级教练' },
    ])
  }, [])

  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      render: () => (
        <Avatar size={40} icon={<UserOutlined />} />
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
    },
    {
      title: '专长',
      dataIndex: 'specialty',
      key: 'specialty',
    },
    {
      title: '状态',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>{active ? '在职' : '离职'}</Tag>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        教练管理
      </Title>

      <Card>
        <Table
          columns={columns}
          dataSource={coaches}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}
