import * as d3 from 'd3'

export function createLineChart(
  container: HTMLElement,
  data: Array<{ date: string; value: number }>,
  options: { color?: string; height?: number } = {}
) {
  const { color = '#0f766e', height = 200 } = options
  const width = container.clientWidth

  d3.select(container).selectAll('*').remove()

  const margin = { top: 20, right: 20, bottom: 30, left: 40 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const parseDate = d3.timeParse('%Y-%m-%d')
  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => parseDate(d.date)!) as [Date, Date])
    .range([0, innerWidth])

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)! * 1.1])
    .range([innerHeight, 0])

  const line = d3.line<any>()
    .x(d => xScale(parseDate(d.date)!))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX)

  const area = d3.area<any>()
    .x(d => xScale(parseDate(d.date)!))
    .y0(innerHeight)
    .y1(d => yScale(d.value))
    .curve(d3.curveMonotoneX)

  const gradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'area-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%')

  gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', color)
    .attr('stop-opacity', 0.3)

  gradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', color)
    .attr('stop-opacity', 0.01)

  g.append('path')
    .datum(data)
    .attr('fill', 'url(#area-gradient)')
    .attr('d', area)

  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-width', 2)
    .attr('d', line)

  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat('%m-%d') as any))
    .selectAll('text')
    .attr('font-size', '10px')
    .attr('fill', '#9ca3af')

  g.append('g')
    .call(d3.axisLeft(yScale).ticks(4))
    .selectAll('text')
    .attr('font-size', '10px')
    .attr('fill', '#9ca3af')

  g.selectAll('.domain, .tick line')
    .attr('stroke', '#e5e7eb')
}

export function createBarChart(
  container: HTMLElement,
  data: Array<{ label: string; value: number }>,
  options: { color?: string; height?: number; horizontal?: boolean } = {}
) {
  const { color = '#0f766e', height = 200, horizontal = false } = options
  const width = container.clientWidth

  d3.select(container).selectAll('*').remove()

  const margin = { top: 10, right: 20, bottom: 30, left: 60 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  if (horizontal) {
    const yScale = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, innerHeight])
      .padding(0.3)

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)! * 1.1])
      .range([0, innerWidth])

    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('y', d => yScale(d.label)!)
      .attr('x', 0)
      .attr('height', yScale.bandwidth())
      .attr('width', 0)
      .attr('fill', color)
      .attr('rx', 4)
      .transition()
      .duration(600)
      .attr('width', d => xScale(d.value))

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('fill', '#6b7280')

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('fill', '#9ca3af')
  } else {
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.2)

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)! * 1.1])
      .range([innerHeight, 0])

    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.label)!)
      .attr('y', innerHeight)
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('fill', color)
      .attr('rx', 4)
      .transition()
      .duration(600)
      .attr('y', d => yScale(d.value))
      .attr('height', d => innerHeight - yScale(d.value))

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('fill', '#9ca3af')

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(4))
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('fill', '#9ca3af')
  }

  g.selectAll('.domain, .tick line')
    .attr('stroke', '#e5e7eb')
}

export function createPieChart(
  container: HTMLElement,
  data: Array<{ label: string; value: number; color: string }>,
  options: { height?: number } = {}
) {
  const { height = 200 } = options
  const width = container.clientWidth
  const radius = Math.min(width, height) / 2 - 20

  d3.select(container).selectAll('*').remove()

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`)

  const pie = d3.pie<any>().value(d => d.value)
  const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius)

  const arcs = svg.selectAll('.arc')
    .data(pie(data))
    .enter()
    .append('g')
    .attr('class', 'arc')

  arcs.append('path')
    .attr('d', arc as any)
    .attr('fill', d => d.data.color)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .style('opacity', 0)
    .transition()
    .duration(600)
    .style('opacity', 1)

  const total = data.reduce((sum, d) => sum + d.value, 0)

  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.2em')
    .attr('font-size', '24px')
    .attr('font-weight', 'bold')
    .attr('fill', '#1f2937')
    .text(total)

  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1.2em')
    .attr('font-size', '12px')
    .attr('fill', '#9ca3af')
    .text('总计')
}
