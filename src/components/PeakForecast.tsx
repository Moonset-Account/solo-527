import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { Ride, TimePeriod } from '@/types';
import { useDataStore } from '@/store/dataStore';
import { useFilterStore } from '@/store/filterStore';

const MARGIN = { top: 30, right: 20, bottom: 30, left: 40 };
const COLORS = {
  historical: '#00e5c7',
  predicted: '#00e5c7',
  confidence: 'rgba(0, 229, 199, 0.15)',
  morningBand: 'rgba(0, 229, 199, 0.08)',
  eveningBand: 'rgba(255, 159, 67, 0.08)',
  grid: 'rgba(255, 255, 255, 0.05)',
  axisText: 'rgba(255, 255, 255, 0.5)',
  warning: '#ff9f43',
};

const PERIOD_LABELS: Record<TimePeriod, string> = {
  all_day: '全天',
  morning_rush: '早高峰',
  evening_rush: '晚高峰',
  custom: '自定义',
};

const PERIOD_HOURS: Record<string, [number, number]> = {
  all_day: [0, 24],
  morning_rush: [7, 9],
  evening_rush: [17, 19],
};

const WEATHER_ICONS: Record<string, string> = {
  sunny: '☀',
  cloudy: '☁',
  rainy: '🌧',
  snowy: '❄',
  windy: '💨',
};

interface HourlyPoint {
  hour: number;
  count: number;
  predicted: boolean;
  upper: number;
  lower: number;
}

function computeHourlyData(rides: Ride[]): HourlyPoint[] {
  const counts = new Array(24).fill(0) as number[];
  for (const ride of rides) {
    const hour = new Date(ride.startTime).getHours();
    counts[hour]++;
  }

  const data: HourlyPoint[] = counts.map((count, hour) => ({
    hour,
    count,
    predicted: false,
    upper: count,
    lower: count,
  }));

  const histMax = Math.max(...data.filter((d) => d.hour < 18).map((d) => d.count), 1);

  for (let hour = 18; hour < 24; hour++) {
    const base = Math.round(histMax * (0.6 + 0.3 * Math.sin((hour - 18) / 6 * Math.PI)) + Math.random() * histMax * 0.15);
    const noise = Math.round(base * 0.2);
    data[hour] = {
      hour,
      count: base,
      predicted: true,
      upper: base + noise,
      lower: Math.max(0, base - noise),
    };
  }

  return data;
}

