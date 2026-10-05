import React from 'react';
import { CalculationResult, LoanParams } from '../types/sora';
import { formatSGD, formatPercent } from '../utils/soraMath';
import { Percent, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';

interface CalculationSummaryProps {
  result: CalculationResult;
  params: LoanParams;
  benchmarkRate: number;
  onViewSchedule: () => void;
  onViewStressTest: () => void;
}

export const CalculationSummary: React.FC<CalculationSummaryProps> = ({
  result,
  params,
  benchmarkRate,
  onViewSchedule,
  onViewStressTest,
}) => {
  const principalRatio =
    result.totalPayment > 0
      ? (params.loanAmount / result.totalPayment) * 100
      : 50;
  const interestRatio = 100 - principalRatio;

  // Monthly difference under MAS 4.0% stress test
  const masStressRate = 4.0;
  const monthlyRateStress = masStressRate / 100 / 12;
  const totalMonths = params.tenureYears * 12;
  const stressFactor = Math.pow(1 + monthlyRateStress, totalMonths);
  const stressMonthlyPayment =
    params.repaymentType === 'interest_only'
      ? params.loanAmount * monthlyRateStress
      : (params.loanAmount * monthlyRateStress * stressFactor) / (stressFactor - 1);
  const stressDiff = stressMonthlyPayment - result.monthlyPayment;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="border-b border-slate-200 pb-4 mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Repayment Summary</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{params.tenureYears} Years</span>
              <span aria-hidden="true">·</span>
              <span>{params.repaymentType === 'amortizing' ? 'Amortizing' : 'Interest-Only'}</span>
              <span aria-hidden="true">·</span>
              <span>MAS SORA Linked</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 block">Initial Rate</span>
            <span className="text-sm font-bold font-mono text-emerald-600 tabular-nums">
              {formatPercent(result.effectiveRate, 3)}
            </span>
          </div>
        </div>

        {/* Primary Focus: Monthly Instalment */}
        <div className="bg-slate-900 text-white rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Estimated Monthly Instalment</span>
            <span className="font-mono text-slate-400">SGD / Month</span>
          </div>
          <div className="text-3xl sm:text-4xl font-bold font-mono text-white tabular-nums tracking-tight">
            {formatSGD(result.monthlyPayment)}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800">
            <span>SORA: {formatPercent(benchmarkRate, 3)}</span>
            <span aria-hidden="true">+</span>
            <span>
              Margin:{' '}
              {params.isSteppedMargin
                ? `Yr 1: +${params.marginTiers.year1.toFixed(2)}%`
                : `+${params.bankMargin.toFixed(2)}%`}
            </span>
            <span aria-hidden="true">=</span>
            <span className="text-emerald-400 font-semibold">
              {formatPercent(result.effectiveRate, 3)} p.a.
            </span>
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-slate-400" />
              Total Interest Payable
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              {formatSGD(result.totalInterest)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {interestRatio.toFixed(1)}% of total repayment
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              Total Amount Payable
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              {formatSGD(result.totalPayment)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Principal + Total Interest</div>
          </div>
        </div>

        {/* First Year Breakdown */}
        <div className="mb-5 p-3.5 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700">First 12 Months Breakdown</span>
            <span className="font-mono text-slate-500 tabular-nums">
              Annual: {formatSGD(result.monthlyPayment * 12)}
            </span>
          </div>

          {/* Visual Ratio Bar */}
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex mb-2">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{
                width: `${
                  (result.firstYearPrincipal / (result.firstYearPrincipal + result.firstYearInterest || 1)) * 100
                }%`,
              }}
              title="First Year Principal"
            ></div>
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{
                width: `${
                  (result.firstYearInterest / (result.firstYearPrincipal + result.firstYearInterest || 1)) * 100
                }%`,
              }}
              title="First Year Interest"
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Principal: {formatSGD(result.firstYearPrincipal)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Interest: {formatSGD(result.firstYearInterest)}</span>
            </div>
          </div>
        </div>

        {/* MAS 4.0% TDSR Regulatory Compliance Callout */}
        <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/80 mb-5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-amber-900">
                MAS TDSR 4.00% Stress Test Check
              </div>
              <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                MAS Notice 645 requires Singapore banks to qualify property buyers at a minimum stress rate of{' '}
                <span className="font-semibold">4.00% p.a.</span> At this regulatory floor, your instalment would be{' '}
                <span className="font-mono font-semibold tabular-nums">{formatSGD(stressMonthlyPayment)}</span>/mo{' '}
                {stressDiff >= 0 ? (
                  <span>
                    (+{formatSGD(stressDiff)}/mo buffer required).
                  </span>
                ) : (
                  <span>(Current rate is above the 4.0% floor).</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onViewSchedule}
          className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 shadow-xs"
        >
          View Full Schedule
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onViewStressTest}
          className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors text-center"
        >
          Stress Test Analysis
        </button>
      </div>
    </div>
  );
};
