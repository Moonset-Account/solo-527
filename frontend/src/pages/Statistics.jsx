import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Select,
  Button,
  Space,
  Statistic,
  message,
  Tag,
} from 'antd'
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { statisticsApi, departmentApi } from '../api'

const { Option } = Select

const Statistics = () => {
  const [overview, setOverview] = useState(null)
  const [deptStats, setDeptStats] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedDepts, setSelectedDepts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDepartments()
    fetchOverview()
  }, [])

  const fetchDepartments = async () => {
    try {
      const result = await departmentApi.getAll()
      setDepartments(result)
    } catch (error) {
      console.error('获取部门列表失败:', error)
    }
  }

  const fetchOverview = async () => {
    try {
      const result = await statisticsApi.getOverview()
      setOverview(result)
    } catch (error) {
      console.error('获取概览数据失败:', error)
    }
  }

  const fetchBatchStats = async () => {
    if (selectedDepts.length === 0) {
      message.warning('请选择至少一个部门')
      return
    }
    setLoading(true)
    try {
      const result = await statisticsApi.getDeptStatsBatch(selectedDepts)
      setDeptStats(result)
    } catch (error) {
      console.error('获取部门统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
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
      title: '总需求数',
      dataIndex: 'totalCount',
      key: 'totalCount',
      width: 100,
      render: (val) => val || 0,
    },
    {
      title: '已通过',
      dataIndex: 'approvedCount',
      key: 'approvedCount',
      width: 100,
      render: (val) => <Tag color="success">{val || 0}</Tag>,
    },
    {
      title: '进行中节点',
      dataIndex: 'inProgressCount',
      key: 'inProgressCount',
      width: 110,
      render: (val) => <Tag color="processing">{val || 0}</Tag>,
    },
    {
      title: '卡住节点',
      dataIndex: 'stuckCount',
      key: 'stuckCount',
      width: 100,
      render: (val) => (val && val > 0 ? <Tag color="warning">{val}</Tag> : 0),
    },
    {
      title: '平均节点处理时长',
      dataIndex: 'avgNodeDuration',
      key: 'avgNodeDuration',
      render: (val) => (val ? `${val.toFixed(2)} 小时` : '-'),
    },
  ]

  return (
    <div>
      <h2 className="page-title">协作效率统计</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="总需求数"
              value={overview?.totalRequirements || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="总节点数"
              value={overview?.totalNodes || 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="卡住节点"
              value={overview?.stuckNodes || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="已完成审批"
              value={(overview?.statusCounts && overview.statusCounts.APPROVED) || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="部门效率批量查询" className="detail-card">
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Select
              mode="multiple"
              style={{ width: 400 }}
              placeholder="选择部门（支持多选批量查询）"
              value={selectedDepts}
              onChange={setSelectedDepts}
              optionFilterProp="children"
            >
              {departments.map((dept) => (
                <Option key={dept.id} value={dept.id}>
                  {dept.deptName}
                </Option>
              ))}
            </Select>
            <Button type="primary" icon={<ReloadOutlined />} onClick={fetchBatchStats}>
              查询
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={deptStats}
          rowKey="deptId"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default Statistics
