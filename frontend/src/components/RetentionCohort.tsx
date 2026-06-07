import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Spin, Alert, Select } from 'antd';
import { DownloadOutlined, BarChartOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useFilterStore } from '@/store/useFilterStore';
import { apiService } from '@/services/api';
import { RetentionCohortResponse } from '@/types';

const RetentionCohort: React.FC = () => {
  const { filters } = useFilterStore();
  const [data, setData] = useState<RetentionCohortResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [months, setMonths] = useState(6);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  useEffect(() => {
    loadData();
  }, [filters, months]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await apiService.getRetentionCohort(filters, months);
      setData(result);
    } catch (error) {
      console.error('加载留存Cohort失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const url = apiService.exportCohort(filters, months);
    window.open(url, '_blank');
  };

  const getRetentionClass = (rate: number | null) => {
    if (rate === null) return '';
    if (rate >= 0.6) return 'cohort-high';
    if (rate >= 0.3) return 'cohort-medium';
    return 'cohort-low';
  };

  const columns = [
    {
      title: '入组月份',
      dataIndex: 'cohort_month',
      key: 'cohort_month',
      fixed: 'left' as const,
      width: 120,
    },
    {
      title: '样本量',
      dataIndex: 'cohort_size',
      key: 'cohort_size',
      width: 80,
      render: (size: number, record: any) => (
        <span>
          {size}
          {record.sample_warning && (
            <span title="样本量不足" style={{ color: '#faad14', marginLeft: 4 }}>⚠️</span>
          )}
        </span>
      ),
    },
    ...Array.from({ length: months + 1 }, (_, i) => ({
      title: `M${i}`,
      dataIndex: ['retention', i],
      key: `M${i}`,
      width: 90,
      className: 'cohort-cell',
      render: (rate: number | null) => {
        if (rate === null) return '-';
        return (
          <div className={getRetentionClass(rate)}>
            {(rate * 100).toFixed(1)}%
          </div>
        );
      },
    })),
  ];

  const getChartOption = () => {
    if (!data?.cohort_data?.length) return {};

    const cohortMonths = data.cohort_data.map(d => d.cohort_month);
    const series = Array.from({ length: months + 1 }, (_, i) => ({
      name: `M${i}`,
      type: 'line',
      data: data.cohort_data.map(d => 
        d.retention[i] !== null ? +(d.retention[i]! * 100).toFixed(1) : null
      ),
      smooth: true,
    }));

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let html = `<div>${params[0].axisValue}</div>`;
          params.forEach((p: any) => {
            if (p.value !== null) {
              html += `<div>${p.marker} ${p.seriesName}: ${p.value}%</div>`;
            }
          });
          return html;
        },
      },
      legend: {
        data: Array.from({ length: months + 1 }, (_, i) => `M${i}`),
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: cohortMonths,
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}%',
        },
        min: 0,
        max: 100,
      },
      color: ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2', '#fa8c16'],
      series,
    };
  };

  if (loading) {
    return (
      <div className="card-section" style={{ textAlign: 'center', padding: '40px' }}>
        <Spin />
      </div>
    );
  }

  return (
    <div className="card-section">
      <div className="card-header">
        <div className="card-title">
          <BarChartOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          留存 Cohort 分析
        </div>
        <Space>
          <Select
            value={months}
            onChange={setMonths}
            style={{ width: 120 }}
            options={[
              { label: '3个月', value: 3 },
              { label: '6个月', value: 6 },
              { label: '12个月', value: 12 },
            ]}
          />
          <Button.Group>
            <Button 
              type={viewMode === 'table' ? 'primary' : 'default'}
              onClick={() => setViewMode('table')}
            >
              表格
            </Button>
            <Button 
              type={viewMode === 'chart' ? 'primary' : 'default'}
              onClick={() => setViewMode('chart')}
            >
              折线图
            </Button>
          </Button.Group>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      </div>

      {data?.warnings?.map((warning, idx) => (
        <div key={idx} className="sample-warning">
          ⚠️ {warning}
        </div>
      ))}

      {viewMode === 'table' ? (
        <Table
          className="cohort-table"
          columns={columns}
          dataSource={data?.cohort_data || []}
          pagination={false}
          scroll={{ x: true }}
          rowKey="cohort_month"
        />
      ) : (
        <div className="chart-container">
          <ReactECharts option={getChartOption()} style={{ height: '100%' }} />
        </div>
      )}

      <Alert
        style={{ marginTop: 16 }}
        message="指标说明"
        description={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>停卡期间的会员不计入流失样本</li>
            <li>M0 = 入会当月，M1 = 入会第1个月后，依此类推</li>
            <li>样本量不足30人时标注 ⚠️，数据仅供参考</li>
          </ul>
        }
        type="info"
        showIcon
      />
    </div>
  );
};

export default RetentionCohort;
