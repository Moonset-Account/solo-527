import { create } from 'zustand'
import type {
  GameState,
  Zone,
  Task,
  Resource,
  Assignment,
  Decision,
  GameEvent,
  LevelConfig,
  ResourceType,
} from '@/types/game'
import { getZoneStatus } from '@/types/game'

interface GameStoreState {
  gameState: GameState
  currentLevel: LevelConfig | null
  zones: Zone[]
  events: GameEvent[]
  tasks: Task[]
  resources: Resource[]
  assignments: Assignment[]
  decisions: Decision[]
  elapsedTime: number
  currentDelay: number
  currentCost: number
  currentSatisfaction: number
}

interface GameStoreActions {
  startGame: (level: LevelConfig) => void
  pauseGame: () => void
  resumeGame: () => void
  resetGame: () => void
  assignResources: (taskId: string, resourceType: ResourceType, amount: number) => void
  tick: (deltaTime: number) => void
  completeTask: (taskId: string) => void
  addDecision: (decision: Decision) => void
  triggerEvent: (eventId: string) => void
}

const initialState: GameStoreState = {
  gameState: 'idle',
  currentLevel: null,
  zones: [],
  events: [],
  tasks: [],
  resources: [],
  assignments: [],
  decisions: [],
  elapsedTime: 0,
  currentDelay: 0,
  currentCost: 0,
  currentSatisfaction: 100,
}

