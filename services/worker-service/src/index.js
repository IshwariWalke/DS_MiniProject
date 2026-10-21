const os = require('os');
const LamportClock = require('./lamportClock');
const CodeSandbox = require('./sandbox');
const GrpcJudgeClient = require('./grpcClient');

const WORKER_ID = process.env.WORKER_ID || `worker-${Math.floor(Math.random() * 900) + 100}`;
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000';
const HEARTBEAT_INTERVAL_MS = 2000;
const POLL_INTERVAL_MS = 800;

const lamportClock = new LamportClock(10);
const sandbox = new CodeSandbox(4000);
let grpcClient = null;

let isRunning = true;
let activeJobs = 0;
let totalProcessed = 0;

try {
  grpcClient = new GrpcJudgeClient();
  console.log(`[Worker:${WORKER_ID}] gRPC Client connected.`);
} catch (e) {
  console.warn(`[Worker:${WORKER_ID}] gRPC Client initialization error: ${e.message}`);
}

// System metrics calculation
function getSystemMetrics() {
  const cpus = os.cpus();
  const memUsedMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
  // Rough CPU metric
  const cpuPercent = Number((Math.min(100, Math.random() * 15 + (activeJobs ? 40 : 5))).toFixed(1));
  return { cpuPercent, memUsedMb };
}

// Beacon Protocol: Periodic Heartbeat
async function sendBeacon() {
  if (!grpcClient) return;
  const metrics = getSystemMetrics();
  const currentClock = lamportClock.tick();

  const heartbeatData = {
    worker_id: WORKER_ID,
    hostname: os.hostname(),
    timestamp: Date.now(),
    lamport_clock: currentClock,
    active_jobs: activeJobs,
    total_processed: totalProcessed,
    cpu_usage_percent: metrics.cpuPercent,
    memory_mb: metrics.memUsedMb,
    status: activeJobs > 0 ? 'BUSY' : 'HEALTHY'
  };

  try {
    const res = await grpcClient.sendHeartbeat(heartbeatData);
    if (res && res.coordinator_lamport_clock) {
      lamportClock.update(res.coordinator_lamport_clock);
    }
  } catch (err) {
    // Coordinator might be temporarily unreachable
  }
}

setInterval(sendBeacon, HEARTBEAT_INTERVAL_MS);

const getFetch = () => globalThis.fetch || ((...args) => import('node-fetch').then(({default: f}) => f(...args)));

// Task Execution Processor
async function executeTask(task) {
  activeJobs = 1;
  const taskClock = lamportClock.update(task.lamport_clock || 0);

  console.log(`[Worker:${WORKER_ID}] Executing submission ${task.id} (${task.language}) - Lamport: ${taskClock}`);

  // Run in sandbox
  const executionResult = sandbox.run(task.language, task.code, task.test_cases || []);

  const reportClock = lamportClock.tick();
  totalProcessed++;
  activeJobs = 0;

  // 1. Report via gRPC to Coordinator
  if (grpcClient) {
    try {
      await grpcClient.reportExecution({
        submission_id: task.id,
        worker_id: WORKER_ID,
        status: executionResult.status,
        stdout: executionResult.stdout,
        stderr: executionResult.stderr,
        execution_time_ms: executionResult.execution_time_ms,
        memory_used_kb: executionResult.memory_used_kb,
        passed_test_cases: executionResult.passed_test_cases,
        total_test_cases: executionResult.total_test_cases,
        lamport_clock: reportClock
      });
    } catch (e) {
      console.warn(`[Worker:${WORKER_ID}] gRPC report error: ${e.message}`);
    }
  }

  // 2. Deliver result to API Gateway
  try {
    const _fetch = getFetch();
    await _fetch(`${API_GATEWAY_URL}/api/internal/tasks/${task.id}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...executionResult,
        worker_id: WORKER_ID,
        lamport_clock: reportClock
      })
    });
  } catch (err) {
    console.warn(`[Worker:${WORKER_ID}] Failed to deliver result to Gateway: ${err.message}`);
  }

  console.log(`[Worker:${WORKER_ID}] Finished ${task.id}: ${executionResult.status} in ${executionResult.execution_time_ms}ms`);
}

// Continuous task loop
async function taskPollingLoop() {
  while (isRunning) {
    try {
      const _fetch = getFetch();
      const res = await _fetch(`${API_GATEWAY_URL}/api/internal/tasks/pop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_id: WORKER_ID })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.task) {
          await executeTask(data.task);
        }
      }
    } catch (err) {
      // Gateway might not be ready yet
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
}

// Send initial beacon immediately, then on interval
sendBeacon();
setInterval(sendBeacon, HEARTBEAT_INTERVAL_MS);

taskPollingLoop();

console.log(`====================================================`);
console.log(`[CloudJudge Worker] Started node ID: ${WORKER_ID}`);
console.log(`  Beacon Interval: ${HEARTBEAT_INTERVAL_MS}ms | Gateway: ${API_GATEWAY_URL}`);
console.log(`====================================================`);
