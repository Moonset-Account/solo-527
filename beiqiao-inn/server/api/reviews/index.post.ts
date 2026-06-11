import { prisma } from '~/server/utils/prisma'
import { useMockStore, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!(await isDbAvailable())) {
    const store = useMockStore()
    return store.createReview(body)
  }

  const review = await prisma.review.create({
    data: {
      orderId: body.orderId,
      userId: body.userId,
      roomId: body.roomId,
      rating: body.rating,
      content: body.content,
      images: body.images,
    },
  })
  await prisma.todoItem.create({
    data: {
      type: 'REVIEW_REPLY',
      title: `回复评价 #${review.id}`,
      priority: 'P2',
      status: 'PENDING',
      assigneeId: 1,
      relatedId: review.id,
      relatedType: 'Review',
    },
  })
  return review
})
