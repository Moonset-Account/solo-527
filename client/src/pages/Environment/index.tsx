import { useEffect, useState, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Checkbox,
  DatePicker,
  Table,
  Button,
  Space,
  Progress,
  Spin,
  Empty,
  message,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, ThermometerOutlined, CloudOutlined, ThunderboltOutlined, BulbOutlined, ExperimentOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { plotApi, environmentApi, thresholdApi } from '@/api';
import { Plot, EnvironmentData, Threshold, Guid, ParameterType } from '@/types';
import { PARAMETER_TYPE_NAMES, PARAMETER_TYPE_UNITS, PARAMETER_TYPE_THRESHOLDS } from '@/constants/mappings';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Group: CheckboxGroup } = Checkbox;

interface GaugeCardProps {
  title: string;
  icon: React.ReactNode;
  value: number;
  unit: string;
  min: number;
  max: number;
  thresholds?: { min: number; max: number };
}

function GaugeCard({ title, icon, value, unit, min, max, thresholds }: GaugeCardProps) {
  const tMin = thresholds?.min ?? min;
  const tMax = thresholds?.max ?? max;
  const outOfRange = value < tMin || value > tMax;
  const percent = Math.min(100, Math.max(0, Math.round(((value - min) / (max - min)) * 100)));
  const color = outOfRange ? '#cf1322' : '#52c41a';

  return (
    <Card size="small">
      <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
        <Space>
          <span style={{ fontSize: 18, color: '#1677ff' }}>{icon}</span>
          <strong>{title}</strong>
        </Space>
        <Progress
          type="dashboard"
          percent={percent}
          size={90}
          strokeColor={color}
          format={() => (
            <span style={{ fontSize: 16, color }}>
              {value}
              <span style={{ fontSize: 12, marginLeft: 2 }}>{unit}</span>
            </span>
          )}
        />
        <div style={{ fontSize: 12, color: '#666' }}>
          阈值范围: {tMin} ~ {tMax}
        </div>
        {outOfRange && <Tag color="red">越界告警</Tag>}
      </Space>
    </Card>
  );
}

const envHistoryColumns: ColumnsType<EnvironmentData> = [
  {
    title: '记录时间',
    dataIndex: 'recordedAt',
    key: 'recordedAt',
    render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    width: 180,
  },
  {
    title: '温度(°C)',
    dataIndex: 'temperature',
    key: 'temperature',
    render: (v) => v.toFixed(1),
  },
  {
    title: '湿度(%)',
    dataIndex: 'humidity',
    key: 'humidity',
    render: (v) => v.toFixed(1),
  },
  {
    title: '土壤湿度(%)',
    dataIndex: 'soilMoisture',
    key: 'soilMoisture',
    render: (v) => v.toFixed(1),
  },
  {
    title: '光照(lux)',
    dataIndex: 'lightIntensity',
    key: 'lightIntensity',
    render: (v) => v.toFixed(0),
  },
  {
    title: 'CO2(ppm)',
    dataIndex: 'co2Level',
    key: 'co2Level',
    render: (v) => v.toFixed(0),
  },
];

const PARAMS: { key: ParameterType; name: string; color: string }[] = [
  { key: 'Temperature', name: '温度', color: '#ff7875' },
  { key: 'Humidity', name: '湿度', color: '#69b1ff' },
  { key: 'SoilMoisture', name: '土壤湿度', color: '#95de64' },
  { key: 'LightIntensity', name: '光照', color: '#ffd666' },
  { key: 'Co2Level', name: 'CO2', color: '#b37feb' },
];

