import { startSuggestionWorker, enqueueBatchTask } from '~/server/utils/queue'
import { useDB } from '~/server/utils/db'

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
      console.log(`[NitroPlugin] Found ${orphanedTasks.length} in-progress tasks, re-enqueueing...`)
      for (const t of orphanedTasks) {
        try {
          await enqueueBatchTask(t.id)
        } catch {}
      }
    }
  } catch (e) {
    console.error('[NitroPlugin] Re-enqueue orphaned tasks failed:', e)
  }
})
