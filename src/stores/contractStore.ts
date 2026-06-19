import { create } from 'zustand'
import type { Contract, StuckNode, ContractStatus } from '../../shared/types'

interface ContractState {
  contracts: Contract[]
  currentContract: Contract | null
  stuckNodes: StuckNode[]
  loading: boolean
  fetchContracts: (status?: ContractStatus) => Promise<void>
  fetchContractById: (id: number) => Promise<void>
  fetchStuckNodes: () => Promise<void>
  createContract: (data: Partial<Contract>) => Promise<void>
  updateContractStatus: (id: number, status: ContractStatus) => Promise<void>
}

export const useContractStore = create<ContractState>((set) => ({
  contracts: [],
  currentContract: null,
  stuckNodes: [],
  loading: false,

  fetchContracts: async (status) => {
    set({ loading: true })
    try {
      const url = status ? `/api/contracts?status=${status}` : '/api/contracts'
      const res = await fetch(url)
      const json = await res.json()
      set({ contracts: json.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchContractById: async (id) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/contracts/${id}`)
      const json = await res.json()
      set({ currentContract: json.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchStuckNodes: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/contracts/stuck')
      const json = await res.json()
      set({ stuckNodes: json.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createContract: async (data) => {
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      set((state) => ({ contracts: [...state.contracts, json.data] }))
    } catch {}
  },

  updateContractStatus: async (id, status) => {
    try {
      const res = await fetch(`/api/contracts/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      const updated = json.data
      set((state) => ({
        contracts: state.contracts.map((c) => (c.id === id ? updated : c)),
        currentContract: state.currentContract?.id === id ? updated : state.currentContract,
      }))
    } catch {}
  },
}))
