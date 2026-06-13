import { Queue, Worker, QueueScheduler, QueueEvents } from 'bullmq'
import { useRedis } from './redis'
import { useDB } from './db'
import { mockGenerateSuggestion } from './mock'

const QUEUE_NAME = 'batch-suggestions'
const TIMEOUT_INTERVAL_MS = 30_000

let suggestionQueue: Queue | undefined
let suggestionWorker: Worker | undefined
let suggestionQueueEvents: QueueEvents | undefined
let timeoutTimer: any = null

export function useSuggestionQueue(): Queue {
  if (!suggestionQueue) {
    const connection = useRedis()
    suggestionQueue = new Queue(QUEUE_NAME, {
      connection: connection as any,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    })
  }
  return suggestionQueue
}

export async function enqueueBatchTask(taskId: string) {
  const queue = useSuggestionQueue()
  await queue.add('process-batch', { taskId }, { jobId: taskId, removeOnComplete: false })
}

export function startSuggestionWorker() {
  if (suggestionWorker) return
  const connection = useRedis()

  suggestionWorker = new Worker(QUEUE_NAME, async (job) => {
    const { taskId } = job.data
    const db = useDB()

    const task = await db.batchTask.findUnique({
      where: { id: taskId },
      include: { questions: true },
    })
    if (!task) return

    if (task.status !== 'pending' && task.status !== 'scheduled') {
      return { skipped: true, reason: `status: ${task.status}` }
    }

    await db.batchTask.update({
      where: { id: taskId },
      data: { status: 'generating', startedAt: new Date() },
    })

    let completedCount = 0
    for (const question of task.questions) {
      try {
        const startTime = Date.now()
        const mockResult = await mockGenerateSuggestion(question.content)
        const durationMs = Date.now() - startTime

        const suggestion = await db.replySuggestion.create({
          data: {
            questionId: question.id,
            content: mockResult.content,
            confidence: mockResult.confidence,
            isHit: mockResult.isHit,
          },
        })

        if (mockResult.references.length > 0) {
          await db.referenceSource.createMany({
            data: mockResult.references.map((r: any) => ({
              replySuggestionId: suggestion.id,
              docTitle: r.docTitle,
              docUrl: r.docUrl,
              relevanceScore: r.relevanceScore,
              isMissing: r.isMissing,
              missingReason: r.missingReason,
            })),
          })
        }

        await db.callLog.create({
          data: {
            batchTaskId: task.id,
            questionId: question.id,
            endpoint: '/api/suggestions/generate',
            requestBody: { content: question.content } as any,
            responseStatus: 200,
            responseBody: { suggestionId: suggestion.id } as any,
            durationMs,
          },
        })

        completedCount++
        await db.batchTask.update({
          where: { id: taskId },
          data: { completedItems: completedCount },
        })
      } catch {
        completedCount++
      }
    }

    await db.batchTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        completedItems: task.questions.length,
        completedAt: new Date(),
      },
    })

    await db.todoItem.updateMany({
      where: { batchTaskId: taskId, status: 'pending' },
      data: { status: 'done' },
    })

    return { taskId, completed: task.questions.length }
  }, {
    connection: connection as any,
    concurrency: 2,
  })

  suggestionWorker.on('completed', (job) => {
    console.log(`[BullMQ] Job completed: ${job.id}`, job.returnvalue)
  })
  suggestionWorker.on('failed', (job, err) => {
    console.error(`[BullMQ] Job failed: ${job?.id}`, err.message)
  })

  suggestionQueueEvents = new QueueEvents(QUEUE_NAME, { connection: connection as any })

  startTimeoutDetector()
}

export function startTimeoutDetector() {
  if (timeoutTimer) return
  timeoutTimer = setInterval(async () => {
    try {
      const db = useDB()
      const now = new Date()
      const generatingTasks = await db.batchTask.findMany({
        where: {
          status: 'generating',
          startedAt: { not: null },
        },
        include: { creator: { select: { id: true } } },
      })

      for (const task of generatingTasks) {
        if (!task.startedAt) continue
        const elapsed = now.getTime() - new Date(task.startedAt).getTime()
        const timeoutMs = task.timeoutMinutes * 60 * 1000
        if (elapsed > timeoutMs) {
          await db.batchTask.update({
            where: { id: task.id },
            data: { status: 'timeout' },
          })

          const existingTimeoutTodo = await db.todoItem.findFirst({
            where: {
              batchTaskId: task.id,
              type: 'rerun_timeout',
              status: 'pending',
            },
          })
          if (!existingTimeoutTodo) {
            await db.todoItem.create({
              data: {
                userId: task.creator.id,
                batchTaskId: task.id,
                type: 'rerun_timeout',
                status: 'pending',
                dueAt: now,
              },
            })
          }
          console.log(`[TimeoutDetector] Task ${task.id} marked timeout after ${elapsed}ms`)
        }
      }

      const pendingTasks = await db.batchTask.findMany({
        where: {
          status: 'pending',
          scheduledAt: { not: null, lt: now },
        },
        include: { creator: { select: { id: true } } },
      })

      for (const task of pendingTasks) {
        if (!task.scheduledAt) continue
        const elapsed = now.getTime() - new Date(task.scheduledAt).getTime()
        const timeoutMs = task.timeoutMinutes * 60 * 1000
        if (elapsed > timeoutMs) {
          await db.batchTask.update({
            where: { id: task.id },
            data: { status: 'timeout' },
          })

          const existingTimeoutTodo = await db.todoItem.findFirst({
            where: {
              batchTaskId: task.id,
              type: 'rerun_timeout',
              status: 'pending',
            },
          })
          if (!existingTimeoutTodo) {
            await db.todoItem.create({
              data: {
                userId: task.creator.id,
                batchTaskId: task.id,
                type: 'rerun_timeout',
                status: 'pending',
                dueAt: now,
              },
            })
          }
          console.log(`[TimeoutDetector] Scheduled task ${task.id} timed out before start`)
        }
      }
    } catch (e) {
      console.error('[TimeoutDetector] error:', e)
    }
  }, TIMEOUT_INTERVAL_MS)

  timeoutTimer.unref?.()
}
