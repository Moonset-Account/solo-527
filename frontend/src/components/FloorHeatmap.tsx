import React, { useMemo, useState } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { HeatmapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, VisualMapComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { FloorHeatmapCell } from '../types';

echarts.use([HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent, LegendComponent, CanvasRenderer]);

interface Props {
  data: FloorHeatmapCell[];
  onRoomClick: (room: FloorHeatmapCell) => void;
}

export default function FloorHeatmap({ data, onRoomClick }: Props) {
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  const floors = useMemo(() => {
    const set = new Set(data.map(d => d.floor));
    return Array.from(set).sort((a, b) => a - b);
  }, [data]);

  const filteredData = useMemo(() => {
    if (selectedFloor === null) return data;
    return data.filter(d => d.floor === selectedFloor);
  }, [data, selectedFloor]);

  const option = useMemo(() => {
    const displayFloors = selectedFloor !== null ? [selectedFloor] : floors;
    const roomsPerFloor = 16;
    const maxRoomIdx = roomsPerFloor;

    const heatData: [number, number, number | string][] = [];
    const roomLabels: Record<string, string> = {};

    filteredData.forEach(cell => {
      const floorIdx = displayFloors.indexOf(cell.floor);
      const roomIdx = parseInt(cell.room_number.slice(-2)) - 1;
      const duration = cell.avg_duration || 0;
      heatData.push([roomIdx, floorIdx, duration]);
      roomLabels[`${roomIdx}-${floorIdx}`] = cell.room_number;
    });

    const statusColorMap: Record<string, string> = {
      dirty: '#f97316',
      cleaning: '#3b82f6',
      clean: '#10b981',
      inspected: '#06b6d4',
    };

    const lateRooms = filteredData.filter(d => d.is_late_checkout);
    const vipRooms = filteredData.filter(d => d.is_vip);

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 25, 35, 0.95)',
        borderColor: '#2a4058',
        textStyle: { color: '#e8edf2', fontSize: 12 },
        formatter: (params: any) => {
          const cell = filteredData.find(
            d => parseInt(d.room_number.slice(-2)) - 1 === params.data[0] && displayFloors.indexOf(d.floor) === params.data[1]
          );
          if (!cell) return '';
          return `<div style="font-weight:600;margin-bottom:4px">${cell.room_number}</div>
            <div>楼层：${cell.floor}F | 房型：${cell.room_type}</div>
            <div>${cell.is_vip ? '<span style="color:#f59e0b">★ VIP</span> | ' : ''}${cell.is_late_checkout ? '<span style="color:#ef4444">⏰ 延迟退房</span>' : ''}</div>
            <div>状态：${cell.status} | 平均时长：${cell.avg_duration || '-'}min</div>
            <div>返工次数：${cell.rework_count}</div>`;
        },
      },
      grid: {
        left: 60,
        right: 40,
        top: 30,
        bottom: 60,
      },
      xAxis: {
        type: 'category',
        data: Array.from({ length: maxRoomIdx }, (_, i) => `${i + 1}`),
        splitArea: { show: true, areaStyle: { color: ['rgba(42,64,88,0.1)', 'rgba(42,64,88,0.05)'] } },
        axisLabel: { color: '#8fa3b8', fontSize: 11 },
        axisLine: { lineStyle: { color: '#2a4058' } },
      },
      yAxis: {
        type: 'category',
        data: displayFloors.map(f => `${f}F`),
        axisLabel: { color: '#8fa3b8', fontSize: 11 },
        axisLine: { lineStyle: { color: '#2a4058' } },
      },
      visualMap: {
        min: 20,
        max: 70,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: {
          color: ['#10b981', '#f59e0b', '#ef4444'],
        },
        textStyle: { color: '#8fa3b8', fontSize: 11 },
        text: ['慢', '快'],
      },
      series: [
        {
          name: '清洁时长',
          type: 'heatmap',
          data: heatData,
          label: {
            show: true,
            fontSize: 9,
            color: '#e8edf2',
            formatter: (params: any) => {
              const cell = filteredData.find(
                d => parseInt(d.room_number.slice(-2)) - 1 === params.data[0] && displayFloors.indexOf(d.floor) === params.data[1]
              );
              return cell ? cell.room_number : '';
            },
          },
          itemStyle: {
            borderColor: '#1e3044',
            borderWidth: 2,
            borderRadius: 4,
          },
          emphasis: {
            itemStyle: {
              borderColor: '#3b82f6',
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: 'rgba(59,130,246,0.5)',
            },
          },
        },
      ],
    };
  }, [filteredData, floors, selectedFloor]);

  return (
    <div>
      <div className="legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#f59e0b' }}></div>
          <span>VIP房</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#ef4444' }}></div>
          <span>延迟退房</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#10b981' }}></div>
          <span>正常</span>
        </div>
        <select
          value={selectedFloor ?? ''}
          onChange={e => setSelectedFloor(e.target.value ? Number(e.target.value) : null)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          <option value="">全部楼层</option>
          {floors.map(f => (
            <option key={f} value={f}>{f}F</option>
          ))}
        </select>
      </div>
      <div className="chart-container">
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          style={{ height: '100%', width: '100%' }}
          onEvents={{
            click: (params: any) => {
              const cell = filteredData.find(
                d => parseInt(d.room_number.slice(-2)) - 1 === params.data[0] && (selectedFloor !== null ? [selectedFloor] : floors).indexOf(d.floor) === params.data[1]
              );
              if (cell) onRoomClick(cell);
            },
          }}
        />
      </div>
    </div>
  );
}
