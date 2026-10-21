const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

const processes = [
  {
    name: 'Coordinator (gRPC:50051, HTTP:4001)',
    cwd: path.join(root, 'services/coordinator-service'),
    command: 'node',
    args: ['src/index.js'],
    env: { ...process.env, HTTP_PORT: '4001', GRPC_PORT: '50051', PROTO_PATH: path.join(root, 'proto/judge.proto') }
  },
  {
    name: 'API Gateway (HTTP:4000)',
    cwd: path.join(root, 'services/api-gateway'),
    command: 'node',
    args: ['src/index.js'],
    env: { ...process.env, PORT: '4000', COORDINATOR_HTTP: 'http://localhost:4001' }
  },
  {
    name: 'Worker Node 1',
    cwd: path.join(root, 'services/worker-service'),
    command: 'node',
    args: ['src/index.js'],
    env: { ...process.env, WORKER_ID: 'worker-node-1', API_GATEWAY_URL: 'http://localhost:4000', COORDINATOR_GRPC: 'localhost:50051', PROTO_PATH: path.join(root, 'proto/judge.proto') }
  },
  {
    name: 'Worker Node 2',
    cwd: path.join(root, 'services/worker-service'),
    command: 'node',
    args: ['src/index.js'],
    env: { ...process.env, WORKER_ID: 'worker-node-2', API_GATEWAY_URL: 'http://localhost:4000', COORDINATOR_GRPC: 'localhost:50051', PROTO_PATH: path.join(root, 'proto/judge.proto') }
  },
  {
    name: 'Worker Node 3',
    cwd: path.join(root, 'services/worker-service'),
    command: 'node',
    args: ['src/index.js'],
    env: { ...process.env, WORKER_ID: 'worker-node-3', API_GATEWAY_URL: 'http://localhost:4000', COORDINATOR_GRPC: 'localhost:50051', PROTO_PATH: path.join(root, 'proto/judge.proto') }
  },
  {
    name: 'Frontend Web App (Port 3000)',
    cwd: path.join(root, 'services/frontend'),
    command: 'npm',
    args: ['run', 'dev'],
    env: { ...process.env }
  }
];

console.log('================================================================');
console.log('  CloudJudge — Distributed Code Execution & Evaluation Platform');
console.log('  Starting Multi-Node Cluster Locally...');
console.log('================================================================');

const activeChildren = [];

processes.forEach((proc, index) => {
  setTimeout(() => {
    console.log(`[Launcher] Starting ${proc.name}...`);
    const child = spawn(proc.command, proc.args, {
      cwd: proc.cwd,
      env: proc.env,
      stdio: 'pipe',
      shell: true
    });

    child.stdout.on('data', (d) => {
      const line = d.toString().trim();
      if (line) console.log(`[${proc.name}] ${line}`);
    });

    child.stderr.on('data', (d) => {
      const line = d.toString().trim();
      if (line) console.error(`[${proc.name}] [ERR] ${line}`);
    });

    child.on('close', (code) => {
      console.log(`[${proc.name}] Process exited with code ${code}`);
    });

    activeChildren.push(child);
  }, index * 800);
});

// Clean up on exit
process.on('SIGINT', () => {
  console.log('\n[Launcher] Shutting down all distributed processes...');
  activeChildren.forEach(c => c.kill());
  process.exit(0);
});
