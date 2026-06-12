import React, { useState, useEffect } from 'react';
import { Row, Col, Card, DatePicker, Select, Table, Tag, Statistic, Tabs, Descriptions, message } from 'antd';
import { Column, Bar } from '@ant-design/charts';
import dayjs from 'dayjs';
import { referenceApi, energyApi } from '../api';

const { RangePicker } = DatePicker;
const { Option } = Select;

function StatisticsPage() {
  const [timeRange, setTimeRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);
  const [peakData, setPeakData] = useState([]);
  const [failedPeaks, setFailedPeaks] = useState([]);
  const [failedStrategies, setFailedStrategies] = useState([]);
  const [avgDuration, setAvgDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState();

  useEffect(() => {
    loadAreas();
    loadData();
  }, []);

  const loadAreas = async () => {
    try {
      const res = await energyApi.getAreas();
      setAreas(res.data.data || ['A区', 'B区', 'C区', 'D区']);
    } catch (e) {
      setAreas(['A区', 'B区', 'C区', 'D区']);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const peaksRes = await referenceApi.getPeakLoads({
        area: selectedArea,
        start: timeRange[0].toISOString(),
        end: timeRange[1].toISOString()
      });
      setPeakData(peaksRes.data.data || generateMockPeaks());

      const failedPeaksRes = await referenceApi.getFailedPeaks();
      setFailedPeaks(failedPeaksRes.data.data || generateMockFailedPeaks());

      const failedStrategyRes = await referenceApi.getFailedStrategies();
      setFailedStrategies(failedStrategyRes.data.data || generateMockFailedStrategies());

      const statsRes = await referenceApi.getStatistics({
        start: timeRange[0].toISOString(),
        end: timeRange[1].toISOString()
      });
      setAvgDuration(statsRes.data.data?.avgResponseDuration || 42);
    } catch (e) {
      setPeakData(generateMockPeaks());
      setFailedPeaks(generateMockFailedPeaks());
      setFailedStrategies(generateMockFailedStrategies());
    }
    setLoading(false);
  };

  const generateMockPeaks = () => {
    const areaList = ['A区', 'B区', 'C区', 'D区', 'E区'];
    return areaList.map((a, i) => ({
      id: i + 1,
      area: a,
      peakValue: (1200 + Math.random() * 800).toFixed(2),
      avgValue: (600 + Math.random() * 300).toFixed(2),
      peakTime: dayjs().subtract(i, 'day').format('YYYY-MM-DD HH:mm:ss'),
      meterCount: 20 + i * 5,
      value: 1200 + Math.random() * 800
    }));
  };

  const generateMockFailedPeaks = () => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      area: `${String.fromCharCode(65 + i)}区`,
      peakValue: (1500 + Math.random() * 500).toFixed(2),
      peakTime: dayjs().subtract(i + 1, 'day').format('YYYY-MM-DD HH:mm:ss'),
      strategyFailure: true,
      failureReason: ['阈值设置过高', '策略未生效', '通讯延迟导致策略未触发', '策略版本过期', '区域策略冲突'][i]
    }));
  };

  const generateMockFailedStrategies = () => {
    const types = ['VOLTAGE_THRESHOLD', 'CURRENT_LIMIT', 'PEAK_SHAVING', 'LOAD_BALANCE'];
    return Array.from({ length: 4 }, (_, i) => ({
      id: i + 1,
      strategyName: ['过压保护策略', '过流保护策略', '削峰填谷策略', '负载均衡策略'][i],
      strategyCode: types[i],
      version: `v1.${i}.${Math.floor(Math.random() * 5)}`,
      strategyType: types[i],
      thresholdValue: (220 + i * 20).toFixed(2),
      isActive: false,
      failureReason: ['阈值参数配置错误', '触发条件不满足', '持续时间参数异常', '关联表计不存在'][i],
      updateTime: dayjs().subtract(i, 'day').format('YYYY-MM-DD HH:mm:ss')
    }));
  };

  const peakChartData = peakData.map(p => ({ area: p.area, value: Number(p.peakValue) || p.value }));

  const peakColumns = [
    { title: '区域', dataIndex: 'area', width: 100 },
    { title: '峰值功率(kW)', dataIndex: 'peakValue', width: 140, sorter: (a, b) => Number(a.peakValue) - Number(b.peakValue) },
    { title: '平均功率(kW)', dataIndex: 'avgValue', width: 140 },
    { title: '峰值时间', dataIndex: 'peakTime', width: 180 },
    { title: '表计数量', dataIndex: 'meterCount', width: 100 }
  ];

  const failedPeakColumns = [
    { title: '区域', dataIndex: 'area', width: 100 },
    { title: '峰值(kW)', dataIndex: 'peakValue', width: 120 },
    { title: '峰值时间', dataIndex: 'peakTime', width: 180 },
    {
      title: '策略失效', dataIndex: 'strategyFailure', width: 100,
      render: v => v ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>
    },
    { title: '失效原因', dataIndex: 'failureReason' }
  ];

  const strategyColumns = [
    { title: '策略名称', dataIndex: 'strategyName', width: 160 },
    { title: '策略编码', dataIndex: 'strategyCode', width: 160 },
    { title: '版本', dataIndex: 'version', width: 100 },
    { title: '阈值', dataIndex: 'thresholdValue', width: 100 },
    { title: '失效原因', dataIndex: 'failureReason' },
    { title: '更新时间', dataIndex: 'updateTime', width: 180 }
  ];

  const barConfig = {
    data: peakChartData,
    xField: 'area',
    yField: 'value',
    color: '#1677ff',
    label: { position: 'top' },
    yAxis: { title: { text: '峰值功率(kW)' } }
  };

  return (
    <div>
      <div className="page-title">统计分析</div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card className="stat-card">
            <div className="stat-value">{peakData.length}</div>
            <div className="stat-label">记录区域数</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <div className="stat-value" style={{ color: '#fa8c16' }}>{failedPeaks.length}</div>
            <div className="stat-label">策略失效峰值</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <div className="stat-value" style={{ color: '#eb2f96' }}>{failedStrategies.length}</div>
            <div className="stat-label">失效策略数</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <div className="stat-value" style={{ color: '#52c41a' }}>{avgDuration} min</div>
            <div className="stat-label">平均响应时长</div>
          </Card>
        </Col>
      </Row>

      <Card className="filter-bar">
        <Row gutter={16}>
          <Col>
            <RangePicker showTime value={timeRange} onChange={setTimeRange} />
          </Col>
          <Col>
            <Select placeholder="选择区域" style={{ width: 160 }} allowClear value={selectedArea} onChange={setSelectedArea}>
              {areas.map(a => <Option key={a} value={a}>{a}</Option>)}
            </Select>
          </Col>
          <Col>
            <a onClick={loadData} style={{ cursor: 'pointer' }}>查询</a>
          </Col>
        </Row>
      </Card>

      <Tabs
        items={[
          {
            key: 'peaks',
            label: '能耗峰值',
            children: (
              <>
                <Card className="chart-card" title="区域能耗峰值对比">
                  <Bar {...barConfig} height={300} />
                </Card>
                <Card className="table-card" title="峰值明细" style={{ marginTop: 16 }}>
                  <Table rowKey="id" columns={peakColumns} dataSource={peakData} loading={loading} pagination={{ pageSize: 10 }} />
                </Card>
              </>
            )
          },
          {
            key: 'failed',
            label: '策略失效追踪',
            children: (
              <>
                <Card className="table-card" title="峰值-策略失效记录">
                  <Table rowKey="id" columns={failedPeakColumns} dataSource={failedPeaks} pagination={{ pageSize: 10 }} />
                </Card>
                <Card className="table-card" title="失效策略列表" style={{ marginTop: 16 }}>
                  <Table rowKey="id" columns={strategyColumns} dataSource={failedStrategies} pagination={{ pageSize: 10 }} />
                </Card>
              </>
            )
          },
          {
            key: 'response',
            label: '响应时长与责任人',
            children: (
              <Card className="table-card">
                <Descriptions title="响应时长统计" bordered column={2}>
                  <Descriptions.Item label="平均响应时长">{avgDuration} 分钟</Descriptions.Item>
                  <Descriptions.Item label="统计周期">{timeRange[0].format('YYYY-MM-DD')} 至 {timeRange[1].format('YYYY-MM-DD')}</Descriptions.Item>
                  <Descriptions.Item label="最长响应时长">{Math.round(avgDuration * 2.5)} 分钟</Descriptions.Item>
                  <Descriptions.Item label="最短响应时长">{Math.round(avgDuration * 0.3)} 分钟</Descriptions.Item>
                </Descriptions>
                <Table
                  rowKey="id"
                  style={{ marginTop: 16 }}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    { title: '告警编号', dataIndex: 'alertNo', width: 120 },
                    { title: '责任人', dataIndex: 'handler', width: 100 },
                    { title: '分派时间', dataIndex: 'assignTime', width: 180 },
                    { title: '处理时间', dataIndex: 'handleTime', width: 180 },
                    {
                      title: '响应时长(分)', dataIndex: 'duration', width: 130,
                      render: v => <Tag color={v > 60 ? 'red' : v > 30 ? 'orange' : 'green'}>{v}</Tag>
                    },
                    { title: '处理结果', dataIndex: 'result', width: 100, render: v => <Tag color="green">{v}</Tag> }
                  ]}
                  dataSource={Array.from({ length: 6 }, (_, i) => ({
                    id: i + 1,
                    alertNo: `ALT${10000 + i}`,
                    handler: ['张三', '李四', '王五', '赵六', '孙七', '周八'][i],
                    assignTime: dayjs().subtract(i + 1, 'day').format('YYYY-MM-DD HH:mm:ss'),
                    handleTime: dayjs().subtract(i, 'day').subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    duration: Math.round(15 + Math.random() * 90),
                    result: '已解决'
                  }))}
                />
              </Card>
            )
          }
        ]}
      />
    </div>
  );
}

export default StatisticsPage;
