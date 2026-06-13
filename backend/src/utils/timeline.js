import prisma from '../config/prisma.js';

export const createTimelineEvent = async (data) => {
  return prisma.timeline.create({
    data: {
      eventType: data.eventType,
      eventName: data.eventName,
      description: data.description,
      operatorId: data.operatorId,
      operatorName: data.operatorName,
      eventTime: data.eventTime || new Date(),
      billId: data.billId,
      paymentId: data.paymentId,
      transactionId: data.transactionId,
      collectionId: data.collectionId,
      refundId: data.refundId,
      writeOffId: data.writeOffId,
    },
  });
};
