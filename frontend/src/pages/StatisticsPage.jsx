import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, DatePicker, Select, Table, Tag, Tabs, Descriptions,
  Input, Space, Button, Empty, Alert as AntAlert, Statistic
} from 'antd';
import { Bar } from '@ant-design/charts';
import { SearchOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { referenceApi, energyApi } from '../api';

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
  ESCALATED: { color: 'orange', text: '升级' },
  ASSIGNED: { color: 'blue', text: '已分派' },
  PENDING: { color: 'default', text: '待处理' }
};

function StatisticsPage() {
  const [timeRange, setTimeRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);
  const [peakData, setPeakData] = useState([]);
  const [failedPeaks, setFailedPeaks] = useState([]);
  const [failedStrategies, setFailedStrategies] = useState([]);
  const [avgDuration, setAvgDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState();

  const [responseData, setResponseData] = useState([]);
  const [responseTotal, setResponseTotal] = useState(0);
  const [responsePage, setResponsePage] = useState(1);
  const [responsePageSize, setResponsePageSize] = useState(10);
  const [handlerFilter, setHandlerFilter] = useState('');
  const [responseLoading, setResponseLoading] = useState(false);
  const [responseError, setResponseError] = useState('');

  useEffect(() => {
    loadAreas();
    loadData();
    loadResponseData();
  }, []);

  const loadAreas = async () => {
    try {
      const res = await energyApi.getAreas();
      setAreas(res.data?.data || []);
    } catch (e) {
      console.warn('加载区域列表失败:', e);
      setAreas([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const peaksRes = await referenceApi.getPeakLoads({
        area: selectedArea || undefined,
        start: timeRange[0].toISOString(),
        end: timeRange[1].toISOString()
      });
      setPeakData(peaksRes.data?.data || []);

      const failedPeaksRes = await referenceApi.getFailedPeaks();
      setFailedPeaks(failedPeaksRes.data?.data || []);

      const failedStrategyRes = await referenceApi.getFailedStrategies();
      setFailedStrategies(failedStrategyRes.data?.data || []);

      try {
        const statsRes = await referenceApi.getStatistics({
          start: timeRange[0].toISOString(),
          end: timeRange[1].toISOString()
        });
        setAvgDuration(statsRes.data?.data?.avgResponseDuration || 0);
      } catch (_) {
        setAvgDuration(0);
      }
    } catch (e) {
      console.error('加载统计数据失败:', e);
      setErrorMsg(e.response?.data?.message || e.message || '加载统计数据失败');
      setPeakData([]);
      setFailedPeaks([]);
      setFailedStrategies([]);
      setAvgDuration(0);
    }
    setLoading(false);
  };

  const loadResponseData = async (page = 1, pageSize = 10) => {
    setResponseLoading(true);
    setResponseError('');
    try {
      const res = await referenceApi.getResponseDurations({
        start: timeRange[0].toISOString(),
        end: timeRange[1].toISOString(),
        handler: handlerFilter || undefined,
        page: page - 1,
        size: pageSize
      });
      const pageData = res.data?.data;
      if (pageData && pageData.content) {
        setResponseData(pageData.content);
        setResponseTotal(pageData.totalElements ?? pageData.total ?? pageData.content?.length ?? 0);
      } else if (Array.isArray(pageData)) {
        setResponseData(pageData);
        setResponseTotal(pageData.length);
      } else {
        setResponseData([]);
        setResponseTotal(0);
      }
    } catch (e) {
      console.error('加载响应时长数据失败:', e);
      setResponseError(e.response?.data?.message || e.message || '加载响应时长数据失败');
      setResponseData([]);
      setResponseTotal(0);
    }
    setResponseLoading(false);
  };

  const peakChartData = peakData.map(p => ({
    area: p.area,
    value: Number(p.peakValue) || 0
  }));

  const durations = responseData.map(d => d.responseDuration).filter(v => v != null && !isNaN(v));
  const maxDuration = durations.length ? Math.max(...durations) : 0;
  const minDuration = durations.length ? Math.min(...durations) : 0;

  const peakColumns = [
    { title: '区域', dataIndex: 'area', width: 100 },
    {
      title: '峰值功率(kW)', dataIndex: 'peakValue', width: 140,
      sorter: (a, b) => Number(a.peakValue || 0) - Number(b.peakValue || 0),
      render: v => v != null ? Number(v).toFixed(2) : '-'
    },
    {
      title: '平均功率(kW)', dataIndex: 'avgValue', width: 140,
      render: v => v != null ? Number(v).toFixed(2) : '-'
    },
    { title: '峰值时间', dataIndex: 'peakTime', width: 180 },
    {
      title: '表计数量', dataIndex: 'meterCount', width: 100,
      render: v => v ?? '-'
    }
  ];

  const failedPeakColumns = [
    { title: '区域', dataIndex: 'area', width: 100 },
    {
      title: '峰值(kW)', dataIndex: 'peakValue', width: 120,
      render: v => v != null ? Number(v).toFixed(2) : '-'
    },
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
    {
      title: '阈值', dataIndex: 'thresholdValue', width: 100,
      render: v => v != null ? v : '-'
    },
    { title: '失效原因', dataIndex: 'failureReason' },
    { title: '更新时间', dataIndex: 'updateTime', width: 180 }
  ];

  const responseColumns = [
    { title: '告警编号', dataIndex: 'alertNo', width: 120 },
    { title: '区域', dataIndex: 'area', width: 80 },
    { title: '电表', dataIndex: 'meterName', width: 120 },
    {
      title: '告警级别', dataIndex: 'alertLevel', width: 100,
      render: v => alertLevelMap[v] ? <Tag color={alertLevelMap[v].color}>{alertLevelMap[v].text}</Tag> : (v || '-')
    },
    { title: '责任人', dataIndex: 'handler', width: 100 },
    { title: '分派时间', dataIndex: 'assignTime', width: 180 },
    { title: '处理时间', dataIndex: 'handleTime', width: 180 },
    {
      title: '响应时长(分)', dataIndex: 'responseDuration', width: 130,
      sorter: (a, b) => (a.responseDuration || 0) - (b.responseDuration || 0),
      render: v => {
        if (v == null || isNaN(v)) return '-';
        const color = v > 60 ? 'red' : v > 30 ? 'orange' : 'green';
        return <Tag color={color}>{v}</Tag>;
      }
    },
    {
      title: '处理结果', dataIndex: 'handleResult', width: 100,
      render: v => handleResultMap[v]
        ? <Tag color={handleResultMap[v].color}>{handleResultMap[v].text}</Tag>
        : (v || '-')
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

  const emptyOrError = (error, emptyDesc) => {
    if (error) return <AntAlert type="error" showIcon message="数据加载异常" description={error} />;
    return <Empty description={emptyDesc} />;
  };

  return (
    <div>
      <div className="page-title">统计分析</div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="记录区域数" value={peakData.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="策略失效峰值" value={failedPeaks.length} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="失效策略数" value={failedStrategies.length} valueStyle={{ color: '#eb2f96' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="平均响应时长" value={avgDuration} suffix="分钟" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card className="filter-bar">
        <Space wrap>
          <RangePicker showTime value={timeRange} onChange={setTimeRange} />
          <Select
            placeholder="选择区域"
            style={{ width: 160 }}
            allowClear
            value={selectedArea}
            onChange={setSelectedArea}
            options={areas.map(a => ({ value: a, label: a }))}
          />
          <Button type="primary" onClick={loadData} loading={loading}>查询</Button>
        </Space>
      </Card>

      {errorMsg && (
        <AntAlert
          style={{ marginBottom: 16 }}
          type="error"
          showIcon
          message="统计数据加载异常"
          description={errorMsg}
        />
      )}

      <Tabs
        items={[
          {
            key: 'peaks',
            label: '能耗峰值',
            children: (
              <>
                <Card className="chart-card" title="区域能耗峰值对比">
                  {peakChartData.length > 0
                    ? <Bar {...barConfig} height={300} />
                    : emptyOrError(errorMsg, '暂无峰值数据')
                  }
                </Card>
                <Card className="table-card" title="峰值明细" style={{ marginTop: 16 }}>
                  <Table
                    rowKey="id"
                    columns={peakColumns}
                    dataSource={peakData}
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{
                      emptyText: errorMsg
                        ? <Empty description="暂无数据（接口异常）" />
                        : <Empty description="暂无峰值记录" />
                    }}
                  />
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
                  <Table
                    rowKey="id"
                    columns={failedPeakColumns}
                    dataSource={failedPeaks}
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{
                      emptyText: errorMsg
                        ? <Empty description="暂无数据（接口异常）" />
                        : <Empty description={<span><WarningOutlined style={{ marginRight: 4 }} />暂无策略失效的峰值记录</span>} />
                    }}
                  />
                </Card>
                <Card className="table-card" title="失效策略列表" style={{ marginTop: 16 }}>
                  <Table
                    rowKey="id"
                    columns={strategyColumns}
                    dataSource={failedStrategies}
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{
                      emptyText: errorMsg
                        ? <Empty description="暂无数据（接口异常）" />
                        : <Empty description="暂无失效策略" />
                    }}
                  />
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
                  <Descriptions.Item label="平均响应时长">
                    {avgDuration > 0 ? `${avgDuration} 分钟` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="最长响应时长">
                    {maxDuration > 0 ? `${maxDuration} 分钟` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="最短响应时长">
                    {minDuration > 0 ? `${minDuration} 分钟` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="统计周期">
                    {timeRange[0].format('YYYY-MM-DD')} 至 {timeRange[1].format('YYYY-MM-DD')}
                  </Descriptions.Item>
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
                  <RangePicker showTime value={timeRange} onChange={setTimeRange} />
                  <Button type="primary" onClick={handleResponseSearch} loading={responseLoading}>查询</Button>
                </Space>

                {responseError && (
                  <AntAlert
                    style={{ marginBottom: 16 }}
                    type="error"
                    showIcon
                    message="响应时长数据加载异常"
                    description={responseError}
                  />
                )}

                <Table
                  rowKey="id"
                  columns={responseColumns}
                  dataSource={responseData}
                  loading={responseLoading}
                  scroll={{ x: 1200 }}
                  locale={{
                    emptyText: responseError
                      ? <Empty description="暂无数据（接口异常）" />
                      : <Empty description="暂无响应时长记录" />
                  }}
                  pagination={{
                    current: responsePage,
                    pageSize: responsePageSize,
                    total: responseTotal,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: total => `共 ${total} 条记录`,
                    onChange: handleResponsePageChange
                  }}
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
