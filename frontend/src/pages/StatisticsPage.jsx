import React, { useState, useEffect } from 'react';
import { Row, Col, Card, DatePicker, Select, Table, Tag, Tabs, Descriptions, Input, Space, Button, message } from 'antd';
import { Bar } from '@ant-design/charts';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { referenceApi, energyApi, exportApi } from '../api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const alertLevelMap = {
  LOW: { color: 'green', text: '低' },
  MEDIUM: { color: 'orange', text: '中' },
  HIGH: { color: 'red', text: '高' },
  CRITICAL: { color: 'magenta', text: '严重' }
};

const handleResultMap = {
  RESOLVED: { color: 'green', text: '已解决' },
  PROCESSING: { color: 'blue', text: '处理中' },
  CLOSED: { color: 'gray', text: '关闭' },
  ESCALATED: { color: 'orange', text: '升级' }
};

function StatisticsPage() {
  const [timeRange, setTimeRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);
  const [peakData, setPeakData] = useState([]);
  const [failedPeaks, setFailedPeaks] = useState([]);
  const [failedStrategies, setFailedStrategies] = useState([]);
  const [avgDuration, setAvgDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState();

  const [responseData, setResponseData] = useState([]);
  const [responseTotal, setResponseTotal] = useState(0);
  const [responsePage, setResponsePage] = useState(1);
  const [responsePageSize, setResponsePageSize] = useState(10);
  const [handlerFilter, setHandlerFilter] = useState('');
  const [responseLoading, setResponseLoading] = useState(false);

  useEffect(() => {
    loadAreas();
    loadData();
    loadResponseData();
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

  const loadResponseData = async (page = 1, pageSize = 10) => {
    setResponseLoading(true);
    try {
      const res = await referenceApi.getResponseDurations({
        start: timeRange[0].toISOString(),
        end: timeRange[1].toISOString(),
        handler: handlerFilter || undefined,
        page: page - 1,
        size: pageSize
      });
      const pageData = res.data.data;
      if (pageData && pageData.content) {
        setResponseData(pageData.content.map(item => ({
          ...item,
          duration: item.responseDuration,
          result: item.handleResult
        })));
        setResponseTotal(pageData.totalElements || pageData.total || 0);
      } else {
        setResponseData(generateMockResponseData());
        setResponseTotal(50);
      }
    } catch (e) {
      setResponseData(generateMockResponseData());
      setResponseTotal(50);
    }
    setResponseLoading(false);
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

  const generateMockResponseData = () => {
    const handlers = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十'];
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      alertId: 100 + i,
      alertNo: `ALT${10000 + i}`,
      alertType: ['OVER_VOLTAGE', 'OVER_CURRENT', 'POWER_ABNORMAL', 'COMMUNICATION_FAIL'][i % 4],
      alertLevel: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][i % 4],
      meterName: `电表-${String.fromCharCode(65 + (i % 4))}${100 + i}`,
      area: `${String.fromCharCode(65 + (i % 4))}区`,
      handler: handlers[i % 8],
      assignee: handlers[(i + 1) % 8],
      alertTime: dayjs().subtract(i + 1, 'day').format('YYYY-MM-DD HH:mm:ss'),
      assignTime: dayjs().subtract(i + 1, 'day').add(10, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      handleTime: dayjs().subtract(i, 'day').subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      responseDuration: Math.round(15 + Math.random() * 120),
      duration: Math.round(15 + Math.random() * 120),
      handleResult: 'RESOLVED',
      result: '已解决',
      handleRemark: `处理说明-${i + 1}`
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

  const responseColumns = [
    { title: '告警编号', dataIndex: 'alertNo', width: 120 },
    { title: '区域', dataIndex: 'area', width: 80 },
    { title: '电表', dataIndex: 'meterName', width: 120 },
    {
      title: '告警级别', dataIndex: 'alertLevel', width: 100,
      render: v => alertLevelMap[v] ? <Tag color={alertLevelMap[v].color}>{alertLevelMap[v].text}</Tag> : v
    },
    { title: '责任人', dataIndex: 'handler', width: 100 },
    { title: '分派时间', dataIndex: 'assignTime', width: 180 },
    { title: '处理时间', dataIndex: 'handleTime', width: 180 },
    {
      title: '响应时长(分)', dataIndex: 'responseDuration', width: 130,
      sorter: (a, b) => (a.responseDuration || 0) - (b.responseDuration || 0),
      render: v => {
        if (v == null) return '-';
        return <Tag color={v > 60 ? 'red' : v > 30 ? 'orange' : 'green'}>{v}</Tag>;
      }
    },
    {
      title: '处理结果', dataIndex: 'handleResult', width: 100,
      render: v => handleResultMap[v] ? <Tag color={handleResultMap[v].color}>{handleResultMap[v].text}</Tag> : v
    }
  ];

  const barConfig = {
    data: peakChartData,
    xField: 'area',
    yField: 'value',
    color: '#1677ff',
    label: { position: 'top' },
    yAxis: { title: { text: '峰值功率(kW)' } }
  };

  const handleResponsePageChange = (page, pageSize) => {
    setResponsePage(page);
    setResponsePageSize(pageSize);
    loadResponseData(page, pageSize);
  };

  const handleResponseSearch = () => {
    setResponsePage(1);
    loadResponseData(1, responsePageSize);
  };

  // 计算统计数据
  const durations = responseData.map(d => d.responseDuration || d.duration).filter(v => v != null);
  const maxDuration = durations.length ? Math.max(...durations) : 0;
  const minDuration = durations.length ? Math.min(...durations) : 0;

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
        <Space wrap>
          <RangePicker showTime value={timeRange} onChange={setTimeRange} />
          <Select placeholder="选择区域" style={{ width: 160 }} allowClear value={selectedArea} onChange={setSelectedArea}>
            {areas.map(a => <Option key={a} value={a}>{a}</Option>)}
          </Select>
          <Button type="primary" onClick={loadData}>查询</Button>
        </Space>
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
                <Descriptions title="响应时长统计" bordered column={4} style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="平均响应时长">{avgDuration} 分钟</Descriptions.Item>
                  <Descriptions.Item label="最长响应时长">{maxDuration} 分钟</Descriptions.Item>
                  <Descriptions.Item label="最短响应时长">{minDuration} 分钟</Descriptions.Item>
                  <Descriptions.Item label="统计周期">{timeRange[0].format('YYYY-MM-DD')} 至 {timeRange[1].format('YYYY-MM-DD')}</Descriptions.Item>
                </Descriptions>

                <Space style={{ marginBottom: 16 }} wrap>
                  <Input
                    placeholder="搜索责任人"
                    prefix={<SearchOutlined />}
                    style={{ width: 200 }}
                    value={handlerFilter}
                    onChange={e => setHandlerFilter(e.target.value)}
                    allowClear
                  />
                  <RangePicker
                    showTime
                    value={timeRange}
                    onChange={setTimeRange}
                  />
                  <Button type="primary" onClick={handleResponseSearch}>查询</Button>
                </Space>

                <Table
                  rowKey="id"
                  columns={responseColumns}
                  dataSource={responseData}
                  loading={responseLoading}
                  pagination={{
                    current: responsePage,
                    pageSize: responsePageSize,
                    total: responseTotal,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: total => `共 ${total} 条记录`,
                    onChange: handleResponsePageChange
                  }}
                  scroll={{ x: 1200 }}
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
