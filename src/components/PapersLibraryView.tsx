import React, { useState } from 'react';
import { BookOpen, ExternalLink, Bookmark, Check, ShieldAlert, Sparkles, Layers } from 'lucide-react';
import { PAPERS, PAPER_CHUNKS } from '../data/papersData';
import { TEST_QUESTIONS } from '../data/questionsData';

export const PapersLibraryView: React.FC = () => {
  const [selectedPaperId, setSelectedPaperId] = useState<string>('attention');

  const paperList = Object.values(PAPERS);
  const activePaper = PAPERS[selectedPaperId] || paperList[0];
  const activeChunks = PAPER_CHUNKS.filter(c => c.paperId === selectedPaperId);
  const relatedQuestions = TEST_QUESTIONS.filter(q => q.targetPaperId === selectedPaperId);

  return (
    <div className="space-y-6">
      {/* Paper Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {paperList.map((paper) => {
          const isSelected = selectedPaperId === paper.id;
          return (
            <button
              key={paper.id}
              onClick={() => setSelectedPaperId(paper.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-md'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between font-mono text-xs text-indigo-400 mb-1">
                <span>arXiv:{paper.arxivId}v{paper.version}</span>
                <span>{paper.year}</span>
              </div>
              <h3 className="text-sm font-semibold text-white line-clamp-1">
                {paper.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {paper.abstract}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Paper Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
        <div className="border-b border-slate-800 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-slate-400 mb-2">
            <span className="px-2.5 py-1 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800">
              arXiv:{activePaper.arxivId}v{activePaper.version}
            </span>
            <span>Authors: {activePaper.authors.join(', ')}</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {activePaper.title}
          </h2>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            {activePaper.abstract}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {activePaper.primaryTopics.map((topic, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* Chunks Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Pre-Indexed Semantic Chunks & Passages ({activeChunks.length} sections)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Boundaries preserved for exact citation</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {activeChunks.map((chunk) => (
              <div
                key={chunk.chunkId}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
                  <span className="font-semibold text-indigo-300">{chunk.section}</span>
                  <span>Page {chunk.page} · {chunk.wordCount} words</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {chunk.content}
                </p>
                <div className="text-[10px] font-mono text-slate-500 pt-1">
                  Supported Settings: {chunk.settingCompatibility.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Related Benchmark Questions */}
        {relatedQuestions.length > 0 && (
          <div className="border-t border-slate-800 pt-5 space-y-3">
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Calibrated Benchmark Inquiries for this Paper
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {relatedQuestions.map((q) => (
                <div
                  key={q.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="font-bold text-slate-300">{q.id.toUpperCase()}</span>
                    <span className="uppercase text-indigo-400">{q.category.replace('_', ' ')}</span>
                  </div>
                  <p className="text-slate-200 font-medium">{q.question}</p>
                  <p className="text-[11px] text-slate-400 italic">Expected: {q.groundTruthSummary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
