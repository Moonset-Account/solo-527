import { useState, useEffect } from 'react'
import { Card, Tabs, Table, Button, Form, Input, Select, DatePicker, Modal, message, Space, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DesignPlan, Contract, HouseSurvey, Project } from '@/types'
import { getStatusText, getStatusColor, formatDate, formatDateOnly, formatMoney } from '@/utils'
import { getDesignPlanList, createDesignPlan, updateDesignPlan, deleteDesignPlan } from '@/api/design'
import { getContractList, createContract, updateContract, deleteContract } from '@/api/contract'
import { getHouseSurveyList, createHouseSurvey, updateHouseSurvey, deleteHouseSurvey } from '@/api/survey'
import { getProjectList } from '@/api/project'
import dayjs from 'dayjs'

const { Option } = Select

const SalesEntry = () => {
  const [activeTab, setActiveTab] = useState('design')
  const [designPlans, setDesignPlans] = useState<DesignPlan[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [houseSurveys, setHouseSurveys] = useState<HouseSurvey[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  
  const [designLoading, setDesignLoading] = useState(false)
  const [contractLoading, setContractLoading] = useState(false)
  const [surveyLoading, setSurveyLoading] = useState(false)
  
  const [designModalVisible, setDesignModalVisible] = useState(false)
  const [contractModalVisible, setContractModalVisible] = useState(false)
  const [surveyModalVisible, setSurveyModalVisible] = useState(false)
  
  const [editingDesign, setEditingDesign] = useState<DesignPlan | null>(null)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [editingSurvey, setEditingSurvey] = useState<HouseSurvey | null>(null)
  
  const [designForm] = Form.useForm()
  const [contractForm] = Form.useForm()
  const [surveyForm] = Form.useForm()

  const [designPagination, setDesignPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [contractPagination, setContractPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [surveyPagination, setSurveyPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const loadProjects = async () => {
    try {
      const response = await getProjectList({ page: 1, pageSize: 1000 })
      setProjects(response.data.list || [])
    } catch (error) {
      console.error('加载项目列表失败', error)
    }
  }

  const loadDesignPlans = async (page = designPagination.current, pageSize = designPagination.pageSize) => {
    setDesignLoading(true)
    try {
      const response = await getDesignPlanList({ page, pageSize })
      setDesignPlans(response.data.list || [])
      setDesignPagination({ current: response.data.page || 1, pageSize: response.data.pageSize || 10, total: response.data.total || 0 })
    } catch (error) {
      console.error('加载装修方案失败', error)
      message.error('加载装修方案失败')
    } finally {
      setDesignLoading(false)
    }
  }

  const loadContracts = async (page = contractPagination.current, pageSize = contractPagination.pageSize) => {
    setContractLoading(true)
    try {
      const response = await getContractList({ page, pageSize })
      setContracts(response.data.list || [])
      setContractPagination({ current: response.data.page || 1, pageSize: response.data.pageSize || 10, total: response.data.total || 0 })
    } catch (error) {
      console.error('加载合同失败', error)
      message.error('加载合同失败')
    } finally {
      setContractLoading(false)
    }
  }

  const loadHouseSurveys = async (page = surveyPagination.current, pageSize = surveyPagination.pageSize) => {
    setSurveyLoading(true)
    try {
      const response = await getHouseSurveyList({ page, pageSize })
      setHouseSurveys(response.data.list || [])
      setSurveyPagination({ current: response.data.page || 1, pageSize: response.data.pageSize || 10, total: response.data.total || 0 })
    } catch (error) {
      console.error('加载量房信息失败', error)
      message.error('加载量房信息失败')
    } finally {
      setSurveyLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (activeTab === 'design') {
      loadDesignPlans()
    }
  }, [activeTab, designPagination.current, designPagination.pageSize])

  useEffect(() => {
    if (activeTab === 'contract') {
      loadContracts()
    }
  }, [activeTab, contractPagination.current, contractPagination.pageSize])

  useEffect(() => {
    if (activeTab === 'survey') {
      loadHouseSurveys()
    }
  }, [activeTab, surveyPagination.current, surveyPagination.pageSize])

  const getProjectName = (projectId: number) => {
    return projects.find(p => p.id === projectId)?.name || '-'
  }

  const handleAddDesign = () => {
    setEditingDesign(null)
    designForm.resetFields()
    setDesignModalVisible(true)
  }

  const handleEditDesign = (record: DesignPlan) => {
    setEditingDesign(record)
    designForm.setFieldsValue({
      ...record,
      handleTime: record.handleTime ? dayjs(record.handleTime) : undefined
    })
    setDesignModalVisible(true)
  }

  const handleDeleteDesign = async (id: number) => {
    try {
      await deleteDesignPlan(id)
      message.success('删除成功')
      loadDesignPlans()
    } catch (error) {
      console.error('删除失败', error)
      message.error('删除失败')
    }
  }

  const handleSubmitDesign = async () => {
    try {
      const values = await designForm.validateFields()
      const data = {
        ...values,
        estimatedPrice: values.estimatedPrice !== undefined && values.estimatedPrice !== '' ? Number(values.estimatedPrice) : undefined,
        handleTime: values.handleTime?.format('YYYY-MM-DD HH:mm:ss') || undefined
      }
      
      if (editingDesign) {
        await updateDesignPlan(editingDesign.id, data)
        message.success('更新成功')
      } else {
        await createDesignPlan(data)
        message.success('创建成功')
      }
      setDesignModalVisible(false)
      loadDesignPlans()
    } catch (error) {
      console.error('提交失败', error)
    }
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
      signDate: record.signDate ? dayjs(record.signDate) : undefined,
      handleTime: record.handleTime ? dayjs(record.handleTime) : undefined
    })
    setContractModalVisible(true)
  }

  const handleDeleteContract = async (id: number) => {
    try {
      await deleteContract(id)
      message.success('删除成功')
      loadContracts()
    } catch (error) {
      console.error('删除失败', error)
      message.error('删除失败')
    }
  }

  const handleSubmitContract = async () => {
    try {
      const values = await contractForm.validateFields()
      const data = {
        ...values,
        amount: values.amount !== undefined && values.amount !== '' ? Number(values.amount) : undefined,
        signDate: values.signDate?.format('YYYY-MM-DD') || '',
        handleTime: values.handleTime?.format('YYYY-MM-DD HH:mm:ss') || undefined
      }
      
      if (editingContract) {
        await updateContract(editingContract.id, data)
        message.success('更新成功')
      } else {
        await createContract(data)
        message.success('创建成功')
      }
      setContractModalVisible(false)
      loadContracts()
    } catch (error) {
      console.error('提交失败', error)
    }
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
      surveyDate: record.surveyDate ? dayjs(record.surveyDate) : undefined,
      handleTime: record.handleTime ? dayjs(record.handleTime) : undefined
    })
    setSurveyModalVisible(true)
  }

  const handleDeleteSurvey = async (id: number) => {
    try {
      await deleteHouseSurvey(id)
      message.success('删除成功')
      loadHouseSurveys()
    } catch (error) {
      console.error('删除失败', error)
      message.error('删除失败')
    }
  }

  const handleSubmitSurvey = async () => {
    try {
      const values = await surveyForm.validateFields()
      const data = {
        ...values,
        area: values.area !== undefined && values.area !== '' ? Number(values.area) : undefined,
        floor: values.floor !== undefined && values.floor !== '' ? Number(values.floor) : undefined,
        surveyDate: values.surveyDate?.format('YYYY-MM-DD') || undefined,
        handleTime: values.handleTime?.format('YYYY-MM-DD HH:mm:ss') || undefined
      }
      
      if (editingSurvey) {
        await updateHouseSurvey(editingSurvey.id, data)
        message.success('更新成功')
      } else {
        await createHouseSurvey(data)
        message.success('创建成功')
      }
      setSurveyModalVisible(false)
      loadHouseSurveys()
    } catch (error) {
      console.error('提交失败', error)
    }
  }

  const designColumns: ColumnsType<DesignPlan> = [
    { title: '方案名称', dataIndex: 'name', key: 'name' },
    { title: '关联项目', dataIndex: 'projectId', key: 'projectName', render: (projectId: number) => getProjectName(projectId) },
    { title: '预算', dataIndex: 'estimatedPrice', key: 'estimatedPrice', width: 120, render: (v) => formatMoney(v) },
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
    { title: '关联项目', dataIndex: 'projectId', key: 'projectName', render: (projectId: number) => getProjectName(projectId) },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 120, render: (v) => formatMoney(v) },
    { title: '签订日期', dataIndex: 'signDate', key: 'signDate', width: 120, render: (d) => formatDateOnly(d) },
    { title: '甲方', dataIndex: 'partyA', key: 'partyA', width: 100 },
    { title: '乙方', dataIndex: 'partyB', key: 'partyB', width: 100 },
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
    { title: '关联项目', dataIndex: 'projectId', key: 'projectName', render: (projectId: number) => getProjectName(projectId) },
    { title: '量房日期', dataIndex: 'surveyDate', key: 'surveyDate', width: 120, render: (d) => formatDateOnly(d) },
    { title: '量房师', dataIndex: 'surveyor', key: 'surveyor', width: 100 },
    { title: '面积', dataIndex: 'area', key: 'area', width: 100, render: (v) => `${v} ㎡` },
    { title: '户型', dataIndex: 'layout', key: 'layout', width: 120 },
    { title: '楼层', dataIndex: 'floor', key: 'floor', width: 80 },
    { title: '朝向', dataIndex: 'orientation', key: 'orientation', width: 80 },
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
            loading={designLoading}
            scroll={{ x: 1000 }}
            pagination={{
              current: designPagination.current,
              pageSize: designPagination.pageSize,
              total: designPagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => setDesignPagination({ ...designPagination, current: page, pageSize })
            }}
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
            loading={contractLoading}
            scroll={{ x: 1200 }}
            pagination={{
              current: contractPagination.current,
              pageSize: contractPagination.pageSize,
              total: contractPagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => setContractPagination({ ...contractPagination, current: page, pageSize })
            }}
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
            loading={surveyLoading}
            scroll={{ x: 1200 }}
            pagination={{
              current: surveyPagination.current,
              pageSize: surveyPagination.pageSize,
              total: surveyPagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => setSurveyPagination({ ...surveyPagination, current: page, pageSize })
            }}
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
        confirmLoading={designLoading}
      >
        <Form form={designForm} layout="vertical">
          <Form.Item name="projectId" label="关联项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select placeholder="请选择项目" showSearch optionFilterProp="children">
              {projects.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="方案名称" rules={[{ required: true, message: '请输入方案名称' }]}>
            <Input placeholder="请输入方案名称" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="estimatedPrice" label="预算">
              <Input type="number" placeholder="请输入预算" prefix="¥" />
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
              <Select placeholder="请选择状态">
                <Option value="DRAFT">草稿</Option>
                <Option value="SUBMITTED">已提交</Option>
                <Option value="APPROVED">已通过</Option>
                <Option value="REJECTED">已驳回</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="designFile" label="设计文件">
            <Input placeholder="请输入设计文件路径" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="handler" label="经手人">
              <Input placeholder="请输入经手人" />
            </Form.Item>
            <Form.Item name="handleTime" label="处理时间">
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
        confirmLoading={contractLoading}
      >
        <Form form={contractForm} layout="vertical">
          <Form.Item name="projectId" label="关联项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select placeholder="请选择项目" showSearch optionFilterProp="children">
              {projects.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="contractNo" label="合同编号" rules={[{ required: true, message: '请输入合同编号' }]}>
              <Input placeholder="请输入合同编号" />
            </Form.Item>
            <Form.Item name="amount" label="合同金额" rules={[{ required: true, message: '请输入合同金额' }]}>
              <Input type="number" placeholder="请输入金额" prefix="¥" />
            </Form.Item>
          </div>
          <Form.Item name="signDate" label="签订日期">
            <DatePicker style={{ width: '100%' }} placeholder="请选择签订日期" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="partyA" label="甲方">
              <Input placeholder="请输入甲方" />
            </Form.Item>
            <Form.Item name="partyB" label="乙方">
              <Input placeholder="请输入乙方" />
            </Form.Item>
          </div>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select placeholder="请选择状态">
              <Option value="DRAFT">草稿</Option>
              <Option value="SIGNED">已签订</Option>
              <Option value="TERMINATED">已终止</Option>
            </Select>
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="handler" label="经手人">
              <Input placeholder="请输入经手人" />
            </Form.Item>
            <Form.Item name="handleTime" label="处理时间">
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
        confirmLoading={surveyLoading}
      >
        <Form form={surveyForm} layout="vertical">
          <Form.Item name="projectId" label="关联项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select placeholder="请选择项目" showSearch optionFilterProp="children">
              {projects.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="surveyDate" label="量房日期">
              <DatePicker style={{ width: '100%' }} placeholder="请选择量房日期" />
            </Form.Item>
            <Form.Item name="surveyor" label="量房师">
              <Input placeholder="请输入量房师" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="area" label="面积(㎡)" rules={[{ required: true, message: '请输入面积' }]}>
              <Input type="number" placeholder="请输入面积" />
            </Form.Item>
            <Form.Item name="layout" label="户型">
              <Input placeholder="如 三室两厅一卫" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="floor" label="楼层">
              <Input type="number" placeholder="请输入楼层" />
            </Form.Item>
            <Form.Item name="orientation" label="朝向">
              <Input placeholder="请输入朝向" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="handler" label="经手人">
              <Input placeholder="请输入经手人" />
            </Form.Item>
            <Form.Item name="handleTime" label="处理时间">
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
