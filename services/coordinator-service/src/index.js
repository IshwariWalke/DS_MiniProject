const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const express = require('express');
const cors = require('cors');
const LamportClock = require('./lamportClock');
const FailureDetector = require('./failureDetector');

const HTTP_PORT = process.env.HTTP_PORT || 4001;
const GRPC_PORT = process.env.GRPC_PORT || 50051;
const PROTO_PATH = process.env.PROTO_PATH || path.join(__dirname, '../../../proto/judge.proto');

const lamportClock = new LamportClock(100);
const failureDetector = new FailureDetector(5000, 1000);

// Log failure detector events
failureDetector.on('worker:registered', (w) => {
  console.log(`[Coordinator] [BEACON] New Worker Registered: ${w.worker_id} (${w.hostname})`);
});
failureDetector.on('worker:failed', (evt) => {
  console.warn(`[Coordinator] [FAILURE DETECTOR ALERT] Worker ${evt.worker_id} missed heartbeat timeout! Marked DEAD.`);
});
failureDetector.on('worker:recovered', (w) => {
  console.log(`[Coordinator] [BEACON] Worker Recovered: ${w.worker_id}`);
});

// Load Protocol Buffers
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const judgeProto = grpc.loadPackageDefinition(packageDefinition).judge;

// gRPC Service Implementation
function sendHeartbeat(call, callback) {
  const req = call.request;
  const currentClock = lamportClock.update(req.lamport_clock);

  failureDetector.recordHeartbeat({
    worker_id: req.worker_id,
    hostname: req.hostname,
    status: req.status,
    active_jobs: req.active_jobs,
    total_processed: req.total_processed,
    cpu_usage_percent: req.cpu_usage_percent,
    memory_mb: req.memory_mb,
    lamport_clock: currentClock
  });

  callback(null, {
    acknowledged: true,
    coordinator_lamport_clock: currentClock,
    command: 'CONTINUE'
  });
}

function reportExecutionResult(call, callback) {
  const req = call.request;
  const currentClock = lamportClock.update(req.lamport_clock);

  const report = {
    submission_id: req.submission_id,
    worker_id: req.worker_id,
    status: req.status,
    stdout: req.stdout,
    stderr: req.stderr,
    execution_time_ms: Number(req.execution_time_ms),
    memory_used_kb: Number(req.memory_used_kb),
    passed_test_cases: req.passed_test_cases,
    total_test_cases: req.total_test_cases,
    lamport_clock: currentClock
  };

  failureDetector.recordExecution(report);
  console.log(`[Coordinator] [gRPC] Result received for ${req.submission_id} from ${req.worker_id}: ${req.status} (Lamport: ${currentClock})`);

  callback(null, {
    success: true,
    coordinator_lamport_clock: currentClock
  });
}

function getClusterState(call, callback) {
  const snap = failureDetector.getClusterSnapshot();
  const currentClock = lamportClock.tick();

  callback(null, {
    coordinator_lamport_clock: currentClock,
    active_workers_count: snap.active_workers_count,
    dead_workers_count: snap.dead_workers_count,
    pending_queue_size: 0,
    workers: snap.workers
  });
}

// Start gRPC Server
const grpcServer = new grpc.Server();
grpcServer.addService(judgeProto.JudgeCoordinator.service, {
  SendHeartbeat: sendHeartbeat,
  ReportExecutionResult: reportExecutionResult,
  GetClusterState: getClusterState
});

grpcServer.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error(`[Coordinator] gRPC bind error:`, err);
    return;
  }
  console.log(`[Coordinator] gRPC Server running at 0.0.0.0:${port}`);
});

// HTTP Express Management API
const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'coordinator-service', timestamp: Date.now() });
});

app.get('/api/cluster', (req, res) => {
  const snap = failureDetector.getClusterSnapshot();
  res.json({
    success: true,
    coordinator_lamport_clock: lamportClock.getValue(),
    ...snap
  });
});

app.get('/api/executions', (req, res) => {
  res.json({
    success: true,
    executions: failureDetector.executionHistory
  });
});

app.post('/api/workers/:id/kill', (req, res) => {
  const workerId = req.params.id;
  const killed = failureDetector.simulateWorkerKill(workerId);
  if (killed) {
    res.json({ success: true, message: `Worker ${workerId} simulated failure triggered.` });
  } else {
    res.status(404).json({ success: false, message: `Worker ${workerId} not found.` });
  }
});

app.listen(HTTP_PORT, () => {
  console.log(`[Coordinator] HTTP Admin API running on http://localhost:${HTTP_PORT}`);
});
