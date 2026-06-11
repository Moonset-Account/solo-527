import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Form,
  Select,
  Input,
  Modal,
  message,
  Popconfirm,
  Empty,
  Spin,
  Descriptions,
  InputNumber,
  Checkbox,
  Row,
  Col,
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  HistoryOutlined,
  SearchOutlined,
  RollbackOutlined,
  DiffOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { mockPromptApi as promptApi } from '@/api'
import type { PromptItem, PromptStatus, PromptVersionHistory } from '@/types/api'
import { formatDate } from '@/utils'

const { TextArea } = Input
const { Option } = Select
const { confirm } = Modal

const statusMap: Record<PromptStatus | 'all', { label: string; color: string }> = {
  all: { label: '全部', color: 'default' },
  draft: { label: '草稿', color: 'default' },
  active: { label: '启用', color: 'green' },
  inactive: { label: '停用', color: 'red' },
}

const categories = ['问候类', '产品类', '售后类', '投诉类', '通用类']
const salesGroups = ['华东组', '华北组', '华南组', '西南组']

const Prompts: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PromptItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [filterForm] = Form.useForm()
  const [editModal, setEditModal] = useState(false)
  const [editType, setEditType] = useState<'create' | 'edit'>('create')
  const [editForm] = Form.useForm()
  const [editLoading, setEditLoading] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<PromptItem | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [historyModal, setHistoryModal] = useState(false)
  const [historyList, setHistoryList] = useState<PromptVersionHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [compareModal, setCompareModal] = useState(false)
  const [compareVersions, setCompareVersions] = useState<PromptVersionHistory[]>([])
  const [currentPromptId, setCurrentPromptId] = useState<string>('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const values = filterForm.getFieldsValue()
      const params = {
        page,
        pageSize,
        status: values.status,
        category: values.category,
        version: values.version,
        keyword: values.keyword,
      }
      const result = await promptApi.getList(params)
      setData(result.list)
      setTotal(result.total)
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page])

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const handleReset = () => {
    filterForm.resetFields()
    setPage(1)
    setTimeout(fetchData, 0)
  }

  const handleCreate = () => {
    setEditType('create')
    editForm.resetFields()
    setEditModal(true)
  }

  const handleEdit = async (record: PromptItem) => {
    setEditType('edit')
    setCurrentPromptId(record.id)
    setEditLoading(true)
    try {
      const detail = await promptApi.getDetail(record.id)
      if (detail) {
        editForm.setFieldsValue({
          ...detail,
        })
        setEditModal(true)
      }
    } catch (error) {
      message.error('获取详情失败')
    } finally {
      setEditLoading(false)
    }
  }

  const handleViewDetail = async (id: string) => {
    setDetailLoading(true)
    try {
      const detail = await promptApi.getDetail(id)
      if (detail) {
        setCurrentDetail(detail)
        setDetailModal(true)
      }
    } catch (error) {
      message.error('获取详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields()
      setEditLoading(true)
      if (editType === 'create') {
        await promptApi.create(values)
        message.success('创建成功')
      } else {
        await promptApi.update(currentPromptId, values)
        message.success('更新成功')
      }
      setEditModal(false)
      fetchData()
    } catch (error) {
      if ((error as { errorFields?: unknown[] }).errorFields) return
      message.error('操作失败')
    } finally {
      setEditLoading(false)
    }
  }

  const handlePublish = (id: string) => {
    confirm({
      title: '发布提示词',
      content: '确定要发布此提示词吗？发布后将对指定分组生效。',
      onOk: async () => {
        try {
          await promptApi.publish(id)
          message.success('发布成功')
          fetchData()
        } catch (error) {
          message.error('发布失败')
        }
      },
    })
  }

  const handleDeactivate = (id: string) => {
    confirm({
      title: '停用提示词',
      content: '确定要停用此提示词吗？停用后将不再使用。',
      okType: 'danger',
      onOk: async () => {
        try {
          await promptApi.deactivate(id)
          message.success('停用成功')
          fetchData()
        } catch (error) {
          message.error('停用失败')
        }
      },
    })
  }

  const handleViewHistory = async (id: string) => {
    setCurrentPromptId(id)
    setHistoryLoading(true)
    try {
      const history = await promptApi.getVersionHistory(id)
      setHistoryList(history)
      setHistoryModal(true)
    } catch (error) {
      message.error('获取版本历史失败')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleRollback = (versionId: string) => {
    confirm({
      title: '版本回滚',
      content: '确定要回滚到此版本吗？回滚后将创建一个新版本。',
      onOk: async () => {
        try {
          await promptApi.rollback(currentPromptId, versionId)
          message.success('回滚成功')
          setHistoryModal(false)
          fetchData()
        } catch (error) {
          message.error('回滚失败')
        }
      },
    })
  }

  const handleCompare = (version: PromptVersionHistory) => {
    const currentVersion = historyList[0]
    if (currentVersion.id === version.id) {
      message.info('请选择不同的版本进行对比')
      return
    }
    setCompareVersions([currentVersion, version])
    setCompareModal(true)
  }

  const columns: ColumnsType<PromptItem> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text: string, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ color: '#999', fontSize: 12 }}>版本：{record.version}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: PromptStatus) => (
        <Tag color={statusMap[status].color}>{statusMap[status].label}</Tag>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 90,
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: '准确率',
      dataIndex: 'accuracy',
      key: 'accuracy',
      width: 90,
      render: (val: number) => `${val}%`,
    },
    {
      title: '灰度百分比',
      dataIndex: 'grayScale',
      key: 'grayScale',
      width: 110,
      render: (val: number) => `${val}%`,
    },
    {
      title: '适用分组',
      dataIndex: 'applicableGroups',
      key: 'applicableGroups',
      width: 150,
      render: (groups: string[]) => (
        <Space wrap size={[4, 4]}>
          {groups.map((g) => (
            <Tag key={g} color="blue" style={{ fontSize: 11, margin: 0 }}>
              {g}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time: string) => formatDate(time),
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>
            查看
          </Button>
          {record.status === 'draft' && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {(record.status === 'draft' || record.status === 'inactive') && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              style={{ color: '#52c41a' }}
              onClick={() => handlePublish(record.id)}
            >
              发布
            </Button>
          )}
          {record.status === 'active' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<PauseCircleOutlined />}
              onClick={() => handleDeactivate(record.id)}
            >
              停用
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => handleViewHistory(record.id)}
          >
            版本历史
          </Button>
        </Space>
      ),
    },
  ]

  const historyColumns: ColumnsType<PromptVersionHistory> = [
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: PromptStatus) => (
        <Tag color={statusMap[status].color}>{statusMap[status].label}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time: string) => formatDate(time),
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<DiffOutlined />} onClick={() => handleCompare(record)}>
            对比
          </Button>
          <Popconfirm
            title="确认回滚？"
            description="回滚到此版本将创建一个新版本"
            onConfirm={() => handleRollback(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" icon={<RollbackOutlined />}>
              回滚
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>提示词版本管理</h2>

      <Card style={{ marginBottom: 16 }}>
        <Form form={filterForm} layout="inline" initialValues={{ status: 'all' }}>
          <Form.Item name="status" label="状态">
            <Select style={{ width: 120 }}>
              {Object.entries(statusMap).map(([key, val]) => (
                <Option key={key} value={key}>
                  {val.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select style={{ width: 120 }} placeholder="请选择" allowClear>
              {categories.map((c) => (
                <Option key={c} value={c}>
                  {c}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="version" label="版本号">
            <Input placeholder="输入版本号" style={{ width: 150 }} allowClear />
          </Form.Item>
          <Form.Item name="keyword">
            <Input
              placeholder="搜索标题"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              allowClear
              onPressEnter={handleSearch}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSearch}>
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建提示词
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p) => setPage(p),
          }}
          scroll={{ x: 1300 }}
          locale={{
            emptyText: loading ? <Spin tip="加载中..." /> : <Empty description="暂无数据" />,
          }}
        />
      </Card>

      <Modal
        title={editType === 'create' ? '新建提示词' : '编辑提示词'}
        open={editModal}
        onOk={handleEditSubmit}
        onCancel={() => setEditModal(false)}
        confirmLoading={editLoading}
        width={720}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="标题"
                rules={[{ required: true, message: '请输入标题' }]}
              >
                <Input placeholder="请输入提示词标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="version"
                label="版本号"
                rules={[{ required: true, message: '请输入版本号' }]}
              >
                <Input placeholder="例如：v1.0.0" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="请选择分类">
                  {categories.map((c) => (
                    <Option key={c} value={c}>
                      {c}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="grayScale"
                label="灰度百分比"
                rules={[{ required: true, message: '请输入灰度百分比' }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} suffix="%" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="applicableGroups"
            label="适用分组"
            rules={[{ required: true, message: '请选择适用分组' }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Row>
                {salesGroups.map((g) => (
                  <Col span={6} key={g}>
                    <Checkbox value={g}>{g}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
          <Form.Item
            name="content"
            label="提示词内容"
            rules={[{ required: true, message: '请输入提示词内容' }]}
          >
            <TextArea rows={10} placeholder="请输入提示词内容" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提示词详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        width={720}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>
            关闭
          </Button>,
        ]}
      >
        <Spin spinning={detailLoading}>
          {currentDetail && (
            <div>
              <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="标题">{currentDetail.title}</Descriptions.Item>
                <Descriptions.Item label="版本号">{currentDetail.version}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusMap[currentDetail.status].color}>
                    {statusMap[currentDetail.status].label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="分类">{currentDetail.category}</Descriptions.Item>
                <Descriptions.Item label="使用次数">{currentDetail.usageCount.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="准确率">{currentDetail.accuracy}%</Descriptions.Item>
                <Descriptions.Item label="灰度百分比">{currentDetail.grayScale}%</Descriptions.Item>
                <Descriptions.Item label="作者">{currentDetail.author}</Descriptions.Item>
                <Descriptions.Item label="创建时间" span={2}>
                  {formatDate(currentDetail.createTime)}
                </Descriptions.Item>
              </Descriptions>

              <Card title="适用分组" size="small" style={{ marginBottom: 16 }}>
                {currentDetail.applicableGroups.map((g) => (
                  <Tag key={g} color="blue">
                    {g}
                  </Tag>
                ))}
              </Card>

              <Card title="提示词内容" size="small">
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'monospace' }}>
                  {currentDetail.content}
                </pre>
              </Card>
            </div>
          )}
        </Spin>
      </Modal>

      <Modal
        title="版本历史"
        open={historyModal}
        onCancel={() => setHistoryModal(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setHistoryModal(false)}>
            关闭
          </Button>,
        ]}
      >
        <Table
          rowKey="id"
          columns={historyColumns}
          dataSource={historyList}
          loading={historyLoading}
          pagination={false}
          size="small"
        />
      </Modal>

      <Modal
        title="版本对比"
        open={compareModal}
        onCancel={() => setCompareModal(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setCompareModal(false)}>
            关闭
          </Button>,
        ]}
      >
        <Row gutter={16}>
          {compareVersions.map((v, index) => (
            <Col span={12} key={v.id}>
              <Card title={`${index === 0 ? '当前版本' : '对比版本'} - ${v.version}`} size="small">
                <p style={{ color: '#666', fontSize: 12 }}>
                  {v.author} · {formatDate(v.createTime)}
                </p>
                <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', fontSize: 12 }}>
                  {v.content}
                </pre>
              </Card>
            </Col>
          ))}
        </Row>
      </Modal>
    </div>
  )
}

export default Prompts
