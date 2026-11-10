import React, { useState } from 'react';
import { Play, RotateCcw, CheckCircle2, AlertCircle, ArrowRight, BookOpen, Layers, ShieldCheck, Cpu, Key, Clock, Zap } from 'lucide-react';
import { TEST_QUESTIONS, TestQuestion } from '../data/questionsData';
import { RETRIEVAL_SETTINGS, RetrievalSettingId } from '../services/retrieverService';
import { runQAPipeline, PipelineExecutionResult, PipelineStepTrace } from '../services/pipelineEngine';

interface PipelinePlaygroundProps {
  onResultRecorded?: (result: PipelineExecutionResult) => void;
}

export const PipelinePlayground: React.FC<PipelinePlaygroundProps> = ({ onResultRecorded }) => {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(TEST_QUESTIONS[0].id);
  const [customQuery, setCustomQuery] = useState<string>(TEST_QUESTIONS[0].question);
  const [selectedSetting, setSelectedSetting] = useState<RetrievalSettingId>('setting_2_balanced');
  const [engineSource, setEngineSource] = useState<'stand-in' | 'real'>('stand-in');
  const [groqApiKey, setGroqApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeSteps, setActiveSteps] = useState<PipelineStepTrace[]>([]);
  const [streamedText, setStreamedText] = useState<string>('');
  const [executionResult, setExecutionResult] = useState<PipelineExecutionResult | null>(null);

  const handleSelectQuestion = (q: TestQuestion) => {
    setSelectedQuestionId(q.id);
    setCustomQuery(q.question);
    setExecutionResult(null);
    setStreamedText('');
    setActiveSteps([]);
  };

  const handleRunPipeline = async () => {
    if (!customQuery.trim() || isRunning) return;
    setIsRunning(true);
    setStreamedText('');
    setExecutionResult(null);

    try {
      const result = await runQAPipeline(
        customQuery,
        selectedSetting,
        engineSource,
        groqApiKey,
        (steps) => {
          setActiveSteps(steps);
        },
        (chunk) => {
          setStreamedText((prev) => prev + chunk);
        }
      );

      setExecutionResult(result);
      if (onResultRecorded) {
        onResultRecorded(result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const selectedQuestionObj = TEST_QUESTIONS.find(q => q.id === selectedQuestionId);

  return (
    <div className="space-y-6">
      {/* Configuration & Input Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-5">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              Interactive 4-Step QA Pipeline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live step execution: Intent classification → Passage retrieval tool → Draft citations → Reflection verifier
            </p>
          </div>

          {/* Engine Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setEngineSource('stand-in')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${engineSource === 'stand-in' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Stand-in (Calibrated)
              </button>
              <button
                onClick={() => {
                  setEngineSource('real');
                  setShowKeyInput(true);
                }}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${engineSource === 'real' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Live Groq API
              </button>
            </div>

            {engineSource === 'real' && (
              <button
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="p-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg"
                title="Configure Groq Key"
              >
                <Key className="w-4 h-4 text-amber-400" />
              </button>
            )}
          </div>
        </div>

        {/* Live Groq Key Input (Optional) */}
        {showKeyInput && engineSource === 'real' && (
          <div className="mb-4 p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-300">Optional: Groq API Key</span>
              <span className="text-slate-400">Stored purely in local browser memory</span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="gsk_..."
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => setShowKeyInput(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Retrieval Setting Selector */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
            Retrieval Configuration (Table 3 Profiles)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {Object.values(RETRIEVAL_SETTINGS).map((s) => {
              const isSelected = selectedSetting === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSetting(s.id)}
                  className={`text-left p-3 rounded-xl border transition-all text-xs ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 text-slate-100 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-medium text-slate-200 flex items-center justify-between">
                    <span>{s.name}</span>
                    {s.id === 'setting_2_balanced' && (
                      <span className="text-[10px] text-indigo-400 font-mono font-semibold uppercase">Recommended</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {s.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Calibrated Test Questions Carousel */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
            Select Calibrated Inquiry (18 Questions across 4 Categories)
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {TEST_QUESTIONS.map((q) => {
              const isSelected = selectedQuestionId === q.id;
              let badgeColor = 'text-indigo-400';
              if (q.category === 'unanswerable_refusal') badgeColor = 'text-amber-400';
              if (q.category === 'retriever_trap') badgeColor = 'text-rose-400';
              if (q.category === 'cross_paper') badgeColor = 'text-cyan-400';

              return (
                <button
                  key={q.id}
                  onClick={() => handleSelectQuestion(q)}
                  className={`shrink-0 px-3 py-2 rounded-xl border text-xs max-w-xs text-left transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-indigo-500 text-slate-100 shadow-sm'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                    <span className="font-semibold text-slate-300">{q.id.toUpperCase()}</span>
                    <span className={`${badgeColor} uppercase font-medium`}>{q.category.replace('_', ' ')}</span>
                  </div>
                  <div className="truncate mt-1 text-slate-200 font-medium">
                    {q.question}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Text Area */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Query Prompt
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Ask a question about Attention Is All You Need, Moshi, or Dynamic Chunking..."
            />
          </div>

          {selectedQuestionObj?.trapExplanation && (
            <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs text-rose-300">
              <span className="font-semibold">Evaluator Note:</span> {selectedQuestionObj.trapExplanation}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleRunPipeline}
              disabled={isRunning || !customQuery.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run 4-Step Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Step Execution Trace */}
      {activeSteps.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center justify-between font-mono">
            <span>Execution Trace & Verification Loop</span>
            <span className="text-xs text-slate-400 font-normal">
              Engine: <strong className="text-indigo-400 capitalize">{engineSource}</strong>
            </span>
          </h3>

          <div className="space-y-3">
            {activeSteps.map((step) => {
              const isRunning = step.status === 'running';
              const isCompleted = step.status === 'completed';
              const isLooped = step.status === 'looped';
              const isFailed = step.status === 'failed';

              return (
                <div
                  key={step.stepNumber}
                  className={`p-4 rounded-xl border transition-all ${
                    isRunning
                      ? 'bg-indigo-950/30 border-indigo-500/80 shadow-md'
                      : isLooped
                      ? 'bg-amber-950/30 border-amber-500/80'
                      : isCompleted
                      ? 'bg-slate-950/70 border-slate-800'
                      : isFailed
                      ? 'bg-rose-950/30 border-rose-800'
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        isRunning ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-pulse' :
                        isLooped ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        isFailed ? 'bg-rose-500/20 text-rose-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {step.stepNumber}
                      </span>
                      <span className="font-semibold text-slate-200">{step.stepName}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {step.durationMs > 0 && (
                        <span className="text-slate-400 tabular-nums">
                          {step.durationMs} ms
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        isCompleted ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        isRunning ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                        isLooped ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        isFailed ? 'bg-rose-950 text-rose-400' :
                        'bg-slate-800 text-slate-500'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-1.5">
                    {step.details}
                  </p>

                  {step.outputSummary && (
                    <div className="mt-2 text-xs font-mono text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      {step.outputSummary}
                    </div>
                  )}

                  {step.toolCall && (
                    <div className="mt-2 p-2 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-[11px] font-mono text-indigo-300 flex items-center justify-between">
                      <span>Tool Invoked: <strong>{step.toolCall.toolName}</strong></span>
                      <span>Passages: {step.toolCall.resultCount}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Output & Telemetry Strip */}
      {(executionResult || streamedText) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Synthesized Output</h3>
              {executionResult?.isRefusal && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-950 text-amber-300 border border-amber-800">
                  Refused Honestly
                </span>
              )}
            </div>

            {executionResult && (
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span>TTFT: <strong className="text-indigo-400">{executionResult.firstTokenMs} ms</strong></span>
                <span>Total: <strong className="text-slate-200">{executionResult.totalMs} ms</strong></span>
                <span>Tokens In: <strong className="text-slate-300">{executionResult.tokensIn}</strong></span>
                <span>Tokens Out: <strong className="text-slate-300">{executionResult.tokensOut}</strong></span>
              </div>
            )}
          </div>

          {/* Answer Content */}
          <div className="text-sm text-slate-200 leading-relaxed font-sans bg-slate-950 p-4 rounded-xl border border-slate-800 whitespace-pre-line">
            {executionResult?.finalAnswer || streamedText}
          </div>

          {/* Citations List */}
          {executionResult?.citations && executionResult.citations.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-mono font-semibold text-slate-400 uppercase">
                Verified arXiv Citations:
              </span>
              <div className="flex flex-wrap gap-2">
                {executionResult.citations.map((cite, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-indigo-950/40 text-indigo-300 border border-indigo-800/60"
                  >
                    {cite}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Latency Breakdown Bar (Section 4 Telemetry) */}
          {executionResult && (
            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-xs font-mono text-slate-400 mb-2 flex justify-between">
                <span>Latency Allocation (Section 4 Requirement):</span>
                <span>
                  Waiting: {executionResult.waitingMs}ms · Working: {executionResult.workingMs}ms · Retrying: {executionResult.retryingMs}ms
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-850 flex overflow-hidden">
                <div
                  style={{ width: `${Math.max(5, (executionResult.waitingMs / executionResult.totalMs) * 100)}%` }}
                  className="bg-amber-500"
                  title={`Waiting: ${executionResult.waitingMs}ms`}
                />
                <div
                  style={{ width: `${Math.max(5, (executionResult.workingMs / executionResult.totalMs) * 100)}%` }}
                  className="bg-emerald-500"
                  title={`Working: ${executionResult.workingMs}ms`}
                />
                <div
                  style={{ width: `${(executionResult.retryingMs / executionResult.totalMs) * 100}%` }}
                  className="bg-rose-500"
                  title={`Retrying: ${executionResult.retryingMs}ms`}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
