import { useState, useEffect } from 'react'
import {
  Card,
  Tabs,
  Descriptions,
  Tag,
  Button,
  Table,
  List,
  message,
  Space,
  Row,
  Col,
  Statistic,
  Empty
} from 'antd'
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useParams, useNavigate } from 'react-router-dom'
import type {
  Project,
  DesignPlan,
  Contract,
  HouseSurvey,
  ConstructionStage,
  StagePhoto,
  CustomerFeedback,
  DelayReminder,
  InspectionTask,
  MaterialCost,
  ProcessRecord
} from '@/types'
import {
  getStatusText,
  getStatusColor,
  getFeedbackTypeText,
  getFeedbackTypeColor,
  getProcessRecordTypeText,
  getProcessRecordTypeColor,
  formatDate,
  formatDateOnly,
  formatMoney
} from '@/utils'
import { getProjectDetail, getProcessRecords } from '@/api/project'
import { getDesignPlansByProject } from '@/api/design'
import { getContractsByProject } from '@/api/contract'
import { getHouseSurveysByProject } from '@/api/survey'
import { getConstructionStagesByProject } from '@/api/construction'
import { getStagePhotosByProject } from '@/api/stage-photo'
import { getCustomerFeedbacksByProject } from '@/api/customer-feedback'
import { getDelayRemindersByProject } from '@/api/delay-reminder'
import { getInspectionTasksByProject } from '@/api/inspection'
import { getMaterialCostsByProject } from '@/api/material'
import { exportProjectData } from '@/api/export'

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projectId = Number(id)

  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [designPlans, setDesignPlans] = useState<DesignPlan[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [houseSurveys, setHouseSurveys] = useState<HouseSurvey[]>([])
  const [constructionStages, setConstructionStages] = useState<ConstructionStage[]>([])
  const [stagePhotos, setStagePhotos] = useState<StagePhoto[]>([])
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([])
  const [delayReminders, setDelayReminders] = useState<DelayReminder[]>([])
  const [inspections, setInspections] = useState<InspectionTask[]>([])
  const [materialCosts, setMaterialCosts] = useState<MaterialCost[]>([])
  const [processRecords, setProcessRecords] = useState<ProcessRecord[]>([])

  const loadProjectDetail = async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const response = await getProjectDetail(projectId)
      setProject(response.data)
    } catch (error) {
      console.error('加载项目详情失败', error)
      message.error('加载项目详情失败')
    } finally {
      setLoading(false)
    }
  }

  const loadAllRelatedData = async () => {
    if (!projectId) return
    try {
      const [
        designRes,
        contractRes,
        surveyRes,
        stageRes,
        photoRes,
        feedbackRes,
        reminderRes,
        inspectionRes,
        materialRes,
        processRes
      ] = await Promise.all([
        getDesignPlansByProject(projectId),
        getContractsByProject(projectId),
        getHouseSurveysByProject(projectId),
        getConstructionStagesByProject(projectId),
        getStagePhotosByProject(projectId),
        getCustomerFeedbacksByProject(projectId),
        getDelayRemindersByProject(projectId),
        getInspectionTasksByProject(projectId),
        getMaterialCostsByProject(projectId),
        getProcessRecords(projectId)
      ])

      setDesignPlans(designRes.data || [])
      setContracts(contractRes.data || [])
      setHouseSurveys(surveyRes.data || [])
      setConstructionStages(stageRes.data || [])
      setStagePhotos(photoRes.data || [])
      setFeedbacks(feedbackRes.data || [])
      setDelayReminders(reminderRes.data || [])
      setInspections(inspectionRes.data || [])
      setMaterialCosts(materialRes.data || [])
      setProcessRecords(processRes.data || [])
    } catch (error) {
      console.error('加载关联数据失败', error)
    }
  }

  useEffect(() => {
    loadProjectDetail()
    loadAllRelatedData()
  }, [projectId])

  const handleExport = async () => {
    try {
      const blob = await exportProjectData(projectId)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `project-${projectId}-archive-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      console.error('导出失败', error)
      message.error('导出失败')
    }
  }

  const materialColumns: ColumnsType<MaterialCost> = [
    { title: '材料名称', dataIndex: 'materialName', key: 'materialName', width: 120 },
    { title: '规格型号', dataIndex: 'specification', key: 'specification', width: 100 },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 60 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 50 },
    { title: '单价(元)', dataIndex: 'unitPrice', key: 'unitPrice', width: 80, render: (v) => formatMoney(v || 0) },
    { title: '总价(元)', dataIndex: 'totalPrice', key: 'totalPrice', width: 90, render: (v) => formatMoney(v || 0) },
    { title: '供应商', dataIndex: 'supplier', key: 'supplier', width: 100 },
    { title: '采购日期', dataIndex: 'purchaseDate', key: 'purchaseDate', width: 100, render: (d) => formatDateOnly(d || '') }
  ]

  const totalMaterialCost = materialCosts.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0)

  const overviewTab = (
    <div>
      {project && (
        <>
          <Descriptions column={3} bordered size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="项目编号">{project.projectNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="项目名称">{project.name}</Descriptions.Item>
            <Descriptions.Item label="项目状态">
              <Tag color={getStatusColor(project.status)}>{getStatusText(project.status)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="客户名称">{project.customer?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{project.customer?.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="合同金额">{formatMoney(project.totalPrice || 0)}</Descriptions.Item>
            <Descriptions.Item label="销售负责人">{project.salesPerson || '-'}</Descriptions.Item>
            <Descriptions.Item label="项目经理">{project.projectManager || '-'}</Descriptions.Item>
            <Descriptions.Item label="经手人">{project.handler || '-'}</Descriptions.Item>
            <Descriptions.Item label="计划开始日期">{formatDateOnly(project.startDate || '')}</Descriptions.Item>
            <Descriptions.Item label="计划结束日期">{formatDateOnly(project.endDate || '')}</Descriptions.Item>
            <Descriptions.Item label="实际结束日期">{formatDateOnly(project.actualEndDate || '-')}</Descriptions.Item>
          </Descriptions>

          <Row gutter={[16, 16]}>
            <Col span={4}>
              <Card size="small">
                <Statistic title="设计方案" value={designPlans.length} suffix="个" />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic title="合同数" value={contracts.length} suffix="份" />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic title="施工阶段" value={constructionStages.length} suffix="个" />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic title="节点照片" value={stagePhotos.length} suffix="张" />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic title="客户反馈" value={feedbacks.length} suffix="条" />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic title="巡检任务" value={inspections.length} suffix="个" />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  )

  const salesTab = (
    <div>
      <Card size="small" title="装修方案" style={{ marginBottom: 16 }}>
        {designPlans.length > 0 ? (
          <List
            dataSource={designPlans}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.name}
                  description={
                    <Space direction="vertical" size={4}>
                      <span>预算：{formatMoney(item.estimatedPrice || 0)}</span>
                      {item.designFile && <span>设计文件：{item.designFile}</span>}
                      <span>状态：<Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag></span>
                      {item.description && <span>描述：{item.description}</span>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : <Empty description="暂无设计方案" />}
      </Card>

      <Card size="small" title="合同信息" style={{ marginBottom: 16 }}>
        {contracts.length > 0 ? (
          <List
            dataSource={contracts}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.contractNo || '合同'}
                  description={
                    <Space direction="vertical" size={4}>
                      <span>甲方：{item.partyA || '-'}</span>
                      <span>乙方：{item.partyB || '-'}</span>
                      <span>金额：{formatMoney(item.amount || 0)}</span>
                      <span>签订日期：{formatDateOnly(item.signDate || '')}</span>
                      <span>状态：<Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag></span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : <Empty description="暂无合同信息" />}
      </Card>

      <Card size="small" title="量房信息">
        {houseSurveys.length > 0 ? (
          <List
            dataSource={houseSurveys}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={`${item.surveyor || '量房员'} - ${formatDateOnly(item.surveyDate || '')}`}
                  description={
                    <Space direction="vertical" size={4}>
                      <span>面积：{item.area} ㎡</span>
                      <span>户型：{item.layout || '-'}</span>
                      <span>楼层：{item.floor || '-'}</span>
                      <span>朝向：{item.orientation || '-'}</span>
                      {item.description && <span>描述：{item.description}</span>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : <Empty description="暂无量房信息" />}
      </Card>
    </div>
  )

  const constructionTab = (
    <div>
      <Card size="small" title="施工阶段" style={{ marginBottom: 16 }}>
        {constructionStages.length > 0 ? (
          <List
            dataSource={constructionStages}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.name}
                  description={
                    <Space direction="vertical" size={4}>
                      <span>状态：<Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag></span>
                      <span>计划开始：{formatDateOnly(item.startDate || '')}</span>
                      <span>计划结束：{formatDateOnly(item.endDate || '')}</span>
                      {item.description && <span>描述：{item.description}</span>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : <Empty description="暂无施工阶段" />}
      </Card>

      <Card size="small" title="节点照片" style={{ marginBottom: 16 }}>
        {stagePhotos.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {stagePhotos.map((photo) => (
              <Card key={photo.id} size="small" cover={
                <div style={{
                  height: 120,
                  background: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: 12
                }}>
                  {photo.photoUrl || '暂无图片'}
                </div>
              }>
                <Card.Meta title={photo.title} description={`${photo.uploader} · ${formatDateOnly(photo.uploadTime || '')}`} />
              </Card>
            ))}
          </div>
        ) : <Empty description="暂无节点照片" />}
      </Card>

      <Card size="small" title="客户反馈" style={{ marginBottom: 16 }}>
        {feedbacks.length > 0 ? (
          <List
            dataSource={feedbacks}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={getFeedbackTypeColor(item.type)}>{getFeedbackTypeText(item.type)}</Tag>
                      <span>{formatDate(item.feedbackTime || '')}</span>
                    </Space>
                  }
                  description={
                    <div>
                      <p style={{ margin: '4px 0' }}>{item.content}</p>
                      {item.reply && (
                        <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 8 }}>
                          <p style={{ margin: 0 }}><b>回复：</b>{item.reply}</p>
                          <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: 12 }}>
                            {item.handler} · {formatDate(item.replyTime || '')}
                          </p>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : <Empty description="暂无客户反馈" />}
      </Card>

      <Card size="small" title="延期提醒">
        {delayReminders.length > 0 ? (
          <List
            dataSource={delayReminders}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <span>延期 {item.days} 天</span>
                      <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <p style={{ margin: '4px 0' }}>原因：{item.reason || '暂无'}</p>
                      <p style={{ margin: '4px 0', color: '#999', fontSize: 12 }}>
                        提醒时间：{formatDate(item.remindTime || '')}
                        {item.handler && ` · 处理人：${item.handler}`}
                      </p>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : <Empty description="暂无延期提醒" />}
      </Card>
    </div>
  )

  const processRecordsTab = (
    <div>
      <Card size="small">
        {processRecords.length > 0 ? (
          <List
            dataSource={processRecords}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={getProcessRecordTypeColor(item.type)}>
                        {getProcessRecordTypeText(item.type)}
                      </Tag>
                      <span>{item.title}</span>
                    </Space>
                  }
                  description={
                    <div>
                      {item.description && <p style={{ margin: '4px 0' }}>{item.description}</p>}
                      <p style={{ margin: '4px 0', color: '#999', fontSize: 12 }}>
                        时间：{formatDate(item.handleTime || '')}
                        {item.handler && ` · 处理人：${item.handler}`}
                      </p>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : <Empty description="暂无处理记录" />}
      </Card>
    </div>
  )

  const materialTab = (
    <div>
      <Card size="small" extra={`材料总费用：${formatMoney(totalMaterialCost)}`}>
        <Table
          columns={materialColumns}
          dataSource={materialCosts}
          rowKey="id"
          size="small"
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>
    </div>
  )

  const exportTab = (
    <div>
      <Card size="small" title="项目资料导出">
        <p style={{ marginBottom: 16, color: '#666' }}>
          导出项目的完整资料，包括基本信息、设计方案、合同、施工记录、材料成本等所有相关数据。
        </p>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
          导出项目资料 (JSON)
        </Button>
      </Card>
    </div>
  )

  const tabItems = [
    { key: 'overview', label: '概览', children: overviewTab },
    { key: 'sales', label: '销售信息', children: salesTab },
    { key: 'construction', label: '施工管理', children: constructionTab },
    { key: 'process', label: '处理记录', children: processRecordsTab },
    { key: 'material', label: '材料成本', children: materialTab },
    { key: 'export', label: '导出归档', children: exportTab }
  ]

  return (
    <div>
      <Card
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/projects')}
            />
            <span>项目详情</span>
            {project && <Tag color={getStatusColor(project.status)}>{getStatusText(project.status)}</Tag>}
          </Space>
        }
        loading={loading}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  )
}

export default ProjectDetail