export default function PeakForecast() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const filteredRides = useDataStore((s) => s.filteredRides);
  const weather = useDataStore((s) => s.weather);
  const timePeriod = useFilterStore((s) => s.timePeriod);
  const setTimePeriod = useFilterStore((s) => s.setTimePeriod);

  const handleResize = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    setDimensions({ width, height });
  }, []);

  useEffect(() => {
    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [handleResize]);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const hourlyData = computeHourlyData(filteredRides);
    const [rangeStart, rangeEnd] = PERIOD_HOURS[timePeriod] ?? [0, 24];
    const visibleData = hourlyData.filter((d) => d.hour >= rangeStart && d.hour <= rangeEnd);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dimensions.width;
    const height = dimensions.height;
    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3.scaleLinear()
      .domain([rangeStart, rangeEnd])
      .range([0, innerW]);

    const maxCount = d3.max(hourlyData, (d) => d.upper) ?? 10;
    const y = d3.scaleLinear()
      .domain([0, maxCount * 1.15])
      .range([innerH, 0]);

    if (timePeriod === 'all_day') {
      g.append('rect')
        .attr('x', x(7))
        .attr('y', 0)
        .attr('width', x(9) - x(7))
        .attr('height', innerH)
        .attr('fill', COLORS.morningBand);

      g.append('rect')
        .attr('x', x(17))
        .attr('y', 0)
        .attr('width', x(19) - x(17))
        .attr('height', innerH)
        .attr('fill', COLORS.eveningBand);

      g.append('text')
        .attr('x', x(8))
        .attr('y', 14)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(0, 229, 199, 0.5)')
        .attr('font-size', 10)
        .text('早高峰');

      g.append('text')
        .attr('x', x(18))
        .attr('y', 14)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(255, 159, 67, 0.5)')
        .attr('font-size', 10)
        .text('晚高峰');
    }

    const yTicks = y.ticks(5);
    g.selectAll('.grid-line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', COLORS.grid);

    const hourStep = rangeEnd - rangeStart <= 4 ? 1 : rangeEnd - rangeStart <= 12 ? 2 : 3;
    const xAxis = d3.axisBottom(x)
      .ticks(Math.ceil((rangeEnd - rangeStart) / hourStep))
      .tickFormat((d) => `${d}:00`);

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(xAxis)
      .call((sel) => {
        sel.select('.domain').attr('stroke', COLORS.grid);
        sel.selectAll('.tick line').attr('stroke', COLORS.grid);
        sel.selectAll('.tick text')
          .attr('fill', COLORS.axisText)
          .attr('class', 'font-data')
          .attr('font-size', 11);
      });

    const yAxis = d3.axisLeft(y).ticks(5).tickFormat(d3.format('d'));
    g.append('g')
      .call(yAxis)
      .call((sel) => {
        sel.select('.domain').attr('stroke', COLORS.grid);
        sel.selectAll('.tick line').attr('stroke', COLORS.grid);
        sel.selectAll('.tick text')
          .attr('fill', COLORS.axisText)
          .attr('class', 'font-data')
          .attr('font-size', 11);
      });

    const predictedData = visibleData.filter((d) => d.predicted);
    if (predictedData.length > 0) {
      const areaGen = d3.area<HourlyPoint>()
        .x((d) => x(d.hour))
        .y0((d) => y(d.lower))
        .y1((d) => y(d.upper))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(predictedData)
        .attr('fill', COLORS.confidence)
        .attr('d', areaGen);
    }

    const historicalData = visibleData.filter((d) => !d.predicted);
    if (historicalData.length > 1) {
      const lineGen = d3.line<HourlyPoint>()
        .x((d) => x(d.hour))
        .y((d) => y(d.count))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(historicalData)
        .attr('fill', 'none')
        .attr('stroke', COLORS.historical)
        .attr('stroke-width', 2)
        .attr('d', lineGen);
    }

    if (predictedData.length > 1) {
      const predLineGen = d3.line<HourlyPoint>()
        .x((d) => x(d.hour))
        .y((d) => y(d.count))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(predictedData)
        .attr('fill', 'none')
        .attr('stroke', COLORS.predicted)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '6,3')
        .attr('d', predLineGen);
    }

    if (historicalData.length > 0 && predictedData.length > 0) {
      const bridgePoints = [
        historicalData[historicalData.length - 1],
        predictedData[0],
      ];
      const bridgeLine = d3.line<HourlyPoint>()
        .x((d) => x(d.hour))
        .y((d) => y(d.count))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(bridgePoints)
        .attr('fill', 'none')
        .attr('stroke', COLORS.predicted)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '6,3')
        .attr('d', bridgeLine);
    }

    g.selectAll('.dot-historical')
      .data(historicalData)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.hour))
      .attr('cy', (d) => y(d.count))
      .attr('r', 3)
      .attr('fill', COLORS.historical);

    g.selectAll('.dot-predicted')
      .data(predictedData)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.hour))
      .attr('cy', (d) => y(d.count))
      .attr('r', 3)
      .attr('fill', 'none')
      .attr('stroke', COLORS.predicted)
      .attr('stroke-width', 1.5);

    const overlay = g.append('rect')
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('fill', 'none')
      .attr('pointer-events', 'all');

    const tooltipLine = g.append('line')
      .attr('stroke', 'rgba(255,255,255,0.3)')
      .attr('stroke-width', 1)
      .attr('y1', 0)
      .attr('y2', innerH)
      .style('display', 'none');

    overlay
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const hoveredHour = Math.round(x.invert(mx));
        const point = visibleData.find((d) => d.hour === hoveredHour);
        if (!point || !tooltipRef.current) return;

        tooltipLine
          .style('display', null)
          .attr('x1', x(point.hour))
          .attr('x2', x(point.hour));

        const tooltip = tooltipRef.current;
        tooltip.style.display = 'block';
        tooltip.innerHTML = `
          <div style="font-weight:600;margin-bottom:4px">${point.hour}:00</div>
          <div>骑行量: <span style="color:#00e5c7;font-weight:600">${point.count}</span></div>
          <div style="color:${point.predicted ? '#ff9f43' : 'rgba(255,255,255,0.6)'}">
            ${point.predicted ? '⚡ 预测值' : '📊 历史值'}
          </div>
          ${point.predicted ? `<div style="color:rgba(255,255,255,0.4);font-size:11px">置信区间: ${point.lower} - ${point.upper}</div>` : ''}
        `;

        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const tooltipX = MARGIN.left + x(point.hour) + 10;
          const tooltipY = MARGIN.top + y(point.count) - 10;
          tooltip.style.left = `${tooltipX}px`;
          tooltip.style.top = `${tooltipY}px`;
        }
      })
      .on('mouseleave', () => {
        tooltipLine.style('display', 'none');
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
        }
      });

    if (timePeriod === 'all_day' && weather.length > 0) {
      const weatherGroup = g.append('g').attr('class', 'weather-icons');
      const uniqueDays = [...new Set(weather.map((w) => w.date))];
      const iconsPerDay = Math.min(3, Math.max(1, Math.floor(innerW / 200)));
      const daySpacing = innerW / uniqueDays.length;

      uniqueDays.forEach((date, dayIdx) => {
        const dayWeather = weather.find((w) => w.date === date);
        if (!dayWeather) return;

        for (let i = 0; i < iconsPerDay; i++) {
          const xPos = dayIdx * daySpacing + (i + 1) * (daySpacing / (iconsPerDay + 1));
          if (xPos < 0 || xPos > innerW) continue;

          weatherGroup.append('text')
            .attr('x', xPos)
            .attr('y', -8)
            .attr('text-anchor', 'middle')
            .attr('font-size', 12)
            .text(WEATHER_ICONS[dayWeather.condition] || '');
        }
      });
    }
  }, [filteredRides, weather, timePeriod, dimensions]);

  const periodButtons: { key: TimePeriod; label: string }[] = [
    { key: 'all_day', label: '全天' },
    { key: 'morning_rush', label: '早高峰' },
    { key: 'evening_rush', label: '晚高峰' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">峰值预测</h3>
          <p className="text-xs text-white/40 mt-0.5">
            当前视图: {PERIOD_LABELS[timePeriod]}
          </p>
        </div>
        <div className="flex gap-1">
          {periodButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setTimePeriod(btn.key)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                timePeriod === btn.key
                  ? 'bg-[#00e5c7]/20 text-[#00e5c7] border border-[#00e5c7]/30'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 border border-transparent'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="relative flex-1 min-h-[220px]">
        <svg ref={svgRef} className="w-full h-full" />
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none z-10 bg-[#2a2d36] border border-white/10 rounded px-3 py-2 text-xs text-white shadow-lg"
          style={{ display: 'none' }}
        />
      </div>

      <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 bg-[#00e5c7]" />
          历史数据
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 border-t-2 border-dashed border-[#00e5c7]" />
          预测数据
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 bg-[rgba(0,229,199,0.15)] rounded-sm" />
          置信区间
        </span>
      </div>
    </div>
  );
}
