import React, { useState } from 'react';
import { LoanParams, SoraRateRecord } from '../types/sora';
import { calculateAmortization, formatSGD, formatPercent } from '../utils/soraMath';
import { Columns, Check, ArrowRight } from 'lucide-react';

interface PackageComparisonProps {
  baseParams: LoanParams;
  latestRates: SoraRateRecord;
}

export const PackageComparison: React.FC<PackageComparisonProps> = ({
  baseParams,
  latestRates,
}) => {
  // Option 1: 3-Month SORA (Floating)
  const [spread3m, setSpread3m] = useState(0.70);
  // Option 2: 1-Month SORA (Floating)
  const [spread1m, setSpread1m] = useState(0.65);
  // Option 3: Fixed Rate Package (e.g. 2 years fixed)
  const [fixedRate2y, setFixedRate2y] = useState(2.85);

  const calc3m = calculateAmortization(
    {
      ...baseParams,
      packageType: '3m',
      bankMargin: spread3m,
      isSteppedMargin: false,
    },
    latestRates.soraCompounded3m
  );

  const calc1m = calculateAmortization(
    {
      ...baseParams,
      packageType: '1m',
      bankMargin: spread1m,
      isSteppedMargin: false,
    },
    latestRates.soraCompounded1m
  );

  const calcFixed = calculateAmortization(
    {
      ...baseParams,
      packageType: 'custom',
      customRate: fixedRate2y,
      bankMargin: 0,
      isSteppedMargin: false,
    },
    fixedRate2y
  );

  // 2-Year (24 Months) total payments
  const twoYear3m = calc3m.monthlyPayment * 24;
  const twoYear1m = calc1m.monthlyPayment * 24;
  const twoYearFixed = calcFixed.monthlyPayment * 24;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs mt-6">
      <div className="border-b border-slate-200 pb-4 mb-5">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
          <Columns className="w-5 h-5 text-slate-700" />
          Singapore Mortgage Package Comparison
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Compare 3-Month SORA floating, 1-Month SORA floating, and 2-Year Fixed packages for S${baseParams.loanAmount.toLocaleString()} over {baseParams.tenureYears} years
        </p>
      </div>

      {/* Side by side cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Card 1: 3-Month SORA */}
        <div className="p-4 rounded-xl border-2 border-emerald-500/80 bg-emerald-50/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                3-Month SORA Floating
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                Most Popular
              </span>
            </div>

            <div className="mb-3">
              <div className="text-xs text-slate-500">Effective Rate</div>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {formatPercent(latestRates.soraCompounded3m + spread3m, 3)}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                3M SORA ({formatPercent(latestRates.soraCompounded3m, 2)}) + {spread3m.toFixed(2)}% margin
              </div>
            </div>

            <div className="space-y-2 py-3 border-y border-emerald-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Monthly Payment:</span>
                <span className="font-bold font-mono text-slate-900 tabular-nums">
                  {formatSGD(calc3m.monthlyPayment)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">First 2-Years Total:</span>
                <span className="font-mono text-slate-800 tabular-nums">{formatSGD(twoYear3m)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Tenure Interest:</span>
                <span className="font-mono text-slate-800 tabular-nums">{formatSGD(calc3m.totalInterest)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-100">
            <label className="text-[11px] text-slate-600 block mb-1">Adjust Spread (% p.a.)</label>
            <input
              type="number"
              step="0.05"
              value={spread3m}
              onChange={(e) => setSpread3m(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs tabular-nums"
            />
          </div>
        </div>

        {/* Card 2: 1-Month SORA */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1-Month SORA Floating
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                Faster Adjust
              </span>
            </div>

            <div className="mb-3">
              <div className="text-xs text-slate-500">Effective Rate</div>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {formatPercent(latestRates.soraCompounded1m + spread1m, 3)}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                1M SORA ({formatPercent(latestRates.soraCompounded1m, 2)}) + {spread1m.toFixed(2)}% margin
              </div>
            </div>

            <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Monthly Payment:</span>
                <span className="font-bold font-mono text-slate-900 tabular-nums">
                  {formatSGD(calc1m.monthlyPayment)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">First 2-Years Total:</span>
                <span className="font-mono text-slate-800 tabular-nums">{formatSGD(twoYear1m)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Tenure Interest:</span>
                <span className="font-mono text-slate-800 tabular-nums">{formatSGD(calc1m.totalInterest)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <label className="text-[11px] text-slate-600 block mb-1">Adjust Spread (% p.a.)</label>
            <input
              type="number"
              step="0.05"
              value={spread1m}
              onChange={(e) => setSpread1m(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs tabular-nums"
            />
          </div>
        </div>

        {/* Card 3: 2-Year Fixed Rate */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Fixed Rate Package
              </span>
              <span className="text-[10px] bg-sky-50 text-sky-800 px-2 py-0.5 rounded font-medium">
                Fixed 24 Mo
              </span>
            </div>

            <div className="mb-3">
              <div className="text-xs text-slate-500">Fixed Rate</div>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {formatPercent(fixedRate2y, 2)}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Guaranteed lock-in for first 2 years
              </div>
            </div>

            <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Monthly Payment:</span>
                <span className="font-bold font-mono text-slate-900 tabular-nums">
                  {formatSGD(calcFixed.monthlyPayment)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">First 2-Years Total:</span>
                <span className="font-mono text-slate-800 tabular-nums">{formatSGD(twoYearFixed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Tenure Interest:</span>
                <span className="font-mono text-slate-800 tabular-nums">{formatSGD(calcFixed.totalInterest)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <label className="text-[11px] text-slate-600 block mb-1">Fixed Rate (% p.a.)</label>
            <input
              type="number"
              step="0.05"
              value={fixedRate2y}
              onChange={(e) => setFixedRate2y(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs tabular-nums"
            />
          </div>
        </div>
      </div>

      {/* Comparison Insights */}
      <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-700 leading-relaxed border border-slate-200">
        <div className="font-semibold text-slate-900 mb-1">Decision Framework:</div>
        <ul className="list-disc pl-4 space-y-1 text-slate-600">
          <li>
            <strong>1M SORA vs 3M SORA:</strong> 1-Month SORA adjusts every month. In a declining interest rate environment, 1M SORA captures MAS rate cuts faster. In a rising rate cycle, 3M SORA provides a 3-month buffer against quick hikes.
          </li>
          <li>
            <strong>Fixed Rate vs Floating SORA:</strong> A fixed rate package provides complete payment certainty for the lock-in period (e.g. 24 or 36 months). Compare the 2-year cost difference:{' '}
            <span className="font-mono font-semibold text-slate-900">
              {twoYearFixed < twoYear3m
                ? `Fixed saves approx ${formatSGD(twoYear3m - twoYearFixed)} over 2 years`
                : `3M SORA is approx ${formatSGD(twoYearFixed - twoYear3m)} cheaper over 2 years`}
            </span>.
          </li>
        </ul>
      </div>
    </div>
  );
};
