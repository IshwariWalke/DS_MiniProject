const EventEmitter = require('events');

class FailureDetector extends EventEmitter {
  constructor(timeoutMs = 5000, checkIntervalMs = 1500) {
    super();
    this.timeoutMs = timeoutMs;
    this.checkIntervalMs = checkIntervalMs;
    this.workers = new Map(); // worker_id -> WorkerState
    this.executionHistory = [];
    this.maxHistory = 100;

    // Background loop to evaluate worker liveness (Beacon Protocol Monitor)
    this.timer = setInterval(() => this.evaluateWorkers(), this.checkIntervalMs);
  }

  recordHeartbeat(data) {
    const now = Date.now();
    const existing = this.workers.get(data.worker_id);
    const wasDead = existing && !existing.is_alive;

    const workerState = {
      worker_id: data.worker_id,
      hostname: data.hostname || 'unknown',
      status: data.status || 'HEALTHY',
      last_heartbeat: now,
      active_jobs: data.active_jobs || 0,
      total_processed: data.total_processed || 0,
      cpu_usage_percent: data.cpu_usage_percent || 0,
      memory_mb: data.memory_mb || 0,
      lamport_clock: data.lamport_clock || 0,
      is_alive: true,
      last_seen_seconds_ago: 0
    };

    this.workers.set(data.worker_id, workerState);

    if (wasDead) {
      this.emit('worker:recovered', workerState);
    } else if (!existing) {
      this.emit('worker:registered', workerState);
    }

    return workerState;
  }

  recordExecution(report) {
    this.executionHistory.unshift({
      ...report,
      recorded_at: Date.now()
    });
    if (this.executionHistory.length > this.maxHistory) {
      this.executionHistory.pop();
    }
    this.emit('execution:recorded', report);
  }

  evaluateWorkers() {
    const now = Date.now();
    for (const [id, worker] of this.workers.entries()) {
      const elapsed = now - worker.last_heartbeat;
      worker.last_seen_seconds_ago = Number((elapsed / 1000).toFixed(1));

      if (elapsed > this.timeoutMs && worker.is_alive) {
        worker.is_alive = false;
        worker.status = 'DEAD';
        this.emit('worker:failed', {
          worker_id: id,
          elapsedMs: elapsed,
          lastSeen: new Date(worker.last_heartbeat).toISOString()
        });
      }
    }
  }

  getClusterSnapshot() {
    const workersList = Array.from(this.workers.values());
    const activeCount = workersList.filter(w => w.is_alive).length;
    const deadCount = workersList.filter(w => !w.is_alive).length;
    const totalActiveJobs = workersList.reduce((acc, w) => acc + (w.is_alive ? w.active_jobs : 0), 0);
    const totalProcessed = workersList.reduce((acc, w) => acc + w.total_processed, 0);

    return {
      active_workers_count: activeCount,
      dead_workers_count: deadCount,
      total_active_jobs: totalActiveJobs,
      total_processed_jobs: totalProcessed,
      workers: workersList,
      recent_executions: this.executionHistory.slice(0, 15)
    };
  }

  simulateWorkerKill(workerId) {
    if (this.workers.has(workerId)) {
      const w = this.workers.get(workerId);
      w.is_alive = false;
      w.status = 'KILLED_SIMULATION';
      w.last_heartbeat = 0; // force timeout
      this.emit('worker:failed', { worker_id: workerId, simulated: true });
      return true;
    }
    return false;
  }
}

module.exports = FailureDetector;
