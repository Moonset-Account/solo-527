import { Queue, Worker, QueueEvents } from 'bullmq'
import { useDB } from './db'
import { mockGenerateSuggestion } from './mock'

const QUEUE_NAME = 'batch-suggestions'
const TIMEOUT_INTERVAL_MS = 30_000

let suggestionQueue: Queue | null = null
let suggestionWorker: Worker | null = null
let suggestionQueueEvents: QueueEvents | null = null
let timeoutTimer: any = null
let workerStarted = false
let workerReady = false

function getRedisConfig() {
  const config = useRuntimeConfig()
  return config.redisUrl || 'redis://localhost:6379'
}

export function isWorkerReady(): boolean {
  return workerReady
}

export function useSuggestionQueue(): Queue | null {
  if (suggestionQueue) return suggestionQueue
  try {
    const redisConfig = getRedisConfig()
    suggestionQueue = new Queue(QUEUE_NAME, {
      connection: typeof redisConfig === 'string' ? redisConfig as any : redisConfig,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    })
    suggestionQueue.on('error', (err) => {
      console.warn('[Queue] error:', err.message)
    })
    return suggestionQueue
  } catch (e) {
    console.warn('[Queue] failed to instantiate:', e)
    return null
  }
}

export async function enqueueBatchTask(taskId: string): Promise<{ queued: boolean; reason?: string }> {
  if (!workerReady) {
    return { queued: false, reason: 'worker not connected' }
  }
  const queue = useSuggestionQueue()
  if (!queue) return { queued: false, reason: 'queue not available' }
  try {
    await queue.add('process-batch', { taskId }, { jobId: taskId, removeOnComplete: false, removeOnFail: false })
    return { queued: true }
  } catch (e: any) {
    console.warn('[Queue] enqueue failed:', e?.message)
    workerReady = false
    return { queued: false, reason: e?.message }
  }
}

export async function processTaskFallback(taskId: string) {
  const db = useDB()
  const task = await db.batchTask.findUnique({
    where: { id: taskId },
    include: { questions: true },
  })
  if (!task) return { skipped: true, reason: 'task not found' }

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
}

export function startSuggestionWorker() {
  if (workerStarted) return
  workerStarted = true

  try {
    const redisConfig = getRedisConfig()

    suggestionWorker = new Worker(QUEUE_NAME, async (job) => {
      const { taskId } = job.data
      return processTaskFallback(taskId)
    }, {
      connection: typeof redisConfig === 'string' ? redisConfig as any : redisConfig,
      concurrency: 2,
    })

    suggestionWorker.on('completed', (job) => {
      console.log(`[BullMQ] Job completed: ${job.id}`, job.returnvalue)
    })
    suggestionWorker.on('failed', (job, err) => {
      console.error(`[BullMQ] Job failed: ${job?.id}`, err.message)
    })
    suggestionWorker.on('error', (err) => {
      console.error('[BullMQ] Worker error:', err.message)
      workerReady = false
    })
    suggestionWorker.on('connected', () => {
      console.log('[BullMQ] Worker connected — consumer ready')
      workerReady = true
    })
    suggestionWorker.on('disconnected', () => {
      console.warn('[BullMQ] Worker disconnected')
      workerReady = false
    })
    suggestionWorker.on('closing', () => {
      console.warn('[BullMQ] Worker closing')
      workerReady = false
    })

    suggestionQueueEvents = new QueueEvents(QUEUE_NAME, {
      connection: typeof redisConfig === 'string' ? redisConfig as any : redisConfig,
    })
    suggestionQueueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`[BullMQ] Queue event failed: ${jobId} ${failedReason}`)
    })
  } catch (e) {
    console.warn('[BullMQ] Worker start failed, will rely on local fallback + timeout detector:', e)
    workerReady = false
  }

  startTimeoutDetector()
}

export function startTimeoutDetector() {
  if (timeoutTimer) return
  timeoutTimer = setInterval(async () => {
    try {
      const db = useDB()
      const now = new Date()

      const inProgressTasks = await db.batchTask.findMany({
        where: {
          status: { in: ['generating', 'scheduled', 'pending'] },
        },
        include: { creator: { select: { id: true } } },
      })

      for (const task of inProgressTasks) {
        let isTimeout = false

        if (task.status === 'generating' && task.startedAt) {
          const elapsed = now.getTime() - new Date(task.startedAt).getTime()
          isTimeout = elapsed > task.timeoutMinutes * 60 * 1000
        } else if ((task.status === 'scheduled' || task.status === 'pending') && task.scheduledAt) {
          const elapsed = now.getTime() - new Date(task.scheduledAt).getTime()
          isTimeout = elapsed > task.timeoutMinutes * 60 * 1000
        } else if (task.status === 'pending' && !task.scheduledAt) {
          const elapsed = now.getTime() - new Date(task.createdAt).getTime()
          isTimeout = elapsed > task.timeoutMinutes * 60 * 1000
        }

        if (!isTimeout) continue

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
        console.log(`[TimeoutDetector] Task ${task.id} (status=${task.status}) marked timeout`)
      }
    } catch (e) {
      console.error('[TimeoutDetector] error:', e)
    }
  }, TIMEOUT_INTERVAL_MS)

  try {
    timeoutTimer.unref?.()
  } catch {}
}
