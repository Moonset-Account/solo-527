import { useState, useEffect } from 'react'
import {
  Card,
  Tabs,
  Select,
  DatePicker,
  Button,
  Table,
  Statistic,
  Row,
  Col,
  message,
  Space
} from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Project, MaterialCost } from '@/types'
import { formatMoney, formatDateOnly } from '@/utils'
import { getMaterialCostReport, getMonthlySummary, getProjectSummary } from '@/api/report'
import { getProjectList } from '@/api/project'
import dayjs from 'dayjs'

const { Option } = Select
const { MonthPicker } = DatePicker

const Reports = () => {
  const [activeTab, setActiveTab] = useState('material')
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number>()
  const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format('YYYY-MM'))
  const [materialData, setMaterialData] = useState<MaterialCost[]>([])
  const [monthlyData, setMonthlyData] = useState<any>(null)
  const [projectSummaryData, setProjectSummaryData] = useState<any>(null)

  const loadProjects = async () => {
    try {
      const response = await getProjectList({ page: 1, pageSize: 1000 })
      setProjects(response.data.list || [])
    } catch (error) {
      console.error('加载项目列表失败', error)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const loadMaterialCostReport = async () => {
    if (!selectedProjectId || !selectedMonth) return
    setLoading(true)
    try {
      const response = await getMaterialCostReport({
        projectId: selectedProjectId,
        month: selectedMonth
      })
      setMaterialData(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('加载材料成本报表失败', error)
      message.error('加载材料成本报表失败')
    } finally {
      setLoading(false)
    }
  }

  const loadMonthlySummary = async () => {
    if (!selectedMonth) return
    setLoading(true)
    try {
      const response = await getMonthlySummary(selectedMonth)
      setMonthlyData(response.data)
    } catch (error) {
      console.error('加载月度汇总失败', error)
      message.error('加载月度汇总失败')
    } finally {
      setLoading(false)
    }
  }

  const loadProjectSummary = async () => {
    if (!selectedProjectId) return
    setLoading(true)
    try {
      const response = await getProjectSummary(selectedProjectId)
      setProjectSummaryData(response.data)
    } catch (error) {
      console.error('加载项目汇总失败', error)
      message.error('加载项目汇总失败')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    if (key === 'material') {
      loadMaterialCostReport()
    } else if (key === 'monthly') {
      loadMonthlySummary()
    } else if (key === 'project') {
      loadProjectSummary()
    }
  }

  const materialColumns: ColumnsType<MaterialCost> = [
    { title: '材料名称', dataIndex: 'materialName', key: 'materialName', width: 150 },
    { title: '规格型号', dataIndex: 'specification', key: 'specification', width: 120 },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    { title: '单价(元)', dataIndex: 'unitPrice', key: 'unitPrice', width: 100, render: (v) => formatMoney(v || 0) },
    { title: '总价(元)', dataIndex: 'totalPrice', key: 'totalPrice', width: 120, render: (v) => formatMoney(v || 0) },
    { title: '供应商', dataIndex: 'supplier', key: 'supplier', width: 120 },
    { title: '采购日期', dataIndex: 'purchaseDate', key: 'purchaseDate', width: 120, render: (d) => formatDateOnly(d || '') },
    { title: '经手人', dataIndex: 'handler', key: 'handler', width: 100 },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true }
  ]

  const totalMaterialCost = materialData.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0)

  const items = [
    {
      key: 'material',
      label: '材料成本报表',
      children: (
        <div>
          <Space style={{ marginBottom: 16 }} wrap>
            <Select
              placeholder="选择项目"
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              style={{ width: 250 }}
              showSearch
              optionFilterProp="children"
            >
              {projects.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
            <MonthPicker
              value={selectedMonth ? dayjs(selectedMonth) : null}
              onChange={(date) => date && setSelectedMonth(date.format('YYYY-MM'))}
              style={{ width: 200 }}
              placeholder="选择月份"
            />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={loadMaterialCostReport}
              loading={loading}
            >
              查询
            </Button>
          </Space>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic title="材料总费用" value={totalMaterialCost} precision={2} prefix="¥" />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="材料种类" value={materialData.length} suffix="种" />
              </Card>
            </Col>
          </Row>
          <Table
            columns={materialColumns}
            dataSource={materialData}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        </div>
      )
    },
    {
      key: 'monthly',
      label: '月度汇总',
      children: (
        <div>
          <Space style={{ marginBottom: 16 }} wrap>
            <MonthPicker
              value={selectedMonth ? dayjs(selectedMonth) : null}
              onChange={(date) => date && setSelectedMonth(date.format('YYYY-MM'))}
              style={{ width: 200 }}
              placeholder="选择月份"
            />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={loadMonthlySummary}
              loading={loading}
            >
              查询
            </Button>
          </Space>
          {monthlyData && (
            <div>
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col span={6}>
                  <Card>
                    <Statistic title="项目总数" value={monthlyData.totalProjects || 0} suffix="个" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="新增项目" value={monthlyData.newProjects || 0} suffix="个" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="完成项目" value={monthlyData.completedProjects || 0} suffix="个" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="合同总额"
                      value={monthlyData.totalContractAmount || 0}
                      precision={2}
                      prefix="¥"
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="材料成本"
                      value={monthlyData.totalMaterialCost || 0}
                      precision={2}
                      prefix="¥"
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="客户反馈" value={monthlyData.totalFeedbacks || 0} suffix="条" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="巡检任务" value={monthlyData.totalInspections || 0} suffix="个" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="售后工单" value={monthlyData.totalAfterSales || 0} suffix="个" />
                  </Card>
                </Col>
              </Row>
            </div>
          )}
          {!monthlyData && !loading && (
            <Card style={{ textAlign: 'center', color: '#999' }}>
              请选择月份后点击查询
            </Card>
          )}
        </div>
      )
    },
    {
      key: 'project',
      label: '项目汇总',
      children: (
        <div>
          <Space style={{ marginBottom: 16 }} wrap>
            <Select
              placeholder="选择项目"
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              style={{ width: 250 }}
              showSearch
              optionFilterProp="children"
            >
              {projects.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={loadProjectSummary}
              loading={loading}
            >
              查询
            </Button>
          </Space>
          {projectSummaryData && (
            <div>
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="项目预算"
                      value={projectSummaryData.totalPrice || 0}
                      precision={2}
                      prefix="¥"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="材料成本"
                      value={projectSummaryData.totalMaterialCost || 0}
                      precision={2}
                      prefix="¥"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="售后费用"
                      value={projectSummaryData.totalAfterSalesCost || 0}
                      precision={2}
                      prefix="¥"
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={6}>
                  <Card>
                    <Statistic title="设计方案" value={projectSummaryData.designPlanCount || 0} suffix="个" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="合同数量" value={projectSummaryData.contractCount || 0} suffix="份" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="施工阶段" value={projectSummaryData.constructionStageCount || 0} suffix="个" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="节点照片" value={projectSummaryData.stagePhotoCount || 0} suffix="张" />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Card>
                    <Statistic title="客户反馈" value={projectSummaryData.feedbackCount || 0} suffix="条" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="巡检任务" value={projectSummaryData.inspectionCount || 0} suffix="个" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="售后工单" value={projectSummaryData.afterSalesCount || 0} suffix="个" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="延期提醒" value={projectSummaryData.delayReminderCount || 0} suffix="条" />
                  </Card>
                </Col>
              </Row>
            </div>
          )}
          {!projectSummaryData && !loading && (
            <Card style={{ textAlign: 'center', color: '#999' }}>
              请选择项目后点击查询
            </Card>
          )}
        </div>
      )
    }
  ]

  return (
    <Card title="报表中心">
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={items} />
    </Card>
  )
}

export default Reports
