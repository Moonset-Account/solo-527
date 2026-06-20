import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Popconfirm,
  Drawer,
  Descriptions,
  Badge,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  getLeadList,
  deleteLead,
  updateStatus,
  assignOwner,
} from '../api/lead'
import { getAllUsers } from '../api/user'
import dayjs from 'dayjs'

const { Option } = Select

const statusMap = {
  NEW: { text: '新线索', color: 'blue' },
  CONTACTED: { text: '已接触', color: 'cyan' },
  MEASURED: { text: '已量房', color: 'green' },
  QUOTED: { text: '已报价', color: 'gold' },
  NEGOTIATING: { text: '谈判中', color: 'purple' },
  DEAL: { text: '已成交', color: 'success' },
  LOST: { text: '已流失', color: 'red' },
}

const levelMap = {
  S: { text: 'S级', color: 'red' },
  A: { text: 'A级', color: 'orange' },
  B: { text: 'B级', color: 'gold' },
  C: { text: 'C级', color: 'blue' },
  D: { text: 'D级', color: 'default' },
}

const LeadList = () => {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentLead, setCurrentLead] = useState(null)
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [assignForm] = Form.useForm()

  useEffect(() => {
    loadUsers()
    loadLeads()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await getAllUsers()
      setUsers(res || [])
    } catch (e) {}
  }

  const loadLeads = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params = {
        pageNum: page,
        pageSize,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        level: levelFilter || undefined,
        ownerId: ownerFilter || undefined,
      }
      const res = await getLeadList(params)
      setData(res.records || [])
      setPagination({
        current: res.current,
        pageSize: res.size,
        total: res.total,
      })
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadLeads(1, pagination.pageSize)
  }

  const handleReset = () => {
    setKeyword('')
    setStatusFilter('')
    setLevelFilter('')
    setOwnerFilter('')
    loadLeads(1, pagination.pageSize)
  }

  const handleDelete = async (id) => {
    try {
      await deleteLead(id)
      message.success('删除成功')
      loadLeads(pagination.current, pagination.pageSize)
    } catch (e) {}
  }

  const handleAssign = async (values) => {
    try {
      await assignOwner(currentLead.id, values.ownerId)
      message.success('分配成功')
      setAssignModalVisible(false)
      loadLeads(pagination.current, pagination.pageSize)
    } catch (e) {}
  }

  const openAssignModal = (record) => {
    setCurrentLead(record)
    assignForm.setFieldsValue({ ownerId: record.ownerId })
    setAssignModalVisible(true)
  }

  const openDetailDrawer = (record) => {
    setCurrentLead(record)
    setDetailVisible(true)
  }

  const columns = [
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      width: 120,
      render: (text, record) => (
        <a onClick={() => navigate(`/leads/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '电话',
      dataIndex: 'phone',
      width: 120,
    },
    {
      title: '小区',
      dataIndex: 'community',
      width: 120,
    },
    {
      title: '房屋面积',
      dataIndex: 'houseArea',
      width: 100,
      render: (val) => val ? `${val}㎡` : '-',
    },
    {
      title: '预算',
      dataIndex: 'budgetMin',
      width: 140,
      render: (val, record) => {
        if (record.budgetMin && record.budgetMax) {
          return `¥${record.budgetMin} - ¥${record.budgetMax}`
        }
        return val ? `¥${val}` : '-'
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const info = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '等级',
      dataIndex: 'level',
      width: 80,
      render: (level) => {
        const info = levelMap[level] || { text: level, color: 'default' }
        return <Badge status={info.color} text={info.text} />
      },
    },
    {
      title: '负责人',
      dataIndex: 'ownerName',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (val) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetailDrawer(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openAssignModal(record)}>
            分配
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>线索列表</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/leads/create')}>
          新增线索
        </Button>
      </div>

      <div className="filter-bar">
        <Space wrap>
          <Input
            placeholder="搜索客户姓名/电话"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="状态"
            value={statusFilter || undefined}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            allowClear
          >
            {Object.entries(statusMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.text}</Option>
            ))}
          </Select>
          <Select
            placeholder="等级"
            value={levelFilter || undefined}
            onChange={setLevelFilter}
            style={{ width: 100 }}
            allowClear
          >
            {Object.entries(levelMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.text}</Option>
            ))}
          </Select>
          <Select
            placeholder="负责人"
            value={ownerFilter || undefined}
            onChange={setOwnerFilter}
            style={{ width: 120 }}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {users.map((user) => (
              <Option key={user.id} value={user.id}>{user.realName}</Option>
            ))}
          </Select>
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <div className="table-card">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => loadLeads(page, pageSize),
          }}
          scroll={{ x: 1200 }}
        />
      </div>

      <Drawer
        title="线索详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        extra={
          <Button type="primary" onClick={() => navigate(`/leads/${currentLead?.id}`)}>
            查看完整详情
          </Button>
        }
      >
        {currentLead && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="客户姓名">{currentLead.customerName}</Descriptions.Item>
            <Descriptions.Item label="电话">{currentLead.phone}</Descriptions.Item>
            <Descriptions.Item label="小区">{currentLead.community || '-'}</Descriptions.Item>
            <Descriptions.Item label="地址">{currentLead.address || '-'}</Descriptions.Item>
            <Descriptions.Item label="房屋类型">{currentLead.houseType || '-'}</Descriptions.Item>
            <Descriptions.Item label="房屋面积">{currentLead.houseArea ? `${currentLead.houseArea}㎡` : '-'}</Descriptions.Item>
            <Descriptions.Item label="预算范围">
              {currentLead.budgetMin && currentLead.budgetMax
                ? `¥${currentLead.budgetMin} - ¥${currentLead.budgetMax}`
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="装修风格">{currentLead.decorationStyle || '-'}</Descriptions.Item>
            <Descriptions.Item label="装修类型">{currentLead.decorationType || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {statusMap[currentLead.status]?.text || currentLead.status}
            </Descriptions.Item>
            <Descriptions.Item label="等级">
              {levelMap[currentLead.level]?.text || currentLead.level}
            </Descriptions.Item>
            <Descriptions.Item label="负责人">{currentLead.ownerName || '-'}</Descriptions.Item>
            <Descriptions.Item label="来源">{currentLead.source || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注">{currentLead.remark || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {currentLead.createdAt ? dayjs(currentLead.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      <Modal
        title="分配负责人"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
      >
        <Form form={assignForm} onFinish={handleAssign} layout="vertical">
          <Form.Item
            name="ownerId"
            label="选择负责人"
            rules={[{ required: true, message: '请选择负责人' }]}
          >
            <Select placeholder="请选择负责人">
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.realName} ({user.role})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
              <Button onClick={() => setAssignModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default LeadList
