export interface Review {
  id: number
  orderId: number
  userId: number
  roomId: number
  rating: number
  content: string
  images: string[] | null
  reply: string | null
  status: 'PENDING_REPLY' | 'REPLIED'
  createdAt: string
  user?: { id: number; name: string }
}

export function useReviews() {
  const reviews = ref<Review[]>([])
  const loading = ref(false)

  async function fetchReviews(params?: { roomId?: number; status?: string }) {
    loading.value = true
    try {
      const query = new URLSearchParams()
      if (params?.roomId) query.set('roomId', String(params.roomId))
      if (params?.status) query.set('status', params.status)
      const data = await $fetch<Review[]>(`/api/reviews?${query.toString()}`)
      reviews.value = data
    } finally {
      loading.value = false
    }
  }

  const averageRating = computed(() => {
    if (reviews.value.length === 0) return 0
    const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0)
    return Math.round((sum / reviews.value.length) * 10) / 10
  })

  const ratingDistribution = computed(() => {
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.value.forEach((r) => { dist[r.rating] = (dist[r.rating] || 0) + 1 })
    return dist
  })

  return { reviews, loading, averageRating, ratingDistribution, fetchReviews }
}
