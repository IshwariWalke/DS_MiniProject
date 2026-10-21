import React, { useState } from 'react';
import { Flame, Layers, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function LoadTestPanel({ onTriggerLoad, queueDepth }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleTrigger = async (count) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await onTriggerLoad(count);
      setMessage(`Successfully dispatched ${count} concurrent jobs across worker nodes!`);
    } catch (e) {
      setMessage(`Error triggering load: ${e.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            Scalability & Load Spike Stress Tester
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulates bursty real-world code judging traffic to demonstrate queue buffering and worker parallelization.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Queue Buffer:</span>
          <span className={`px-2 py-0.5 rounded font-bold ${queueDepth > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
            {queueDepth} tasks
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        <div className="col-span-2 text-xs text-slate-300 space-y-1.5 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 font-semibold text-amber-300">
            <Layers className="w-4 h-4" />
            <span>Kubernetes HPA Demonstration:</span>
          </div>
          <p className="text-slate-400">
            In Kubernetes production mode, when queue depth exceeds the target threshold or worker CPU exceeds 70%, the <code>HorizontalPodAutoscaler (HPA)</code> automatically scales worker replicas from <strong>2 to 10 pods</strong>.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleTrigger(10)}
            disabled={loading}
            className="w-full py-2 px-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-medium font-mono rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Burst 10 Tasks (Moderate)
          </button>
          <button
            onClick={() => handleTrigger(20)}
            disabled={loading}
            className="w-full py-2 px-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-medium font-mono rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50"
          >
            <Flame className="w-3.5 h-3.5" />
            Burst 20 Tasks (Heavy Spike)
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-3 p-2.5 rounded bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
