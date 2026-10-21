import React, { useState } from 'react';
import { Cpu, HardDrive, Zap, AlertTriangle, Play, RefreshCw, XCircle } from 'lucide-react';

export default function WorkerNodesList({ workers, onKillWorker }) {
  const [killingId, setKillingId] = useState(null);

  const handleKill = async (id) => {
    setKillingId(id);
    try {
      await onKillWorker(id);
    } finally {
      setTimeout(() => setKillingId(null), 1000);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            Distributed Worker Nodes (Beacon Protocol Monitor)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Nodes send gRPC heartbeats every 2000ms. If inactive &gt; 5000ms, Coordinator flags failure.
          </p>
        </div>
        <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded">
          {workers.length} nodes registered
        </span>
      </div>

      {workers.length === 0 ? (
        <div className="text-center py-8 text-slate-500 font-mono text-xs">
          Waiting for worker nodes to register via gRPC beacon...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {workers.map((worker) => {
            const isAlive = worker.is_alive;
            const isBusy = worker.active_jobs > 0;
            const statusColor = !isAlive
              ? 'border-rose-800/60 bg-rose-950/20 text-rose-400'
              : isBusy
              ? 'border-cyan-800/60 bg-cyan-950/20 text-cyan-400'
              : 'border-emerald-800/60 bg-emerald-950/20 text-emerald-400';

            return (
              <div
                key={worker.worker_id}
                className={`border rounded-lg p-3.5 transition-all ${statusColor} relative group`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isAlive ? (isBusy ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400') : 'bg-rose-500'}`} />
                      <span className="text-xs font-bold font-mono tracking-wider text-white">
                        {worker.worker_id}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono ml-4">
                      host: {worker.hostname || 'container'}
                    </span>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    !isAlive
                      ? 'bg-rose-900/60 text-rose-300'
                      : isBusy
                      ? 'bg-cyan-900/60 text-cyan-300 animate-pulse'
                      : 'bg-emerald-900/60 text-emerald-300'
                  }`}>
                    {worker.status || (isAlive ? 'HEALTHY' : 'DEAD')}
                  </span>
                </div>

                {/* Metrics */}
                <div className="space-y-2 my-3 text-xs font-mono">
                  {/* CPU Meter */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>CPU Utilization</span>
                      <span>{worker.cpu_usage_percent}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          worker.cpu_usage_percent > 80 ? 'bg-rose-500' : worker.cpu_usage_percent > 40 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, worker.cpu_usage_percent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Memory & Jobs */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
                      <span className="text-slate-400 block text-[9px] uppercase">Memory</span>
                      <span className="text-slate-200">{worker.memory_mb || 45} MB</span>
                    </div>
                    <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
                      <span className="text-slate-400 block text-[9px] uppercase">Total Solved</span>
                      <span className="text-emerald-300 font-bold">{worker.total_processed || 0}</span>
                    </div>
                  </div>

                  {/* Beacon timestamp */}
                  <div className="text-[10px] text-slate-400 flex justify-between items-center pt-1">
                    <span>Last Beacon:</span>
                    <span className="text-slate-300">
                      {isAlive ? `${worker.last_seen_seconds_ago || 0}s ago` : 'TIMED OUT'}
                    </span>
                  </div>
                </div>

                {/* Kill / Fault Injection Button */}
                {isAlive && (
                  <button
                    onClick={() => handleKill(worker.worker_id)}
                    disabled={killingId === worker.worker_id}
                    className="w-full mt-2 text-[11px] font-mono py-1.5 px-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 rounded flex items-center justify-center gap-1.5 transition-all"
                    title="Simulate node failure to demonstrate the Beacon protocol & fault recovery"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    {killingId === worker.worker_id ? 'Killing Node...' : 'Inject Fault (Kill Node)'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
