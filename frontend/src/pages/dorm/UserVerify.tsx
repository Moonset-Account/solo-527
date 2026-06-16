import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Button, Space, Avatar, message, Modal, Descriptions,
  Select, Input,
} from 'antd'
import { UserOutlined, CheckOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from '@/utils/request'

export default function UserVerify() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [params, setParams] = useState<any>({ is_verified: 'false' })
  const [detailOpen, setDetailOpen] = useState(false)
  const [current, setCurrent] = useState<any>(null)

  const fetchList = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/users/', { params: { page, ...params } })
      setList(data.results)
      setTotal(data.count)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [page, params])

  const handleVerify = async (record: any, pass: boolean) => {
    try {
      await axios.post(`/api/users/${record.id}/verify/`, {
        is_verified: pass,
        remark: pass ? '审核通过' : '审核未通过',
      })
      message.success(pass ? '已通过审核' : '已拒绝')
      fetchList()
    } catch {}
  }

  const viewDetail = (record: any) => {
    setCurrent(record)
    setDetailOpen(true)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '用户', dataIndex: 'avatar', width: 140,
      render: (_: any, r: any) => (
        <Space>
          <Avatar src={r.avatar} icon={!r.avatar && <UserOutlined />} />
          <div>
            <div style={{ fontWeight: 600 }}>{r.real_name || r.username}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{r.username}</div>
          </div>
        </Space>
      ),
    },
    { title: '学号/工号', dataIndex: 'student_id', width: 140 },
    { title: '角色', dataIndex: 'role_display', width: 100, render: (v: string) => <Tag>{v}</Tag> },
    { title: '手机', dataIndex: 'phone', width: 130 },
    { title: '宿舍', dataIndex: 'dorm_building', width: 120, render: (b: string, r: any) => `${b}-${r.dorm_room}` },
    { title: '注册时间', dataIndex: 'date_joined', width: 170, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '状态', dataIndex: 'is_verified', width: 100,
      render: (v: boolean) => <Tag color={v ? 'green' : v === false ? 'orange' : 'default'}>
        {v ? '已认证' : '待审核'}
      </Tag>,
    },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right',
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" onClick={() => viewDetail(r)}>详情</Button>
          {!r.is_verified && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleVerify(r, true)}>
                通过
              </Button>
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleVerify(r, false)}>
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="认证状态" allowClear style={{ width: 140 }}
            value={params.is_verified}
            options={[
              { value: 'false', label: '待审核' },
              { value: 'true', label: '已认证' },
            ]}
            onChange={(v) => setParams((p: any) => ({ ...p, is_verified: v }))}
          />
          <Select
            placeholder="角色" allowClear style={{ width: 140 }}
            options={[
              { value: 'student', label: '学生' },
              { value: 'dorm_manager', label: '宿管老师' },
              { value: 'maintenance', label: '维修人员' },
            ]}
            onChange={(v) => setParams((p: any) => ({ ...p, role: v }))}
          />
          <Input
            allowClear placeholder="搜索姓名/学号" prefix={<SearchOutlined />} style={{ width: 220 }}
            onPressEnter={(e: any) => setParams((p: any) => ({ ...p, search: e.target.value }))}
          />
        </Space>
      </Card>

      <Card title="身份审核列表">
        <Table
          rowKey="id" loading={loading} dataSource={list} columns={columns} scroll={{ x: 1200 }}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
        />
      </Card>

      <Modal
        title="用户详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={current && !current.is_verified ? (
          <Space>
            <Button danger onClick={() => { handleVerify(current, false); setDetailOpen(false) }}>拒绝</Button>
            <Button type="primary" onClick={() => { handleVerify(current, true); setDetailOpen(false) }}>通过审核</Button>
          </Space>
        ) : null}
      >
        {current && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="头像">
              <Avatar size={64} src={current.avatar} icon={!current.avatar && <UserOutlined />} />
            </Descriptions.Item>
            <Descriptions.Item label="用户名">{current.username}</Descriptions.Item>
            <Descriptions.Item label="真实姓名">{current.real_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="学号/工号">{current.student_id || '-'}</Descriptions.Item>
            <Descriptions.Item label="角色">{current.role_display}</Descriptions.Item>
            <Descriptions.Item label="手机号">{current.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{current.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="宿舍楼">{current.dorm_building || '-'}</Descriptions.Item>
            <Descriptions.Item label="宿舍号">{current.dorm_room || '-'}</Descriptions.Item>
            <Descriptions.Item label="注册时间">{dayjs(current.date_joined).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="认证状态">
              <Tag color={current.is_verified ? 'green' : 'orange'}>
                {current.is_verified ? '已认证' : '待审核'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