export const useGameStore = create<GameStoreState & GameStoreActions>()((set, get) => ({
  ...initialState,

  startGame: (level) => {
    set({
      gameState: 'playing',
      currentLevel: level,
      zones: level.zones.map((z) => ({
        ...z,
        status: getZoneStatus(z.health) as Zone['status'],
        currentHealth: z.health,
      })),
      events: level.events.map((e) => ({
        ...e,
        triggered: false,
        expired: false,
      })),
      tasks: [],
      resources: level.resources.map((r) => ({
        ...r,
        available: r.total,
      })),
      assignments: [],
      decisions: [],
      elapsedTime: 0,
      currentDelay: 0,
      currentCost: 0,
      currentSatisfaction: 100,
    })
  },

  pauseGame: () => {
    const { gameState } = get()
    if (gameState === 'playing') {
      set({ gameState: 'paused' })
    }
  },

  resumeGame: () => {
    const { gameState } = get()
    if (gameState === 'paused') {
      set({ gameState: 'playing' })
    }
  },

  resetGame: () => {
    set(initialState)
  },

  assignResources: (taskId, resourceType, amount) => {
    const { resources, assignments, tasks } = get()
    const resource = resources.find((r) => r.type === resourceType)
    if (!resource || resource.available < amount) return

    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.completed || task.failed) return

    const assignment: Assignment = {
      id: `assignment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      taskId,
      resourceType,
      resourceAmount: amount,
      dispatchTime: get().elapsedTime,
      eta: get().elapsedTime + 3,
      status: 'dispatched',
    }

    set({
      resources: resources.map((r) =>
        r.type === resourceType ? { ...r, available: r.available - amount } : r
      ),
      assignments: [...assignments, assignment],
      tasks: tasks.map((t) => {
        if (t.id !== taskId) return t
        if (resourceType === 'repair_team') {
          return { ...t, assignedTeams: t.assignedTeams + amount }
        }
        if (resourceType === 'supply') {
          return { ...t, assignedSupplies: t.assignedSupplies + amount }
        }
        return t
      }),
    })
  },

  tick: (deltaTime) => {
    const { gameState, currentLevel, elapsedTime, tasks, assignments, currentSatisfaction, currentDelay, currentCost, zones, events } = get()
    if (gameState !== 'playing' || !currentLevel) return

    const newElapsedTime = elapsedTime + deltaTime

    const updatedAssignments = assignments.map((a) => {
      if (a.status === 'dispatched' && newElapsedTime >= a.eta * 0.3 + a.dispatchTime * 0.7) {
        return { ...a, status: 'en_route' as const }
      }
      if (a.status === 'en_route' && newElapsedTime >= a.eta) {
        return { ...a, status: 'working' as const }
      }
      return a
    })

    let satisfactionDelta = 0
    let delayAccum = 0
    let costAccum = 0
    const completedTaskIds: string[] = []
    const updatedTasks = tasks.map((t) => {
      if (t.completed || t.failed) return t
      const timeElapsed = newElapsedTime - t.createdAt
      if (timeElapsed >= t.timeLimit) {
        satisfactionDelta += t.satisfactionImpact
        delayAccum += t.delayImpact * 0.5
        return { ...t, failed: true }
      }
      const workingAssignments = updatedAssignments.filter(
        (a) => a.taskId === t.id && a.status === 'working'
      )
      const totalTeams = t.assignedTeams
      const totalSupplies = t.assignedSupplies
      if (
        totalTeams >= t.requiredTeams &&
        totalSupplies >= t.requiredSupplies &&
        workingAssignments.length > 0
      ) {
        const workRate = Math.min(totalTeams / t.requiredTeams, 1.5)
        const newEstimated = t.estimatedTime - deltaTime * workRate
        if (newEstimated <= 0) {
          completedTaskIds.push(t.id)
          costAccum += t.costImpact * 0.3
          return { ...t, completed: true, estimatedTime: 0 }
        }
        return { ...t, estimatedTime: newEstimated }
      }
      return t
    })

    let freedResources: Partial<Record<ResourceType, number>> = {}
    let finalAssignments = updatedAssignments
    let finalResources = get().resources
    let finalZones = zones

    if (completedTaskIds.length > 0) {
      const completedAssigns = updatedAssignments.filter((a) => completedTaskIds.includes(a.taskId))
      freedResources = completedAssigns.reduce<Partial<Record<ResourceType, number>>>(
        (acc, a) => {
          acc[a.resourceType] = (acc[a.resourceType] || 0) + a.resourceAmount
          return acc
        },
        {}
      )
      finalAssignments = updatedAssignments.map((a) =>
        completedTaskIds.includes(a.taskId) ? { ...a, status: 'completed' as const } : a
      )
      finalResources = finalResources.map((r) => {
        const freed = freedResources[r.type]
        if (freed) return { ...r, available: Math.min(r.total, r.available + freed) }
        return r
      })
      const completedTasks = updatedTasks.filter((t) => completedTaskIds.includes(t.id))
      finalZones = zones.map((z) => {
        const affectedByCompleted = completedTasks.find((t) => t.zoneId === z.id)
        if (!affectedByCompleted) return z
        const newHealth = Math.min(100, z.currentHealth + 20)
        return { ...z, currentHealth: newHealth, status: getZoneStatus(newHealth) }
      })
    }

    const triggeredEvents = events.filter(
      (e) => !e.triggered && !e.expired && newElapsedTime >= e.triggerTime
    )
    const updatedEvents = events.map((e) => {
      if (triggeredEvents.some((te) => te.id === e.id)) {
        return { ...e, triggered: true }
      }
      return e
    })

    const newTasks: Task[] = triggeredEvents.map((e) => ({
      id: `task-${e.id}-${Date.now()}`,
      eventId: e.id,
      zoneId: e.affectedZoneIds[0],
      eventType: e.type,
      name: e.name,
      description: e.description,
      priority: e.urgency,
      requiredTeams: e.requiredTeams,
      requiredSupplies: e.requiredSupplies,
      estimatedTime: e.timeLimit * 0.5,
      delayImpact: e.delayImpact,
      costImpact: e.costImpact,
      satisfactionImpact: e.satisfactionImpact,
      timeLimit: e.timeLimit,
      createdAt: newElapsedTime,
      assignedTeams: 0,
      assignedSupplies: 0,
      completed: false,
      failed: false,
    }))

    const updatedZones = triggeredEvents.reduce<Zone[]>((acc, event) => {
      return acc.map((z) => {
        if (!event.affectedZoneIds.includes(z.id)) return z
        const healthDelta = event.satisfactionImpact * 0.5
        const newHealth = Math.max(0, z.currentHealth - healthDelta)
        return {
          ...z,
          currentHealth: newHealth,
          status: getZoneStatus(newHealth),
        }
      })
    }, finalZones)

    const newSatisfaction = Math.max(0, currentSatisfaction + satisfactionDelta)
    const newDelay = currentDelay + delayAccum
    const newCost = currentCost + costAccum

    set({
      elapsedTime: newElapsedTime,
      assignments: finalAssignments,
      tasks: [...updatedTasks, ...newTasks],
      events: updatedEvents,
      zones: updatedZones,
      resources: finalResources,
      currentSatisfaction: newSatisfaction,
      currentDelay: newDelay,
      currentCost: newCost,
    })

    if (newSatisfaction <= 0) {
      set({ gameState: 'failed' })
      return
    }
    if (currentLevel.thresholds.maxDelay > 0 && newDelay >= currentLevel.thresholds.maxDelay) {
      set({ gameState: 'failed' })
      return
    }
    if (currentLevel.thresholds.maxCost > 0 && newCost >= currentLevel.thresholds.maxCost) {
      set({ gameState: 'failed' })
      return
    }
    if (newElapsedTime >= currentLevel.duration) {
      set({ gameState: 'success' })
    }
  },

  completeTask: (taskId) => {
    const { tasks, assignments, resources, currentDelay, currentCost, zones } = get()
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.completed) return

    const completedAssignments = assignments.filter((a) => a.taskId === taskId)
    const freedResources = completedAssignments.reduce<Partial<Record<ResourceType, number>>>(
      (acc, a) => {
        acc[a.resourceType] = (acc[a.resourceType] || 0) + a.resourceAmount
        return acc
      },
      {}
    )

    const updatedZones = zones.map((z) => {
      if (z.id !== task.zoneId) return z
      const healthRestore = 20
      const newHealth = Math.min(100, z.currentHealth + healthRestore)
      return {
        ...z,
        currentHealth: newHealth,
        status: getZoneStatus(newHealth),
      }
    })

    set({
      tasks: tasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t)),
      assignments: assignments.map((a) =>
        a.taskId === taskId ? { ...a, status: 'completed' as const } : a
      ),
      resources: resources.map((r) => {
        const freed = freedResources[r.type]
        if (freed) {
          return { ...r, available: Math.min(r.total, r.available + freed) }
        }
        return r
      }),
      currentDelay: currentDelay + task.delayImpact,
      currentCost: currentCost + task.costImpact,
      zones: updatedZones,
    })
  },

  addDecision: (decision) => {
    set((state) => ({
      decisions: [...state.decisions, decision],
      currentDelay: state.currentDelay + decision.delayDelta,
      currentCost: state.currentCost + decision.costDelta,
      currentSatisfaction: Math.max(0, state.currentSatisfaction + decision.satisfactionDelta),
    }))
  },

  triggerEvent: (eventId) => {
    const { events } = get()
    const event = events.find((e) => e.id === eventId)
    if (!event || event.triggered) return

    set({
      events: events.map((e) => (e.id === eventId ? { ...e, triggered: true } : e)),
    })
  },
}))
