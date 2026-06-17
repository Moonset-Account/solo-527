import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Form,
  Space,
  Tag,
  Modal,
  message,
  Popconfirm,
  DatePicker,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ExportOutlined,
  ReloadOutlined,
  EyeOutlined,
  MergeCellsOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { requirementApi, exportApi, departmentApi, authApi } from '../api'

const { RangePicker } = DatePicker
const { Option } = Select

const statusMap = {
  DRAFT: { text: '草稿', color: 'default' },
  SUBMITTED: { text: '已提交', color: 'blue' },
  IN_PROGRESS: { text: '进行中', color: 'processing' },
  APPROVED: { text: '已通过', color: 'success' },
  REJECTED: { text: '已驳回', color: 'error' },
  MERGED: { text: '已合并', color: 'purple' },
  CLOSED: { text: '已关闭', color: 'default' },
}

const priorityMap = {
  1: { text: '最高', color: 'red' },
  2: { text: '高', color: 'orange' },
  3: { text: '中', color: 'blue' },
  4: { text: '低', color: 'green' },
  5: { text: '最低', color: 'default' },
}

const RequirementList = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [sortInfo, setSortInfo] = useState({
    sortBy: 'createdAt',
    sortDirection: 'desc',
  })
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [mergeModalVisible, setMergeModalVisible] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState(null)
  const [duplicateList, setDuplicateList] = useState([])

  useEffect(() => {
    fetchDepartments()
    fetchUsers()
    fetchData()
  }, [])

  const fetchDepartments = async () => {
    try {
      const result = await departmentApi.getAll()
      setDepartments(result)
    } catch (error) {
      console.error('获取部门列表失败:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const result = await authApi.getUsers()
      setUsers(result)
    } catch (error) {
      console.error('获取用户列表失败:', error)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const params = {
        ...values,
        sortBy: sortInfo.sortBy,
        sortDirection: sortInfo.sortDirection,
        startDate: values.dateRange?.[0]?.toISOString(),
        endDate: values.dateRange?.[1]?.toISOString(),
      }
      delete params.dateRange

      const result = await requirementApi.search(
        params,
        pagination.current - 1,
        pagination.pageSize
      )
      setData(result.content)
      setPagination({
        ...pagination,
        total: result.totalElements,
      })
    } catch (error) {
      console.error('获取需求列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    setTimeout(fetchData, 0)
  }

  const handleReset = () => {
    form.resetFields()
    setSortInfo({ sortBy: 'createdAt', sortDirection: 'desc' })
    setPagination({ current: 1, pageSize: 20, total: 0 })
    setTimeout(fetchData, 0)
  }

  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter.field) {
      setSortInfo({
        sortBy: sorter.field,
        sortDirection: sorter.order === 'ascend' ? 'asc' : 'desc',
      })
    }
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total,
    })
    setTimeout(fetchData, 0)
  }

  const handleExport = async () => {
    try {
      const values = form.getFieldsValue()
      const params = {
        keyword: values.keyword || undefined,
        status: values.status || undefined,
        deptId: values.deptId || undefined,
        priority: values.priority || undefined,
        category: values.category || undefined,
        startDate: values.dateRange?.[0]?.startOf('day')?.toISOString() || undefined,
        endDate: values.dateRange?.[1]?.endOf('day')?.toISOString() || undefined,
        sortBy: sortInfo.sortBy,
        sortDirection: sortInfo.sortDirection,
      }

      const dupCheck = await exportApi.checkDuplicate(params)
      if (dupCheck.hasExported) {
        Modal.confirm({
          title: '导出去重提醒',
          content: `该筛选条件的数据已于 ${dupCheck.exportInfo || '之前'} 导出过，是否继续导出？`,
          okText: '仍然导出',
          cancelText: '取消',
          onOk: () => doExport(params, false),
        })
        return
      }

      await doExport(params, true)
    } catch (error) {
      console.error('导出检查失败:', error)
    }
  }

  const doExport = async (params, checkDuplicate) => {
    try {
      const blob = await exportApi.exportRequirements(params, checkDuplicate)
      if (!blob || blob.size === 0) {
        message.error('导出数据为空')
        return
      }
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `需求导出_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      console.error('导出失败:', error)
      message.error('导出失败，请重试')
    }
  }

  const handleMerge = async (record) => {
    setSelectedRequirement(record)
    try {
      const result = await requirementApi.getDuplicates(record.id)
      setDuplicateList(result)
    } catch (error) {
      console.error('获取重复需求失败:', error)
    }
    setMergeModalVisible(true)
  }

  const confirmMerge = async (targetId) => {
    try {
      await requirementApi.merge(selectedRequirement.id, targetId)
      message.success('合并成功')
      setMergeModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('合并失败:', error)
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: true,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <a onClick={() => navigate(`/requirements/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      sorter: true,
      render: (priority) => {
        const p = priorityMap[priority] || priorityMap[3]
        return <Tag color={p.color}>{p.text}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const s = statusMap[status] || statusMap.DRAFT
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    {
      title: '部门',
      dataIndex: 'deptId',
      key: 'deptId',
      width: 120,
      render: (deptId) => {
        const dept = departments.find((d) => d.id === deptId)
        return dept?.deptName || '-'
      },
    },
    {
      title: '负责人',
      dataIndex: 'assigneeId',
      key: 'assigneeId',
      width: 100,
      render: (assigneeId) => {
        const user = users.find((u) => u.id === assigneeId)
        return user?.realName || '-'
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      sorter: true,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '预期完成',
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      width: 110,
      sorter: true,
      render: (date) => date || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/requirements/${record.id}`)}
          >
            查看
          </Button>
          {record.status === 'DRAFT' && (
            <Button
              type="link"
              size="small"
              icon={<MergeCellsOutlined />}
              onClick={() => handleMerge(record)}
            >
              合并
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="table-toolbar">
        <h2 className="page-title" style={{ margin: 0 }}>
          需求管理
        </h2>
        <Space>
          <Button icon={<PlusOutlined />} type="primary" onClick={() => navigate('/requirements/create')}>
            新建需求
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      </div>

      <Form form={form} layout="inline" className="filter-bar">
        <Form.Item name="keyword" label="关键词">
          <Input
            placeholder="搜索标题/描述"
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select placeholder="全部状态" style={{ width: 140 }} allowClear>
            {Object.entries(statusMap).map(([key, val]) => (
              <Option key={key} value={key}>
                {val.text}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="deptId" label="部门">
          <Select placeholder="全部部门" style={{ width: 140 }} allowClear>
            {departments.map((dept) => (
              <Option key={dept.id} value={dept.id}>
                {dept.deptName}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="priority" label="优先级">
          <Select placeholder="全部优先级" style={{ width: 120 }} allowClear>
            {Object.entries(priorityMap).map(([key, val]) => (
              <Option key={key} value={parseInt(key)}>
                {val.text}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="dateRange" label="创建时间">
          <RangePicker />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="选择要合并到的需求"
        open={mergeModalVisible}
        onCancel={() => setMergeModalVisible(false)}
        footer={null}
        width={600}
      >
        {duplicateList.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>暂无相似需求</p>
        ) : (
          <div>
            <p style={{ marginBottom: 16 }}>找到以下相似需求，选择合并目标：</p>
            {duplicateList.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: 12,
                  border: '1px solid #e8e8e8',
                  borderRadius: 4,
                  marginBottom: 8,
                  cursor: 'pointer',
                }}
                onClick={() => confirmMerge(item.id)}
              >
                <div style={{ fontWeight: 500 }}>{item.title}</div>
                <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                  ID: {item.id} | 状态: {statusMap[item.status]?.text} | 创建时间:{' '}
                  {dayjs(item.createdAt).format('YYYY-MM-DD')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default RequirementList
