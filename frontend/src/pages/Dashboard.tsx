import React, { useState, useEffect } from 'react';
import { Card, Tabs, message } from 'antd';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import StatsCards from '../components/StatsCards';
import FilterPanel from '../components/FilterPanel';
import PriceScatterChart from '../components/Charts/PriceScatterChart';
import AnalysisCharts from '../components/Charts/AnalysisCharts';
import RecordsTable from '../components/RecordsTable';
import { analyticsAPI, exportAPI } from '../services/api';
import {
  SummaryData,
  PriceScatterData,
  BookAnalysisData,
  FilterParams,
  ExportParams,
} from '../types';

const { TabPane } = Tabs;

const DEFAULT_FILTERS: FilterParams = {
  channels: [],
  conditions: [],
  min_days_in_stock: undefined,
  max_days_in_stock: undefined,
  min_recycle_price: undefined,
  max_recycle_price: undefined,
  only_abnormal: false,
  only_unsold: false,
  isbn_keyword: undefined,
  title_keyword: undefined,
  start_date: undefined,
  end_date: undefined,
  category: undefined,
};

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [scatterData, setScatterData] = useState<PriceScatterData[]>([]);
  const [analysisData, setAnalysisData] = useState<BookAnalysisData[]>([]);
  const [filters, setFilters] = useState<FilterParams>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    try {
      const data = await analyticsAPI.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('获取汇总数据失败:', error);
    }
  };

  const fetchScatterData = async () => {
    setLoading(true);
    try {
      const data = await analyticsAPI.getPriceScatter(filters);
      setScatterData(data);
    } catch (error) {
      console.error('获取散点数据失败:', error);
      message.error('获取散点数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisData = async () => {
    try {
      const data = await analyticsAPI.getBookAnalysis(filters);
      setAnalysisData(data);
    } catch (error) {
      console.error('获取分析数据失败:', error);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleSearch = () => {
    fetchScatterData();
    fetchAnalysisData();
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setTimeout(() => {
      fetchScatterData();
      fetchAnalysisData();
    }, 100);
  };

  const handleExport = async () => {
    try {
      const exportParams: ExportParams = {
        ...filters,
        export_type: 'excel',
        pricing_version: undefined,
      };
      const blob = await exportAPI.exportReport(exportParams);
      saveAs(blob, `二手书回收定价报表_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
      message.success('报表导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('报表导出失败');
    }
  };

  const handlePointClick = (data: PriceScatterData) => {
    message.info(`选中: ${data.title} (${data.condition}) - 回收价: ¥${data.recycle_price}`);
  };

  return (
    <div>
      <StatsCards data={summary} />

      <FilterPanel
        filters={filters}
        onChange={setFilters}
        onSearch={handleSearch}
        onReset={handleReset}
        onExport={handleExport}
      />

      <Card style={{ marginBottom: 16 }}>
        <PriceScatterChart data={scatterData} onPointClick={handlePointClick} />
      </Card>

      <Tabs defaultActiveKey="1" style={{ marginBottom: 16 }}>
        <TabPane tab="多维度分析" key="1">
          <AnalysisCharts data={analysisData} />
        </TabPane>
        <TabPane tab="回收记录明细" key="2">
          <RecordsTable data={scatterData} loading={loading} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Dashboard;
