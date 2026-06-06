const functions = require('firebase-functions')
const admin = require('firebase-admin')
const dayjs = require('dayjs')

admin.initializeApp()
const db = admin.firestore()

const COLLECTIONS = {
  USERS: 'users',
  ROTATIONS: 'rotations',
  NOTIFICATIONS: 'notifications',
  ANNOUNCEMENTS: 'announcements'
}

const ROTATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ABSENT: 'absent'
}

const CONSECUTIVE_ABSENCE_THRESHOLD = 3

exports.checkConsecutiveAbsences = functions.pubsub.schedule('every day 08:00').onRun(async (context) => {
  try {
    const usersSnapshot = await db.collection(COLLECTIONS.USERS)
      .where('role', '==', 'resident')
      .get()

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id
      const userData = userDoc.data()
      
      const consecutiveCount = await calculateConsecutiveAbsences(userId)
      
      await userDoc.ref.update({
        consecutiveAbsences: consecutiveCount,
        lastAbsenceCheckDate: admin.firestore.FieldValue.serverTimestamp()
      })

      if (consecutiveCount >= CONSECUTIVE_ABSENCE_THRESHOLD) {
        await createAbsenceWarningNotification(userId, userData.name, consecutiveCount)
        await notifyAdminsAboutAbsence(userData.name, consecutiveCount)
      }
    }

    functions.logger.info('连续缺席检查完成')
    return null
  } catch (error) {
    functions.logger.error('检查连续缺席时出错:', error)
    throw error
  }
})

async function calculateConsecutiveAbsences(userId) {
  const rotationsSnapshot = await db.collection(COLLECTIONS.ROTATIONS)
    .where('assigneeId', '==', userId)
    .where('status', 'in', [ROTATION_STATUS.ABSENT, ROTATION_STATUS.COMPLETED])
    .orderBy('date', 'desc')
    .limit(10)
    .get()

  let consecutiveCount = 0
  
  for (const rotationDoc of rotationsSnapshot.docs) {
    const rotation = rotationDoc.data()
    if (rotation.status === ROTATION_STATUS.ABSENT) {
      consecutiveCount++
    } else if (rotation.status === ROTATION_STATUS.COMPLETED) {
      break
    }
  }

  return consecutiveCount
}

async function createAbsenceWarningNotification(userId, userName, absenceCount) {
  await db.collection(COLLECTIONS.NOTIFICATIONS).add({
    userId,
    title: '连续缺席提醒',
    content: `您已连续缺席 ${absenceCount} 次轮值任务，请留意后续准时参加。注意：系统不会自动取消您的认领资格，但多次缺席可能影响后续申请。`,
    type: 'warning',
    relatedId: null,
    relatedType: 'absence_warning',
    read: false,
    readAt: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
}

async function notifyAdminsAboutAbsence(userName, absenceCount) {
  const adminsSnapshot = await db.collection(COLLECTIONS.USERS)
    .where('role', '==', 'admin')
    .get()

  const notifications = adminsSnapshot.docs.map(adminDoc => {
    return db.collection(COLLECTIONS.NOTIFICATIONS).add({
      userId: adminDoc.id,
      title: '用户连续缺席提醒',
      content: `用户 ${userName} 已连续缺席 ${absenceCount} 次轮值任务，请管理员关注。`,
      type: 'warning',
      relatedId: null,
      relatedType: 'admin_absence_alert',
      read: false,
      readAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
  })

  await Promise.all(notifications)
}

exports.sendRotationReminders = functions.pubsub.schedule('every day 18:00').onRun(async (context) => {
  try {
    const tomorrow = dayjs().add(1, 'day').startOf('day').toDate()
    const tomorrowEnd = dayjs().add(1, 'day').endOf('day').toDate()

    const rotationsSnapshot = await db.collection(COLLECTIONS.ROTATIONS)
      .where('date', '>=', tomorrow)
      .where('date', '<=', tomorrowEnd)
      .where('status', '==', ROTATION_STATUS.PENDING)
      .get()

    for (const rotationDoc of rotationsSnapshot.docs) {
      const rotation = rotationDoc.data()
      await db.collection(COLLECTIONS.NOTIFICATIONS).add({
        userId: rotation.assigneeId,
        title: '明日轮值提醒',
        content: `您明天有轮值任务：${rotation.description}，时间：${rotation.startTime} - ${rotation.endTime}，请准时参加。`,
        type: 'reminder',
        relatedId: rotationDoc.id,
        relatedType: 'rotation',
        read: false,
        readAt: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })
    }

    functions.logger.info(`发送了 ${rotationsSnapshot.size} 条轮值提醒`)
    return null
  } catch (error) {
    functions.logger.error('发送轮值提醒时出错:', error)
    throw error
  }
})

exports.checkToolOverdue = functions.pubsub.schedule('every day 09:00').onRun(async (context) => {
  try {
    const now = admin.firestore.Timestamp.now()
    
    const overdueBorrowsSnapshot = await db.collection('toolBorrows')
      .where('status', '==', 'borrowed')
      .where('expectedReturnTime', '<', now)
      .get()

    for (const borrowDoc of overdueBorrowsSnapshot.docs) {
      const borrow = borrowDoc.data()
      
      await db.collection(COLLECTIONS.NOTIFICATIONS).add({
        userId: borrow.borrowerId,
        title: '工具逾期提醒',
        content: `您借用的 ${borrow.toolName} 已逾期，请尽快归还。`,
        type: 'warning',
        relatedId: borrowDoc.id,
        relatedType: 'toolBorrow',
        read: false,
        readAt: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })

      await borrowDoc.ref.update({
        status: 'overdue',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })
    }

    functions.logger.info(`检查到 ${overdueBorrowsSnapshot.size} 条逾期工具借用`)
    return null
  } catch (error) {
    functions.logger.error('检查工具逾期时出错:', error)
    throw error
  }
})

exports.onClaimStatusChange = functions.firestore
  .document('claims/{claimId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    if (before.status !== after.status) {
      const statusText = {
        approved: '已通过',
        rejected: '已拒绝',
        cancelled: '已取消'
      }

      if (statusText[after.status]) {
        await db.collection(COLLECTIONS.NOTIFICATIONS).add({
          userId: after.applicantId,
          title: `认领申请${statusText[after.status]}`,
          content: `您的地块 ${after.plotNumber} 认领申请${statusText[after.status]}`,
          type: 'info',
          relatedId: context.params.claimId,
          relatedType: 'claim',
          read: false,
          readAt: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })
      }

      if (after.status === 'approved') {
        await db.collection('plots').doc(after.plotId).update({
          status: 'claimed',
          claimedBy: after.applicantId,
          claimedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })
      }
    }

    return null
  })

exports.onRotationStatusChange = functions.firestore
  .document('rotations/{rotationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    if (before.status !== after.status && after.status === ROTATION_STATUS.COMPLETED) {
      await db.collection(COLLECTIONS.USERS).doc(after.assigneeId).update({
        consecutiveAbsences: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })
    }

    if (before.status !== after.status && after.status === ROTATION_STATUS.ABSENT) {
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(after.assigneeId).get()
      const userData = userDoc.data()
      const newCount = (userData.consecutiveAbsences || 0) + 1
      
      await userDoc.ref.update({
        consecutiveAbsences: newCount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })

      if (newCount >= CONSECUTIVE_ABSENCE_THRESHOLD) {
        await createAbsenceWarningNotification(after.assigneeId, userData.name, newCount)
        await notifyAdminsAboutAbsence(userData.name, newCount)
      }
    }

    return null
  })
