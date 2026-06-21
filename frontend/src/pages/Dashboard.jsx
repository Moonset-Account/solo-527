import { Card, Row, Col } from 'antd'
import ReactECharts from 'echarts-for-react'

const Dashboard = () => {
  const lineOption = {
    title: { text: '用户增长趋势' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增用户', '活跃用户'] },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '新增用户',
        type: 'line',
        data: [120, 200, 150, 80, 70, 110, 130],
      },
      {
        name: '活跃用户',
        type: 'line',
        data: [220, 300, 250, 180, 170, 210, 230],
      },
    ],
  }

  const pieOption = {
    title: { text: '用户分布', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '访问来源',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 1048, name: '搜索引擎' },
          { value: 735, name: '直接访问' },
          { value: 580, name: '邮件营销' },
          { value: 484, name: '联盟广告' },
          { value: 300, name: '视频广告' },
        ],
      },
    ],
  }

  const barOption = {
    title: { text: '销售数据' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '销量',
        type: 'bar',
        data: [5, 20, 36, 10, 10, 20],
      },
    ],
  }

  return (
    <div>
      <h2>数据看板</h2>
      <Row gutter={16}>
        <Col span={12}>
          <Card style={{ marginBottom: 16 }}>
            <ReactECharts option={lineOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ marginBottom: 16 }}>
            <ReactECharts option={pieOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
      <Card>
        <ReactECharts option={barOption} style={{ height: 300 }} />
      </Card>
    </div>
  )
}

export default Dashboard
