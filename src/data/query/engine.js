export function applyFilters(data, filters, options = {}) {
  if (!data || data.length === 0) return []
  
  let result = [...data]
  
  if (filters.stationIds && filters.stationIds.length > 0) {
    result = result.filter(d => 
      d.station_id && filters.stationIds.includes(d.station_id)
    )
  }
  
  if (filters.chargerModels && filters.chargerModels.length > 0 && options.chargerMap) {
    result = result.filter(d => {
      const charger = options.chargerMap.get(d.charger_id)
      return charger && filters.chargerModels.includes(charger.model)
    })
  }
  
  if (filters.faultCodes && filters.faultCodes.length > 0) {
    result = result.filter(d => 
      d.fault_code && filters.faultCodes.includes(d.fault_code)
    )
  }
  
  if (filters.timeRange && filters.timeRange[0] && filters.timeRange[1]) {
    const start = new Date(filters.timeRange[0]).getTime()
    const end = new Date(filters.timeRange[1]).getTime()
    
    result = result.filter(d => {
      const timeField = options.timeField || 'occur_time'
      const t = d[timeField] ? new Date(d[timeField]).getTime() : 0
      return t >= start && t <= end
    })
  }
  
  if (filters.repairPersonIds && filters.repairPersonIds.length > 0) {
    result = result.filter(d => 
      d.person_id && filters.repairPersonIds.includes(d.person_id)
    )
  }
  
  return result
}

export function groupBy(data, key) {
  const groups = {}
  data.forEach(item => {
    const k = typeof key === 'function' ? key(item) : item[key]
    if (!groups[k]) groups[k] = []
    groups[k].push(item)
  })
  return groups
}

export function aggregateBy(data, groupKey, aggKey, aggFn = 'count') {
  const groups = groupBy(data, groupKey)
  
  return Object.entries(groups).map(([key, items]) => {
    let value
    
    switch (aggFn) {
      case 'count':
        value = items.length
        break
      case 'sum':
        value = items.reduce((acc, i) => acc + (i[aggKey] || 0), 0)
        break
      case 'avg':
        value = items.length > 0 
          ? items.reduce((acc, i) => acc + (i[aggKey] || 0), 0) / items.length 
          : 0
        break
      case 'max':
        value = Math.max(...items.map(i => i[aggKey] || 0))
        break
      case 'min':
        value = Math.min(...items.map(i => i[aggKey] || 0))
        break
      default:
        value = items.length
    }
    
    return { key, value, items }
  })
}

export function selectFields(data, fields) {
  return data.map(item => {
    const result = {}
    fields.forEach(f => {
      result[f] = item[f]
    })
    return result
  })
}

export function limit(data, n, offset = 0) {
  return data.slice(offset, offset + n)
}

export function sortBy(data, key, order = 'desc') {
  return [...data].sort((a, b) => {
    const va = typeof key === 'function' ? key(a) : a[key]
    const vb = typeof key === 'function' ? key(b) : b[key]
    return order === 'desc' ? vb - va : va - vb
  })
}

export function buildQuery() {
  let _data = []
  let _filters = {}
  let _options = {}
  
  return {
    from(data) {
      _data = data
      return this
    },
    where(filters, options = {}) {
      _filters = { ..._filters, ...filters }
      _options = { ..._options, ...options }
      return this
    },
    groupBy(key) {
      _groupKey = key
      return this
    },
    aggregate(aggKey, aggFn) {
      _aggKey = aggKey
      _aggFn = aggFn
      return this
    },
    execute() {
      let result = applyFilters(_data, _filters, _options)
      
      if (_groupKey) {
        result = aggregateBy(result, _groupKey, _aggKey, _aggFn)
      }
      
      return result
    }
  }
}
