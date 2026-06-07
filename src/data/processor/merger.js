const WINDOW_MS = 72 * 60 * 60 * 1000

export function mergeDuplicateRepairs(faultLogs) {
  const sorted = [...faultLogs].sort((a, b) => 
    new Date(a.occur_time) - new Date(b.occur_time)
  )
  
  const merged = []
  
  for (const fault of sorted) {
    const occurTime = new Date(fault.occur_time).getTime()
    
    const lastMatch = merged.find(m => 
      m.charger_id === fault.charger_id &&
      m.fault_code === fault.fault_code &&
      occurTime - new Date(m.first_occur_time).getTime() <= WINDOW_MS
    )
    
    if (lastMatch) {
      lastMatch.duplicate_count = (lastMatch.duplicate_count || 1) + 1
      lastMatch.last_occur_time = fault.occur_time
      lastMatch.merged_ids.push(fault.id)
      
      if (!lastMatch.is_resolved && fault.is_resolved) {
        lastMatch.is_resolved = true
        lastMatch.resolve_time = fault.resolve_time
      }
    } else {
      merged.push({
        ...fault,
        duplicate_count: 1,
        first_occur_time: fault.occur_time,
        last_occur_time: fault.occur_time,
        merged_ids: [fault.id]
      })
    }
  }
  
  return merged
}

export function getDuplicateGroups(faultLogs) {
  const merged = mergeDuplicateRepairs(faultLogs)
  return merged.filter(m => m.duplicate_count > 1)
}

export function isDuplicate(faultId, faultLogs) {
  const groups = getDuplicateGroups(faultLogs)
  return groups.some(g => g.merged_ids.includes(faultId) && g.id !== faultId)
}
