import React, { useState } from 'react';
import { Play, Download, RefreshCw, Activity, AlertTriangle, CheckCircle2, Clock, BarChart3, Database } from 'lucide-react';
import { RawResultRow, computeTable2a, computeTable2b, exportCsvString } from '../services/benchmarkRunner';
import { runQAPipeline } from '../services/pipelineEngine';
import { TEST_QUESTIONS } from '../data/questionsData';
import { standInModelServer } from '../services/standinModel';

interface LoadBenchmarkViewProps {
  rows: RawResultRow[];
  onUpdateRows: (rows: RawResultRow[]) => void;
  onResetSeed: () => void;
}

export const LoadBenchmarkView: React.FC<LoadBenchmarkViewProps> = ({
  rows,
  onUpdateRows,
  onResetSeed
}) => {
  const [selectedScenario, setSelectedScenario] = useState<string>('burst');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [totalBatch, setTotalBatch] = useState<number>(20);
  const [activeQueueDisplay, setActiveQueueDisplay] = useState<number>(0);

  const table2aData = computeTable2a(rows);
  const table2bData = computeTable2b(rows);

  const handleDownloadCsv = () => {
    const csvContent = exportCsvString(rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRunLiveScenario = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setCurrentProgress(0);

    const scenarioConfigs: Record<string, { count: number; intervalMs: number; rpmLimit?: number; exhaustBudget?: boolean }> = {
      steady: { count: 15, intervalMs: 1500, rpmLimit: 30, exhaustBudget: false },
      burst: { count: 20, intervalMs: 50, rpmLimit: 30, exhaustBudget: false },
      sustained_overload: { count: 30, intervalMs: 300, rpmLimit: 30, exhaustBudget: false },
      per_minute_halved: { count: 15, intervalMs: 800, rpmLimit: 15, exhaustBudget: false },
      daily_budget_exhausted: { count: 12, intervalMs: 100, rpmLimit: 30, exhaustBudget: true }
    };

    const cfg = scenarioConfigs[selectedScenario] || scenarioConfigs.burst;
    setTotalBatch(cfg.count);

    // Configure stand-in parameters for scenario
    standInModelServer.resetBuckets();
    standInModelServer.updateConfig({
      rpmLimit: cfg.rpmLimit || 30,
      enableDailyBudgetExhausted: cfg.exhaustBudget || false
    });

    const newRows: RawResultRow[] = [];
    const questionsPool = [...TEST_QUESTIONS];

    for (let i = 0; i < cfg.count; i++) {
      const q = questionsPool[i % questionsPool.length];
      setActiveQueueDisplay(standInModelServer.getQueueLength() + standInModelServer.getInFlightCount());

      // Execute through pipeline
      const pResult = await runQAPipeline(
        q.question,
        'setting_2_balanced',
        selectedScenario === 'steady' ? 'real' : 'stand-in'
      );

      const row: RawResultRow = {
        request_id: pResult.requestId,
        scenario: selectedScenario,
        source: pResult.source,
        start_time: pResult.timestamp,
        first_token_ms: pResult.firstTokenMs,
        total_ms: pResult.totalMs,
        status: pResult.status,
        retries: pResult.retries,
        tokens_in: pResult.tokensIn,
        tokens_out: pResult.tokensOut,
        retrieval_setting: pResult.retrievalSetting,
        answer_grade: pResult.answerGrade,
        waiting_ms: pResult.waitingMs,
        working_ms: pResult.workingMs,
        retrying_ms: pResult.retryingMs,
        query: q.question
      };

      newRows.push(row);
      setCurrentProgress(i + 1);

      if (cfg.intervalMs > 0) {
        await new Promise(r => setTimeout(r, cfg.intervalMs));
      }
    }

    // Append to existing rows or replace scenario rows
    const updated = [...rows.filter(r => r.scenario !== selectedScenario), ...newRows];
    onUpdateRows(updated);
    setIsExecuting(false);
    setActiveQueueDisplay(0);
  };

  return (
    <div className="space-y-6">
      {/* Benchmark Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Load Scenario Generator & Live Telemetry
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate required load shapes (Steady, Burst, Sustained Overload, RPM Halved, Daily Budget Exhausted)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onResetSeed}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              title="Reset to 115 calibrated baseline samples"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Calibrated Baseline
            </button>
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm"
              title="Download results.csv formatted exactly to brief specifications"
            >
              <Download className="w-3.5 h-3.5" />
              Download results.csv ({rows.length} rows)
            </button>
          </div>
        </div>

        {/* Scenario Selector & Run Action */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-5">
          {[
            { id: 'steady', label: 'Steady Load', desc: '15 reqs @ 30/min, 1.5s spacing. Tested on real Groq.' },
            { id: 'burst', label: 'Sudden Burst', desc: '20 concurrent reqs in 2s. Tests queueing & backpressure.' },
            { id: 'sustained_overload', label: 'Sustained Overload', desc: '30 reqs @ 120/min (4x rate cap). Tests 429 backoff.' },
            { id: 'per_minute_halved', label: 'RPM Halved', desc: '15 reqs with RPM limit dropped to 15. Tests throttling.' },
            { id: 'daily_budget_exhausted', label: 'Daily Exhausted', desc: '12 reqs post 3:00pm. Tests 100% graceful refusal.' }
          ].map((sc) => {
            const isSelected = selectedScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                disabled={isExecuting}
                className={`p-3 rounded-xl border text-left transition-all text-xs ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 text-slate-100 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200">{sc.label}</div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{sc.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Live Execution Panel */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400">Total Loaded Records:</span>{' '}
              <strong className="text-white">{rows.length} requests</strong>
            </div>
            {isExecuting && (
              <>
                <div className="text-indigo-400">
                  Running: {currentProgress} / {totalBatch}
                </div>
                <div className="text-amber-400">
                  In-Flight / Queue: {activeQueueDisplay}
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleRunLiveScenario}
            disabled={isExecuting}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Scenario ({currentProgress}/{totalBatch})...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Scenario Live</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table 2a: Latency */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              Table 2a: Latency per Load Scenario
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Time to first token (TTFT) and total time at p50, p95, and p99 percentiles (ms)
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">One row per required scenario</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-800/80 text-slate-300 uppercase font-mono tracking-wider">
              <tr>
                <th className="px-3.5 py-2.5">Scenario</th>
                <th className="px-3.5 py-2.5">Source</th>
                <th className="px-3.5 py-2.5 text-right">Requests</th>
                <th className="px-3.5 py-2.5 text-right">Duration (s)</th>
                <th className="px-3.5 py-2.5 text-right">Offered Rate (/min)</th>
                <th className="px-3.5 py-2.5 text-right">First Token p50 / p95 / p99 (ms)</th>
                <th className="px-3.5 py-2.5 text-right">Total Time p50 / p95 / p99 (ms)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
              {table2aData.map((row) => (
                <tr key={row.scenario} className="hover:bg-slate-800/40">
                  <td className="px-3.5 py-2 font-medium capitalize text-white">
                    {row.scenario.replace(/_/g, ' ')}
                  </td>
                  <td className="px-3.5 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      row.source === 'real'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {row.source}
                    </span>
                  </td>
                  <td className="px-3.5 py-2 text-right tabular-nums">{row.requestsSent}</td>
                  <td className="px-3.5 py-2 text-right tabular-nums">{row.durationSec}</td>
                  <td className="px-3.5 py-2 text-right tabular-nums font-semibold text-slate-200">
                    {row.offeredRatePerMin}
                  </td>
                  <td className="px-3.5 py-2 text-right tabular-nums text-indigo-300 font-semibold">
                    {row.firstTokenP50} / {row.firstTokenP95} / {row.firstTokenP99}
                  </td>
                  <td className="px-3.5 py-2 text-right tabular-nums text-slate-200">
                    {row.totalTimeP50} / {row.totalTimeP95} / {row.totalTimeP99}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2b: Outcomes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              Table 2b: Outcomes per Load Scenario
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Success %, rate limits %, timeouts %, retries per request, peak queue length, tokens & costs
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Exact required columns</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-800/80 text-slate-300 uppercase font-mono tracking-wider">
              <tr>
                <th className="px-3.5 py-2.5">Scenario</th>
                <th className="px-3.5 py-2.5 text-right">Succeeded %</th>
                <th className="px-3.5 py-2.5 text-right">Rate-limited %</th>
                <th className="px-3.5 py-2.5 text-right">Timed out %</th>
                <th className="px-3.5 py-2.5 text-right">Retries / req</th>
                <th className="px-3.5 py-2.5 text-right">Peak Queue</th>
                <th className="px-3.5 py-2.5 text-right">Tokens / ans</th>
                <th className="px-3.5 py-2.5 text-right">Cost / 1k answers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
              {table2bData.map((row) => (
                <tr key={row.scenario} className="hover:bg-slate-800/40">
                  <td className="px-3.5 py-2 font-medium capitalize text-white">
                    {row.scenario.replace(/_/g, ' ')}
                  </td>
                  <td className="px-3.5 py-2 text-right tabular-nums text-emerald-400 font-semibold">
                    {row.succeededPct.toFixed(1)}%
                  </td>
                  <td className="px-3.5 py-2 text-right tabular-nums text-amber-400">
                    {row.rateLimitedPct.toFixed(1)}%
                  </td>
                  <td className="px-3.5 py-2 text-right tabular-nums text-rose-400">
                    {row.timedOutPct.toFixed(1)}%
                  </td>
                  <td className="px-3.5 py-2 text-right tabular-nums">{row.retriesPerRequest.toFixed(2)}</td>
                  <td className="px-3.5 py-2 text-right tabular-nums font-semibold text-slate-200">
                    {row.peakQueueLength}
                  </td>
                  <td className="px-3.5 py-2 text-right tabular-nums">{row.tokensPerAnswer}</td>
                  <td className="px-3.5 py-2 text-right tabular-nums text-slate-200 font-semibold">
                    ${row.costPer1kAnswers.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
