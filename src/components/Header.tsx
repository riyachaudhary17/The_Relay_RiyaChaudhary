import React from 'react';
import { Download, Cpu } from 'lucide-react';
import { RawResultRow, exportCsvString } from '../services/benchmarkRunner';

export type ActiveTab = 'playground' | 'benchmarks' | 'waterfall' | 'report' | 'library' | 'code';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  rows: RawResultRow[];
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, rows }) => {
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

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single line, no clutter) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            The Relay
          </span>
        </div>

        {/* Zone 2: Navigation links (single line, concise) */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('playground')}
            className={`transition-colors whitespace-nowrap hover:text-white ${
              activeTab === 'playground' ? 'text-indigo-400 font-semibold' : ''
            }`}
          >
            Pipeline
          </button>
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`transition-colors whitespace-nowrap hover:text-white ${
              activeTab === 'benchmarks' ? 'text-indigo-400 font-semibold' : ''
            }`}
          >
            Load Benchmarks
          </button>
          <button
            onClick={() => setActiveTab('waterfall')}
            className={`transition-colors whitespace-nowrap hover:text-white ${
              activeTab === 'waterfall' ? 'text-indigo-400 font-semibold' : ''
            }`}
          >
            Where Time Goes
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`transition-colors whitespace-nowrap hover:text-white ${
              activeTab === 'report' ? 'text-indigo-400 font-semibold' : ''
            }`}
          >
            Executive Report
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`transition-colors whitespace-nowrap hover:text-white ${
              activeTab === 'library' ? 'text-indigo-400 font-semibold' : ''
            }`}
          >
            arXiv Papers
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`transition-colors whitespace-nowrap hover:text-white ${
              activeTab === 'code' ? 'text-indigo-400 font-semibold' : ''
            }`}
          >
            GitHub Artifacts
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-indigo-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>results.csv</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="flex lg:hidden items-center gap-2 overflow-x-auto pt-3 border-t border-slate-800/60 mt-2 text-xs">
        {[
          { id: 'playground', label: 'Pipeline' },
          { id: 'benchmarks', label: 'Benchmarks' },
          { id: 'waterfall', label: 'Time Waterfall' },
          { id: 'report', label: '2-Page Report' },
          { id: 'library', label: 'Papers' },
          { id: 'code', label: 'GitHub Artifacts' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as ActiveTab)}
            className={`px-3 py-1 rounded-md shrink-0 font-medium ${
              activeTab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </header>
  );
};
