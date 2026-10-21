const EventEmitter = require('events');
const Redis = require('ioredis');

class QueueManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.redisHost = process.env.REDIS_HOST || null;
    this.redisPort = process.env.REDIS_PORT || 6379;
    this.useRedis = Boolean(this.redisHost);
    this.memoryQueue = [];
    this.tasks = new Map(); // id -> TaskObject
    this.redisClient = null;

    if (this.useRedis) {
      this.initRedis();
    } else {
      console.log('[QueueManager] Running in In-Memory Distributed Queue Mode (Zero external dependencies).');
    }
  }

  initRedis() {
    try {
      this.redisClient = new Redis({
        host: this.redisHost,
        port: this.redisPort,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn('[QueueManager] Redis connection failed. Falling back to In-Memory Queue.');
            this.useRedis = false;
            return null;
          }
          return Math.min(times * 100, 2000);
        }
      });

      this.redisClient.on('connect', () => {
        console.log(`[QueueManager] Connected to Redis at ${this.redisHost}:${this.redisPort}`);
      });

      this.redisClient.on('error', (err) => {
        console.warn(`[QueueManager] Redis error (${err.message}). Using In-Memory fallback.`);
        this.useRedis = false;
      });
    } catch (e) {
      console.warn('[QueueManager] Redis init failed. Using In-Memory fallback.');
      this.useRedis = false;
    }
  }

  async enqueue(task) {
    const enrichedTask = {
      ...task,
      status: 'PENDING',
      enqueued_at: Date.now()
    };

    this.tasks.set(task.id, enrichedTask);

    if (this.useRedis && this.redisClient) {
      try {
        await this.redisClient.lpush('judge:task_queue', JSON.stringify(enrichedTask));
        await this.redisClient.set(`judge:task:${task.id}`, JSON.stringify(enrichedTask));
      } catch (err) {
        this.memoryQueue.push(enrichedTask);
      }
    } else {
      this.memoryQueue.push(enrichedTask);
    }

    this.emit('task:enqueued', enrichedTask);
    return enrichedTask;
  }

  async popTask(workerId) {
    if (this.useRedis && this.redisClient) {
      try {
        const item = await this.redisClient.rpop('judge:task_queue');
        if (item) {
          const task = JSON.parse(item);
          task.status = 'IN_PROGRESS';
          task.dispatched_to = workerId;
          task.dispatched_at = Date.now();
          this.tasks.set(task.id, task);
          await this.redisClient.set(`judge:task:${task.id}`, JSON.stringify(task));
          this.emit('task:dispatched', task);
          return task;
        }
      } catch (err) {
        // Fall back to memory
      }
    }

    if (this.memoryQueue.length > 0) {
      const task = this.memoryQueue.shift();
      task.status = 'IN_PROGRESS';
      task.dispatched_to = workerId;
      task.dispatched_at = Date.now();
      this.tasks.set(task.id, task);
      this.emit('task:dispatched', task);
      return task;
    }

    return null;
  }

  getTask(id) {
    return this.tasks.get(id) || null;
  }

  updateTaskStatus(id, update) {
    const existing = this.tasks.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...update, updated_at: Date.now() };
    this.tasks.set(id, updated);
    this.emit('task:updated', updated);
    return updated;
  }

  getQueueLength() {
    return this.memoryQueue.length;
  }

  getAllTasks() {
    return Array.from(this.tasks.values()).slice(-50).reverse();
  }
}

module.exports = QueueManager;
