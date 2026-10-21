import React from 'react';
import { ListOrdered, Clock, CheckCircle2, XCircle, AlertCircle, Cpu } from 'lucide-react';

export default function SubmissionHistory({ submissions }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-indigo-400" />
            Distributed Submission Ledger & Causal Ordering
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tasks strictly ordered by Lamport Logical Timestamps (L) across distributed nodes.
          </p>
        </div>
        <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded">
          {submissions.length} Total Records
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
              <th className="py-2.5 px-3">Submission ID</th>
              <th className="py-2.5 px-3">Problem</th>
              <th className="py-2.5 px-3">Lang</th>
              <th className="py-2.5 px-3">Assigned Worker</th>
              <th className="py-2.5 px-3">Verdict</th>
              <th className="py-2.5 px-3">Runtime</th>
              <th className="py-2.5 px-3 text-right">Lamport (L)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-slate-500">
                  No submissions recorded yet. Submit a solution above to view distributed dispatch.
                </td>
              </tr>
            ) : (
              submissions.map((sub) => {
                const isAccepted = sub.status === 'ACCEPTED';
                const isPending = sub.status === 'PENDING' || sub.status === 'IN_PROGRESS';

                return (
                  <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 text-slate-300 font-semibold">{sub.id}</td>
                    <td className="py-2 px-3 text-slate-200">{sub.problem_title || sub.problem_id}</td>
                    <td className="py-2 px-3 uppercase text-indigo-300">{sub.language}</td>
                    <td className="py-2 px-3 text-slate-300">
                      {sub.worker_id || sub.dispatched_to ? (
                        <span className="inline-flex items-center gap-1 text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                          <Cpu className="w-3 h-3" />
                          {sub.worker_id || sub.dispatched_to}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">In Queue</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isAccepted
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : isPending
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40 animate-pulse'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                      }`}>
                        {isAccepted && <CheckCircle2 className="w-3 h-3" />}
                        {isPending && <Clock className="w-3 h-3" />}
                        {!isAccepted && !isPending && <XCircle className="w-3 h-3" />}
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {sub.execution_time_ms ? `${sub.execution_time_ms}ms` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right text-indigo-400 font-bold">
                      L={sub.lamport_clock || 1}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
