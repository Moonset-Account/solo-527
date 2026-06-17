import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  Modal,
  Tag,
  message,
  Typography,
  Drawer,
  Descriptions,
  InputNumber,
} from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import {
  getConfigList,
  createConfigVersion,
  updateConfigStatus,
  getConfigVersions,
} from '@/api/config'
import type { ConfigVersion } from '@/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

const ConfigManagement = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ConfigVersion[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [searchForm] = Form.useForm()
  const [form] = Form.useForm()

  const [modalVisible, setModalVisible] = useState(false)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ConfigVersion | null>(null)
  const [historyList, setHistoryList] = useState<ConfigVersion[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [page, size])

  const fetchData = async (values?: any) => {
    setLoading(true)
    try {
      const params: any = {
      page,
      size,
      ...values,
    }
      const res = await getConfigList(params)
      if (res.data.code === 200) {
        setData(res.data.data.records)
        setTotal(res.data.data.total)
      }
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(0)
    searchForm.validateFields().then((values) => {
      fetchData(values)
    })
  }

  const handleReset = () => {
    searchForm.resetFields()
    setPage(0)
    fetchData()
  }

  const handleAdd = () => {
    form.resetFields()
    form.setFieldsValue({
      status: 'ACTIVE',
      effectStartTime: dayjs(),
    })
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (values.effectStartTime) {
        values.effectStartTime = values.effectStartTime.format('YYYY-MM-DD HH:mm:ss')
      }
      if (values.effectEndTime) {
        values.effectEndTime = values.effectEndTime.format('YYYY-MM-DD HH:mm:ss')
      }
      await createConfigVersion(values)
      message.success('配置创建成功')
      setModalVisible(false)
      fetchData()
    } catch (error: any) {
      if (error.errorFields) return
      message.error('操作失败')
    }
  }

  const handleViewDetail = (record: ConfigVersion) => {
    setSelectedItem(record)
    setDetailDrawerVisible(true)
  }

  const handleViewHistory = async (configType: string, configKey: string) => {
    setHistoryLoading(true)
    try {
      const res = await getConfigVersions(configType, configKey)
      if (res.data.code === 200) {
        setHistoryList(res.data.data)
        setHistoryDrawerVisible(true)
      }
    } catch (error) {
      message.error('获取历史版本失败')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleToggleStatus = async (id: number, status: string) => {
    Modal.confirm({
      title: '确认操作',
      content: `确定要${status === 'ACTIVE' ? '启用' : '停用'}该配置吗？`,
      onOk: async () => {
        try {
          await updateConfigStatus(id, status)
          message.success('状态更新成功')
          fetchData()
        } catch (error) {
          message.error('更新失败')
        }
      },
    })
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '配置类型',
      dataIndex: 'configType',
      key: 'configType',
    },
    {
      title: '配置键',
      dataIndex: 'configKey',
      key: 'configKey',
    },
    {
      title: '配置名称',
      dataIndex: 'configName',
      key: 'configName',
    },
    {
      title: '版本号',
      dataIndex: 'versionNo',
      key: 'versionNo',
      render: (val: number) => <Tag color="blue">v{val}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          ACTIVE: 'green',
          INACTIVE: 'default',
          EXPIRED: 'red',
        }
        return <Tag color={colorMap[val] || 'default'}>{val}</Tag>
      },
    },
    {
      title: '生效时间',
      dataIndex: 'effectStartTime',
      key: 'effectStartTime',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: ConfigVersion) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => handleViewHistory(record.configType, record.configKey)}
          >
            版本历史
          </Button>
          {record.status === 'ACTIVE' ? (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => handleToggleStatus(record.id, 'INACTIVE')}
            >
              停用
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              onClick={() => handleToggleStatus(record.id, 'ACTIVE')}
            >
              启用
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>配置中心</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建版本
        </Button>
      </div>

      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="configType" label="配置类型">
          <Input placeholder="请输入" style={{ width: 120 }} />
        </Form.Item>
        <Form.Item name="configKey" label="配置键">
          <Input placeholder="请输入" style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select placeholder="请选择" style={{ width: 100 }} allowClear>
            <Option value="ACTIVE">生效中</Option>
            <Option value="INACTIVE">已停用</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        loading={loading}
        dataSource={data}
        columns={columns}
        rowKey="id"
        pagination={{
          current: page + 1,
          pageSize: size,
          total,
          onChange: (p, s) => {
            setPage(p - 1)
            setSize(s)
          },
        }}
      />

      <Modal
        title="新建配置版本"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="configType" label="配置类型" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="configKey" label="配置键" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="configName" label="配置名称">
            <Input />
          </Form.Item>
          <Form.Item name="configValue" label="配置值(JSON)" rules={[{ required: true }]}>
            <TextArea rows={6} placeholder='请输入JSON格式的配置值，如：{"key": "value"}' />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Option value="ACTIVE">生效</Option>
              <Option value="INACTIVE">停用</Option>
            </Select>
          </Form.Item>
          <Form.Item name="effectStartTime" label="生效开始时间">
            <Input />
          </Form.Item>
          <Form.Item name="effectEndTime" label="生效结束时间">
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="配置详情"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={500}
      >
        {selectedItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{selectedItem.id}</Descriptions.Item>
            <Descriptions.Item label="配置类型">{selectedItem.configType}</Descriptions.Item>
            <Descriptions.Item label="配置键">{selectedItem.configKey}</Descriptions.Item>
            <Descriptions.Item label="配置名称">{selectedItem.configName}</Descriptions.Item>
            <Descriptions.Item label="版本号">v{selectedItem.versionNo}</Descriptions.Item>
            <Descriptions.Item label="状态">{selectedItem.status}</Descriptions.Item>
            <Descriptions.Item label="配置值">
              <Text style={{ wordBreak: 'break-all' }}>{selectedItem.configValue}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="生效开始时间">{selectedItem.effectStartTime || '-'}</Descriptions.Item>
            <Descriptions.Item label="生效结束时间">{selectedItem.effectEndTime || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注">{selectedItem.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      <Drawer
        title="版本历史"
        open={historyDrawerVisible}
        onClose={() => setHistoryDrawerVisible(false)}
        width={600}
      >
        <Table
          loading={historyLoading}
          dataSource={historyList}
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            { title: '版本号', dataIndex: 'versionNo', width: 80, render: (v) => `v${v}` },
            { title: '状态', dataIndex: 'status', width: 80, render: (val) => (
              <Tag color={val === 'ACTIVE' ? 'green' : 'default'}>{val}</Tag>
            )},
            { title: '生效时间', dataIndex: 'effectStartTime' },
            { title: '创建人', dataIndex: 'createdBy' },
            { title: '创建时间', dataIndex: 'createdAt' },
          ]}
        />
      </Drawer>
    </div>
  )
}

export default ConfigManagement
