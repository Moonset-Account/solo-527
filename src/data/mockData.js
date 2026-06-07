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

const generateWeatherRecords = () => {
  const records = []
  
  CAMP_SESSIONS.forEach(session => {
    const start = new Date(session.startDate)
    const end = new Date(session.endDate)
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const weather = weightedWeatherChoice()
      records.push({
        id: `${session.id}-${d.toISOString().split('T')[0]}`,
        sessionId: session.id,
        date: d.toISOString().split('T')[0],
        weatherId: weather.id,
        temperature: weather.id === 'hot' ? randomInt(32, 38) : 
                     weather.id === 'cold' ? randomInt(10, 18) : 
                     weather.id === 'storm' ? randomInt(18, 26) :
                     randomInt(22, 32),
        windSpeed: weather.id === 'storm' || weather.id === 'windy' ? randomInt(20, 45) : randomInt(2, 18),
        visibility: weather.id === 'foggy' || weather.id === 'storm' ? randomInt(1, 3) : randomInt(5, 10)
      })
    }
  })
  
  return records
}

const weightedWeatherChoice = () => {
  const weights = [
    { id: 'sunny', weight: 35 },
    { id: 'cloudy', weight: 25 },
    { id: 'light_rain', weight: 10 },
    { id: 'heavy_rain', weight: 8 },
    { id: 'storm', weight: 5 },
    { id: 'windy', weight: 7 },
    { id: 'foggy', weight: 5 },
    { id: 'hot', weight: 3 },
    { id: 'cold', weight: 2 }
  ]
  
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const w of weights) {
    random -= w.weight
    if (random <= 0) {
      return WEATHER_TYPES.find(t => t.id === w.id)
    }
  }
  
  return WEATHER_TYPES[0]
}

const isSevereWeather = (weatherId) => {
  return ['storm', 'heavy_rain', 'windy', 'foggy', 'hot', 'cold'].includes(weatherId)
}

const generateRegistrations = (weatherRecords) => {
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
          const registerDate = randomDate(new Date(session.startDate), new Date(session.endDate))
          const dateStr = registerDate.toISOString().split('T')[0]
          
          const dayWeather = weatherRecords.find(
            w => w.sessionId === session.id && w.date === dateStr
          )
          
          const severeWeather = dayWeather ? isSevereWeather(dayWeather.weatherId) : false
          
          let confirmed, checkedIn, completed, cancelled, cancelReason
          
          if (severeWeather) {
            confirmed = Math.random() > 0.45
            checkedIn = confirmed ? Math.random() > 0.35 : false
            completed = checkedIn ? Math.random() > 0.2 : false
            cancelled = !confirmed || (confirmed && !checkedIn && Math.random() > 0.3)
          } else {
            confirmed = Math.random() > 0.12
            checkedIn = confirmed ? Math.random() > 0.08 : false
            completed = checkedIn ? Math.random() > 0.03 : false
            cancelled = !confirmed || (confirmed && !checkedIn && Math.random() > 0.6)
          }
          
          if (cancelled) {
            if (severeWeather && Math.random() > 0.35) {
              const weatherReasons = CANCEL_REASONS.filter(r => r.id === 'weather' || r.id === 'safety')
              cancelReason = randomChoice(weatherReasons)
            } else {
              cancelReason = randomChoice(CANCEL_REASONS)
            }
          } else {
            cancelReason = null
          }
          
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
            weatherId: dayWeather?.weatherId || null,
            isMinor,
            registerDate: dateStr
          })
        }
      })
    })
  })
  
  return registrations
}

