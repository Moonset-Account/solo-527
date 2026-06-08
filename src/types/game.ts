export type EventType = 'storm' | 'blackout' | 'traffic' | 'flood' | 'fire'
export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type ZoneType = 'residential' | 'commercial' | 'industrial' | 'hospital' | 'powerplant' | 'transport'
export type ResourceType = 'repair_team' | 'supply' | 'vehicle'
export type AssignmentStatus = 'dispatched' | 'en_route' | 'working' | 'completed' | 'failed'
export type GameState = 'idle' | 'playing' | 'paused' | 'success' | 'failed'
export type ZoneStatus = 'normal' | 'minor' | 'damaged' | 'critical'

export interface ZoneConfig {
  id: string
  name: string
  gridX: number
  gridY: number
  type: ZoneType
  health: number
  population: number
}

export interface EventConfig {
  id: string
  type: EventType
  name: string
  description: string
  triggerTime: number
  affectedZoneIds: string[]
  urgency: Priority
  timeLimit: number
  requiredTeams: number
  requiredSupplies: number
  delayImpact: number
  costImpact: number
  satisfactionImpact: number
}

export interface ResourceConfig {
  id: string
  type: ResourceType
  name: string
  total: number
}

export interface TutorialStep {
  id: string
  text: string
  highlightElement?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export interface LevelConfig {
  id: string
  name: string
  description: string
  difficulty: 1 | 2 | 3 | 4 | 5
  duration: number
  gridCols: number
  gridRows: number
  zones: ZoneConfig[]
  events: EventConfig[]
  resources: ResourceConfig[]
  thresholds: {
    maxDelay: number
    maxCost: number
    minSatisfaction: number
  }
  tutorialSteps?: TutorialStep[]
}

export interface Zone extends ZoneConfig {
  status: ZoneStatus
  currentHealth: number
}

export interface GameEvent extends EventConfig {
  triggered: boolean
  expired: boolean
}

export interface Task {
  id: string
  eventId: string
  zoneId: string
  eventType: EventType
  name: string
  description: string
  priority: Priority
  requiredTeams: number
  requiredSupplies: number
  estimatedTime: number
  delayImpact: number
  costImpact: number
  satisfactionImpact: number
  timeLimit: number
  createdAt: number
  assignedTeams: number
  assignedSupplies: number
  completed: boolean
  failed: boolean
}

export interface Resource {
  id: string
  type: ResourceType
  name: string
  total: number
  available: number
}

export interface Assignment {
  id: string
  taskId: string
  resourceType: ResourceType
  resourceAmount: number
  dispatchTime: number
  eta: number
  status: AssignmentStatus
}

export interface Decision {
  time: number
  taskId: string
  action: string
  detail: string
  delayDelta: number
  costDelta: number
  satisfactionDelta: number
}

export interface GameResult {
  levelId: string
  success: boolean
  totalDelay: number
  totalCost: number
  finalSatisfaction: number
  stars: number
  failReason?: string
  decisions: Decision[]
}

export interface LevelSave {
  levelId: string
  bestStars: number
  unlocked: boolean
  bestResult?: GameResult
}

export interface GameSave {
  tutorialCompleted: boolean
  levels: LevelSave[]
  totalPlayTime: number
}

export interface DebugLogEntry {
  timestamp: number
  type: 'event' | 'task' | 'resource' | 'system' | 'error'
  message: string
  detail?: string
}

export const PRIORITY_CONFIG: Record<Priority, { color: string; label: string; order: number }> = {
  critical: { color: '#ef4444', label: '紧急', order: 0 },
  high: { color: '#f97316', label: '重要', order: 1 },
  medium: { color: '#eab308', label: '一般', order: 2 },
  low: { color: '#3b82f6', label: '低优', order: 3 },
}

export const ZONE_TYPE_CONFIG: Record<ZoneType, { icon: string; label: string; color: string }> = {
  residential: { icon: '🏠', label: '居民区', color: '#4ade80' },
  commercial: { icon: '🏢', label: '商业区', color: '#60a5fa' },
  industrial: { icon: '🏭', label: '工业区', color: '#a78bfa' },
  hospital: { icon: '🏥', label: '医院', color: '#f87171' },
  powerplant: { icon: '⚡', label: '发电站', color: '#fbbf24' },
  transport: { icon: '🛤️', label: '交通枢纽', color: '#34d399' },
}

export const EVENT_TYPE_CONFIG: Record<EventType, { icon: string; label: string; color: string }> = {
  storm: { icon: '🌧️', label: '暴雨', color: '#60a5fa' },
  blackout: { icon: '🔌', label: '停电', color: '#9ca3af' },
  traffic: { icon: '🚗', label: '交通拥堵', color: '#f97316' },
  flood: { icon: '🌊', label: '洪涝', color: '#06b6d4' },
  fire: { icon: '🔥', label: '火灾', color: '#ef4444' },
}

export const RESOURCE_TYPE_CONFIG: Record<ResourceType, { icon: string; label: string }> = {
  repair_team: { icon: '👷', label: '维修队' },
  supply: { icon: '📦', label: '物资' },
  vehicle: { icon: '🚛', label: '车辆' },
}

export function getZoneStatus(health: number): ZoneStatus {
  if (health >= 80) return 'normal'
  if (health >= 60) return 'minor'
  if (health >= 30) return 'damaged'
  return 'critical'
}

export function getZoneStatusColor(status: ZoneStatus): string {
  switch (status) {
    case 'normal': return '#00c9a7'
    case 'minor': return '#ffc107'
    case 'damaged': return '#ff6b35'
    case 'critical': return '#ef4444'
  }
}

export function calculateStars(delay: number, cost: number, satisfaction: number, thresholds: LevelConfig['thresholds']): number {
  const delayRatio = delay / thresholds.maxDelay
  const costRatio = cost / thresholds.maxCost
  const satRatio = satisfaction / 100
  const score = (1 - delayRatio) * 0.3 + (1 - costRatio) * 0.3 + satRatio * 0.4
  if (score >= 0.8) return 3
  if (score >= 0.5) return 2
  return 1
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
