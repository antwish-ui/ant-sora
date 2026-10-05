/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SoraRateRecord, LoanParams, DataSourceStatus } from './types/sora';
import { FALLBACK_MAS_SORA_DATA, getLatestSoraRecord } from './data/masSoraDataset';
import { fetchMasSoraRates } from './services/masApiService';
import { calculateAmortization, exportAmortizationCSV } from './utils/soraMath';
import { TopNav } from './components/TopNav';
import { MasRateTicker } from './components/MasRateTicker';
import { LoanCalculatorForm } from './components/LoanCalculatorForm';
import { CalculationSummary } from './components/CalculationSummary';
import { AmortizationTable } from './components/AmortizationTable';
import { DailyCompoundingPlayground } from './components/DailyCompoundingPlayground';
import { MasRatesExplorer } from './components/MasRatesExplorer';
import { RegulatoryStressTest } from './components/RegulatoryStressTest';
import { PackageComparison } from './components/PackageComparison';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('calculator');
  const [records, setRecords] = useState<SoraRateRecord[]>(FALLBACK_MAS_SORA_DATA);
  const [dataStatus, setDataStatus] = useState<DataSourceStatus>({
    source: 'cached_mas_dataset',
    lastUpdated: '09:00 SGT (MAS Published)',
    recordCount: FALLBACK_MAS_SORA_DATA.length,
    isLoading: true,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [customCompoundedRate, setCustomCompoundedRate] = useState<number | null>(null);

  // Loan Configuration Defaults typical for a Singapore property loan
  const [loanParams, setLoanParams] = useState<LoanParams>({
    loanAmount: 800000,
    tenureYears: 25,
    packageType: '3m',
    customRate: 3.518,
    bankMargin: 0.7,
    isSteppedMargin: false,
    marginTiers: {
      year1: 0.65,
      year2: 0.75,
      year3: 0.85,
      thereafter: 1.0,
    },
    floorRate: 0.0,
    repaymentType: 'amortizing',
  });

  // Fetch rates on mount
  const loadRates = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetchMasSoraRates();
      if (res.records && res.records.length > 0) {
        setRecords(res.records);
      }
      setDataStatus(res.status);
    } catch {
      // Graceful fallback already handled by service
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const latestRecord = useMemo(() => {
    return getLatestSoraRecord(records);
  }, [records]);

  // Determine active benchmark rate
  const activeBenchmarkRate = useMemo(() => {
    switch (loanParams.packageType) {
      case '1m':
        return latestRecord.soraCompounded1m;
      case '3m':
        return latestRecord.soraCompounded3m;
      case '6m':
        return latestRecord.soraCompounded6m;
      case 'custom':
        return customCompoundedRate ?? loanParams.customRate;
      default:
        return latestRecord.soraCompounded3m;
    }
  }, [loanParams.packageType, loanParams.customRate, latestRecord, customCompoundedRate]);

  // Reactive calculation result
  const calculationResult = useMemo(() => {
    return calculateAmortization(loanParams, activeBenchmarkRate);
  }, [loanParams, activeBenchmarkRate]);

  const handleExportCsv = () => {
    exportAmortizationCSV(
      calculationResult.monthlySchedule,
      loanParams.loanAmount,
      calculationResult.effectiveRate
    );
  };

  const handleApplyCustomRate = (rate: number) => {
    setCustomCompoundedRate(rate);
    setLoanParams((prev) => ({
      ...prev,
      packageType: 'custom',
      customRate: rate,
    }));
    setActiveTab('calculator');
  };

  const handleSelectRateFromExplorer = (rate: number) => {
    setCustomCompoundedRate(rate);
    setLoanParams((prev) => ({
      ...prev,
      packageType: 'custom',
      customRate: rate,
    }));
    setActiveTab('calculator');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 3-Zone Top Navigation */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportCsv={handleExportCsv}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        onRefreshRates={loadRates}
        isRefreshing={isRefreshing}
      />

      {/* MAS Benchmark Rate Ticker */}
      <MasRateTicker
        latestRecord={latestRecord}
        status={dataStatus}
        selectedPackage={loanParams.packageType}
        onSelectPackage={(pkg) => {
          setLoanParams((prev) => ({ ...prev, packageType: pkg }));
          setActiveTab('calculator');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Loan Calculator Tab */}
        {activeTab === 'calculator' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Input Form (5 cols on lg) */}
              <div className="lg:col-span-6">
                <LoanCalculatorForm
                  params={loanParams}
                  setParams={setLoanParams}
                  latestRates={latestRecord}
                  customCompoundedRate={customCompoundedRate}
                />
              </div>

              {/* Right Column: Repayment Summary (7 cols on lg) */}
              <div className="lg:col-span-6">
                <CalculationSummary
                  result={calculationResult}
                  params={loanParams}
                  benchmarkRate={activeBenchmarkRate}
                  onViewSchedule={() => {
                    const el = document.getElementById('amortization-schedule-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onViewStressTest={() => setActiveTab('stress-test')}
                />
              </div>
            </div>

            {/* Amortization Table */}
            <div id="amortization-schedule-section">
              <AmortizationTable result={calculationResult} params={loanParams} />
            </div>
          </div>
        )}

        {/* MAS Compounding Engine Tab */}
        {activeTab === 'compounding' && (
          <DailyCompoundingPlayground
            records={records}
            onApplyRateToCalculator={handleApplyCustomRate}
          />
        )}

        {/* MAS Rates Explorer Tab */}
        {activeTab === 'rates' && (
          <MasRatesExplorer
            records={records}
            onSelectRate={handleSelectRateFromExplorer}
          />
        )}

        {/* MAS TDSR Stress Test Tab */}
        {activeTab === 'stress-test' && (
          <RegulatoryStressTest
            params={loanParams}
            effectiveRate={calculationResult.effectiveRate}
          />
        )}

        {/* Package Comparison Tab */}
        {activeTab === 'comparison' && (
          <PackageComparison
            baseParams={loanParams}
            latestRates={latestRecord}
          />
        )}
      </main>

      {/* Developer Backend Integration Modal */}
      <BackendIntegrationModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        onEndpointSaved={() => {
          setIsBackendModalOpen(false);
          loadRates();
        }}
      />

      {/* Clean Editorial Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="font-semibold text-slate-800 text-sm mb-1.5">
                Singapore SORA Calculator
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Engineered for Singapore homeowners, mortgage brokers, and financial analysts to calculate exact loan repayments using official Monetary Authority of Singapore (MAS) published benchmarks.
              </p>
            </div>

            <div>
              <div className="font-semibold text-slate-800 text-sm mb-1.5">
                Financial Methodologies
              </div>
              <div className="space-y-1 text-[11px] text-slate-500">
                <p>MAS Compounded SORA Standard Product Formula</p>
                <p>Actuarial Monthly Compound Amortization</p>
                <p>MAS Notice 645 TDSR 55% Regulatory Compliance</p>
              </div>
            </div>

            <div>
              <div className="font-semibold text-slate-800 text-sm mb-1.5">
                Data & API Connectivity
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Integrated with the official MAS open datastore API. Ready for direct backend proxy attachment via the Developer Setup panel.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
            <div>
              &copy; {new Date().getFullYear()} Singapore SORA Mortgage Calculator · For financial planning and simulation purposes.
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span>MAS Notice 645</span>
              <span aria-hidden="true">·</span>
              <span>Volume-Weighted SORA</span>
              <span aria-hidden="true">·</span>
              <span>SingDollar SGD</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
