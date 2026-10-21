import React, { useState, useEffect } from 'react';
import { Play, Code2, CheckCircle2, XCircle, Clock, Zap, RotateCcw } from 'lucide-react';

export default function CodeEditor({ problems, onSubmit, isSubmitting, latestResult }) {
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [selectedLang, setSelectedLang] = useState('javascript');
  const [code, setCode] = useState('');

  const currentProblem = problems.find(p => p.id === selectedProblemId) || problems[0];

  useEffect(() => {
    if (problems.length > 0 && !selectedProblemId) {
      setSelectedProblemId(problems[0].id);
      setCode(problems[0].starterCode[selectedLang] || '');
    }
  }, [problems]);

  useEffect(() => {
    if (currentProblem) {
      setCode(currentProblem.starterCode[selectedLang] || '');
    }
  }, [selectedProblemId, selectedLang]);

  const handleReset = () => {
    if (currentProblem) {
      setCode(currentProblem.starterCode[selectedLang] || '');
    }
  };

  const handleSubmit = () => {
    if (!currentProblem || !code.trim()) return;
    onSubmit({
      problemId: currentProblem.id,
      language: selectedLang,
      code
    });
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm flex flex-col h-full">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-semibold text-white">Problem:</span>
          </div>
          <select
            value={selectedProblemId}
            onChange={(e) => setSelectedProblemId(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 font-medium"
          >
            {problems.map(p => (
              <option key={p.id} value={p.id}>{p.title} ({p.difficulty})</option>
            ))}
          </select>

          <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
            {currentProblem?.difficulty || 'Easy'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setSelectedLang('javascript')}
              className={`px-3 py-1 rounded-md transition-all ${selectedLang === 'javascript' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              JavaScript
            </button>
            <button
              onClick={() => setSelectedLang('python')}
              className={`px-3 py-1 rounded-md transition-all ${selectedLang === 'python' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Python
            </button>
          </div>

          <button
            onClick={handleReset}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
            title="Reset code template"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Problem Description */}
      {currentProblem && (
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 mb-3 text-xs text-slate-300">
          <p className="mb-2 text-slate-200 leading-relaxed">{currentProblem.description}</p>
          <div className="text-[11px] font-mono text-slate-400">
            <strong>Sample Test Cases:</strong>
            <div className="mt-1 flex flex-wrap gap-2">
              {currentProblem.testCases.map((tc, idx) => (
                <span key={idx} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Input: {JSON.stringify(tc.input)} → Output: {JSON.stringify(tc.expected)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Code Editor TextArea */}
      <div className="flex-1 relative mb-3 min-h-[220px]">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full h-full min-h-[220px] bg-slate-950 text-emerald-300 font-mono text-xs p-3.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500/80 leading-relaxed resize-none shadow-inner"
          placeholder="// Write your distributed execution code here..."
        />
      </div>

      {/* Footer Submission Bar */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] text-slate-400 font-mono">
          Language: <strong className="text-slate-200 uppercase">{selectedLang}</strong> | Distributed Sandbox: <strong className="text-indigo-400">Isolated VM</strong>
        </span>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              Routing to Cluster...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Submit to Distributed Cluster
            </>
          )}
        </button>
      </div>

      {/* Latest Execution Result Banner */}
      {latestResult && (
        <div className={`mt-4 p-3.5 rounded-lg border text-xs font-mono transition-all ${
          latestResult.status === 'ACCEPTED'
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
            : latestResult.status === 'WRONG_ANSWER'
            ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              {latestResult.status === 'ACCEPTED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>Verdict: {latestResult.status}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>Node: <strong className="text-white">{latestResult.worker_id || 'Worker'}</strong></span>
              <span>Runtime: <strong className="text-white">{latestResult.execution_time_ms}ms</strong></span>
              <span>Memory: <strong className="text-white">{latestResult.memory_used_kb} KB</strong></span>
              <span>Lamport: <strong className="text-indigo-300 font-bold">L={latestResult.lamport_clock}</strong></span>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 whitespace-pre-wrap bg-slate-950/60 p-2 rounded border border-slate-900">
            {latestResult.stdout || latestResult.stderr || 'Execution finished.'}
          </p>
        </div>
      )}
    </div>
  );
}
