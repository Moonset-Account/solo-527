import {
  CAMP_SESSIONS,
  SPORTS_PROJECTS,
  AGE_GROUPS,
  COACHES,
  CANCEL_REASONS,
  EQUIPMENT_TYPES,
  WEATHER_TYPES,
  INCIDENT_LEVELS
} from './constants'

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

const generateRegistrations = () => {
  const registrations = []
  let id = 1

  CAMP_SESSIONS.forEach(session => {
    SPORTS_PROJECTS.forEach(project => {
      AGE_GROUPS.forEach(ageGroup => {
        const baseCount = randomInt(15, 50)
        const filteredCoaches = COACHES.filter(c => c.specialty === project.id)
        const coachPool = filteredCoaches.length > 0 ? filteredCoaches : COACHES
        const coach = randomChoice(coachPool)
        
        for (let i = 0; i < baseCount; i++) {
          const registerCount = 1
          const confirmed = Math.random() > 0.15
          const checkedIn = confirmed ? Math.random() > 0.1 : false
          const completed = checkedIn ? Math.random() > 0.05 : false
          const cancelled = !confirmed || (confirmed && !checkedIn && Math.random() > 0.5)
          
          const cancelReason = cancelled ? randomChoice(CANCEL_REASONS) : null
          const isMinor = ageGroup.id !== '18+'
          
          registrations.push({
            id: `reg-${id++}`,
            sessionId: session.id,
            projectId: project.id,
            ageGroupId: ageGroup.id,
            coachId: coach.id,
            registerCount,
            confirmCount: confirmed ? 1 : 0,
            checkinCount: checkedIn ? 1 : 0,
            completeCount: completed ? 1 : 0,
            cancelled: cancelled ? 1 : 0,
            cancelReasonId: cancelReason?.id || null,
            isMinor,
            registerDate: randomDate(new Date(session.startDate), new Date(session.endDate)).toISOString().split('T')[0]
          })
        }
      })
    })
  })
  
  return registrations
}

const generateIncidents = () => {
  const incidents = []
  let id = 1
  const levels = Object.keys(INCIDENT_LEVELS)
  
  CAMP_SESSIONS.forEach(session => {
    SPORTS_PROJECTS.forEach(project => {
      const incidentCount = randomInt(0, 8)
      for (let i = 0; i < incidentCount; i++) {
        const level = randomChoice(levels)
        const coach = randomChoice(COACHES)
        const date = randomDate(new Date(session.startDate), new Date(session.endDate))
        
        incidents.push({
          id: `inc-${id++}`,
          sessionId: session.id,
          projectId: project.id,
          coachId: coach.id,
          level,
          title: INCIDENT_LEVELS[level].label + '事件',
          description: level === 'minor' 
            ? '轻微擦伤，已消毒处理' 
            : level === 'medical' 
              ? '肌肉拉伤，已送医检查' 
              : '较严重情况，当日活动暂停',
          date: date.toISOString().split('T')[0],
          time: `${randomInt(8, 18)}:${String(randomInt(0, 59)).padStart(2, '0')}`,
          hasPhoto: Math.random() > 0.4,
          photoUrl: Math.random() > 0.4 ? `/photos/incident-${id}.jpg` : null,
          ageGroupId: randomChoice(AGE_GROUPS).id,
          minorCount: randomInt(0, 3),
          adultCount: randomInt(0, 2)
        })
      }
    })
  })
  
  return incidents.sort((a, b) => new Date(b.date) - new Date(a.date))
}

const generateEquipmentUsage = () => {
  const usage = []
  
  CAMP_SESSIONS.forEach(session => {
    SPORTS_PROJECTS.forEach(project => {
      EQUIPMENT_TYPES.forEach(equipment => {
        const useCount = randomInt(10, 100)
        const damageCount = randomInt(0, Math.floor(useCount * 0.15))
        const lossCount = randomInt(0, Math.floor(useCount * 0.05))
        
        usage.push({
          id: `${session.id}-${project.id}-${equipment.id}`,
          sessionId: session.id,
          projectId: project.id,
          equipmentId: equipment.id,
          useCount,
          damageCount,
          lossCount,
          totalWear: Math.floor(useCount * 0.3 + damageCount * 5 + lossCount * 10)
        })
      })
    })
  })
  
  return usage
}

const generateWeatherRecords = () => {
  const records = []
  
  CAMP_SESSIONS.forEach(session => {
    const start = new Date(session.startDate)
    const end = new Date(session.endDate)
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const weather = randomChoice(WEATHER_TYPES)
      records.push({
        id: `${session.id}-${d.toISOString().split('T')[0]}`,
        sessionId: session.id,
        date: d.toISOString().split('T')[0],
        weatherId: weather.id,
        temperature: randomInt(20, 35),
        windSpeed: randomInt(0, 30),
        visibility: randomInt(1, 10)
      })
    }
  })
  
  return records
}

export const mockData = {
  registrations: generateRegistrations(),
  incidents: generateIncidents(),
  equipmentUsage: generateEquipmentUsage(),
  weatherRecords: generateWeatherRecords()
}
