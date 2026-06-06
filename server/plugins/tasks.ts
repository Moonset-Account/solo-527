import Task, { TaskStatus } from '~/server/models/Task'

export default defineNitroPlugin(() => {
  const checkOverdueTasks = async () => {
    try {
      const now = new Date()
      
      const overdueTasks = await Task.find({
        deadline: { $lt: now },
        status: { $in: [TaskStatus.SUBMITTED, TaskStatus.CLAIMED, TaskStatus.IN_PROGRESS] },
        isEscalated: false
      })
      
      for (const task of overdueTasks) {
        task.isEscalated = true
        task.escalationReason = '逾期未处理'
        task.escalationTime = now
        task.status = TaskStatus.ESCALATED
        task.history.push({
          status: TaskStatus.ESCALATED,
          changedBy: task.submitterId,
          changedByName: '系统',
          changedAt: now,
          note: '系统自动升级：任务逾期未处理'
        })
        await task.save()
      }
      
      if (overdueTasks.length > 0) {
        console.log(`自动升级了 ${overdueTasks.length} 个逾期任务`)
      }
    } catch (error) {
      console.error('检查逾期任务时出错:', error)
    }
  }
  
  const interval = setInterval(checkOverdueTasks, 60 * 60 * 1000)
  
  checkOverdueTasks()
  
  process.on('exit', () => {
    clearInterval(interval)
  })
})
