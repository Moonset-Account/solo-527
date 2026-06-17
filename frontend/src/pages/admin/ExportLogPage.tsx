import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  message,
  Typography,
  Drawer,
  Descriptions,
  Collapse,
} from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { getExportLogList } from '@/api/config'
import type { ExportLog } from '@/types'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const ExportLogPage = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ExportLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [searchForm] = Form.useForm()

  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ExportLog | null>(null)

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
      if (values?.dateRange?.length === 2) {
        params.startTime = values.dateRange[0].format('YYYY-MM-DD HH:mm:ss')
        params.endTime = values.dateRange[1].format('YYYY-MM-DD HH:mm:ss')
        delete params.dateRange
      }
      const res = await getExportLogList(params)
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

  const handleViewDetail = (record: ExportLog) => {
    setSelectedItem(record)
    setDetailDrawerVisible(true)
  }

  const renderQueryCriteria = (criteria: string) => {
    try {
      const obj = JSON.parse(criteria)
      const items = Object.entries(obj).map(([key, value]) => (
        <Descriptions.Item key={key} label={key}>
          {String(value)}
        </Descriptions.Item>
      ))
      return <Descriptions column={1} size="small" bordered>{items}</Descriptions>
    } catch (e) {
      return <span>{criteria}</span>
    }
  }

  const columns = [
    {
      title: '导出单号',
      dataIndex: 'exportNo',
      key: 'exportNo',
      width: 180,
    },
    {
      title: '导出类型',
      dataIndex: 'exportType',
      key: 'exportType',
      render: (val: string) => {
        const map: Record<string, string> = {
          INVENTORY_DETAIL: '库存明细',
          ORDER: '订单数据',
          ROUTE: '路线数据',
        }
        return map[val] || val
      },
    },
    {
      title: '导出名称',
      dataIndex: 'exportName',
      key: 'exportName',
    },
    {
      title: '导出人',
      dataIndex: 'exportBy',
      key: 'exportBy',
    },
    {
      title: '导出时间',
      dataIndex: 'exportTime',
      key: 'exportTime',
    },
    {
      title: '记录数',
      dataIndex: 'recordCount',
      key: 'recordCount',
    },
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          SUCCESS: 'green',
          PROCESSING: 'blue',
          FAILED: 'red',
        }
        return <Tag color={colorMap[val] || 'default'}>{val}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: ExportLog) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>导出日志</Title>

      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="exportNo" label="导出单号">
          <Input placeholder="请输入" style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="exportType" label="导出类型">
          <Select placeholder="请选择" style={{ width: 120 }} allowClear>
            <Option value="INVENTORY_DETAIL">库存明细</Option>
            <Option value="ORDER">订单数据</Option>
          </Select>
        </Form.Item>
        <Form.Item name="exportBy" label="导出人">
          <Input placeholder="请输入" style={{ width: 100 }} />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select placeholder="请选择" style={{ width: 100 }} allowClear>
            <Option value="SUCCESS">成功</Option>
            <Option value="PROCESSING">处理中</Option>
            <Option value="FAILED">失败</Option>
          </Select>
        </Form.Item>
        <Form.Item name="dateRange" label="导出时间">
          <RangePicker showTime />
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

      <Drawer
        title="导出详情"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={500}
      >
        {selectedItem && (
          <div>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="导出单号">{selectedItem.exportNo}</Descriptions.Item>
              <Descriptions.Item label="导出类型">{selectedItem.exportType}</Descriptions.Item>
              <Descriptions.Item label="导出名称">{selectedItem.exportName}</Descriptions.Item>
              <Descriptions.Item label="导出人">{selectedItem.exportBy}</Descriptions.Item>
              <Descriptions.Item label="导出时间">{selectedItem.exportTime}</Descriptions.Item>
              <Descriptions.Item label="记录数">{selectedItem.recordCount}</Descriptions.Item>
              <Descriptions.Item label="文件名">{selectedItem.fileName}</Descriptions.Item>
              <Descriptions.Item label="文件大小">{selectedItem.fileSize || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag>{selectedItem.status}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Collapse
              items={[
                {
                  key: '1',
                  label: '查询口径',
                  children: selectedItem.queryCriteria
                    ? renderQueryCriteria(selectedItem.queryCriteria)
                    : '-',
                },
                {
                  key: '2',
                  label: '备注',
                  children: selectedItem.remark || '-',
                },
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default ExportLogPage
