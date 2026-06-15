import { getFluctuations } from './mockData'
import type { Fluctuation } from '~/types'

const fluctuationsData: Fluctuation[] = getFluctuations()

export const useFluctuationsStore = () => {
  return fluctuationsData
}

export const findFluctuationIndex = (id: string): number => {
  return fluctuationsData.findIndex(f => f.id === id)
}

export const findFluctuation = (id: string): Fluctuation | undefined => {
  return fluctuationsData.find(f => f.id === id)
}

export const upsertFluctuation = (id: string, patch: Partial<Fluctuation>): Fluctuation => {
  const idx = findFluctuationIndex(id)
  if (idx === -1) throw new Error('Fluctuation not found')
  fluctuationsData[idx] = { ...fluctuationsData[idx], ...patch }
  return fluctuationsData[idx]
}

export const addFluctuation = (item: Fluctuation): Fluctuation => {
  fluctuationsData.unshift(item)
  return item
}
