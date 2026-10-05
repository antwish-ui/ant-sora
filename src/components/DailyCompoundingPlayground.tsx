import React, { useState, useMemo } from 'react';
import { SoraRateRecord } from '../types/sora';
import { calculateCustomCompoundedSora, formatPercent } from '../utils/soraMath';
import { Calculator, Check, ArrowRight } from 'lucide-react';

interface DailyCompoundingPlaygroundProps {
  records: SoraRateRecord[];
  onApplyRateToCalculator: (rate: number) => void;
}

export const DailyCompoundingPlayground: React.FC<DailyCompoundingPlaygroundProps> = ({
  records,
  onApplyRateToCalculator,
}) => {
  // Default to recent ~30-day window from records
  const availableDates = useMemo(
    () => records.map((r) => r.date).sort((a, b) => a.localeCompare(b)),
    [records]
  );

  const initialStart = availableDates[Math.max(0, availableDates.length - 25)] || '2026-08-25';
  const initialEnd = availableDates[availableDates.length - 1] || '2026-10-02';

  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [appliedNotification, setAppliedNotification] = useState(false);

  const compoundingResult = useMemo(() => {
    return calculateCustomCompoundedSora(records, startDate, endDate);
  }, [records, startDate, endDate]);

  const handleApply = () => {
    onApplyRateToCalculator(compoundingResult.compoundedAnnualRate);
    setAppliedNotification(true);
    setTimeout(() => setAppliedNotification(false), 2500);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs mt-6">
      <div className="border-b border-slate-200 pb-4 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              MAS SORA Daily Compounding Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify and calculate exact annualized compounded SORA using the official MAS product formula
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              {appliedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Applied to Calculator!
                </>
              ) : (
                <>
                  <Calculator className="w-3.5 h-3.5" />
                  Use Rate in Calculator
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Formula Card */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-4 sm:p-5 mb-6">
        <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
          Official MAS Compounded SORA Formula
        </div>
        <div className="font-mono text-xs sm:text-sm bg-slate-800/80 p-3 rounded-lg border border-slate-700/80 text-slate-200 overflow-x-auto">
          Compounded SORA = [ &prod;<sub>i=1</sub><sup>d<sub>b</sub></sup> ( 1 + (r<sub>i</sub> &times; n<sub>i</sub>) / 365 ) - 1 ] &times; ( 365 / d ) &times; 100%
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800">
          <div>
            <span className="text-slate-300 font-semibold font-mono">r<sub>i</sub></span> = Daily SORA for business day i
          </div>
          <div>
            <span className="text-slate-300 font-semibold font-mono">n<sub>i</sub></span> = Calendar days rate applies (Fri=3)
          </div>
          <div>
            <span className="text-slate-300 font-semibold font-mono">d<sub>b</sub></span> = Total SG business days
          </div>
          <div>
            <span className="text-slate-300 font-semibold font-mono">d</span> = Total calendar days in window
          </div>
        </div>
      </div>

      {/* Date Range Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Observation Period Start
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Observation Period End
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums"
          />
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-lg p-3 flex flex-col justify-center">
          <div className="text-[11px] text-emerald-800 font-medium">Resulting Compounded SORA</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {formatPercent(compoundingResult.compoundedAnnualRate, 4)}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">
            {compoundingResult.businessDays} business days · {compoundingResult.calendarDays} calendar days
          </div>
        </div>
      </div>

      {/* Step-by-Step Business Day Ledger */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-2">
          <span>Observation Period Daily Ledger</span>
          <span className="text-slate-500 font-normal">
            Showing {compoundingResult.items.length} Singapore business days
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Day</th>
                <th className="py-2.5 px-3 text-right">Published SORA (r<sub>i</sub>)</th>
                <th className="py-2.5 px-3 text-right">Weight (n<sub>i</sub>)</th>
                <th className="py-2.5 px-3 text-right">Factor: 1 + (r<sub>i</sub> &times; n<sub>i</sub>)/365</th>
                <th className="py-2.5 px-3 text-right">Cumulative Product (&prod;)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {compoundingResult.items.map((item) => (
                <tr key={item.date} className="hover:bg-slate-50">
                  <td className="py-1.5 px-3 font-semibold text-slate-900 font-sans">{item.date}</td>
                  <td className="py-1.5 px-3 text-slate-500 font-sans">{item.dayOfWeek}</td>
                  <td className="py-1.5 px-3 text-right text-emerald-700 font-medium">
                    {formatPercent(item.soraRate, 4)}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-700">
                    <span className={item.calendarDaysWeight > 1 ? 'font-bold text-slate-900' : ''}>
                      {item.calendarDaysWeight} {item.calendarDaysWeight > 1 ? 'days' : 'day'}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-600">
                    {item.dailyFactor.toFixed(8)}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-900 font-medium">
                    {item.cumulativeProduct.toFixed(8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compounding Explanation Notes */}
      <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1 leading-relaxed">
        <p>
          <strong className="text-slate-700">Why are Friday weights 3 days?</strong> Singapore interbank cash market does not operate on Saturdays and Sundays. The overnight rate set on Friday applies for Friday night, Saturday, and Sunday until Monday settlement.
        </p>
        <p>
          <strong className="text-slate-700">In Advance vs In Arrears:</strong> Singapore retail floating home loans commonly use &ldquo;Compounded SORA in Advance&rdquo; (where the published 1M or 3M compounded rate preceding the interest period is locked in for the upcoming month/quarter), or &ldquo;Compounded SORA in Arrears&rdquo; with a 5-day backward shift.
        </p>
      </div>
    </div>
  );
};
