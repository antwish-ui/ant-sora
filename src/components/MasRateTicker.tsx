import React from 'react';
import { SoraRateRecord, DataSourceStatus } from '../types/sora';
import { formatPercent } from '../utils/soraMath';
import { Activity, ShieldCheck, Database, Calendar } from 'lucide-react';

interface MasRateTickerProps {
  latestRecord: SoraRateRecord;
  status: DataSourceStatus;
  selectedPackage: string;
  onSelectPackage: (pkg: '3m' | '1m' | '6m') => void;
}

export const MasRateTicker: React.FC<MasRateTickerProps> = ({
  latestRecord,
  status,
  selectedPackage,
  onSelectPackage,
}) => {
  return (
    <div className="bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Source metadata without pill enclosures */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Monetary Authority of Singapore (MAS) Official Benchmark
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Published: {latestRecord.date} (9:00 AM SGT)
            </span>
            <span aria-hidden="true">·</span>
            <span>SORA Index: {latestRecord.soraIndex.toFixed(6)}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <Database className="w-3 h-3" />
            <span>
              Source:{' '}
              {status.source === 'live_mas_api'
                ? 'MAS Open DataStore API'
                : status.source === 'custom_proxy'
                ? 'Connected Backend Proxy'
                : 'MAS Benchmark Series (Verified)'}
            </span>
            {latestRecord.volumeSgdMillion && (
              <>
                <span aria-hidden="true">·</span>
                <span>Volume: S${latestRecord.volumeSgdMillion.toLocaleString()}M</span>
              </>
            )}
          </div>
        </div>

        {/* Benchmarks Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Overnight SORA */}
          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <div className="text-xs text-slate-400 flex items-center justify-between mb-1">
              <span>Overnight SORA</span>
              <Activity className="w-3 h-3 text-slate-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
              {formatPercent(latestRecord.sora, 4)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Daily SGD interbank volume-weighted</div>
          </div>

          {/* 1-Month Compounded */}
          <button
            type="button"
            onClick={() => onSelectPackage('1m')}
            className={`text-left p-3 rounded-lg border transition-all ${
              selectedPackage === '1m'
                ? 'bg-emerald-950/50 border-emerald-500/80 ring-1 ring-emerald-500/50'
                : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div className="text-xs text-slate-400 flex items-center justify-between mb-1">
              <span>1-Month SORA</span>
              {selectedPackage === '1m' && (
                <span className="text-[10px] text-emerald-400 font-semibold tracking-wide uppercase">
                  Active
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
              {formatPercent(latestRecord.soraCompounded1m, 4)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Monthly resetting packages</div>
          </button>

          {/* 3-Month Compounded (Benchmark) */}
          <button
            type="button"
            onClick={() => onSelectPackage('3m')}
            className={`text-left p-3 rounded-lg border transition-all ${
              selectedPackage === '3m'
                ? 'bg-emerald-950/50 border-emerald-500/80 ring-1 ring-emerald-500/50'
                : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div className="text-xs text-slate-400 flex items-center justify-between mb-1">
              <span>3-Month SORA (Standard)</span>
              {selectedPackage === '3m' && (
                <span className="text-[10px] text-emerald-400 font-semibold tracking-wide uppercase">
                  Active
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {formatPercent(latestRecord.soraCompounded3m, 4)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Standard for DBS, OCBC, UOB</div>
          </button>

          {/* 6-Month Compounded */}
          <button
            type="button"
            onClick={() => onSelectPackage('6m')}
            className={`text-left p-3 rounded-lg border transition-all ${
              selectedPackage === '6m'
                ? 'bg-emerald-950/50 border-emerald-500/80 ring-1 ring-emerald-500/50'
                : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div className="text-xs text-slate-400 flex items-center justify-between mb-1">
              <span>6-Month SORA</span>
              {selectedPackage === '6m' && (
                <span className="text-[10px] text-emerald-400 font-semibold tracking-wide uppercase">
                  Active
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
              {formatPercent(latestRecord.soraCompounded6m, 4)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Semi-annual reset option</div>
          </button>
        </div>
      </div>
    </div>
  );
};
