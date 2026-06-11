export interface Room {
  id: number
  name: string
  type: string
  floor: number
  maxGuests: number
  amenities: string[] | null
  images: string[] | null
  status: 'AVAILABLE' | 'BOOKED' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING'
  basePrice: number
  inventories?: RoomInventory[]
}

export interface RoomInventory {
  id: number
  roomId: number
  date: string
  availableCount: number
  totalCount: number
  price: number
  syncStatus: string
  lastSyncedAt: string | null
  room?: { id: number; name: string; type: string }
}

export function useRooms() {
  const rooms = ref<Room[]>([])
  const inventories = ref<RoomInventory[]>([])
  const loading = ref(false)

  async function fetchRooms(params?: { type?: string; status?: string }) {
    loading.value = true
    try {
      const query = new URLSearchParams()
      if (params?.type) query.set('type', params.type)
      if (params?.status) query.set('status', params.status)
      const data = await $fetch<Room[]>(`/api/rooms?${query.toString()}`)
      rooms.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchRoom(id: number) {
    loading.value = true
    try {
      const data = await $fetch<Room>(`/api/rooms/${id}`)
      return data
    } finally {
      loading.value = false
    }
  }

  async function fetchInventories(params?: { startDate?: string; endDate?: string; type?: string }) {
    loading.value = true
    try {
      const query = new URLSearchParams()
      if (params?.startDate) query.set('startDate', params.startDate)
      if (params?.endDate) query.set('endDate', params.endDate)
      if (params?.type) query.set('type', params.type)
      const data = await $fetch<RoomInventory[]>(`/api/rooms/inventory?${query.toString()}`)
      inventories.value = data
    } finally {
      loading.value = false
    }
  }

  return { rooms, inventories, loading, fetchRooms, fetchRoom, fetchInventories }
}
