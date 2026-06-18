import { useState, useEffect } from 'react'
import { Card, Row, Col, DatePicker, Form, Select, Tabs, Table, Statistic } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import { statsApi } from '@/api'
import type { BaseQuery } from '@/types'

const { RangePicker } = DatePicker
const { Option } = Select

const StatsPage = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [accuracyData, setAccuracyData] = useState<any>({
    byLegalOwner: [],
    byDate: [],
    byErrorReason: [],
  })

  const fetchData = async (params: BaseQuery = {}) => {
    setLoading(true)
    try {
      const data = await statsApi.getAccuracyStats(params)
      setAccuracyData(data || { byLegalOwner: [], byDate: [], byErrorReason: [] })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSearch = () => {
    const values = form.getFieldsValue()
    const params: BaseQuery = {}
    if (values.dateRange) {
      params.startTime = values.dateRange[0].format('YYYY-MM-DD HH:mm:ss')
      params.endTime = values.dateRange[1].format('YYYY-MM-DD HH:mm:ss')
    }
    fetchData(params)
  }

  const getDateChartOption = () => {
    const dates = accuracyData.byDate?.map((item: any) => item.date) || []
    const totalCounts = accuracyData.byDate?.map((item: any) => item.totalCount) || []
    const successCounts = accuracyData.byDate?.map((item: any) => item.successCount) || []
    const failCounts = accuracyData.byDate?.map((item: any) => item.failCount) || []

    return {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['总数', '成功', '失败'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '总数',
          type: 'line',
          data: totalCounts,
          smooth: true,
        },
        {
          name: '成功',
          type: 'line',
          data: successCounts,
          smooth: true,
          lineStyle: { color: '#52c41a' },
          itemStyle: { color: '#52c41a' },
        },
        {
          name: '失败',
          type: 'line',
          data: failCounts,
          smooth: true,
          lineStyle: { color: '#ff4d4f' },
          itemStyle: { color: '#ff4d4f' },
        },
      ],
    }
  }

  const getLegalOwnerChartOption = () => {
    const owners = accuracyData.byLegalOwner?.map((item: any) => item.legalOwner) || []
    const accuracy = accuracyData.byLegalOwner?.map((item: any) => Number(item.accuracy?.toFixed?.(2)) || item.accuracy) || []

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value}%' },
      },
      yAxis: {
        type: 'category',
        data: owners,
      },
      series: [
        {
          name: '准确率',
          type: 'bar',
          data: accuracy,
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
          },
          itemStyle: {
            color: '#1677ff',
          },
        },
      ],
    }
  }

  const getErrorReasonChartOption = () => {
    const reasons = accuracyData.byErrorReason?.map((item: any) => item.errorReason) || []
    const counts = accuracyData.byErrorReason?.map((item: any) => item.count) || []

    return {
      tooltip: {
        trigger: 'item',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          name: '异常分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: reasons.map((reason: string, index: number) => ({
            name: reason,
            value: counts[index],
          })),
        },
      ],
    }
  }

  const legalOwnerColumns: ColumnsType<any> = [
    {
      title: '法务负责人',
      dataIndex: 'legalOwner',
      width: 150,
    },
    {
      title: '总数',
      dataIndex: 'totalCount',
      width: 100,
    },
    {
      title: '成功数',
      dataIndex: 'successCount',
      width: 100,
      render: (value) => <span style={{ color: '#52c41a' }}>{value}</span>,
    },
    {
      title: '失败数',
      dataIndex: 'failCount',
      width: 100,
      render: (value) => <span style={{ color: '#ff4d4f' }}>{value}</span>,
    },
    {
      title: '风险数',
      dataIndex: 'riskCount',
      width: 100,
      render: (value) => <span style={{ color: '#faad14' }}>{value}</span>,
    },
    {
      title: '准确率',
      dataIndex: 'accuracy',
      width: 150,
      render: (value) => `${Number(value || 0).toFixed(2)}%`,
    },
  ]

  const errorReasonColumns: ColumnsType<any> = [
    {
      title: '异常原因',
      dataIndex: 'errorReason',
      width: 300,
    },
    {
      title: '出现次数',
      dataIndex: 'count',
      width: 150,
    },
    {
      title: '占比',
      dataIndex: 'ratio',
      width: 150,
      render: (_, record) => {
        const total = accuracyData.byErrorReason?.reduce(
          (sum: number, item: any) => sum + item.count,
          0
        ) || 1
        return `${((record.count / total) * 100).toFixed(2)}%`
      },
    },
  ]

  const dateColumns: ColumnsType<any> = [
    {
      title: '日期',
      dataIndex: 'date',
      width: 150,
    },
    {
      title: '总数',
      dataIndex: 'totalCount',
      width: 100,
    },
    {
      title: '成功数',
      dataIndex: 'successCount',
      width: 100,
      render: (value) => <span style={{ color: '#52c41a' }}>{value}</span>,
    },
    {
      title: '失败数',
      dataIndex: 'failCount',
      width: 100,
      render: (value) => <span style={{ color: '#ff4d4f' }}>{value}</span>,
    },
    {
      title: '准确率',
      dataIndex: 'accuracy',
      width: 150,
      render: (_, record) => {
        const total = record.totalCount || 1
        return `${((record.successCount / total) * 100).toFixed(2)}%`
      },
    },
  ]

  const totalAll = accuracyData.byLegalOwner?.reduce(
    (sum: number, item: any) => sum + (item.totalCount || 0),
    0
  ) || 0
  const successAll = accuracyData.byLegalOwner?.reduce(
    (sum: number, item: any) => sum + (item.successCount || 0),
    0
  ) || 0
  const failAll = accuracyData.byLegalOwner?.reduce(
    (sum: number, item: any) => sum + (item.failCount || 0),
    0
  ) || 0
  const overallAccuracy = totalAll > 0 ? ((successAll / totalAll) * 100).toFixed(2) : '0.00'

  const tabItems = [
    {
      key: 'overview',
      label: '总览',
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic title="生成总数" value={totalAll} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="成功数量"
                  value={successAll}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="失败数量"
                  value={failAll}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="整体准确率"
                  value={overallAccuracy}
                  suffix="%"
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="按日期趋势">
                <ReactECharts option={getDateChartOption()} style={{ height: 350 }} />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="异常原因分布">
                <ReactECharts option={getErrorReasonChartOption()} style={{ height: 350 }} />
              </Card>
            </Col>
          </Row>

          <Card title="按法务负责人" style={{ marginTop: 16 }}>
            <ReactECharts option={getLegalOwnerChartOption()} style={{ height: 350 }} />
          </Card>
        </div>
      ),
    },
    {
      key: 'byLegalOwner',
      label: '按法务负责人',
      children: (
        <Table
          columns={legalOwnerColumns}
          dataSource={accuracyData.byLegalOwner || []}
          rowKey="legalOwner"
          loading={loading}
          pagination={false}
        />
      ),
    },
    {
      key: 'byDate',
      label: '按日期',
      children: (
        <Table
          columns={dateColumns}
          dataSource={accuracyData.byDate || []}
          rowKey="date"
          loading={loading}
          pagination={false}
        />
      ),
    },
    {
      key: 'byErrorReason',
      label: '按异常原因',
      children: (
        <Table
          columns={errorReasonColumns}
          dataSource={accuracyData.byErrorReason || []}
          rowKey="errorReason"
          loading={loading}
          pagination={false}
        />
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">统计报表</div>
      </div>

      <div className="filter-form">
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="dateRange" label="时间范围">
            <RangePicker
              showTime
              defaultValue={[dayjs().subtract(30, 'day'), dayjs()]}
            />
          </Form.Item>
          <Form.Item>
            <Select placeholder="法务负责人" style={{ width: 150 }} allowClear>
              <Option value="legal1">法务专员A</Option>
              <Option value="legal2">法务专员B</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Select placeholder="来源" style={{ width: 120 }} allowClear>
              <Option value="MARKETING">市场部</Option>
              <Option value="SALES">销售部</Option>
              <Option value="CUSTOMER_SERVICE">客服部</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <button type="submit" className="ant-btn ant-btn-primary">
              查询
            </button>
          </Form.Item>
        </Form>
      </div>

      <Card>
        <Tabs defaultActiveKey="overview" items={tabItems} />
      </Card>
    </div>
  )
}

export default StatsPage
