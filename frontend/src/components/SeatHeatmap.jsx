import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Spin, Select } from 'antd';
import ChartHeader from './ChartHeader';
import { useFilter } from '../context/FilterContext';
import { getHeatmap, getAreas } from '../services/api';

const { Option } = Select;

const SeatHeatmap = () => {
  const { filters } = useFilter();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ sampleSize: 0, updateTime: null });
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);

  const effectiveAreaId = filters.area_id || selectedArea;
  const selectedAreaObj = areas.find(a => a.id === effectiveAreaId);

  useEffect(() => {
    fetchAreas();
  }, [filters.floor_id]);

  useEffect(() => {
    if (filters.area_id) {
      setSelectedArea(filters.area_id);
    }
  }, [filters.area_id]);

  useEffect(() => {
    fetchData();
  }, [filters.start_date, filters.end_date, filters.time_slot, filters.user_group_id, effectiveAreaId]);

  const fetchAreas = async () => {
    try {
      const res = await getAreas(filters.floor_id);
      const areaList = res.data.data || [];
      setAreas(areaList);
      if (areaList.length > 0 && !effectiveAreaId && !filters.area_id) {
        setSelectedArea(areaList[0].id);
      }
    } catch (error) {
      console.error('获取区域列表失败:', error);
    }
  };

  const fetchData = async () => {
    if (!effectiveAreaId) return;
    try {
      setLoading(true);
      const res = await getHeatmap({
        start_date: filters.start_date,
        end_date: filters.end_date,
        area_id: effectiveAreaId,
        user_group_id: filters.user_group_id,
        time_slot: filters.time_slot
      });
      setData(res.data.data || []);
      setMeta({
        sampleSize: res.data.sample_size,
        updateTime: res.data.update_time
      });
    } catch (error) {
      console.error('获取热力图数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOption = () => {
    if (!data || data.length === 0) {
      return {
        title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#8c8c8c' } }
      };
    }

    const maxX = Math.max(...data.map(d => d.grid_x));
    const maxY = Math.max(...data.map(d => d.grid_y));

    const xAxisData = Array.from({ length: maxX + 1 }, (_, i) => `列${i + 1}`);
    const yAxisData = Array.from({ length: maxY + 1 }, (_, i) => `排${i + 1}`);

    const heatData = data.map(d => [d.grid_x, d.grid_y, d.value, d.seat_code, d.sample_size]);

    return {
      tooltip: {
        position: 'top',
        formatter: (params) => {
          const [, , value, seatCode, sampleSize] = params.data;
          return `
            <div style="padding: 8px;">
              <div><strong>${seatCode}</strong></div>
              <div>利用率: ${value.toFixed(1)}%</div>
              <div>样本量: ${sampleSize}</div>
            </div>
          `;
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '8%',
        bottom: '15%'
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        splitArea: { show: true }
      },
      yAxis: {
        type: 'category',
        data: yAxisData,
        splitArea: { show: true }
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        text: ['高利用率', '低利用率'],
        inRange: {
          color: ['#e0f7fa', '#80deea', '#26c6da', '#00acc1', '#00838f']
        }
      },
      series: [{
        name: '座位利用率',
        type: 'heatmap',
        data: heatData,
        label: {
          show: true,
          fontSize: 10,
          formatter: (params) => params.data[3].split('-').pop()
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  };

  return (
    <div className="chart-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ChartHeader
          title="座位热力图"
          sampleSize={meta.sampleSize}
          updateTime={meta.updateTime}
          filters={filters}
          areaName={selectedAreaObj?.area_name}
        />
        <Select
          style={{ width: 150, marginLeft: 16 }}
          value={effectiveAreaId}
          onChange={setSelectedArea}
          placeholder="选择区域"
          disabled={!!filters.area_id}
        >
          {areas.map(a => (
            <Option key={a.id} value={a.id}>{a.area_name}</Option>
          ))}
        </Select>
      </div>
      {loading ? (
        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin />
        </div>
      ) : (
        <ReactECharts option={getOption()} style={{ height: 400 }} />
      )}
    </div>
  );
};

export default SeatHeatmap;