function Environment() {
  const [loading, setLoading] = useState(false);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<Guid | null>(null);
  const [latestData, setLatestData] = useState<EnvironmentData | null>(null);
  const [recentData, setRecentData] = useState<EnvironmentData[]>([]);
  const [historyData, setHistoryData] = useState<EnvironmentData[]>([]);
  const [checkedParams, setCheckedParams] = useState<ParameterType[]>(['Temperature', 'Humidity', 'LightIntensity']);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const chartRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getThresholdFor = (param: ParameterType, plotId?: Guid) => {
    const specific = thresholds.find((t) => t.parameterType === param && t.plotId === plotId);
    if (specific) return { min: specific.minValue, max: specific.maxValue };
    const global = thresholds.find((t) => t.parameterType === param && !t.plotId);
    if (global) return { min: global.minValue, max: global.maxValue };
    return PARAMETER_TYPE_THRESHOLDS[param];
  };

  const loadPlots = async () => {
    try {
      const data = await plotApi.getAll();
      setPlots(data);
      if (data.length > 0 && !selectedPlot) {
        setSelectedPlot(data[0].id);
      }
    } catch {
      message.error('加载地块失败');
    }
  };

  const loadThresholds = async () => {
    try {
      const data = await thresholdApi.getAll();
      setThresholds(data);
    } catch {
      setThresholds([]);
    }
  };

  const loadLatest = async () => {
    if (!selectedPlot) return;
    setLoading(true);
    try {
      const all = await environmentApi.getLatestAll();
      setLatestData(all[selectedPlot] || null);
    } catch {
      setLatestData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadRecent = async () => {
    if (!selectedPlot) return;
    try {
      const data = await environmentApi.getRecent(selectedPlot, 120);
      setRecentData(Array.isArray(data) ? data : []);
    } catch {
      setRecentData([]);
    }
  };

  const loadHistory = async () => {
    if (!selectedPlot || !dateRange || !dateRange[0] || !dateRange[1]) return;
    try {
      const data = await environmentApi.getRange(
        selectedPlot,
        dateRange[0].toISOString(),
        dateRange[1].toISOString()
      );
      setHistoryData(Array.isArray(data) ? data : []);
    } catch {
      setHistoryData([]);
    }
  };

  useEffect(() => {
    loadPlots();
    loadThresholds();
  }, []);

  useEffect(() => {
    if (selectedPlot) {
      loadLatest();
      loadRecent();
    }
  }, [selectedPlot]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      loadRecent();
    }, 30000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedPlot]);

  const chartOption = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: PARAMS.filter((p) => checkedParams.includes(p.key)).map((p) => `${p.name}(${PARAMETER_TYPE_UNITS[p.key]})`),
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: recentData.map((d) => dayjs(d.recordedAt).format('HH:mm')),
    },
    yAxis: { type: 'value' },
    series: PARAMS.filter((p) => checkedParams.includes(p.key)).map((p) => {
      const keyMap: Record<string, keyof EnvironmentData> = {
        Temperature: 'temperature',
        Humidity: 'humidity',
        SoilMoisture: 'soilMoisture',
        LightIntensity: 'lightIntensity',
        Co2Level: 'co2Level',
      };
      return {
        name: `${p.name}(${PARAMETER_TYPE_UNITS[p.key]})`,
        type: 'line',
        smooth: true,
        data: recentData.map((d) => d[keyMap[p.key]] as number),
        lineStyle: { color: p.color },
        itemStyle: { color: p.color },
      };
    }),
  };

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 8 }}>选择地块</div>
              <Select
                style={{ width: '100%' }}
                placeholder="选择地块"
                value={selectedPlot || undefined}
                onChange={(v) => setSelectedPlot(v)}
                showSearch
                optionFilterProp="children"
              >
                {plots.map((p) => (
                  <Option key={p.id} value={p.id}>
                    {[p.greenhouseName, p.plotCode, p.name].filter(Boolean).join(' - ')}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={24} md={18}>
              <div style={{ marginBottom: 8 }}>显示指标（实时折线图）</div>
              <CheckboxGroup
                value={checkedParams}
                onChange={(v) => setCheckedParams(v as ParameterType[])}
                options={PARAMS.map((p) => ({ label: p.name, value: p.key }))}
              />
              <Space style={{ marginLeft: 16 }}>
                <Button icon={<ReloadOutlined />} onClick={loadRecent}>
                  刷新
                </Button>
                <span style={{ color: '#888', fontSize: 12 }}>自动每30秒刷新</span>
              </Space>
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={24 / 5}>
            <GaugeCard
              title="温度"
              icon={<ThermometerOutlined />}
              value={latestData?.temperature ?? 0}
              unit="°C"
              min={-10}
              max={50}
              thresholds={getThresholdFor('Temperature', selectedPlot || undefined)}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={24 / 5}>
            <GaugeCard
              title="湿度"
              icon={<CloudOutlined />}
              value={latestData?.humidity ?? 0}
              unit="%"
              min={0}
              max={100}
              thresholds={getThresholdFor('Humidity', selectedPlot || undefined)}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={24 / 5}>
            <GaugeCard
              title="土壤湿度"
              icon={<ThunderboltOutlined />}
              value={latestData?.soilMoisture ?? 0}
              unit="%"
              min={0}
              max={100}
              thresholds={getThresholdFor('SoilMoisture', selectedPlot || undefined)}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={24 / 5}>
            <GaugeCard
              title="光照"
              icon={<BulbOutlined />}
              value={latestData?.lightIntensity ?? 0}
              unit="lux"
              min={0}
              max={100000}
              thresholds={getThresholdFor('LightIntensity', selectedPlot || undefined)}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={24 / 5}>
            <GaugeCard
              title="CO2"
              icon={<ExperimentOutlined />}
              value={latestData?.co2Level ?? 0}
              unit="ppm"
              min={0}
              max={3000}
              thresholds={getThresholdFor('Co2Level', selectedPlot || undefined)}
            />
          </Col>
        </Row>

        <Card title="实时数据（最近2小时）">
          {recentData.length === 0 ? (
            <Empty description="暂无实时数据" />
          ) : (
            <ReactECharts ref={chartRef} option={chartOption} style={{ height: 380 }} notMerge={true} lazyUpdate={true} />
          )}
        </Card>

        <Card
          title="历史数据"
          extra={
            <Space>
              <RangePicker
                showTime
                value={dateRange as any}
                onChange={(v) => setDateRange(v as any)}
              />
              <Button type="primary" onClick={loadHistory} disabled={!dateRange || !dateRange[0] || !dateRange[1]}>
                查询
              </Button>
            </Space>
          }
        >
          {historyData.length === 0 ? (
            <Empty description="选择日期范围后查询历史数据" />
          ) : (
            <Table
              rowKey="id"
              columns={envHistoryColumns}
              data={historyData}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          )}
        </Card>
      </Space>
    </Spin>
  );
}

export default Environment;
