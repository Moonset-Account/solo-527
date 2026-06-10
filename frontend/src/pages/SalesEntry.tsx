import { useState } from 'react'
import { Card, Tabs, Table, Button, Form, Input, Select, DatePicker, Modal, message, Space, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DesignPlan, Contract, HouseSurvey } from '@/types'
import { getStatusText, getStatusColor, formatDate, formatDateOnly, formatMoney } from '@/utils'
import { mockDesignPlans, mockContracts, mockHouseSurveys, mockProjects } from '@/mock/data'
import dayjs from 'dayjs'

const { Option } = Select

const SalesEntry = () => {
  const [activeTab, setActiveTab] = useState('design')
  const [designPlans, setDesignPlans] = useState<DesignPlan[]>(mockDesignPlans)
  const [contracts, setContracts] = useState<Contract[]>(mockContracts)
  const [houseSurveys, setHouseSurveys] = useState<HouseSurvey[]>(mockHouseSurveys)
  
  const [designModalVisible, setDesignModalVisible] = useState(false)
  const [contractModalVisible, setContractModalVisible] = useState(false)
  const [surveyModalVisible, setSurveyModalVisible] = useState(false)
  
  const [editingDesign, setEditingDesign] = useState<DesignPlan | null>(null)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [editingSurvey, setEditingSurvey] = useState<HouseSurvey | null>(null)
  
  const [designForm] = Form.useForm()
  const [contractForm] = Form.useForm()
  const [surveyForm] = Form.useForm()

  const projectOptions = mockProjects.map(p => ({ value: p.id, label: p.name }))

  const handleAddDesign = () => {
    setEditingDesign(null)
    designForm.resetFields()
    setDesignModalVisible(true)
  }

  const handleEditDesign = (record: DesignPlan) => {
    setEditingDesign(record)
    designForm.setFieldsValue({
      ...record,
      handleTime: dayjs(record.handleTime)
    })
    setDesignModalVisible(true)
  }

  const handleDeleteDesign = (id: string) => {
    setDesignPlans(prev => prev.filter(item => item.id !== id))
    message.success('删除成功')
  }

  const handleSubmitDesign = () => {
    designForm.validateFields().then(values => {
      const data = {
        ...values,
        handleTime: values.handleTime?.format('YYYY-MM-DD HH:mm:ss') || new Date().toISOString()
      }
      const projectName = mockProjects.find(p => p.id === values.projectId)?.name || ''
      if (editingDesign) {
        setDesignPlans(prev => prev.map(item =>
          item.id === editingDesign.id ? { ...item, ...data, projectName, updatedAt: new Date().toISOString() } : item
        ))
        message.success('更新成功')
      } else {
        const newItem: DesignPlan = {
          ...data,
          projectName,
          id: String(Date.now()),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setDesignPlans(prev => [newItem, ...prev])
        message.success('创建成功')
      }
      setDesignModalVisible(false)
    })
  }

  const handleAddContract = () => {
    setEditingContract(null)
    contractForm.resetFields()
    setContractModalVisible(true)
  }

  const handleEditContract = (record: Contract) => {
    setEditingContract(record)
    contractForm.setFieldsValue({
      ...record,
      signDate: dayjs(record.signDate),
      handleTime: dayjs(record.handleTime)
    })
    setContractModalVisible(true)
  }

  const handleDeleteContract = (id: string) => {
    setContracts(prev => prev.filter(item => item.id !== id))
    message.success('删除成功')
  }

  const handleSubmitContract = () => {
    contractForm.validateFields().then(values => {
      const data = {
        ...values,
        signDate: values.signDate?.format('YYYY-MM-DD') || '',
        handleTime: values.handleTime?.format('YYYY-MM-DD HH:mm:ss') || new Date().toISOString()
      }
      const projectName = mockProjects.find(p => p.id === values.projectId)?.name || ''
      if (editingContract) {
        setContracts(prev => prev.map(item =>
          item.id === editingContract.id ? { ...item, ...data, projectName, updatedAt: new Date().toISOString() } : item
        ))
        message.success('更新成功')
      } else {
        const newItem: Contract = {
          ...data,
          projectName,
          id: String(Date.now()),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setContracts(prev => [newItem, ...prev])
        message.success('创建成功')
      }
      setContractModalVisible(false)
    })
  }

  const handleAddSurvey = () => {
    setEditingSurvey(null)
    surveyForm.resetFields()
    setSurveyModalVisible(true)
  }

  const handleEditSurvey = (record: HouseSurvey) => {
    setEditingSurvey(record)
    surveyForm.setFieldsValue({
      ...record,
      surveyDate: dayjs(record.surveyDate),
      handleTime: dayjs(record.handleTime)
    })
    setSurveyModalVisible(true)
  }

  const handleDeleteSurvey = (id: string) => {
    setHouseSurveys(prev => prev.filter(item => item.id !== id))
    message.success('删除成功')
  }

  const handleSubmitSurvey = () => {
    surveyForm.validateFields().then(values => {
      const data = {
        ...values,
        surveyDate: values.surveyDate?.format('YYYY-MM-DD') || '',
        handleTime: values.handleTime?.format('YYYY-MM-DD HH:mm:ss') || new Date().toISOString()
      }
      const projectName = mockProjects.find(p => p.id === values.projectId)?.name || ''
      if (editingSurvey) {
        setHouseSurveys(prev => prev.map(item =>
          item.id === editingSurvey.id ? { ...item, ...data, projectName, updatedAt: new Date().toISOString() } : item
        ))
        message.success('更新成功')
      } else {
        const newItem: HouseSurvey = {
          ...data,
          projectName,
          id: String(Date.now()),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setHouseSurveys(prev => [newItem, ...prev])
        message.success('创建成功')
      }
      setSurveyModalVisible(false)
    })
  }

  const designColumns: ColumnsType<DesignPlan> = [
    { title: '方案名称', dataIndex: 'title', key: 'title' },
    { title: '关联项目', dataIndex: 'projectName', key: 'projectName' },
    { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
    { title: '设计师', dataIndex: 'designer', key: 'designer', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
    },
    { title: '经手人', dataIndex: 'handler', key: 'handler', width: 100 },
    { title: '处理时间', dataIndex: 'handleTime', key: 'handleTime', width: 160, render: (t) => formatDate(t) },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: unknown, record: DesignPlan) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditDesign(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteDesign(record.id)}>删除</Button>
        </Space>
      )
    }
  ]

  const contractColumns: ColumnsType<Contract> = [
    { title: '合同编号', dataIndex: 'contractNo', key: 'contractNo', width: 120 },
    { title: '关联项目', dataIndex: 'projectName', key: 'projectName' },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 120, render: (v) => formatMoney(v) },
    { title: '签订日期', dataIndex: 'signDate', key: 'signDate', width: 120, render: (d) => formatDateOnly(d) },
    { title: '甲方', dataIndex: 'partyA', key: 'partyA', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
    },
    { title: '经手人', dataIndex: 'handler', key: 'handler', width: 100 },
    { title: '处理时间', dataIndex: 'handleTime', key: 'handleTime', width: 160, render: (t) => formatDate(t) },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: unknown, record: Contract) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditContract(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteContract(record.id)}>删除</Button>
        </Space>
      )
    }
  ]

  const surveyColumns: ColumnsType<HouseSurvey> = [
    { title: '关联项目', dataIndex: 'projectName', key: 'projectName' },
    { title: '量房日期', dataIndex: 'surveyDate', key: 'surveyDate', width: 120, render: (d) => formatDateOnly(d) },
    { title: '量房师', dataIndex: 'surveyor', key: 'surveyor', width: 100 },
    { title: '面积', dataIndex: 'area', key: 'area', width: 100, render: (v) => `${v} ㎡` },
    { title: '户型', dataIndex: 'layout', key: 'layout', width: 120 },
    { title: '经手人', dataIndex: 'handler', key: 'handler', width: 100 },
    { title: '处理时间', dataIndex: 'handleTime', key: 'handleTime', width: 160, render: (t) => formatDate(t) },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: unknown, record: HouseSurvey) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditSurvey(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteSurvey(record.id)}>删除</Button>
        </Space>
      )
    }
  ]

  const tabItems = [
    {
      key: 'design',
      label: '装修方案',
      children: (
        <Card
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDesign}>
              新增方案
            </Button>
          }
        >
          <Table
            columns={designColumns}
            dataSource={designPlans}
            rowKey="id"
            scroll={{ x: 1000 }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>
      )
    },
    {
      key: 'contract',
      label: '合同',
      children: (
        <Card
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddContract}>
              新增合同
            </Button>
          }
        >
          <Table
            columns={contractColumns}
            dataSource={contracts}
            rowKey="id"
            scroll={{ x: 1000 }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>
      )
    },
    {
      key: 'survey',
      label: '量房信息',
      children: (
        <Card
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSurvey}>
              新增量房
            </Button>
          }
        >
          <Table
            columns={surveyColumns}
            dataSource={houseSurveys}
            rowKey="id"
            scroll={{ x: 1000 }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>
      )
    }
  ]

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title={editingDesign ? '编辑装修方案' : '新增装修方案'}
        open={designModalVisible}
        onOk={handleSubmitDesign}
        onCancel={() => setDesignModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={designForm} layout="vertical">
          <Form.Item name="projectId" label="关联项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select placeholder="请选择项目" options={projectOptions} />
          </Form.Item>
          <Form.Item name="title" label="方案名称" rules={[{ required: true, message: '请输入方案名称' }]}>
            <Input placeholder="请输入方案名称" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="version" label="版本号" rules={[{ required: true, message: '请输入版本号' }]}>
              <Input placeholder="如 v1.0" />
            </Form.Item>
            <Form.Item name="designer" label="设计师" rules={[{ required: true, message: '请输入设计师' }]}>
              <Input placeholder="请输入设计师" />
            </Form.Item>
          </div>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select placeholder="请选择状态">
              <Option value="draft">草稿</Option>
              <Option value="submitted">已提交</Option>
              <Option value="approved">已通过</Option>
              <Option value="rejected">已驳回</Option>
            </Select>
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="handler" label="经手人" rules={[{ required: true, message: '请输入经手人' }]}>
              <Input placeholder="请输入经手人" />
            </Form.Item>
            <Form.Item name="handleTime" label="处理时间" rules={[{ required: true, message: '请选择处理时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} placeholder="请选择处理时间" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="方案描述">
            <Input.TextArea rows={3} placeholder="请输入方案描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingContract ? '编辑合同' : '新增合同'}
        open={contractModalVisible}
        onOk={handleSubmitContract}
        onCancel={() => setContractModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={contractForm} layout="vertical">
          <Form.Item name="projectId" label="关联项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select placeholder="请选择项目" options={projectOptions} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="contractNo" label="合同编号" rules={[{ required: true, message: '请输入合同编号' }]}>
              <Input placeholder="请输入合同编号" />
            </Form.Item>
            <Form.Item name="amount" label="合同金额" rules={[{ required: true, message: '请输入合同金额' }]}>
              <Input type="number" placeholder="请输入金额" prefix="¥" />
            </Form.Item>
          </div>
          <Form.Item name="signDate" label="签订日期" rules={[{ required: true, message: '请选择签订日期' }]}>
            <DatePicker style={{ width: '100%' }} placeholder="请选择签订日期" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="partyA" label="甲方" rules={[{ required: true, message: '请输入甲方' }]}>
              <Input placeholder="请输入甲方" />
            </Form.Item>
            <Form.Item name="partyB" label="乙方" rules={[{ required: true, message: '请输入乙方' }]}>
              <Input placeholder="请输入乙方" />
            </Form.Item>
          </div>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select placeholder="请选择状态">
              <Option value="draft">草稿</Option>
              <Option value="signed">已签订</Option>
              <Option value="terminated">已终止</Option>
            </Select>
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="handler" label="经手人" rules={[{ required: true, message: '请输入经手人' }]}>
              <Input placeholder="请输入经手人" />
            </Form.Item>
            <Form.Item name="handleTime" label="处理时间" rules={[{ required: true, message: '请选择处理时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} placeholder="请选择处理时间" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="合同描述">
            <Input.TextArea rows={3} placeholder="请输入合同描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingSurvey ? '编辑量房信息' : '新增量房'}
        open={surveyModalVisible}
        onOk={handleSubmitSurvey}
        onCancel={() => setSurveyModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={surveyForm} layout="vertical">
          <Form.Item name="projectId" label="关联项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select placeholder="请选择项目" options={projectOptions} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="surveyDate" label="量房日期" rules={[{ required: true, message: '请选择量房日期' }]}>
              <DatePicker style={{ width: '100%' }} placeholder="请选择量房日期" />
            </Form.Item>
            <Form.Item name="surveyor" label="量房师" rules={[{ required: true, message: '请输入量房师' }]}>
              <Input placeholder="请输入量房师" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="area" label="面积(㎡)" rules={[{ required: true, message: '请输入面积' }]}>
              <Input type="number" placeholder="请输入面积" />
            </Form.Item>
            <Form.Item name="layout" label="户型" rules={[{ required: true, message: '请输入户型' }]}>
              <Input placeholder="如 三室两厅一卫" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="handler" label="经手人" rules={[{ required: true, message: '请输入经手人' }]}>
              <Input placeholder="请输入经手人" />
            </Form.Item>
            <Form.Item name="handleTime" label="处理时间" rules={[{ required: true, message: '请选择处理时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} placeholder="请选择处理时间" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="备注说明">
            <Input.TextArea rows={3} placeholder="请输入备注说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SalesEntry
