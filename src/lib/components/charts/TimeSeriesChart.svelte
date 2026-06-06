<script lang="ts">
  import BaseChart from './BaseChart.svelte';
  import type { SensorReading, Sensor, SensorType } from '$lib/types';
  import { METRIC_CONFIGS, SENSOR_TYPE_LABELS } from '$lib/data/dictionary';
  import dayjs from 'dayjs';

  export let readings: SensorReading[];
  export let sensors: Sensor[];
  export let selectedType: SensorType | 'all' = 'all';

  let chartOption: any = {};

  function updateChart() {
    const sensorMap = new Map(sensors.map((s: Sensor) => [s.id, s]));
    
    let filteredReadings = readings.filter((r: SensorReading) => {
      const sensor = sensorMap.get(r.sensorId);
      if (!sensor) return false;
      if (selectedType !== 'all' && sensor.type !== selectedType) return false;
      return true;
    });

    const groupedBySensorType: Record<string, { sensor: Sensor; data: Array<[number, number | null]> }> = {};

    filteredReadings.forEach((r: SensorReading) => {
      const sensor = sensorMap.get(r.sensorId);
      if (!sensor) return;

      const type = sensor.type;
      if (!groupedBySensorType[type]) {
        groupedBySensorType[type] = {
          sensor,
          data: []
        };
      }

      const time = new Date(r.timestamp).getTime();
      const value = r.isMissing ? null : r.value;
      groupedBySensorType[type].data.push([time, value]);
    });

    const series = Object.entries(groupedBySensorType).map(([type, { sensor, data }]) => {
      const config = METRIC_CONFIGS.find((m) => m.key === type);
      const sortedData = data.sort((a, b) => a[0] - b[0]);

      return {
        name: SENSOR_TYPE_LABELS[type as SensorType] || type,
        type: 'line',
        smooth: true,
        symbol: 'none',
        sampling: 'lttb',
        lineStyle: {
          width: 2,
          color: config?.color || '#3b82f6'
        },
        areaStyle: {
          opacity: 0.1,
          color: config?.color || '#3b82f6'
        },
        emphasis: {
          focus: 'series'
        },
        data: sortedData,
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            type: 'dashed',
            width: 1
          },
          data: [
            {
              yAxis: config?.idealMin,
              lineStyle: { color: config?.color || '#22c55e' },
              label: { formatter: '理想下限', position: 'end' }
            },
            {
              yAxis: config?.idealMax,
              lineStyle: { color: config?.color || '#22c55e' },
              label: { formatter: '理想上限', position: 'end' }
            }
          ]
        }
      };
    });

    const anomalyPoints = filteredReadings
      .filter((r: SensorReading) => r.isOutlier && !r.isMissing)
      .map((r: SensorReading) => {
        const sensor = sensorMap.get(r.sensorId);
        return {
          name: '异常点',
          value: [new Date(r.timestamp).getTime(), r.value],
          itemStyle: { color: '#ef4444' },
          symbol: 'circle',
          symbolSize: 8
        };
      });

    if (anomalyPoints.length > 0) {
      series.push({
        name: '异常点',
        type: 'scatter',
        data: anomalyPoints,
        z: 10
      });
    }

    chartOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: function (params: any) {
          if (!Array.isArray(params) || params.length === 0) return '';
          const time = dayjs(params[0].axisValue).format('YYYY-MM-DD HH:mm:ss');
          let content = `<div style="font-weight: bold; margin-bottom: 4px;">${time}</div>`;
          params.forEach((p: any) => {
            if (p.value && p.value[1] !== null) {
              const config = METRIC_CONFIGS.find((m) => SENSOR_TYPE_LABELS[m.key] === p.seriesName);
              const value = typeof p.value[1] === 'number' ? p.value[1].toFixed(2) : p.value[1];
              content += `<div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${p.color};"></span>
                <span>${p.seriesName}:</span>
                <span style="font-weight: bold;">${value}${config?.unit || ''}</span>
              </div>`;
            }
          });
          return content;
        }
      },
      legend: {
        data: Object.keys(groupedBySensorType).map((t) => SENSOR_TYPE_LABELS[t as SensorType] || t),
        textStyle: { color: '#94a3b8' },
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        axisLabel: {
          color: '#94a3b8',
          formatter: (value: number) => dayjs(value).format('MM-DD HH:mm')
        },
        axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          height: 20,
          bottom: 5,
          borderColor: 'transparent',
          backgroundColor: '#1e293b',
          fillerColor: 'rgba(74, 222, 128, 0.2)',
          handleStyle: { color: '#4ade80' },
          textStyle: { color: '#94a3b8' }
        }
      ],
      series: series as any
    };
  }

  $: {
    readings;
    sensors;
    selectedType;
    updateChart();
  }
</script>

<BaseChart option={chartOption} height="100%" />
