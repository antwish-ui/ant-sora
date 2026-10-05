import React from 'react';
import { LoanParams, SoraPackageType, SoraRateRecord } from '../types/sora';
import { formatPercent } from '../utils/soraMath';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface LoanCalculatorFormProps {
  params: LoanParams;
  setParams: React.Dispatch<React.SetStateAction<LoanParams>>;
  latestRates: SoraRateRecord;
  customCompoundedRate: number | null;
}

const PRESET_AMOUNTS = [
  { label: 'S$500k', value: 500000 },
  { label: 'S$800k', value: 800000 },
  { label: 'S$1.2M', value: 1200000 },
  { label: 'S$1.6M', value: 1600000 },
  { label: 'S$2.0M', value: 2000000 },
];

const PRESET_TENURES = [15, 20, 25, 30];

export const LoanCalculatorForm: React.FC<LoanCalculatorFormProps> = ({
  params,
  setParams,
  latestRates,
  customCompoundedRate,
}) => {
  const [showSteppedMargins, setShowSteppedMargins] = React.useState(params.isSteppedMargin);

  const handleAmountChange = (val: number) => {
    setParams((prev) => ({ ...prev, loanAmount: Math.max(10000, val) }));
  };

  const handleTenureChange = (val: number) => {
    setParams((prev) => ({ ...prev, tenureYears: Math.max(1, Math.min(35, val)) }));
  };

  const handlePackageChange = (type: SoraPackageType) => {
    setParams((prev) => ({ ...prev, packageType: type }));
  };

  const handleBankMarginChange = (val: number) => {
    setParams((prev) => ({ ...prev, bankMargin: Math.max(0, val) }));
  };

  const toggleSteppedMargins = () => {
    const nextState = !showSteppedMargins;
    setShowSteppedMargins(nextState);
    setParams((prev) => ({ ...prev, isSteppedMargin: nextState }));
  };

  // Get active benchmark rate according to package
  const getBenchmarkRate = () => {
    switch (params.packageType) {
      case '1m':
        return latestRates.soraCompounded1m;
      case '3m':
        return latestRates.soraCompounded3m;
      case '6m':
        return latestRates.soraCompounded6m;
      case 'custom':
        return customCompoundedRate ?? params.customRate;
    }
  };

  const currentBenchmark = getBenchmarkRate();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
      <div className="border-b border-slate-200 pb-4 mb-5">
        <h2 className="text-base font-semibold text-slate-900">Mortgage & Loan Parameters</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure loan amount, MAS SORA benchmark index, and bank margins
        </p>
      </div>

      <div className="space-y-5">
        {/* 1. Loan Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Loan Principal (SGD)
            </label>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              S${params.loanAmount.toLocaleString()}
            </span>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
              S$
            </span>
            <input
              type="number"
              min="50000"
              max="20000000"
              step="10000"
              value={params.loanAmount}
              onChange={(e) => handleAmountChange(Number(e.target.value))}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all tabular-nums"
            />
          </div>

          {/* Amount Presets */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleAmountChange(preset.value)}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  params.loanAmount === preset.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Loan Tenure */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Loan Tenure
            </label>
            <span className="text-xs font-semibold text-slate-900">
              {params.tenureYears} Years ({params.tenureYears * 12} Months)
            </span>
          </div>

          <input
            type="range"
            min="5"
            max="35"
            step="1"
            value={params.tenureYears}
            onChange={(e) => handleTenureChange(Number(e.target.value))}
            className="w-full accent-slate-900 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />

          <div className="flex items-center justify-between gap-1.5 mt-2">
            {PRESET_TENURES.map((yrs) => (
              <button
                key={yrs}
                type="button"
                onClick={() => handleTenureChange(yrs)}
                className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${
                  params.tenureYears === yrs
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {yrs} Yrs
              </button>
            ))}
          </div>
        </div>

        {/* 3. SORA Package Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              MAS SORA Benchmark
              <span
                title="Monetary Authority of Singapore compounded overnight rates"
                className="cursor-help text-slate-400 hover:text-slate-600"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
            </label>
            <span className="text-xs font-mono font-medium text-emerald-700 tabular-nums">
              Index: {formatPercent(currentBenchmark, 4)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handlePackageChange('3m')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                params.packageType === '3m'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-semibold">3-Month SORA</div>
              <div
                className={`text-[11px] mt-0.5 font-mono ${
                  params.packageType === '3m' ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {formatPercent(latestRates.soraCompounded3m, 4)} · Market Standard
              </div>
            </button>

            <button
              type="button"
              onClick={() => handlePackageChange('1m')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                params.packageType === '1m'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-semibold">1-Month SORA</div>
              <div
                className={`text-[11px] mt-0.5 font-mono ${
                  params.packageType === '1m' ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {formatPercent(latestRates.soraCompounded1m, 4)} · Monthly Reset
              </div>
            </button>

            <button
              type="button"
              onClick={() => handlePackageChange('6m')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                params.packageType === '6m'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-semibold">6-Month SORA</div>
              <div
                className={`text-[11px] mt-0.5 font-mono ${
                  params.packageType === '6m' ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {formatPercent(latestRates.soraCompounded6m, 4)} · Semi-Annual
              </div>
            </button>

            <button
              type="button"
              onClick={() => handlePackageChange('custom')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                params.packageType === 'custom'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-semibold">Custom / Engine</div>
              <div
                className={`text-[11px] mt-0.5 font-mono ${
                  params.packageType === 'custom' ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {formatPercent(customCompoundedRate ?? params.customRate, 4)} · User Defined
              </div>
            </button>
          </div>

          {params.packageType === 'custom' && (
            <div className="mt-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">
                Custom Benchmark Rate (% p.a.)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                max="15"
                value={params.customRate}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, customRate: parseFloat(e.target.value) || 0 }))
                }
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs tabular-nums text-slate-900"
              />
            </div>
          )}
        </div>

        {/* 4. Bank Margin / Spread */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Bank Margin / Spread (% p.a.)
            </label>
            <button
              type="button"
              onClick={toggleSteppedMargins}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium underline"
            >
              {showSteppedMargins ? 'Use Flat Margin' : 'Use Stepped Tiers'}
              {showSteppedMargins ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!showSteppedMargins ? (
            <div>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="5"
                  value={params.bankMargin}
                  onChange={(e) => handleBankMarginChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
                  % p.a.
                </span>
              </div>

              {/* Bank Margin Presets typical in SG (e.g. DBS/OCBC/UOB 0.65% - 0.85%) */}
              <div className="flex items-center gap-1.5 mt-2">
                {[0.65, 0.70, 0.75, 0.85, 1.0].map((margin) => (
                  <button
                    key={margin}
                    type="button"
                    onClick={() => handleBankMarginChange(margin)}
                    className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${
                      params.bankMargin === margin
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    +{margin.toFixed(2)}%
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2.5">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-slate-600 block mb-0.5">Year 1 Margin</span>
                  <input
                    type="number"
                    step="0.05"
                    value={params.marginTiers.year1}
                    onChange={(e) =>
                      setParams((prev) => ({
                        ...prev,
                        marginTiers: { ...prev.marginTiers, year1: parseFloat(e.target.value) || 0 },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs tabular-nums"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-600 block mb-0.5">Year 2 Margin</span>
                  <input
                    type="number"
                    step="0.05"
                    value={params.marginTiers.year2}
                    onChange={(e) =>
                      setParams((prev) => ({
                        ...prev,
                        marginTiers: { ...prev.marginTiers, year2: parseFloat(e.target.value) || 0 },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs tabular-nums"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-600 block mb-0.5">Year 3 Margin</span>
                  <input
                    type="number"
                    step="0.05"
                    value={params.marginTiers.year3}
                    onChange={(e) =>
                      setParams((prev) => ({
                        ...prev,
                        marginTiers: { ...prev.marginTiers, year3: parseFloat(e.target.value) || 0 },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs tabular-nums"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-600 block mb-0.5">Thereafter Margin</span>
                  <input
                    type="number"
                    step="0.05"
                    value={params.marginTiers.thereafter}
                    onChange={(e) =>
                      setParams((prev) => ({
                        ...prev,
                        marginTiers: { ...prev.marginTiers, thereafter: parseFloat(e.target.value) || 0 },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs tabular-nums"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Loan repayment will dynamically recompute upon each step transition.
              </p>
            </div>
          )}
        </div>

        {/* 5. Repayment Type */}
        <div className="pt-1 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
            Repayment Method
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setParams((prev) => ({ ...prev, repaymentType: 'amortizing' }))}
              className={`py-2 px-3 text-xs rounded-lg font-medium border text-center transition-colors ${
                params.repaymentType === 'amortizing'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Principal + Interest
            </button>
            <button
              type="button"
              onClick={() => setParams((prev) => ({ ...prev, repaymentType: 'interest_only' }))}
              className={`py-2 px-3 text-xs rounded-lg font-medium border text-center transition-colors ${
                params.repaymentType === 'interest_only'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Interest-Only (Bridging)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
