import { prisma } from '~/server/utils/prisma'
import { isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { userId, roomId, checkIn, checkOut, guestCount, guestName, guestPhone } = body

  if (!(await isDbAvailable())) {
    return {
      id: Date.now(),
      orderNo: 'BQ' + Date.now(),
      userId,
      roomId,
      checkIn,
      checkOut,
      guestCount: guestCount || 1,
      guestName,
      guestPhone,
      totalPrice: 0,
      status: 'PENDING_PAYMENT',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  const room = await prisma.room.findUnique({ where: { id: roomId } })
  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' })
  }

  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

  const totalPrice = Number(room.basePrice) * nights
  const orderNo = 'BQ' + Date.now()

  const order = await prisma.order.create({
    data: {
      orderNo,
      userId,
      roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guestCount: guestCount || 1,
      guestName,
      guestPhone,
      totalPrice,
      status: 'PENDING_PAYMENT',
    },
    include: { user: true, room: true },
  })

  const currentDate = new Date(checkInDate)
  while (currentDate < checkOutDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    await prisma.roomInventory.updateMany({
      where: { roomId, date: new Date(dateStr) },
      data: { availableCount: { decrement: 1 } },
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return order
})
