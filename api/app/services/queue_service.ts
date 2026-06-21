import { Redis } from 'ioredis'
import env from '#start/env'

interface QueueMessage {
  type: string
  payload: Record<string, any>
}

export class QueueService {
  private static publisher: Redis | null = null
  private static subscriber: Redis | null = null
  private static handlers: Map<string, (payload: Record<string, any>) => Promise<void>> = new Map()

  private getPublisher(): Redis {
    if (!QueueService.publisher) {
      QueueService.publisher = new Redis({
        host: env.get('REDIS_HOST', '127.0.0.1'),
        port: env.get('REDIS_PORT', 6379),
        password: env.get('REDIS_PASSWORD', ''),
        db: env.get('REDIS_DB', 0),
        lazyConnect: true,
      })
    }
    return QueueService.publisher
  }

  private getSubscriber(): Redis {
    if (!QueueService.subscriber) {
      QueueService.subscriber = new Redis({
        host: env.get('REDIS_HOST', '127.0.0.1'),
        port: env.get('REDIS_PORT', 6379),
        password: env.get('REDIS_PASSWORD', ''),
        db: env.get('REDIS_DB', 0),
        lazyConnect: true,
      })
    }
    return QueueService.subscriber
  }

  async publish(channel: string, message: QueueMessage): Promise<void> {
    const publisher = this.getPublisher()
    await publisher.publish(channel, JSON.stringify(message))
  }

  async enqueue(queueName: string, message: QueueMessage): Promise<void> {
    const publisher = this.getPublisher()
    await publisher.rpush(`queue:${queueName}`, JSON.stringify(message))
  }

  async dequeue(queueName: string): Promise<QueueMessage | null> {
    const subscriber = this.getSubscriber()
    const data = await subscriber.lpop(`queue:${queueName}`)
    if (!data) return null
    return JSON.parse(data)
  }

  subscribe(channel: string, handler: (payload: Record<string, any>) => Promise<void>): void {
    QueueService.handlers.set(channel, handler)
    const subscriber = this.getSubscriber()
    subscriber.subscribe(channel)
    subscriber.on('message', (ch: string, data: string) => {
      if (ch === channel) {
        const message: QueueMessage = JSON.parse(data)
        handler(message.payload)
      }
    })
  }

  async processQueue(queueName: string): Promise<void> {
    const message = await this.dequeue(queueName)
    if (!message) return
    const handler = QueueService.handlers.get(queueName)
    if (handler) {
      await handler(message.payload)
    }
  }
}
