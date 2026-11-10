import React, { useState } from 'react';
import { Header, ActiveTab } from './components/Header';
import { PipelinePlayground } from './components/PipelinePlayground';
import { LoadBenchmarkView } from './components/LoadBenchmarkView';
import { LatencyWaterfallView } from './components/LatencyWaterfallView';
import { TwoPageReportView } from './components/TwoPageReportView';
import { PapersLibraryView } from './components/PapersLibraryView';
import { PythonCodeViewer } from './components/PythonCodeViewer';
import { RawResultRow, generateCalibratedSeedData } from './services/benchmarkRunner';
import { PipelineExecutionResult } from './services/pipelineEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('playground');
  const [rows, setRows] = useState<RawResultRow[]>(() => generateCalibratedSeedData());

  const handleResultRecorded = (res: PipelineExecutionResult) => {
    const newRow: RawResultRow = {
      request_id: res.requestId,
      scenario: 'steady',
      source: res.source,
      start_time: res.timestamp,
      first_token_ms: res.firstTokenMs,
      total_ms: res.totalMs,
      status: res.status,
      retries: res.retries,
      tokens_in: res.tokensIn,
      tokens_out: res.tokensOut,
      retrieval_setting: res.retrievalSetting,
      answer_grade: res.answerGrade,
      waiting_ms: res.waitingMs,
      working_ms: res.workingMs,
      retrying_ms: res.retryingMs,
      query: res.query
    };

    setRows(prev => [newRow, ...prev]);
  };

  const handleResetSeed = () => {
    setRows(generateCalibratedSeedData());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        rows={rows}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Editorial Subheader Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 no-print">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="text-indigo-400 font-semibold">Corpus:</span>
            <span>Attention (1706.03762v7)</span>
            <span aria-hidden="true">·</span>
            <span>Moshi (2410.00037v1)</span>
            <span aria-hidden="true">·</span>
            <span>Dynamic Chunking (2507.07955v2)</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Stand-in: <strong className="text-emerald-400">30 RPM / 6k TPM Calibrated</strong></span>
            <span aria-hidden="true">·</span>
            <span>Dataset: <strong className="text-slate-200">{rows.length} rows</strong></span>
          </div>
        </div>

        {/* Tab Viewport */}
        {activeTab === 'playground' && (
          <PipelinePlayground onResultRecorded={handleResultRecorded} />
        )}

        {activeTab === 'benchmarks' && (
          <LoadBenchmarkView
            rows={rows}
            onUpdateRows={setRows}
            onResetSeed={handleResetSeed}
          />
        )}

        {activeTab === 'waterfall' && (
          <LatencyWaterfallView rows={rows} />
        )}

        {activeTab === 'report' && (
          <TwoPageReportView rows={rows} />
        )}

        {activeTab === 'library' && (
          <PapersLibraryView />
        )}

        {activeTab === 'code' && (
          <PythonCodeViewer />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 py-6 px-4 sm:px-8 text-center text-xs text-slate-500 font-mono no-print">
        The Relay · Research Paper QA Pipeline & Load Benchmarking Platform · Clean citations strictly enforced
      </footer>
    </div>
  );
}
