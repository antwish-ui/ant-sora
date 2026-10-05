import React, { useState } from 'react';
import { LoanParams, SensitivityScenario } from '../types/sora';
import { calculateSensitivityScenarios, formatSGD, formatPercent } from '../utils/soraMath';
import { ShieldCheck, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface RegulatoryStressTestProps {
  params: LoanParams;
  effectiveRate: number;
}

export const RegulatoryStressTest: React.FC<RegulatoryStressTestProps> = ({
  params,
  effectiveRate,
}) => {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(12000);
  const [otherMonthlyDebt, setOtherMonthlyDebt] = useState<number>(1000);

  const scenarios: SensitivityScenario[] = calculateSensitivityScenarios(
    params.loanAmount,
    params.tenureYears,
    effectiveRate,
    params.repaymentType
  );

  // MAS Stress Rate is 4.0%
  const masStressScenario = scenarios.find((s) => s.isMasStressTest) || scenarios[scenarios.length - 1];

  // Calculate TDSR: (Mortgage Payment at 4.0% + Other Debt) / Monthly Income
  const calculatedTdsrStress =
    monthlyIncome > 0
      ? ((masStressScenario.monthlyPayment + otherMonthlyDebt) / monthlyIncome) * 100
      : 0;

  const calculatedTdsrActual =
    monthlyIncome > 0
      ? ((scenarios.find((s) => s.rateDelta === 0)?.monthlyPayment || 0 + otherMonthlyDebt) /
          monthlyIncome) *
        100
      : 0;

  const isTdsrCompliant = calculatedTdsrStress <= 55;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs mt-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 mb-5">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          MAS Regulatory Stress Test & TDSR Eligibility (MAS Notice 645)
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Evaluate repayment sensitivity and assess compliance with Singapore&apos;s 55% Total Debt Servicing Ratio cap
        </p>
      </div>

      {/* TDSR Interactive Checker */}
      <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200/80 mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
          Interactive TDSR Regulatory Qualifier
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Borrower(s) Monthly Gross Income (SGD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                S$
              </span>
              <input
                type="number"
                step="500"
                min="1000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Math.max(1, Number(e.target.value)))}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Other Monthly Debt Obligations (Car loan, credit card, etc.)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                S$
              </span>
              <input
                type="number"
                step="100"
                min="0"
                value={otherMonthlyDebt}
                onChange={(e) => setOtherMonthlyDebt(Math.max(0, Number(e.target.value)))}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* TDSR Result Pill */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500">TDSR at MAS 4.0% Stress Test</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`text-2xl font-bold font-mono tabular-nums ${
                  isTdsrCompliant ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {calculatedTdsrStress.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500 font-medium">/ 55.0% Limit</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              {isTdsrCompliant ? (
                <span className="text-emerald-700 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Passes MAS TDSR Regulatory Threshold
                </span>
              ) : (
                <span className="text-rose-700 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Exceeds 55% MAS limit (Increase income or downpayment)
                </span>
              )}
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500">TDSR at Current Effective Rate ({formatPercent(effectiveRate, 2)})</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {calculatedTdsrActual.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500 font-medium">Actual monthly burden</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Monthly buffer vs 4% test:{' '}
              <span className="font-mono font-medium text-slate-700">
                +{formatSGD(masStressScenario.monthlyDifference)}/mo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stress Test Matrix */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
          Interest Rate Shock Sensitivity Matrix
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Scenario</th>
                <th className="py-2.5 px-3 text-right">Tested Rate</th>
                <th className="py-2.5 px-3 text-right">Monthly Instalment</th>
                <th className="py-2.5 px-3 text-right">Monthly Delta</th>
                <th className="py-2.5 px-3 text-right">Total Interest Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {scenarios.map((scenario) => (
                <tr
                  key={scenario.label}
                  className={`transition-colors ${
                    scenario.isMasStressTest
                      ? 'bg-amber-50/70 font-semibold'
                      : scenario.rateDelta === 0
                      ? 'bg-emerald-50/50 font-semibold'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-2 px-3 font-sans flex items-center gap-1.5">
                    {scenario.isMasStressTest && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block"></span>
                    )}
                    {scenario.rateDelta === 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                    )}
                    <span>{scenario.label}</span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-900">
                    {formatPercent(scenario.effectiveRate, 2)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    {formatSGD(scenario.monthlyPayment)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {scenario.monthlyDifference === 0 ? (
                      <span className="text-slate-400">—</span>
                    ) : scenario.monthlyDifference > 0 ? (
                      <span className="text-rose-600 font-medium">
                        +{formatSGD(scenario.monthlyDifference)}/mo
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium">
                        -{formatSGD(Math.abs(scenario.monthlyDifference))}/mo
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-700">
                    {formatSGD(scenario.totalInterest)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regulatory Context Box */}
      <div className="mt-5 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-slate-500" />
          Key Monetary Authority of Singapore (MAS) Rules
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] leading-relaxed">
          <div>
            <strong className="text-slate-800">Total Debt Servicing Ratio (TDSR):</strong> Capped at 55% of the borrower&apos;s gross monthly income. All debt payments (property, cars, personal, credit lines) are included, evaluated at a medium-term stress rate of at least 4.00% p.a.
          </div>
          <div>
            <strong className="text-slate-800">Mortgage Servicing Ratio (MSR):</strong> Applies specifically to HDB flats and new Executive Condominiums (ECs), capped at 30% of gross monthly income, also calculated under the regulatory stress rate.
          </div>
        </div>
      </div>
    </div>
  );
};
