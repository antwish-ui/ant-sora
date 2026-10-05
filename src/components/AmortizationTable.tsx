import React, { useState } from 'react';
import { CalculationResult, LoanParams } from '../types/sora';
import { formatSGD, formatSGDCents, formatPercent, exportAmortizationCSV } from '../utils/soraMath';
import { Download, Search, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';

interface AmortizationTableProps {
  result: CalculationResult;
  params: LoanParams;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({ result, params }) => {
  const [viewMode, setViewMode] = useState<'annual' | 'monthly'>('annual');
  const [searchYear, setSearchYear] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 24; // 2 years per page for monthly view

  const handleExport = () => {
    exportAmortizationCSV(result.monthlySchedule, params.loanAmount, result.effectiveRate);
  };

  // Filter monthly schedule if searching
  const filteredMonthly = result.monthlySchedule.filter((row) => {
    if (!searchYear) return true;
    return (
      row.year.toString() === searchYear.trim() ||
      `Year ${row.year}`.toLowerCase().includes(searchYear.toLowerCase().trim())
    );
  });

  const totalPages = Math.ceil(filteredMonthly.length / rowsPerPage);
  const paginatedMonthly = filteredMonthly.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // SVG Balance Reduction Chart Path Calculation
  const chartPoints = result.annualSchedule.map((row, idx, arr) => {
    const x = (idx / (arr.length - 1 || 1)) * 100;
    const y = 100 - (row.endingBalance / params.loanAmount) * 85 - 5; // leave margins
    return `${x},${y}`;
  });
  const chartPathD = `M 0,${100 - (params.loanAmount / params.loanAmount) * 85 - 5} ` + chartPoints.map((p) => `L ${p}`).join(' ');
  const areaPathD = `${chartPathD} L 100,95 L 0,95 Z`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs mt-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Loan Amortization Schedule</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full actuarial amortization breakdown over the {params.tenureYears}-year tenure
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle View Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => {
                setViewMode('annual');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'annual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual Summary
            </button>
            <button
              onClick={() => {
                setViewMode('monthly');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Schedule
            </button>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            CSV Export
          </button>
        </div>
      </div>

      {/* Loan Balance Trajectory Chart */}
      <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-4 mb-6">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
            Outstanding Principal Balance Over Tenure
          </span>
          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <span>Start: {formatSGD(params.loanAmount)}</span>
            <span aria-hidden="true">→</span>
            <span>End: S$0 (Year {params.tenureYears})</span>
          </div>
        </div>

        <div className="w-full h-28 relative">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Horizontal guideline */}
            <line x1="0" y1="95" x2="100" y2="95" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="0" y1="52.5" x2="100" y2="52.5" stroke="#e2e8f0" strokeDasharray="2,2" strokeWidth="0.8" />
            <line x1="0" y1="10" x2="100" y2="10" stroke="#e2e8f0" strokeDasharray="2,2" strokeWidth="0.8" />

            {/* Gradient fill */}
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Area Fill */}
            <path d={areaPathD} fill="url(#balanceGradient)" />

            {/* Line Path */}
            <path
              d={chartPathD}
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
          <span>Year 0</span>
          <span>Year {Math.round(params.tenureYears / 2)}</span>
          <span>Year {params.tenureYears}</span>
        </div>
      </div>

      {/* Monthly Search Filter if in Monthly Mode */}
      {viewMode === 'monthly' && (
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by year (e.g. 1, 5, 10)..."
              value={searchYear}
              onChange={(e) => {
                setSearchYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Showing {paginatedMonthly.length} of {filteredMonthly.length} months
          </div>
        </div>
      )}

      {/* Tables */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        {viewMode === 'annual' ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3 text-right">Avg Applied Rate</th>
                <th className="py-2.5 px-3 text-right">Annual Payment</th>
                <th className="py-2.5 px-3 text-right">Principal Paid</th>
                <th className="py-2.5 px-3 text-right">Interest Paid</th>
                <th className="py-2.5 px-3 text-right">Ending Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {result.annualSchedule.map((row) => (
                <tr key={row.year} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 font-semibold text-slate-900 font-sans">
                    Year {row.year}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600">
                    {formatPercent(row.averageRate, 3)}
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-slate-900">
                    {formatSGD(row.annualPayment)}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-700 font-medium">
                    {formatSGD(row.principalPaid)}
                  </td>
                  <td className="py-2 px-3 text-right text-amber-700">
                    {formatSGD(row.interestPaid)}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-slate-900">
                    {formatSGD(row.endingBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3 text-right">Applied Rate</th>
                <th className="py-2.5 px-3 text-right">Payment</th>
                <th className="py-2.5 px-3 text-right">Principal</th>
                <th className="py-2.5 px-3 text-right">Interest</th>
                <th className="py-2.5 px-3 text-right">Remaining Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {paginatedMonthly.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 text-slate-900 font-medium font-sans">
                    Month {row.month}
                  </td>
                  <td className="py-2 px-3 text-slate-500 font-sans">Year {row.year}</td>
                  <td className="py-2 px-3 text-right text-slate-600">
                    {formatPercent(row.appliedRate, 4)}
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-slate-900">
                    {formatSGDCents(row.monthlyPayment)}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-700">
                    {formatSGDCents(row.principalPaid)}
                  </td>
                  <td className="py-2 px-3 text-right text-amber-700">
                    {formatSGDCents(row.interestPaid)}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-slate-900">
                    {formatSGDCents(row.remainingBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination for monthly view */}
      {viewMode === 'monthly' && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs">
          <span className="text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
