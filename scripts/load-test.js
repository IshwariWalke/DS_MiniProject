const http = require('http');

const GATEWAY_URL = 'http://localhost:4000/api/submissions';
const CONCURRENT_JOBS = 20;

console.log(`================================================================`);
console.log(`  CloudJudge — Distributed Cluster Load Testing`);
console.log(`  Firing ${CONCURRENT_JOBS} concurrent code submissions to Gateway...`);
console.log(`================================================================`);

const sampleSubmissions = [
  {
    problemId: 'two-sum',
    language: 'javascript',
    code: `function solution(nums, target) {
      const map = new Map();
      for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) return [map.get(diff), i];
        map.set(nums[i], i);
      }
      return [];
    }`
  },
  {
    problemId: 'palindrome-number',
    language: 'javascript',
    code: `function solution(x) {
      const s = String(x);
      return s === s.split('').reverse().join('');
    }`
  },
  {
    problemId: 'fibonacci',
    language: 'javascript',
    code: `function solution(n) {
      if (n <= 0) return 0;
      if (n === 1) return 1;
      let a = 0, b = 1;
      for (let i = 2; i <= n; i++) {
        let t = a + b;
        a = b;
        b = t;
      }
      return b;
    }`
  }
];

let completed = 0;
const startTime = Date.now();

for (let i = 0; i < CONCURRENT_JOBS; i++) {
  const payload = JSON.stringify(sampleSubmissions[i % sampleSubmissions.length]);
  const req = http.request(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      completed++;
      try {
        const json = JSON.parse(body);
        console.log(`[Job ${i + 1}/${CONCURRENT_JOBS}] ACK: ${json.submission_id} | Lamport: L=${json.lamport_clock} | Status: ${res.statusCode}`);
      } catch (e) {
        console.log(`[Job ${i + 1}/${CONCURRENT_JOBS}] HTTP ${res.statusCode}`);
      }

      if (completed === CONCURRENT_JOBS) {
        const elapsed = Date.now() - startTime;
        console.log(`\nAll ${CONCURRENT_JOBS} jobs enqueued in ${elapsed}ms (${(CONCURRENT_JOBS / (elapsed / 1000)).toFixed(1)} req/sec).`);
        console.log(`Check the Frontend UI or Coordinator metrics to observe parallel worker processing.`);
      }
    });
  });

  req.on('error', (err) => {
    completed++;
    console.error(`[Job ${i + 1}] Error: ${err.message}`);
  });

  req.write(payload);
  req.end();
}
