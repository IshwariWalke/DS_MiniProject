import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  Server,
  Cpu,
  Layers,
  Activity,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ExternalLink
} from 'lucide-react';

import ClusterTopology from './components/ClusterTopology';
import WorkerNodesList from './components/WorkerNodesList';
import CodeEditor from './components/CodeEditor';
import SubmissionHistory from './components/SubmissionHistory';
import LoadTestPanel from './components/LoadTestPanel';
import TelemetryLogs from './components/TelemetryLogs';

const GATEWAY_URL = 'http://localhost:4000';

export default function App() {
  const [problems, setProblems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);

  const addLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-100), { time, text, type }]);
  };

  // Fetch initial problems, submissions, and metrics
  const fetchData = async () => {
    try {
      const [probRes, subsRes, metRes] = await Promise.all([
        fetch(`${GATEWAY_URL}/api/problems`).then(r => r.json()).catch(() => ({ problems: [] })),
        fetch(`${GATEWAY_URL}/api/submissions`).then(r => r.json()).catch(() => ({ submissions: [] })),
        fetch(`${GATEWAY_URL}/api/cluster/metrics`).then(r => r.json()).catch(() => null)
      ]);

      if (probRes?.problems) setProblems(probRes.problems);
      if (subsRes?.submissions) setSubmissions(subsRes.submissions);
      if (metRes) setMetrics(metRes);
    } catch (err) {
      console.warn('Initial fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup Socket.IO for real-time telemetry
    const socket = io(GATEWAY_URL, {
      reconnectionAttempts: 5,
      timeout: 3000
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      addLog(`[WebSocket] Connected to API Gateway at ${GATEWAY_URL}`, 'success');
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      addLog('[WebSocket] Disconnected from Gateway', 'error');
    });

    socket.on('submission:queued', (task) => {
      addLog(`[INGRESS] Task ${task.id} queued (Problem: ${task.problem_title}, Lamport: L=${task.lamport_clock})`, 'info');
      setSubmissions((prev) => [task, ...prev.filter(s => s.id !== task.id)]);
      fetchMetrics();
    });

    socket.on('submission:dispatched', (task) => {
      addLog(`[DISPATCH] Task ${task.id} leased to ${task.dispatched_to}`, 'info');
      setSubmissions((prev) => prev.map(s => s.id === task.id ? { ...s, ...task } : s));
      fetchMetrics();
    });

    socket.on('submission:updated', (task) => {
      const isAccepted = task.status === 'ACCEPTED';
      addLog(`[RESULT] Task ${task.id} finished with ${task.status} on ${task.worker_id} in ${task.execution_time_ms}ms`, isAccepted ? 'success' : 'error');
      setSubmissions((prev) => prev.map(s => s.id === task.id ? { ...s, ...task } : s));
      setLatestResult(task);
      setIsSubmitting(false);
      fetchMetrics();
    });

    socket.on('worker:failed', (data) => {
      addLog(`[FAILURE DETECTOR] Beacon missed! Node ${data.worker_id} marked DEAD`, 'error');
      fetchMetrics();
    });

    // Periodic metrics poll
    const interval = setInterval(fetchMetrics, 2000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${GATEWAY_URL}/api/cluster/metrics`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (e) {
      // Gateway might be offline
    }
  };

  const handleCodeSubmit = async ({ problemId, language, code }) => {
    setIsSubmitting(true);
    addLog(`[CLIENT] Submitting solution for ${problemId} (${language})...`, 'info');

    try {
      const res = await fetch(`${GATEWAY_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, language, code })
      });

      if (!res.ok) throw new Error('Submission rejected by gateway');
      const data = await res.json();
      addLog(`[INGRESS ACK] Assigned ${data.submission_id} with Lamport Clock L=${data.lamport_clock}`, 'success');
    } catch (err) {
      addLog(`[ERROR] Submission failed: ${err.message}`, 'error');
      setIsSubmitting(false);
    }
  };

  const handleTriggerLoad = async (count) => {
    addLog(`[STRESS TEST] Injecting ${count} concurrent jobs into cluster...`, 'info');
    const res = await fetch(`${GATEWAY_URL}/api/simulate-load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count })
    });
    return res.json();
  };

  const handleKillWorker = async (workerId) => {
    addLog(`[FAULT INJECTION] Simulating sudden crash of node ${workerId}...`, 'error');
    const res = await fetch(`${GATEWAY_URL}/api/workers/${workerId}/kill`, {
      method: 'POST'
    });
    return res.json();
  };

  const activeWorkerList = metrics?.cluster?.workers || [];
  const queueDepth = metrics?.queue_depth || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8">
      {/* Top Navigation Bar */}
      <header className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-600/30">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                CloudJudge
                <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-400 border border-indigo-800/60 px-2 py-0.5 rounded-full">
                  Distributed Systems Platform
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Scalable Cloud Code Execution &amp; Evaluation Engine • Docker &amp; Kubernetes Orchestrated
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-slate-300">{socketConnected ? 'Live Mesh Connected' : 'Connecting to Mesh...'}</span>
          </div>

          <button
            onClick={() => { fetchData(); fetchMetrics(); }}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-all"
            title="Refresh Cluster State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto space-y-6">
        {/* Row 1: Interactive System Topology */}
        <ClusterTopology metrics={metrics} queueDepth={queueDepth} />

        {/* Row 2: Code Editor & Worker Nodes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <CodeEditor
              problems={problems}
              onSubmit={handleCodeSubmit}
              isSubmitting={isSubmitting}
              latestResult={latestResult}
            />
          </div>

          <div className="lg:col-span-5 space-y-6">
            <WorkerNodesList
              workers={activeWorkerList}
              onKillWorker={handleKillWorker}
            />
            <LoadTestPanel
              onTriggerLoad={handleTriggerLoad}
              queueDepth={queueDepth}
            />
          </div>
        </div>

        {/* Row 3: Submissions Ledger & Telemetry Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <SubmissionHistory submissions={submissions} />
          </div>

          <div className="lg:col-span-5">
            <TelemetryLogs
              logs={logs}
              onClear={() => setLogs([])}
            />
          </div>
        </div>
      </main>

      {/* Footer Academic Summary */}
      <footer className="max-w-7xl mx-auto mt-10 pt-4 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-wrap justify-between items-center gap-2">
        <span>Distributed Systems Mini Project • Final Year B.Tech Computer Engineering</span>
        <span className="font-mono text-slate-400">
          Units I (Microservices) • II (gRPC, Queues) • III (Lamport Clocks, Beacon) • IV (K8s HPA, Docker)
        </span>
      </footer>
    </div>
  );
}
