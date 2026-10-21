import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, ArrowDownCircle } from 'lucide-react';

export default function TelemetryLogs({ logs, onClear }) {
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Distributed Telemetry Stream</h2>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
            />
            Auto-scroll
          </label>
          <button
            onClick={onClear}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            title="Clear terminal logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-950 rounded-lg p-3 font-mono text-[11px] overflow-y-auto max-h-[300px] border border-slate-800/80 space-y-1.5">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic">Listening for cluster telemetry events...</div>
        ) : (
          logs.map((log, idx) => {
            const isError = log.type === 'error' || log.text.includes('DEAD') || log.text.includes('FAIL');
            const isSuccess = log.type === 'success' || log.text.includes('ACCEPTED');
            const isBeacon = log.type === 'beacon' || log.text.includes('BEACON');

            return (
              <div key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 shrink-0">[{log.time}]</span>
                <span
                  className={`${
                    isError
                      ? 'text-rose-400 font-semibold'
                      : isSuccess
                      ? 'text-emerald-400'
                      : isBeacon
                      ? 'text-purple-400'
                      : 'text-slate-300'
                  }`}
                >
                  {log.text}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
