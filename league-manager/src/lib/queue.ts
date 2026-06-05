type TaskHandler = (...args: unknown[]) => Promise<unknown>;

interface Task {
  handler: TaskHandler;
  args: unknown[];
  retries: number;
  maxRetries: number;
}

const queue: Task[] = [];
let processing = false;

function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;
  const task = queue.shift()!;
  task
    .handler(...task.args)
    .then(() => {
      processing = false;
      processQueue();
    })
    .catch((err) => {
      console.error('[TaskQueue Error]', err);
      if (task.retries < task.maxRetries) {
        queue.push({ ...task, retries: task.retries + 1 });
      }
      processing = false;
      setTimeout(processQueue, 1000);
    });
}

export function enqueue<T extends unknown[]>(handler: (...args: T) => Promise<unknown>, args: T, maxRetries = 3) {
  queue.push({ handler: handler as TaskHandler, args: args as unknown[], retries: 0, maxRetries });
  processQueue();
}

export function queueSize(): number {
  return queue.length;
}
