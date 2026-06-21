
import { useState } from 'react'
import { Card, Table, Button, Space, Select, DatePicker, Modal, Descriptions } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { operationLogList } from './mockData'

const { Option } = Select
const { RangePicker } = DatePicker

const OperationLogList = () => {
  const [data] = useState(operationLogList)
  const [moduleFilter, setModuleFilter] = useState('')
  const [operatorFilter, setOperatorFilter] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)

  const modules = ['产品管理', '会员管理', '预约管理', '库存管理', '系统设置', '报损管理', '顾问管理', '提成管理']
  const operators = ['管理员', '张经理', '李小红', '王大明', '仓管小王', '财务小李', '陈美丽']

  const filteredData = data.filter(item => {
    const matchModule = !moduleFilter || item.module === moduleFilter
    const matchOperator = !operatorFilter || item.operator === operatorFilter
    return matchModule && matchOperator
  })

  const handleDetail = (record) => {
    setCurrentItem(record)
    setDetailVisible(true)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '模块', dataIndex: 'module', key: 'module', width: 120 },
    { title: '操作', dataIndex: 'action', key: 'action', width: 100 },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '操作对象', dataIndex: 'target', key: 'target' },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 130 },
    { title: '操作时间', dataIndex: 'time', key: 'time', width: 180 },
    {
      title: '操作',
      key: 'action_col',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
          详情
        </Button>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 20 }}>操作日志</h2>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Select
              placeholder="模块筛选"
              value={moduleFilter || undefined}
              onChange={setModuleFilter}
              allowClear
              style={{ width: 150 }}
            >
              {modules.map(m => <Option key={m} value={m}>{m}</Option>)}
            </Select>
            <Select
              placeholder="操作人"
              value={operatorFilter || undefined}
              onChange={setOperatorFilter}
              allowClear
              style={{ width: 130 }}
            >
              {operators.map(o => <Option key={o} value={o}>{o}</Option>)}
            </Select>
            <RangePicker placeholder={['开始时间', '结束时间']} />
            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title="日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="日志ID">{currentItem.id}</Descriptions.Item>
            <Descriptions.Item label="模块">{currentItem.module}</Descriptions.Item>
            <Descriptions.Item label="操作类型">{currentItem.action}</Descriptions.Item>
            <Descriptions.Item label="操作人">{currentItem.operator}</Descriptions.Item>
            <Descriptions.Item label="操作对象">{currentItem.target}</Descriptions.Item>
            <Descriptions.Item label="IP地址">{currentItem.ip}</Descriptions.Item>
            <Descriptions.Item label="操作时间">{currentItem.time}</Descriptions.Item>
            <Descriptions.Item label="操作详情">{currentItem.detail}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default OperationLogList
