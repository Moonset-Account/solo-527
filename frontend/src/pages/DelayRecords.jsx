import React, { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Select,
  Form,
  Button,
  Space,
  Input,
  Tag,
  message,
} from 'antd'
import { SearchOutlined, ReloadOutlined, ExportOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { delayApi, departmentApi, exportApi } from '../api'

const { Option } = Select

const DelayRecords = () => {
  const [form] = Form.useForm()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    fetchDepartments()
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

  const fetchData = async () => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const params = {
        ...values,
        responsibleDeptIds: values.responsibleDeptIds,
      }

      const result = await delayApi.search(
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
      console.error('获取延期记录失败:', error)
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
    setPagination({ current: 1, pageSize: 20, total: 0 })
    setTimeout(fetchData, 0)
  }

  const getDeptName = (deptId) => {
    const dept = departments.find((d) => d.id === deptId)
    return dept?.deptName || '-'
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '需求ID',
      dataIndex: 'requirementId',
      key: 'requirementId',
      width: 90,
    },
    {
      title: '所属部门',
      dataIndex: 'deptId',
      key: 'deptId',
      width: 120,
      render: (deptId) => getDeptName(deptId),
    },
    {
      title: '责任部门',
      dataIndex: 'responsibleDeptId',
      key: 'responsibleDeptId',
      width: 120,
      render: (deptId) => (
        <Tag color="orange">{getDeptName(deptId)}</Tag>
      ),
    },
    {
      title: '延期天数',
      dataIndex: 'delayDays',
      key: 'delayDays',
      width: 100,
      render: (days) => (
        <Tag color="red">{days} 天</Tag>
      ),
    },
    {
      title: '延期原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '原日期',
      dataIndex: 'originalDate',
      key: 'originalDate',
      width: 120,
    },
    {
      title: '新日期',
      dataIndex: 'newDate',
      key: 'newDate',
      width: 120,
    },
    {
      title: '操作人ID',
      dataIndex: 'operatorId',
      key: 'operatorId',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      sorter: true,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ]

  const handleBatchQuery = async (deptIds) => {
    if (!deptIds || deptIds.length === 0) {
      message.warning('请选择责任部门')
      return
    }
    try {
      const result = await delayApi.getBatch(deptIds)
      setData(result)
      setPagination({
        current: 1,
        pageSize: result.length,
        total: result.length,
      })
    } catch (error) {
      console.error('批量查询失败:', error)
    }
  }

  return (
    <div className="page-container">
      <div className="table-toolbar">
        <h2 className="page-title" style={{ margin: 0 }}>
          延期记录
        </h2>
        <Space>
          <Button icon={<ExportOutlined />}>导出</Button>
        </Space>
      </div>

      <Form form={form} layout="inline" className="filter-bar">
        <Form.Item name="keyword" label="关键词">
          <Input
            placeholder="搜索延期原因"
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Form.Item>
        <Form.Item name="deptId" label="所属部门">
          <Select placeholder="全部部门" style={{ width: 140 }} allowClear>
            {departments.map((dept) => (
              <Option key={dept.id} value={dept.id}>
                {dept.deptName}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="responsibleDeptIds" label="责任部门">
          <Select
            mode="multiple"
            placeholder="选择责任部门（批量）"
            style={{ width: 250 }}
            allowClear
          >
            {departments.map((dept) => (
              <Option key={dept.id} value={dept.id}>
                {dept.deptName}
              </Option>
            ))}
          </Select>
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
        onChange={(pag) => {
          setPagination(pag)
          setTimeout(fetchData, 0)
        }}
        scroll={{ x: 1200 }}
      />
    </div>
  )
}

export default DelayRecords