const generateIncidents = (weatherRecords) => {
  const incidents = []
  let id = 1
  const levels = Object.keys(INCIDENT_LEVELS)
  
  CAMP_SESSIONS.forEach(session => {
    SPORTS_PROJECTS.forEach(project => {
      const incidentCount = randomInt(1, 10)
      for (let i = 0; i < incidentCount; i++) {
        const date = randomDate(new Date(session.startDate), new Date(session.endDate))
        const dateStr = date.toISOString().split('T')[0]
        
        const dayWeather = weatherRecords.find(
          w => w.sessionId === session.id && w.date === dateStr
        )
        
        const severeWeather = dayWeather ? isSevereWeather(dayWeather.weatherId) : false
        
        let level
        if (severeWeather) {
          const levelRoll = Math.random()
          if (levelRoll < 0.45) {
            level = 'minor'
          } else if (levelRoll < 0.8) {
            level = 'medical'
          } else {
            level = 'suspend'
          }
        } else {
          const levelRoll = Math.random()
          if (levelRoll < 0.75) {
            level = 'minor'
          } else if (levelRoll < 0.95) {
            level = 'medical'
          } else {
            level = 'suspend'
          }
        }
        
        const coach = randomChoice(COACHES)
        
        incidents.push({
          id: `inc-${id++}`,
          sessionId: session.id,
          projectId: project.id,
          coachId: coach.id,
          weatherId: dayWeather?.weatherId || null,
          weatherName: dayWeather ? WEATHER_TYPES.find(w => w.id === dayWeather.weatherId)?.name : null,
          level,
          title: INCIDENT_LEVELS[level].label + '事件',
          description: severeWeather 
            ? (level === 'minor' 
                ? `恶劣天气下${dayWeather?.weatherId === 'windy' ? '强风' : dayWeather?.weatherId === 'storm' ? '暴雨' : '高温'}导致轻微擦伤，已消毒处理` 
                : level === 'medical' 
                  ? `天气因素(${dayWeather?.name || '恶劣'})导致肌肉拉伤，已送医检查` 
                  : `天气原因(${dayWeather?.name || '恶劣'})导致较严重情况，当日活动暂停`)
            : (level === 'minor' 
                ? '轻微擦伤，已消毒处理' 
                : level === 'medical' 
                  ? '肌肉拉伤，已送医检查' 
                  : '较严重情况，当日活动暂停'),
          date: dateStr,
          time: `${randomInt(8, 18)}:${String(randomInt(0, 59)).padStart(2, '0')}`,
          hasPhoto: Math.random() > 0.4,
          photoUrl: Math.random() > 0.4 ? `/photos/incident-${id}.jpg` : null,
          ageGroupId: randomChoice(AGE_GROUPS).id,
          minorCount: randomInt(0, 3),
          adultCount: randomInt(0, 2),
          temperature: dayWeather?.temperature || null,
          windSpeed: dayWeather?.windSpeed || null
        })
      }
    })
  })
  
  return incidents.sort((a, b) => new Date(b.date) - new Date(a.date))
}

const generateEquipmentUsage = (weatherRecords) => {
  const usage = []
  
  CAMP_SESSIONS.forEach(session => {
    const sessionWeather = weatherRecords.filter(w => w.sessionId === session.id)
    const severeDays = sessionWeather.filter(w => isSevereWeather(w.weatherId)).length
    const weatherMultiplier = 1 + (severeDays / sessionWeather.length) * 0.3
    
    SPORTS_PROJECTS.forEach(project => {
      EQUIPMENT_TYPES.forEach(equipment => {
        const baseUse = randomInt(10, 100)
        const useCount = Math.floor(baseUse * weatherMultiplier)
        const damageCount = randomInt(0, Math.floor(useCount * 0.15 * weatherMultiplier))
        const lossCount = randomInt(0, Math.floor(useCount * 0.05 * weatherMultiplier))
        
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

let cachedMockData = null

export const mockData = {
  get registrations() {
    return this.getData().registrations
  },
  get incidents() {
    return this.getData().incidents
  },
  get equipmentUsage() {
    return this.getData().equipmentUsage
  },
  get weatherRecords() {
    return this.getData().weatherRecords
  },
  getData() {
    if (!cachedMockData) {
      try {
        const weatherRecords = generateWeatherRecords()
        const registrations = generateRegistrations(weatherRecords)
        const incidents = generateIncidents(weatherRecords)
        const equipmentUsage = generateEquipmentUsage(weatherRecords)
        cachedMockData = { registrations, incidents, equipmentUsage, weatherRecords }
      } catch (error) {
        console.error('Failed to generate mock data:', error)
        cachedMockData = { registrations: [], incidents: [], equipmentUsage: [], weatherRecords: [] }
      }
    }
    return cachedMockData
  }
}
