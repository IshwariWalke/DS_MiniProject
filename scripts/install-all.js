const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const services = [
  'services/coordinator-service',
  'services/api-gateway',
  'services/worker-service',
  'services/frontend'
];

console.log('====================================================');
console.log('  CloudJudge: Installing dependencies across all services');
console.log('====================================================');

for (const svc of services) {
  const fullPath = path.join(root, svc);
  console.log(`\n[NPM] Installing in ${svc}...`);
  try {
    execSync('npm install', { cwd: fullPath, stdio: 'inherit', shell: true });
  } catch (err) {
    console.error(`[NPM] Error installing in ${svc}: ${err.message}`);
  }
}

console.log('\n[Done] All microservices dependencies installed successfully.');
