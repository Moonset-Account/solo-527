import { startSuggestionWorker, enqueueBatchTask, processTaskFallback, isWorkerReady } from '~/server/utils/queue'
import { useDB } from '~/server/utils/db'

const WORKER_CONNECT_TIMEOUT = 5_000

function waitForWorker(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (isWorkerReady()) { resolve(true); return }
    const start = Date.now()
    const check = setInterval(() => {
      if (isWorkerReady()) { clearInterval(check); resolve(true); return }
      if (Date.now() - start > timeoutMs) { clearInterval(check); resolve(false) }
    }, 200)
  })
}

export default defineNitroPlugin(async () => {
  console.log('[NitroPlugin] Initializing BullMQ queue system...')

  try {
    startSuggestionWorker()
    console.log('[NitroPlugin] Suggestion worker + timeout detector started')
  } catch (e) {
    console.error('[NitroPlugin] Failed to start worker (Redis may not be available):', e)
  }

  try {
    const db = useDB()
    const orphanedTasks = await db.batchTask.findMany({
      where: {
        status: { in: ['scheduled', 'generating'] },
      },
      select: { id: true, status: true, scheduledAt: true },
    })

    if (orphanedTasks.length > 0) {
      console.log(`[NitroPlugin] Found ${orphanedTasks.length} in-progress tasks, waiting for worker...`)
      const workerUp = await waitForWorker(WORKER_CONNECT_TIMEOUT)
      for (const t of orphanedTasks) {
        if (workerUp) {
          const result = await enqueueBatchTask(t.id)
          if (!result.queued) {
            console.warn(`[NitroPlugin] Re-enqueue task ${t.id} failed (${result.reason}), running local fallback`)
            processTaskFallback(t.id)
          }
        } else {
          console.warn(`[NitroPlugin] Worker not ready, running local fallback for task ${t.id}`)
          processTaskFallback(t.id)
        }
      }
    }
  } catch (e) {
    console.error('[NitroPlugin] Re-enqueue orphaned tasks failed:', e)
  }
})
