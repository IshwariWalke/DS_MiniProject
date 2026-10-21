import React from 'react';
import { Server, Cpu, Database, Radio, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

export default function ClusterTopology({ metrics, queueDepth }) {
  const workers = metrics?.cluster?.workers || [];
  const activeWorkers = workers.filter(w => w.is_alive);
  const deadWorkers = workers.filter(w => !w.is_alive);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
          <h2 className="text-base font-semibold text-white">Live Cluster Architecture & Inter-Service Topology</h2>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            {activeWorkers.length} Active Nodes
          </span>
          {deadWorkers.length > 0 && (
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {deadWorkers.length} Dead Nodes
            </span>
          )}
          <span className="text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
            Lamport Clock: <strong className="text-indigo-300">{metrics?.gateway_lamport_clock || 1}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Node 1: API Gateway */}
        <div className="bg-slate-950/70 border border-indigo-500/30 rounded-lg p-3.5 relative hover:border-indigo-500/60 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded">
                <Server className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">API Gateway</span>
            </div>
            <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/50">:4000</span>
          </div>
          <p className="text-xs text-slate-400 mb-2">Client Ingress & Logical Clock Stamping</p>
          <div className="text-[11px] font-mono text-slate-300 space-y-1 bg-slate-900/60 p-2 rounded border border-slate-800/60">
            <div className="flex justify-between"><span>Protocol:</span><span className="text-emerald-400">HTTP + WS</span></div>
            <div className="flex justify-between"><span>Clock (L):</span><span className="text-indigo-400">{metrics?.gateway_lamport_clock || 1}</span></div>
          </div>
        </div>

        {/* Node 2: Message Queue */}
        <div className="bg-slate-950/70 border border-amber-500/30 rounded-lg p-3.5 relative hover:border-amber-500/60 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded">
                <Database className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">Task Queue</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${queueDepth > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
              {queueDepth} pending
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-2">Asynchronous FIFO Queue & Load Buffering</p>
          <div className="text-[11px] font-mono text-slate-300 space-y-1 bg-slate-900/60 p-2 rounded border border-slate-800/60">
            <div className="flex justify-between"><span>Broker:</span><span className="text-amber-400">Redis / Streams</span></div>
            <div className="flex justify-between"><span>Delivery:</span><span className="text-slate-300">At-Least-Once</span></div>
          </div>
        </div>

        {/* Node 3: Execution Workers */}
        <div className="bg-slate-950/70 border border-emerald-500/30 rounded-lg p-3.5 relative hover:border-emerald-500/60 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Worker Pool</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/50">
              {activeWorkers.length} Replicas
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-2">Stateless Sandboxed Code Executors</p>
          <div className="text-[11px] font-mono text-slate-300 space-y-1 bg-slate-900/60 p-2 rounded border border-slate-800/60">
            <div className="flex justify-between"><span>Isolation:</span><span className="text-emerald-400">VM / Subprocess</span></div>
            <div className="flex justify-between"><span>Auto-Scale:</span><span className="text-slate-300">K8s HPA (2-10)</span></div>
          </div>
        </div>

        {/* Node 4: gRPC Coordinator */}
        <div className="bg-slate-950/70 border border-purple-500/30 rounded-lg p-3.5 relative hover:border-purple-500/60 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">Coordinator</span>
            </div>
            <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/50">:50051</span>
          </div>
          <p className="text-xs text-slate-400 mb-2">Beacon Detector & gRPC Telemetry</p>
          <div className="text-[11px] font-mono text-slate-300 space-y-1 bg-slate-900/60 p-2 rounded border border-slate-800/60">
            <div className="flex justify-between"><span>Transport:</span><span className="text-purple-400">Binary gRPC</span></div>
            <div className="flex justify-between"><span>Protocol:</span><span className="text-cyan-400">Beacon (2s)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
