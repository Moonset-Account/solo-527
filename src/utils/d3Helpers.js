import * as d3 from 'd3'

export const COLORS = {
  primary: '#165DFF',
  danger: '#FF4D4F',
  success: '#52C41A',
  warning: '#FAAD14',
  info: '#1890FF',
  text: {
    primary: '#F0F6FC',
    secondary: '#8B949E',
    muted: '#6E7681'
  },
  bg: {
    dark: '#0E1117',
    card: '#161B22',
    hover: '#21262D'
  },
  border: '#30363D'
}

export const SEVERITY_COLORS = {
  critical: COLORS.danger,
  high: COLORS.warning,
  medium: COLORS.info,
  low: COLORS.text.secondary
}

export function createSvg(container, width, height, margins = { top: 20, right: 20, bottom: 40, left: 50 }) {
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    
  const innerWidth = width - margins.left - margins.right
  const innerHeight = height - margins.top - margins.bottom
  
  const g = svg.append('g')
    .attr('transform', `translate(${margins.left}, ${margins.top})`)
  
  return { svg, g, innerWidth, innerHeight, margins }
}

export function clearSvg(container) {
  d3.select(container).selectAll('*').remove()
}

export function createXAxis(g, xScale, innerHeight, tickFormat = null) {
  const axis = d3.axisBottom(xScale)
  
  if (tickFormat) {
    axis.tickFormat(tickFormat)
  }
  
  g.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(axis)
    .selectAll('text')
    .attr('fill', COLORS.text.secondary)
    .attr('font-size', '11px')
  
  g.selectAll('.domain, .tick line')
    .attr('stroke', COLORS.border)
}

export function createYAxis(g, yScale, tickFormat = null) {
  const axis = d3.axisLeft(yScale)
  
  if (tickFormat) {
    axis.tickFormat(tickFormat)
  }
  
  g.append('g')
    .call(axis)
    .selectAll('text')
    .attr('fill', COLORS.text.secondary)
    .attr('font-size', '11px')
  
  g.selectAll('.domain, .tick line')
    .attr('stroke', COLORS.border)
}

export function createGrid(g, xScale, yScale, innerWidth, innerHeight) {
  g.append('g')
    .attr('class', 'grid')
    .selectAll('line')
    .data(yScale.ticks())
    .enter()
    .append('line')
    .attr('x1', 0)
    .attr('x2', innerWidth)
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d))
    .attr('stroke', COLORS.border)
    .attr('stroke-opacity', 0.3)
    .attr('stroke-dasharray', '3,3')
}

export function createTooltip() {
  return d3.select('body')
    .append('div')
    .attr('class', 'd3-tooltip')
    .style('position', 'absolute')
    .style('padding', '10px 14px')
    .style('background', 'rgba(22, 27, 34, 0.95)')
    .style('border', `1px solid ${COLORS.border}`)
    .style('border-radius', '8px')
    .style('color', COLORS.text.primary)
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('transition', 'opacity 0.15s')
    .style('z-index', '1000')
    .style('box-shadow', '0 4px 12px rgba(0,0,0,0.5)')
}

export function showTooltip(tooltip, html, event) {
  tooltip
    .html(html)
    .style('opacity', 1)
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY - 10) + 'px')
}

export function hideTooltip(tooltip) {
  tooltip.style('opacity', 0)
}

export function formatNumber(n, decimals = 1) {
  if (n >= 10000) {
    return (n / 10000).toFixed(1) + 'w'
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'k'
  }
  return Number(n.toFixed(decimals))
}

export function formatTime(isoString) {
  if (!isoString) return '-'
  const d = new Date(isoString)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDuration(hours) {
  if (hours == null) return '-'
  if (hours < 1) {
    return `${Math.round(hours * 60)}分钟`
  }
  return `${hours.toFixed(1)}小时`
}
