export interface SoraRateRecord {
  date: string; // YYYY-MM-DD
  sora: number; // Overnight rate (% p.a.)
  soraCompounded1m: number; // 1-Month Compounded SORA (% p.a.)
  soraCompounded3m: number; // 3-Month Compounded SORA (% p.a.)
  soraCompounded6m: number; // 6-Month Compounded SORA (% p.a.)
  soraIndex: number; // Published MAS SORA Index
  volumeSgdMillion?: number; // Volume in SGD Millions
}

export type SoraPackageType = '3m' | '1m' | '6m' | 'custom';

export interface MarginTiers {
  year1: number;
  year2: number;
  year3: number;
  thereafter: number;
}

export interface LoanParams {
  loanAmount: number;
  tenureYears: number;
  packageType: SoraPackageType;
  customRate: number; // Used if custom or manual override
  bankMargin: number; // Flat margin (% p.a.)
  isSteppedMargin: boolean;
  marginTiers: MarginTiers;
  floorRate: number; // Minimum rate floor if any
  repaymentType: 'amortizing' | 'interest_only';
}

export interface AmortizationRow {
  month: number;
  year: number;
  monthlyPayment: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  appliedRate: number;
}

export interface AnnualAmortizationRow {
  year: number;
  annualPayment: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
  averageRate: number;
}

export interface CalculationResult {
  effectiveRate: number; // Benchmark + Margin
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  firstYearInterest: number;
  firstYearPrincipal: number;
  monthlySchedule: AmortizationRow[];
  annualSchedule: AnnualAmortizationRow[];
}

export interface SensitivityScenario {
  label: string;
  rateDelta: number;
  effectiveRate: number;
  monthlyPayment: number;
  monthlyDifference: number;
  totalInterest: number;
  isMasStressTest?: boolean;
}

export interface DailyCompoundingItem {
  date: string;
  dayOfWeek: string;
  soraRate: number;
  calendarDaysWeight: number; // n_i
  dailyFactor: number; // (1 + r_i * n_i / 365)
  cumulativeProduct: number;
}

export interface CompoundingCalculationResult {
  startDate: string;
  endDate: string;
  calendarDays: number;
  businessDays: number;
  compoundedAnnualRate: number;
  items: DailyCompoundingItem[];
}

export interface DataSourceStatus {
  source: 'live_mas_api' | 'cached_mas_dataset' | 'custom_proxy';
  lastUpdated: string;
  recordCount: number;
  isLoading: boolean;
  error?: string;
  proxyEndpoint?: string;
}
