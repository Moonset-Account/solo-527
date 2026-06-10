import { useState } from 'react'
import {
  Card,
  Tabs,
  Table,
  Button,
  Select,
  DatePicker,
  Space,
  Statistic,
  Row,
  Col,
  Divider
} from 'antd'
import { ExportOutlined, DollarOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { MaterialCost, ProjectSummary } from '@/types'
import { formatMoney, formatDateOnly } from '@/utils'
import { mockMaterialCosts, mockProjectSummaries, mockProjects } from '@/mock/data'
import dayjs from 'dayjs'

const { MonthPicker } = DatePicker

const Reports = () => {
  const [activeTab, setActiveTab] = useState('material')
  const [materialData, setMaterialData] = useState<MaterialCost[]>(mockMaterialCosts)
  const [selectedProject, setSelectedProject] = useState<string>()
  const [selectedMonth, setSelectedMonth] = useState<string>('2024-03')

  const projectOptions = mockProjects.map(p => ({ value: p.id, label: p.name }))

  const totalMaterialCost = materialData.reduce((sum, item) => sum + item.totalPrice, 0)
  const totalMaterialQuantity = materialData.reduce((sum, item) => sum + item.quantity, 0)

  const filterMaterialData = () => {
    let filtered = [...mockMaterialCosts]
    if (selectedProject) {
      filtered = filtered.filter(item => item.projectId === selectedProject)
    }
    setMaterialData(filtered)
  }

  const projectSummaries = mockProjectSummaries

  const totalRevenue = projectSummaries.reduce((sum, item) => sum + item.totalRevenue, 0)
  const totalCost = projectSummaries.reduce((sum, item) => sum + item.totalCost, 0)
  const totalProfit = projectSummaries.reduce((sum, item) => sum + item.profit, 0)
  const avgProfitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : '0'

  const materialColumns: ColumnsType<MaterialCost> = [
    { title: '项目名称', dataIndex: 'projectName', key: 'projectName' },
    { title: '材料名称', dataIndex: 'name', key: 'name' },
    { title: '规格', dataIndex: 'specification', key: 'specification' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', width: 100, render: (v) => formatMoney(v) },
    { title: '总价', dataIndex: 'totalPrice', key: 'totalPrice', width: 120, render: (v) => formatMoney(v) },
    { title: '供应商', dataIndex: 'supplier', key: 'supplier', width: 120 },
    { title: '采购日期', dataIndex: 'purchaseDate', key: 'purchaseDate', width: 120, render: (d) => formatDateOnly(d) }
  ]

  const summaryColumns: ColumnsType<ProjectSummary> = [
    { title: '项目名称', dataIndex: 'projectName', key: 'projectName' },
    { title: '总收入', dataIndex: 'totalRevenue', key: 'totalRevenue', width: 120, render: (v) => formatMoney(v) },
    { title: '材料成本', dataIndex: 'materialCost', key: 'materialCost', width: 120, render: (v) => formatMoney(v) },
    { title: '人工成本', dataIndex: 'laborCost', key: 'laborCost', width: 120, render: (v) => formatMoney(v) },
    { title: '其他成本', dataIndex: 'otherCost', key: 'otherCost', width: 120, render: (v) => formatMoney(v) },
    { title: '总成本', dataIndex: 'totalCost', key: 'totalCost', width: 120, render: (v) => formatMoney(v) },
    { title: '利润', dataIndex: 'profit', key: 'profit', width: 120, render: (v) => formatMoney(v) },
    {
      title: '利润率',
      dataIndex: 'profitMargin',
      key: 'profitMargin',
      width: 100,
      render: (v: number) => <span style={{ color: v > 30 ? '#52c41a' : '#faad14' }}>{v.toFixed(2)}%</span>
    }
  ]

  const tabItems = [
    {
      key: 'material',
      label: '材料成本报表',
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }} wrap>
            <Select
              placeholder="选择项目"
              value={selectedProject}
              onChange={setSelectedProject}
              style={{ width: 250 }}
              allowClear
              options={projectOptions}
            />
            <MonthPicker
              placeholder="选择月份"
              value={selectedMonth ? dayjs(selectedMonth) : undefined}
              onChange={(date) => setSelectedMonth(date ? date.format('YYYY-MM') : '')}
              style={{ width: 200 }}
            />
            <Button type="primary" onClick={filterMaterialData}>查询</Button>
            <Button icon={<ExportOutlined />}>导出报表</Button>
          </Space>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="材料总费用"
                  value={totalMaterialCost}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="材料种类数"
                  value={materialData.length}
                  suffix="种"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="采购数量"
                  value={totalMaterialQuantity}
                  suffix="件"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <Divider />

          <Table
            columns={materialColumns}
            dataSource={materialData}
            rowKey="id"
            scroll={{ x: 1000 }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={6}>合计</Table.Summary.Cell>
                  <Table.Summary.Cell index={6}>
                    <span style={{ fontWeight: 'bold', color: '#f5222d' }}>{formatMoney(totalMaterialCost)}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7}></Table.Summary.Cell>
                  <Table.Summary.Cell index={8}></Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>
      )
    },
    {
      key: 'monthly',
      label: '月度汇总',
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }} wrap>
            <MonthPicker
              placeholder="选择月份"
              value={selectedMonth ? dayjs(selectedMonth) : undefined}
              onChange={(date) => setSelectedMonth(date ? date.format('YYYY-MM') : '')}
              style={{ width: 200 }}
            />
            <Button type="primary">查询</Button>
            <Button icon={<ExportOutlined />}>导出报表</Button>
          </Space>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="项目数量"
                  value={projectSummaries.length}
                  suffix="个"
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总收入"
                  value={totalRevenue}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#3f8600' }}
                  prefixCls=""
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  <RiseOutlined style={{ color: '#52c41a' }}  /> 较上月增长 12.5%
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总成本"
                  value={totalCost}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#cf1322' }}
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  <FallOutlined style={{ color: '#52c41a' }}  /> 较上月下降 3.2%
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总利润"
                  value={totalProfit}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#3f8600' }}
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  利润率 {avgProfitMargin}%
                </div>
              </Card>
            </Col>
          </Row>

          <Divider orientation="left">各项目明细</Divider>

          <Table
            columns={summaryColumns}
            dataSource={projectSummaries}
            rowKey="projectId"
            scroll={{ x: 1000 }}
            pagination={false}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                  <Table.Summary.Cell index={1}><strong>{formatMoney(totalRevenue)}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={2}><strong>{formatMoney(projectSummaries.reduce((s, i) => s + i.materialCost, 0))}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={3}><strong>{formatMoney(projectSummaries.reduce((s, i) => s + i.laborCost, 0))}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={4}><strong>{formatMoney(projectSummaries.reduce((s, i) => s + i.otherCost, 0))}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={5}><strong>{formatMoney(totalCost)}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={6}><strong style={{ color: '#f5222d' }}>{formatMoney(totalProfit)}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={7}><strong>{avgProfitMargin}%</strong></Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>
      )
    },
    {
      key: 'project',
      label: '项目汇总报表',
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }} wrap>
            <Select
              placeholder="选择项目"
              style={{ width: 300 }}
              options={projectOptions}
              defaultValue={projectSummaries[0]?.projectId}
            />
            <Button type="primary">查询</Button>
            <Button icon={<ExportOutlined />}>导出报表</Button>
          </Space>

          {projectSummaries.length > 0 && (
            <>
              <Card size="small" style={{ marginBottom: 16 }} title={projectSummaries[0].projectName}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Statistic
                      title="项目总收入"
                      value={projectSummaries[0].totalRevenue}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ color: '#3f8600', fontSize: 20 }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="项目总成本"
                      value={projectSummaries[0].totalCost}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ color: '#cf1322', fontSize: 20 }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="项目利润"
                      value={projectSummaries[0].profit}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ color: '#3f8600', fontSize: 20 }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="利润率"
                      value={projectSummaries[0].profitMargin}
                      precision={2}
                      suffix="%"
                      valueStyle={{ color: '#722ed1', fontSize: 20 }}
                    />
                  </Col>
                </Row>
              </Card>

              <Divider orientation="left">成本构成</Divider>

              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Card size="small">
                    <div style={{ color: '#666', marginBottom: 8 }}>材料成本</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                      {formatMoney(projectSummaries[0].materialCost)}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      占总成本 {((projectSummaries[0].materialCost / projectSummaries[0].totalCost) * 100).toFixed(1)}%
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <div style={{ color: '#666', marginBottom: 8 }}>人工成本</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#faad14' }}>
                      {formatMoney(projectSummaries[0].laborCost)}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      占总成本 {((projectSummaries[0].laborCost / projectSummaries[0].totalCost) * 100).toFixed(1)}%
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <div style={{ color: '#666', marginBottom: 8 }}>其他成本</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#722ed1' }}>
                      {formatMoney(projectSummaries[0].otherCost)}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      占总成本 {((projectSummaries[0].otherCost / projectSummaries[0].totalCost) * 100).toFixed(1)}%
                    </div>
                  </Card>
                </Col>
              </Row>

              <Divider orientation="left">材料明细</Divider>

              <Table
                columns={materialColumns}
                dataSource={mockMaterialCosts.filter(m => m.projectId === projectSummaries[0].projectId)}
                rowKey="id"
                scroll={{ x: 1000 }}
                pagination={false}
                size="small"
                summary={() => {
                  const total = mockMaterialCosts
                    .filter(m => m.projectId === projectSummaries[0].projectId)
                    .reduce((s, i) => s + i.totalPrice, 0)
                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={6}>材料合计</Table.Summary.Cell>
                        <Table.Summary.Cell index={6}>
                          <span style={{ fontWeight: 'bold', color: '#f5222d' }}>{formatMoney(total)}</span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={7}></Table.Summary.Cell>
                        <Table.Summary.Cell index={8}></Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )
                }}
              />
            </>
          )}
        </Card>
      )
    }
  ]

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  )
}

export default Reports
