import { useState, useEffect } from 'react'
import { Card, Tabs, Tag, Descriptions, Progress, Table, List, Image, Button, Space, message, Empty, Spin } from 'antd'
import { ArrowLeftOutlined, ExportOutlined, DownloadOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type {
  Project,
  DesignPlan,
  Contract,
  HouseSurvey,
  ConstructionStage,
  StagePhoto,
  CustomerFeedback,
  DelayReminder,
  MaterialCost,
  ProcessRecord
} from '@/types'
import {
  getStatusText,
  getStatusColor,
  formatDate,
  formatDateOnly,
  formatMoney,
  getProcessRecordTypeText,
  getProcessRecordTypeColor
} from '@/utils'
import { getProjectDetail, getProcessRecords } from '@/api/project'
import { getDesignPlansByProject } from '@/api/design'
import { getContractsByProject } from '@/api/contract'
import { getHouseSurveysByProject } from '@/api/survey'
import { getConstructionStagesByProject, getStagePhotos } from '@/api/construction'
import { getFeedbacksByProject } from '@/api/customer-feedback'
import { getDelayRemindersByProject } from '@/api/delay-reminder'
import { getMaterialCostsByProject } from '@/api/material'
import { exportProjectData } from '@/api/export'

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(false)
  const [designPlans, setDesignPlans] = useState<DesignPlan[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [houseSurveys, setHouseSurveys] = useState<HouseSurvey[]>([])
  const [stages, setStages] = useState<ConstructionStage[]>([])
  const [photos, setPhotos] = useState<StagePhoto[]>([])
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([])
  const [reminders, setReminders] = useState<DelayReminder[]>([])
  const [materialCosts, setMaterialCosts] = useState<MaterialCost[]>([])
  const [processRecords, setProcessRecords] = useState<ProcessRecord[]>([])
  const [exporting, setExporting] = useState(false)

  const fetchProjectData = async () => {
    if (!id) return
    
    setLoading(true)
    try {
      const [
        projectRes,
        designRes,
        contractRes,
        surveyRes,
        stageRes,
        feedbackRes,
        reminderRes,
        materialRes,
        recordRes
      ] = await Promise.all([
        getProjectDetail(id),
        getDesignPlansByProject(id),
        getContractsByProject(id),
        getHouseSurveysByProject(id),
        getConstructionStagesByProject(id),
        getFeedbacksByProject(id),
        getDelayRemindersByProject(id),
        getMaterialCostsByProject(id),
        getProcessRecords(id)
      ])

      setProject(projectRes.data)
      setDesignPlans(designRes.data || [])
      setContracts(contractRes.data || [])
      setHouseSurveys(surveyRes.data || [])
      setStages(stageRes.data || [])
      setFeedbacks(feedbackRes.data || [])
      setReminders(reminderRes.data || [])
      setMaterialCosts(materialRes.data || [])
      setProcessRecords((recordRes.data || []).sort(
        (a, b) => new Date(b.handleTime).getTime() - new Date(a.handleTime).getTime()
      ))

      if (stageRes.data && stageRes.data.length > 0) {
        const allPhotos: StagePhoto[] = []
        for (const stage of stageRes.data) {
          try {
            const photoRes = await getStagePhotos(String(stage.id))
            if (photoRes.data) {
              allPhotos.push(...photoRes.data)
            }
          } catch (e) {
            console.error('获取阶段照片失败', e)
          }
        }
        setPhotos(allPhotos)
      }
    } catch (error) {
      console.error('加载项目数据失败', error)
      message.error('加载项目数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjectData()
  }, [id])

  const calculateProgress = () => {
    if (stages.length === 0) return 0
    const completed = stages.filter(s => s.status === 'completed').length
    return Math.round((completed / stages.length) * 100)
  }

  const totalMaterialCost = materialCosts.reduce((sum, item) => sum + item.totalPrice, 0)

  const handleExport = async () => {
    if (!id) return
    
    setExporting(true)
    try {
      const response = await exportProjectData(id)
      const blob = new Blob([response as unknown as BlobPart], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `项目资料_${project?.projectNo || id}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      console.error('导出失败', error)
      message.error('导出失败')
    } finally {
      setExporting(false)
    }
  }

  const designPlanColumns: ColumnsType<DesignPlan> = [
    { title: '方案名称', dataIndex: 'name', key: 'name' },
    { title: '预估价格', dataIndex: 'estimatedPrice', key: 'estimatedPrice', width: 120, render: (v) => formatMoney(v) },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
    },
    { title: '经手人', dataIndex: 'handler', key: 'handler', width: 100 },
    { title: '处理时间', dataIndex: 'handleTime', key: 'handleTime', width: 160, render: (t) => formatDate(t) }
  ]

  const contractColumns: ColumnsType<Contract> = [
    { title: '合同编号', dataIndex: 'contractNo', key: 'contractNo', width: 120 },
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
    { title: '处理时间', dataIndex: 'handleTime', key: 'handleTime', width: 160, render: (t) => formatDate(t) }
  ]

  const stageColumns: ColumnsType<ConstructionStage> = [
    { title: '阶段名称', dataIndex: 'name', key: 'name', width: 120 },
    { title: '顺序', dataIndex: 'order', key: 'order', width: 60 },
    { title: '计划开始', dataIndex: 'startDate', key: 'startDate', width: 110, render: (d) => formatDateOnly(d) },
    { title: '计划结束', dataIndex: 'endDate', key: 'endDate', width: 110, render: (d) => formatDateOnly(d) },
    { title: '实际开始', dataIndex: 'actualStartDate', key: 'actualStartDate', width: 110, render: (d) => formatDateOnly(d) },
    { title: '实际结束', dataIndex: 'actualEndDate', key: 'actualEndDate', width: 110, render: (d) => formatDateOnly(d) },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
    },
    { title: '经手人', dataIndex: 'handler', key: 'handler', width: 100 },
    { title: '处理时间', dataIndex: 'handleTime', key: 'handleTime', width: 160, render: (t) => formatDate(t) }
  ]

  const materialColumns: ColumnsType<MaterialCost> = [
    { title: '材料名称', dataIndex: 'materialName', key: 'materialName' },
    { title: '规格', dataIndex: 'specification', key: 'specification' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', width: 100, render: (v) => formatMoney(v) },
    { title: '总价', dataIndex: 'totalPrice', key: 'totalPrice', width: 120, render: (v) => formatMoney(v) },
    { title: '供应商', dataIndex: 'supplier', key: 'supplier', width: 120 },
    { title: '采购日期', dataIndex: 'purchaseDate', key: 'purchaseDate', width: 120, render: (d) => formatDateOnly(d) }
  ]

  const processRecordColumns: ColumnsType<ProcessRecord> = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => <Tag color={getProcessRecordTypeColor(type)}>{getProcessRecordTypeText(type)}</Tag>
    },
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
    },
    { title: '经手人', dataIndex: 'handler', key: 'handler', width: 100 },
    { title: '处理时间', dataIndex: 'handleTime', key: 'handleTime', width: 160, render: (t) => formatDate(t) }
  ]

  const tabItems = [
    {
      key: 'overview',
      label: '概览',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="项目基本信息">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="项目编号">{project?.projectNo}</Descriptions.Item>
              <Descriptions.Item label="项目名称">{project?.name}</Descriptions.Item>
              <Descriptions.Item label="客户名称">{project?.customerName}</Descriptions.Item>
              <Descriptions.Item label="项目状态">
                <Tag color={getStatusColor(project?.status || '')}>{getStatusText(project?.status || '')}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="销售人员">{project?.salesPerson || '-'}</Descriptions.Item>
              <Descriptions.Item label="项目经理">{project?.projectManager || '-'}</Descriptions.Item>
              <Descriptions.Item label="项目总价">{formatMoney(project?.totalPrice || 0)}</Descriptions.Item>
              <Descriptions.Item label="项目地址">{project?.address || '-'}</Descriptions.Item>
              <Descriptions.Item label="开工日期">{formatDateOnly(project?.startDate || '')}</Descriptions.Item>
              <Descriptions.Item label="竣工日期">{formatDateOnly(project?.endDate || '')}</Descriptions.Item>
              <Descriptions.Item label="实际竣工">{formatDateOnly(project?.actualEndDate || '')}</Descriptions.Item>
              <Descriptions.Item label="经手人">{project?.handler || '-'}</Descriptions.Item>
              <Descriptions.Item label="项目描述" span={2}>{project?.remark || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="施工进度">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Progress
                type="circle"
                percent={calculateProgress()}
                size={160}
                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
              />
              <div style={{ marginTop: 16, color: '#666' }}>
                共 {stages.length} 个阶段，已完成 {stages.filter(s => s.status === 'completed').length} 个
              </div>
            </div>
            <List
              size="small"
              dataSource={stages}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<div style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: item.status === 'completed' ? '#52c41a' :
                        item.status === 'in_progress' ? '#1890ff' :
                        item.status === 'delayed' ? '#faad14' : '#d9d9d9'
                    }} />}
                    title={item.name}
                    description={`计划: ${formatDateOnly(item.startDate || '')} ~ ${formatDateOnly(item.endDate || '')}`}
                  />
                  <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Space>
      )
    },
    {
      key: 'sales',
      label: '销售信息',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="装修方案">
            {designPlans.length > 0 ? (
              <Table
                columns={designPlanColumns}
                dataSource={designPlans}
                rowKey="id"
                size="small"
                pagination={false}
              />
            ) : <Empty description="暂无方案" />}
          </Card>
          <Card title="合同信息">
            {contracts.length > 0 ? (
              <Table
                columns={contractColumns}
                dataSource={contracts}
                rowKey="id"
                size="small"
                pagination={false}
              />
            ) : <Empty description="暂无合同" />}
          </Card>
          <Card title="量房信息">
            {houseSurveys.length > 0 ? (
              <List
                dataSource={houseSurveys}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      title={`量房日期: ${formatDateOnly(item.surveyDate || '')}`}
                      description={
                        <div>
                          <div>量房师: {item.surveyor || '-'}</div>
                          <div>面积: {item.area} 平方米</div>
                          <div>户型: {item.layout || '-'} | 楼层: {item.floor || '-'} | 朝向: {item.orientation || '-'}</div>
                          <div>描述: {item.description || '-'}</div>
                          <div>经手人: {item.handler || '-'} | 处理时间: {formatDate(item.handleTime || '')}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : <Empty description="暂无量房记录" />}
          </Card>
        </Space>
      )
    },
    {
      key: 'construction',
      label: '施工管理',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="施工阶段">
            {stages.length > 0 ? (
              <Table
                columns={stageColumns}
                dataSource={stages}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: 900 }}
              />
            ) : <Empty description="暂无阶段" />}
          </Card>
          <Card title="节点照片">
            {photos.length > 0 ? (
              <Image.PreviewGroup>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {photos.map((photo) => (
                    <div key={photo.id} style={{ textAlign: 'center' }}>
                      <Image
                        width={150}
                        height={150}
                        src={photo.photoUrl}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                      />
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{photo.title}</div>
                    </div>
                  ))}
                </div>
              </Image.PreviewGroup>
            ) : <Empty description="暂无照片" />}
          </Card>
          <Card title="客户反馈">
            {feedbacks.length > 0 ? (
              <List
                dataSource={feedbacks}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>{item.content.substring(0, 30)}...</span>
                          <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div>反馈时间: {formatDate(item.feedbackTime || item.createdAt)}</div>
                          <div style={{ marginTop: 8 }}>{item.content}</div>
                          {item.reply && (
                            <div style={{
                              marginTop: 8,
                              padding: 8,
                              background: '#f5f5f5',
                              borderRadius: 4
                            }}>
                              <strong>回复:</strong> {item.reply}
                              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                                回复时间: {formatDate(item.replyTime || '')}
                              </div>
                            </div>
                          )}
                          <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                            经手人: {item.handler || '-'}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : <Empty description="暂无反馈" />}
          </Card>
          <Card title="延期提醒">
            {reminders.length > 0 ? (
              <List
                dataSource={reminders}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>{item.stageName || '延期提醒'}</span>
                          <Tag color="orange">延期 {item.days} 天</Tag>
                          <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div>原因: {item.reason || '-'}</div>
                          <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                            提醒时间: {formatDate(item.remindTime || item.createdAt)}
                          </div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            经手人: {item.handler || '-'}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : <Empty description="暂无延期提醒" />}
          </Card>
        </Space>
      )
    },
    {
      key: 'records',
      label: '处理记录',
      children: (
        <Card>
          {processRecords.length > 0 ? (
            <Table
              columns={processRecordColumns}
              dataSource={processRecords}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 10, showSizeChanger: true }}
            />
          ) : <Empty description="暂无处理记录" />}
        </Card>
      )
    },
    {
      key: 'material',
      label: '材料成本',
      children: (
        <Card
          title="材料成本列表"
          extra={<div style={{ fontWeight: 'bold', color: '#f5222d' }}>总计: {formatMoney(totalMaterialCost)}</div>}
        >
          {materialCosts.length > 0 ? (
            <Table
              columns={materialColumns}
              dataSource={materialCosts}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 800 }}
            />
          ) : <Empty description="暂无材料成本记录" />}
        </Card>
      )
    },
    {
      key: 'export',
      label: '导出归档',
      children: (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <DownloadOutlined style={{ fontSize: 64, color: '#1890ff' }} />
            <h3 style={{ marginTop: 16 }}>导出项目全部资料</h3>
            <p style={{ color: '#666' }}>点击下方按钮，导出该项目的所有资料（包含方案、合同、施工记录、巡检记录等）</p>
            <Button
              type="primary"
              size="large"
              icon={<ExportOutlined />}
              onClick={handleExport}
              loading={exporting}
              style={{ marginTop: 16 }}
            >
              导出项目资料
            </Button>
          </div>
        </Card>
      )
    }
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!project) {
    return <Empty description="项目不存在" />
  }

  return (
    <div>
      <Card
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: 16 }}
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/projects')}
            >
              返回
            </Button>
            <span>{project.name}</span>
            <Tag color={getStatusColor(project.status)}>{getStatusText(project.status)}</Tag>
          </Space>
        }
        extra={
          <Space>
            <span>项目编号: {project.projectNo}</span>
            <span>客户: {project.customerName || '-'}</span>
          </Space>
        }
      />
      <Card>
        <Tabs defaultActiveKey="overview" items={tabItems} />
      </Card>
    </div>
  )
}

export default ProjectDetail
