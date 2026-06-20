import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Space, Modal, Form, Input, Select, Switch, message, Popconfirm, Drawer, Descriptions } from 'antd'
import {
  FilterOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ShareAltOutlined,
  SearchOutlined,
  ReloadOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import { filterApi } from '@/services/api'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: '系统管理员' },
  { value: 'OPERATION_LEADER', label: '运营负责人' },
  { value: 'DATA_ANALYST', label: '业务分析师' },
  { value: 'OPERATION_STAFF', label: '运营人员' },
]

const getRoleName = (code) => {
  const found = ROLE_OPTIONS.find(o => o.value === code)
  return found ? found.label : code
}

const getFilterConditions = (record) => {
  if (record && typeof record.filterConditionsMap === 'object' && record.filterConditionsMap !== null) {
    return record.filterConditionsMap
  }
  if (record && typeof record.filterConditions === 'object' && record.filterConditions !== null) {
    return record.filterConditions
  }
  if (typeof record?.filterConditions === 'string') {
    try {
      return JSON.parse(record.filterConditions)
    } catch (_) {
      return {}
    }
  }
  return {}
}

export default function FilterTemplates() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [detailVisible, setDetailVisible] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [shareVisible, setShareVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [form] = Form.useForm()
  const [shareForm] = Form.useForm()
  const [filters, setFilters] = useState({})
  const [searchForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current - 1,
        size: pagination.pageSize,
        ...filters,
      }
      const result = await filterApi.getList(params)
      setData(result?.content || result || [])
      setTotal(result?.totalElements || result?.length || 0)
    } catch (error) {
      console.error('加载筛选模板失败', error)
    } finally {
      setLoading(false)
    }
  }

  const getPageText = (pageCode) => {
    const pageMap = {
      anomaly_list: '异常列表',
      approval_list: '审批列表',
      report_efficiency: '报表效率',
      dashboard: '数据看板',
    }
    return pageMap[pageCode] || pageCode
  }

  const handleViewDetail = async (record) => {
    try {
      const detail = await filterApi.getDetail(record.id)
      setCurrentRecord(detail)
      setDetailVisible(true)
    } catch (error) {
      console.error('获取模板详情失败', error)
    }
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ isPublic: false })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    const cond = getFilterConditions(record)
    form.setFieldsValue({
      ...record,
      filterConditions: JSON.stringify(cond, null, 2),
    })
    setModalVisible(true)
  }

  const handleRename = (record) => {
    Modal.confirm({
      title: '重命名模板',
      content: (
        <Form layout="vertical">
          <Form.Item label="模板名称" required>
            <Input defaultValue={record.templateName} id="renameInput" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const newName = document.getElementById('renameInput')?.value
        if (newName && newName.trim()) {
          try {
            await filterApi.rename(record.id, newName.trim())
            message.success('重命名成功')
            loadData()
          } catch (error) {
            console.error('重命名失败', error)
          }
        }
      },
    })
  }

  const handleShare = (record) => {
    setCurrentRecord(record)
    shareForm.resetFields()
    shareForm.setFieldsValue({
      roleCodes: Array.isArray(record.sharedRoles) ? record.sharedRoles : [],
    })
    setShareVisible(true)
  }

  const handleShareSubmit = async (values) => {
    try {
      await filterApi.share(currentRecord.id, values.roleCodes || [])
      message.success('分享成功')
      setShareVisible(false)
      loadData()
    } catch (error) {
      console.error('分享失败', error)
    }
  }

  const handleDelete = async (id) => {
    try {
      await filterApi.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      console.error('删除失败', error)
    }
  }

  const handleSubmit = async (values) => {
    try {
      const condStr = values.filterConditions || '{}'
      let condObj
      try {
        condObj = JSON.parse(condStr)
      } catch (_) {
        condObj = {}
      }
      const submitData = {
        templateName: values.templateName,
        pageCode: values.pageCode,
        description: values.description,
        isPublic: values.isPublic,
        filterConditions: condObj,
        filterConditionsMap: condObj,
      }
      if (editingRecord) {
        await filterApi.update(editingRecord.id, submitData)
        message.success('更新成功')
      } else {
        await filterApi.create(submitData)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (error) {
      console.error('提交失败', error)
      message.error('JSON格式错误或提交失败')
    }
  }

  const handleSearch = (values) => {
    setFilters(values)
    setPagination({ ...pagination, current: 1 })
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({})
    setPagination({ ...pagination, current: 1 })
  }

  const handleCopy = async (record) => {
    try {
      const cond = getFilterConditions(record)
      const newTemplate = {
        templateName: `${record.templateName} - 副本`,
        pageCode: record.pageCode,
        pageName: record.pageName,
        description: record.description,
        isPublic: false,
        sharedRoles: [],
        filterConditions: cond,
        filterConditionsMap: cond,
      }
      await filterApi.create(newTemplate)
      message.success('复制成功')
      loadData()
    } catch (error) {
      console.error('复制失败', error)
    }
  }

  const renderSharedRoles = (roles) => {
    if (!Array.isArray(roles) || roles.length === 0) return '-'
    return (
      <Space wrap>
        {roles.slice(0, 3).map((role, i) => (
          <Tag key={i} color="geekblue">{getRoleName(role)}</Tag>
        ))}
        {roles.length > 3 && <Tag>+{roles.length - 3}</Tag>}
      </Space>
    )
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '模板名称',
      dataIndex: 'templateName',
      key: 'templateName',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '所属页面',
      dataIndex: 'pageCode',
      key: 'pageCode',
      render: (text) => <Tag color="blue">{getPageText(text)}</Tag>,
      filters: [
        { text: '异常列表', value: 'anomaly_list' },
        { text: '审批列表', value: 'approval_list' },
        { text: '报表效率', value: 'report_efficiency' },
        { text: '数据看板', value: 'dashboard' },
      ],
      onFilter: (value, record) => record.pageCode === value,
    },
    {
      title: '创建人',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => text || record.userName || record.createdBy || '-',
    },
    {
      title: '是否公开',
      dataIndex: 'isPublic',
      key: 'isPublic',
      render: (text) => (
        <Tag color={text ? 'green' : 'default'}>
          {text ? '公开' : '私有'}
        </Tag>
      ),
    },
    {
      title: '共享角色',
      dataIndex: 'sharedRoles',
      key: 'sharedRoles',
      render: renderSharedRoles,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(record)}
          >
            复制
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ShareAltOutlined />}
            onClick={() => handleShare(record)}
          >
            分享
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleRename(record)}
          >
            重命名
          </Button>
          <Popconfirm
            title="确定要删除这个模板吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
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
      <Card
        title={
          <Space>
            <FilterOutlined />
            筛选模板管理
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建模板
            </Button>
          </Space>
        }
      >
        <Form form={searchForm} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
          <Form.Item name="templateName" label="模板名称">
            <Input placeholder="请输入" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="pageCode" label="所属页面">
            <Select placeholder="请选择" allowClear style={{ width: 150 }}>
              <Option value="anomaly_list">异常列表</Option>
              <Option value="approval_list">审批列表</Option>
              <Option value="report_efficiency">报表效率</Option>
              <Option value="dashboard">数据看板</Option>
            </Select>
          </Form.Item>
          <Form.Item name="isPublic" label="是否公开">
            <Select placeholder="请选择" allowClear style={{ width: 120 }}>
              <Option value={true}>公开</Option>
              <Option value={false}>私有</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
          }}
        />
      </Card>

      <Drawer
        title="模板详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{currentRecord.id}</Descriptions.Item>
            <Descriptions.Item label="模板名称">{currentRecord.templateName}</Descriptions.Item>
            <Descriptions.Item label="所属页面">
              <Tag color="blue">{getPageText(currentRecord.pageCode)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建人">
              {currentRecord.username || currentRecord.userName || currentRecord.createdBy || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="是否公开">
              <Tag color={currentRecord.isPublic ? 'green' : 'default'}>
                {currentRecord.isPublic ? '公开' : '私有'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="共享角色">
              {Array.isArray(currentRecord.sharedRoles) && currentRecord.sharedRoles.length > 0
                ? currentRecord.sharedRoles.map(getRoleName).join(', ')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="筛选条件">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(getFilterConditions(currentRecord), null, 2)}
              </pre>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {currentRecord.createdAt ? dayjs(currentRecord.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {currentRecord.updatedAt ? dayjs(currentRecord.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      <Modal
        title={editingRecord ? '编辑模板' : '新建模板'}
        width={600}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="templateName"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>
          <Form.Item
            name="pageCode"
            label="所属页面"
            rules={[{ required: true, message: '请选择所属页面' }]}
          >
            <Select>
              <Option value="anomaly_list">异常列表</Option>
              <Option value="approval_list">审批列表</Option>
              <Option value="report_efficiency">报表效率</Option>
              <Option value="dashboard">数据看板</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="filterConditions"
            label="筛选条件（JSON格式）"
            rules={[{ required: true, message: '请输入筛选条件' }]}
          >
            <TextArea rows={6} placeholder='例如：{"metricName": "日活用户", "severity": "HIGH"}' />
          </Form.Item>
          <Form.Item name="isPublic" label="是否公开" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            name="description"
            label="模板说明"
          >
            <TextArea rows={2} placeholder="请输入模板说明（可选）" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRecord ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分享模板"
        open={shareVisible}
        onCancel={() => setShareVisible(false)}
        footer={null}
      >
        <Form form={shareForm} layout="vertical" onFinish={handleShareSubmit}>
          <Form.Item label="模板名称">
            <Input value={currentRecord?.templateName} disabled />
          </Form.Item>
          <Form.Item
            name="roleCodes"
            label="共享给角色"
          >
            <Select
              mode="multiple"
              placeholder="请选择要共享的角色"
              style={{ width: '100%' }}
            >
              {ROLE_OPTIONS.map(o => (
                <Option key={o.value} value={o.value}>{o.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认分享
              </Button>
              <Button onClick={() => setShareVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
