const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const LamportClock = require('./lamportClock');
const QueueManager = require('./queueManager');
const { PROBLEMS } = require('./problems');

const PORT = process.env.PORT || 4000;
const COORDINATOR_HTTP = process.env.COORDINATOR_HTTP || 'http://localhost:4001';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const lamportClock = new LamportClock(1);
const queueManager = new QueueManager();

app.use(cors());
app.use(express.json());

// Forward queue events to WebSocket clients in real-time
queueManager.on('task:enqueued', (task) => {
  io.emit('submission:queued', task);
});
queueManager.on('task:dispatched', (task) => {
  io.emit('submission:dispatched', task);
});
queueManager.on('task:updated', (task) => {
  io.emit('submission:updated', task);
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'api-gateway',
    lamport_clock: lamportClock.getValue(),
    timestamp: Date.now()
  });
});

// Problems list
app.get('/api/problems', (req, res) => {
  res.json({ success: true, problems: PROBLEMS });
});

// Submissions list
app.get('/api/submissions', (req, res) => {
  res.json({ success: true, submissions: queueManager.getAllTasks() });
});

// Single submission lookup
app.get('/api/submissions/:id', (req, res) => {
  const task = queueManager.getTask(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, submission: task });
});

// Submit code
app.post('/api/submissions', async (req, res) => {
  const { problemId, language, code } = req.body;
  if (!problemId || !language || !code) {
    return res.status(400).json({ success: false, message: 'Missing problemId, language, or code' });
  }

  const problem = PROBLEMS.find(p => p.id === problemId);
  if (!problem) {
    return res.status(404).json({ success: false, message: 'Problem not found' });
  }

  // Lamport Logical Clock tick on ingress event
  const currentClock = lamportClock.tick();
  const submissionId = `SUB-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

  const task = {
    id: submissionId,
    problem_id: problem.id,
    problem_title: problem.title,
    language,
    code,
    test_cases: problem.testCases,
    lamport_clock: currentClock,
    enqueued_at: Date.now()
  };

  await queueManager.enqueue(task);

  console.log(`[API-Gateway] [INGRESS] Submission ${submissionId} enqueued. (Lamport: ${currentClock})`);

  res.status(201).json({
    success: true,
    submission_id: submissionId,
    lamport_clock: currentClock,
    status: 'PENDING'
  });
});

// Internal endpoint for worker to pop next task
app.post('/api/internal/tasks/pop', async (req, res) => {
  const { worker_id } = req.body;
  const task = await queueManager.popTask(worker_id || 'anonymous-worker');
  res.json({ task });
});

// Internal endpoint for worker to update task status
app.post('/api/internal/tasks/:id/result', (req, res) => {
  const { id } = req.params;
  const { status, stdout, stderr, execution_time_ms, memory_used_kb, passed_test_cases, total_test_cases, worker_id, lamport_clock } = req.body;

  lamportClock.update(lamport_clock || 0);

  const updated = queueManager.updateTaskStatus(id, {
    status,
    stdout,
    stderr,
    execution_time_ms,
    memory_used_kb,
    passed_test_cases,
    total_test_cases,
    worker_id,
    completed_at: Date.now()
  });

  res.json({ success: true, updated });
});

// Load spike simulation endpoint
app.post('/api/simulate-load', async (req, res) => {
  const count = Math.min(Number(req.body.count) || 10, 30);
  const createdIds = [];

  for (let i = 0; i < count; i++) {
    const p = PROBLEMS[i % PROBLEMS.length];
    const lang = i % 2 === 0 ? 'python' : 'javascript';
    const currentClock = lamportClock.tick();
    const subId = `LOAD-${Date.now().toString(36).toUpperCase()}-${i + 1}`;

    const task = {
      id: subId,
      problem_id: p.id,
      problem_title: p.title,
      language: lang,
      code: p.starterCode[lang],
      test_cases: p.testCases,
      lamport_clock: currentClock,
      is_simulated_load: true
    };

    await queueManager.enqueue(task);
    createdIds.push(subId);
  }

  console.log(`[API-Gateway] [LOAD TEST] Injected ${count} concurrent jobs into cluster queue.`);

  res.json({
    success: true,
    message: `Injected ${count} concurrent jobs into the cluster queue.`,
    submissions: createdIds
  });
});

const getFetch = () => globalThis.fetch || ((...args) => import('node-fetch').then(({default: f}) => f(...args)));

// Cluster aggregate metrics
app.get('/api/cluster/metrics', async (req, res) => {
  try {
    const _fetch = getFetch();
    let coordinatorData = { active_workers_count: 0, dead_workers_count: 0, workers: [], executions: [] };

    try {
      const coordRes = await _fetch(`${COORDINATOR_HTTP}/api/cluster`, { timeout: 2000 });
      if (coordRes.ok) {
        coordinatorData = await coordRes.json();
      }
    } catch (e) {
      // Coordinator might still be starting
    }

    res.json({
      success: true,
      gateway_lamport_clock: lamportClock.getValue(),
      queue_depth: queueManager.getQueueLength(),
      total_submissions: queueManager.getAllTasks().length,
      cluster: coordinatorData
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Proxy kill worker to coordinator
app.post('/api/workers/:id/kill', async (req, res) => {
  try {
    const _fetch = getFetch();
    const coordRes = await _fetch(`${COORDINATOR_HTTP}/api/workers/${req.params.id}/kill`, {
      method: 'POST'
    });
    const data = await coordRes.json();
    io.emit('worker:failed', { worker_id: req.params.id, simulated: true });
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// WebSocket Connection Handler
io.on('connection', (socket) => {
  socket.emit('init', {
    gateway_lamport_clock: lamportClock.getValue(),
    queue_depth: queueManager.getQueueLength()
  });
});

server.listen(PORT, () => {
  console.log(`[API-Gateway] Server running on http://localhost:${PORT}`);
  console.log(`[API-Gateway] WebSocket broadcaster active.`);
});
