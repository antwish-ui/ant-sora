import React from 'react';
import { Download, Sliders, RefreshCw } from 'lucide-react';

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onExportCsv: () => void;
  onOpenBackendModal: () => void;
  onRefreshRates: () => void;
  isRefreshing: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onExportCsv,
  onOpenBackendModal,
  onRefreshRates,
  isRefreshing,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="#calculator"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('calculator');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
            Singapore SORA Calculator
          </a>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`transition-colors pb-1 border-b-2 ${
              activeTab === 'calculator'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Loan Calculator
          </button>
          <button
            onClick={() => setActiveTab('compounding')}
            className={`transition-colors pb-1 border-b-2 ${
              activeTab === 'compounding'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            MAS Compounding Engine
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`transition-colors pb-1 border-b-2 ${
              activeTab === 'rates'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            MAS Rates Explorer
          </button>
          <button
            onClick={() => setActiveTab('stress-test')}
            className={`transition-colors pb-1 border-b-2 ${
              activeTab === 'stress-test'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            MAS TDSR Stress Test
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`transition-colors pb-1 border-b-2 ${
              activeTab === 'comparison'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Package Comparison
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshRates}
            disabled={isRefreshing}
            title="Refresh latest MAS rates"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            onClick={onOpenBackendModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Sliders className="w-3.5 h-3.5" />
            Backend Setup
          </button>
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Schedule
          </button>
        </div>
      </div>

      {/* Mobile nav tabs */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-100 gap-4 text-xs font-medium text-slate-600">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`whitespace-nowrap ${activeTab === 'calculator' ? 'text-slate-900 font-bold' : ''}`}
        >
          Calculator
        </button>
        <button
          onClick={() => setActiveTab('compounding')}
          className={`whitespace-nowrap ${activeTab === 'compounding' ? 'text-slate-900 font-bold' : ''}`}
        >
          Compounding Engine
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`whitespace-nowrap ${activeTab === 'rates' ? 'text-slate-900 font-bold' : ''}`}
        >
          MAS Rates
        </button>
        <button
          onClick={() => setActiveTab('stress-test')}
          className={`whitespace-nowrap ${activeTab === 'stress-test' ? 'text-slate-900 font-bold' : ''}`}
        >
          TDSR Stress Test
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`whitespace-nowrap ${activeTab === 'comparison' ? 'text-slate-900 font-bold' : ''}`}
        >
          Comparison
        </button>
      </div>
    </header>
  );
};
