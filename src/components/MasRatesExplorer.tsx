import React, { useState, useMemo } from 'react';
import { SoraRateRecord } from '../types/sora';
import { formatPercent } from '../utils/soraMath';
import { Search, LineChart, Database, ArrowUpDown } from 'lucide-react';

interface MasRatesExplorerProps {
  records: SoraRateRecord[];
  onSelectRate: (rate: number, label: string) => void;
}

export const MasRatesExplorer: React.FC<MasRatesExplorerProps> = ({
  records,
  onSelectRate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<'all' | 'daily' | '1m' | '3m' | '6m'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<SoraRateRecord | null>(null);

  // Filter records based on search term
  const filteredRecords = useMemo(() => {
    return records.filter((r) => r.date.toLowerCase().includes(searchTerm.toLowerCase().trim()));
  }, [records, searchTerm]);

  // Chart data points (reverse to display oldest to newest left-to-right)
  const chartData = useMemo(() => {
    return [...records].reverse().slice(-40); // display last 40 business days
  }, [records]);

  // Compute min and max across all series for chart scaling
  const { minRate, maxRate } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    chartData.forEach((d) => {
      [d.sora, d.soraCompounded1m, d.soraCompounded3m, d.soraCompounded6m].forEach((val) => {
        if (val > 0) {
          if (val < min) min = val;
          if (val > max) max = val;
        }
      });
    });
    if (min === Infinity) return { minRate: 3.0, maxRate: 4.0 };
    return {
      minRate: Math.floor(min * 10) / 10 - 0.1,
      maxRate: Math.ceil(max * 10) / 10 + 0.1,
    };
  }, [chartData]);

  const range = maxRate - minRate || 1;

  const getCoordinates = (value: number, index: number, total: number) => {
    const x = (index / (total - 1 || 1)) * 100;
    const y = 90 - ((value - minRate) / range) * 80;
    return { x, y };
  };

  const createLinePath = (key: 'sora' | 'soraCompounded1m' | 'soraCompounded3m' | 'soraCompounded6m') => {
    return chartData
      .map((d, i) => {
        const { x, y } = getCoordinates(d[key], i, chartData.length);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs mt-6">
      <div className="border-b border-slate-200 pb-4 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">MAS SORA Benchmark Explorer</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical overnight rate prints and published 1M, 3M, and 6M compounded benchmarks
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedSeries('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedSeries === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Series
            </button>
            <button
              onClick={() => setSelectedSeries('3m')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedSeries === '3m'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3M Only
            </button>
            <button
              onClick={() => setSelectedSeries('1m')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedSeries === '1m'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1M Only
            </button>
            <button
              onClick={() => setSelectedSeries('daily')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedSeries === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily SORA
            </button>
          </div>
        </div>
      </div>

      {/* Interactive SORA SVG Chart */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-3">
          <div className="flex items-center gap-4">
            {(selectedSeries === 'all' || selectedSeries === 'daily') && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                <span className="text-slate-300">Daily Overnight SORA</span>
              </div>
            )}
            {(selectedSeries === 'all' || selectedSeries === '1m') && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400"></span>
                <span className="text-slate-300">1-Month Compounded</span>
              </div>
            )}
            {(selectedSeries === 'all' || selectedSeries === '3m') && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-emerald-400 font-semibold">3-Month Compounded (Benchmark)</span>
              </div>
            )}
            {selectedSeries === 'all' && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-slate-300">6-Month Compounded</span>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {hoveredPoint ? (
              <span className="text-white">
                {hoveredPoint.date}: 3M={formatPercent(hoveredPoint.soraCompounded3m, 3)} · SORA={formatPercent(hoveredPoint.sora, 3)}
              </span>
            ) : (
              <span>Hover chart for values</span>
            )}
          </div>
        </div>

        {/* SVG Container */}
        <div className="w-full h-44 sm:h-52 relative">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Grid horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const yVal = 90 - pct * 80;
              const rateVal = minRate + pct * range;
              return (
                <g key={pct}>
                  <line
                    x1="0"
                    y1={yVal}
                    x2="100"
                    y2={yVal}
                    stroke="#334155"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                  <text
                    x="1"
                    y={yVal - 2}
                    fill="#94a3b8"
                    fontSize="3"
                    className="font-mono tabular-nums"
                  >
                    {rateVal.toFixed(2)}%
                  </text>
                </g>
              );
            })}

            {/* Daily Overnight SORA */}
            {(selectedSeries === 'all' || selectedSeries === 'daily') && (
              <path
                d={createLinePath('sora')}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeOpacity="0.85"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* 1-Month Compounded */}
            {(selectedSeries === 'all' || selectedSeries === '1m') && (
              <path
                d={createLinePath('soraCompounded1m')}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="1.8"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* 3-Month Compounded (Hero line) */}
            {(selectedSeries === 'all' || selectedSeries === '3m') && (
              <path
                d={createLinePath('soraCompounded3m')}
                fill="none"
                stroke="#34d399"
                strokeWidth="2.8"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* 6-Month Compounded */}
            {selectedSeries === 'all' && (
              <path
                d={createLinePath('soraCompounded6m')}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1.5"
                strokeDasharray="3,2"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Invisible hover overlay rects */}
            {chartData.map((d, i) => {
              const xStart = ((i - 0.5) / (chartData.length - 1)) * 100;
              const colWidth = 100 / chartData.length;
              return (
                <rect
                  key={d.date}
                  x={Math.max(0, xStart)}
                  y="0"
                  width={colWidth}
                  height="100"
                  fill="transparent"
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="cursor-crosshair"
                />
              );
            })}
          </svg>
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-mono">
          <span>{chartData[0]?.date}</span>
          <span>{chartData[Math.floor(chartData.length / 2)]?.date}</span>
          <span>{chartData[chartData.length - 1]?.date} (Latest)</span>
        </div>
      </div>

      {/* Historical Data Table */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search date (e.g. 2026-09)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="text-xs text-slate-500">
            Showing {filteredRecords.length} records · Click any rate to load into calculator
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Overnight SORA</th>
                <th className="py-2.5 px-3 text-right">1M Compounded</th>
                <th className="py-2.5 px-3 text-right">3M Compounded</th>
                <th className="py-2.5 px-3 text-right">6M Compounded</th>
                <th className="py-2.5 px-3 text-right">SORA Index</th>
                <th className="py-2.5 px-3 text-right">Volume (SGD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {filteredRecords.map((r) => (
                <tr key={r.date} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 font-semibold text-slate-900 font-sans">{r.date}</td>
                  <td className="py-2 px-3 text-right text-sky-700 font-medium">
                    <button
                      onClick={() => onSelectRate(r.sora, `Overnight SORA (${r.date})`)}
                      className="hover:underline hover:text-sky-900"
                      title="Load into Calculator"
                    >
                      {formatPercent(r.sora, 4)}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-right text-violet-700">
                    <button
                      onClick={() => onSelectRate(r.soraCompounded1m, `1M SORA (${r.date})`)}
                      className="hover:underline hover:text-violet-900"
                      title="Load into Calculator"
                    >
                      {formatPercent(r.soraCompounded1m, 4)}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-700 font-bold">
                    <button
                      onClick={() => onSelectRate(r.soraCompounded3m, `3M SORA (${r.date})`)}
                      className="hover:underline hover:text-emerald-900"
                      title="Load into Calculator"
                    >
                      {formatPercent(r.soraCompounded3m, 4)}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-right text-amber-700">
                    <button
                      onClick={() => onSelectRate(r.soraCompounded6m, `6M SORA (${r.date})`)}
                      className="hover:underline hover:text-amber-900"
                      title="Load into Calculator"
                    >
                      {formatPercent(r.soraCompounded6m, 4)}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600">
                    {r.soraIndex.toFixed(6)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-500 font-sans">
                    {r.volumeSgdMillion ? `S$${r.volumeSgdMillion.toLocaleString()}M` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
