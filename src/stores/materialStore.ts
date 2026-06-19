import { create } from 'zustand'
import type { MaterialItem, MaterialStatus } from '../../shared/types'

interface MaterialState {
  materials: MaterialItem[]
  fetchMaterials: (contractId: number) => Promise<void>
  updateMaterialStatus: (id: number, status: MaterialStatus) => Promise<void>
  batchRemind: (materialIds: number[]) => Promise<void>
}

export const useMaterialStore = create<MaterialState>((set) => ({
  materials: [],

  fetchMaterials: async (contractId) => {
    try {
      const res = await fetch(`/api/materials?contractId=${contractId}`)
      const json = await res.json()
      set({ materials: json.data })
    } catch {}
  },

  updateMaterialStatus: async (id, status) => {
    try {
      const res = await fetch(`/api/materials/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      set((state) => ({
        materials: state.materials.map((m) => (m.id === id ? json.data : m)),
      }))
    } catch {}
  },

  batchRemind: async (materialIds) => {
    try {
      await fetch('/api/materials/batch-remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialIds }),
      })
    } catch {}
  },
}))
