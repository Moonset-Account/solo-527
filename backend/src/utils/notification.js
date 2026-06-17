const prisma = require('./prisma');

const createNotification = async ({ type, title, content, reworkRecordId, materialCheckId, relatedId, relatedType }) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        content,
        reworkRecordId,
        materialCheckId,
        relatedId,
        relatedType,
      },
    });
    return notification;
  } catch (error) {
    console.error('创建通知失败:', error);
    throw error;
  }
};

const notifyRework = async (reworkRecord, processFlow) => {
  await createNotification({
    type: 'REWORK',
    title: '返工通知',
    content: `工序【${processFlow.processId}】产生返工 ${reworkRecord.quantity} 件，原因：${reworkRecord.reason}`,
    reworkRecordId: reworkRecord.id,
    relatedId: processFlow.planId,
    relatedType: 'ProductionPlan',
  });
};

const notifyWorkOrder = async (workOrder, action) => {
  await createNotification({
    type: 'WORK_ORDER',
    title: `工单${action}`,
    content: `工单【${workOrder.orderNo}】${workOrder.productName} 已${action}`,
    relatedId: workOrder.id,
    relatedType: 'WorkOrder',
  });
};

const notifyMaterial = async (materialCheck, workOrder) => {
  const status = materialCheck.isComplete ? '齐套' : '缺料';
  await createNotification({
    type: 'MATERIAL',
    title: `物料${status}通知`,
    content: `工单【${workOrder.orderNo}】物料【${materialCheck.materialName}】${status}，需求：${materialCheck.requiredQty}，可用：${materialCheck.availableQty}`,
    materialCheckId: materialCheck.id,
    relatedId: workOrder.id,
    relatedType: 'WorkOrder',
  });
};

const notifyPlanChange = async (plan, oldPlan, action) => {
  await createNotification({
    type: 'PLAN_CHANGE',
    title: `计划${action}`,
    content: `生产计划【${plan.planNo}】已${action}`,
    relatedId: plan.id,
    relatedType: 'ProductionPlan',
  });
};

module.exports = {
  createNotification,
  notifyRework,
  notifyWorkOrder,
  notifyMaterial,
  notifyPlanChange,
};
