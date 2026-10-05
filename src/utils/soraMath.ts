import {
  LoanParams,
  CalculationResult,
  AmortizationRow,
  AnnualAmortizationRow,
  SensitivityScenario,
  DailyCompoundingItem,
  CompoundingCalculationResult,
  SoraRateRecord,
} from '../types/sora';

/**
 * Currency formatter for Singapore Dollars (SGD)
 */
export function formatSGD(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Decimal formatter for SGD with cents
 */
export function formatSGDCents(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Percentage formatter
 */
export function formatPercent(rate: number, decimals: number = 4): string {
  return `${rate.toFixed(decimals)}%`;
}

/**
 * Computes the monthly instalment for a given balance, annual interest rate, and remaining months.
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRatePct: number,
  remainingMonths: number,
  repaymentType: 'amortizing' | 'interest_only' = 'amortizing'
): number {
  if (principal <= 0 || remainingMonths <= 0) return 0;

  const monthlyRate = annualRatePct / 100 / 12;

  if (repaymentType === 'interest_only') {
    return principal * monthlyRate;
  }

  if (monthlyRate === 0) {
    return principal / remainingMonths;
  }

  const factor = Math.pow(1 + monthlyRate, remainingMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * Generates full monthly and annual amortization schedules.
 * Supports flat or stepped margins where interest recalculates each year.
 */
export function calculateAmortization(
  params: LoanParams,
  benchmarkRate: number
): CalculationResult {
  const totalMonths = params.tenureYears * 12;
  let remainingBalance = params.loanAmount;

  const monthlySchedule: AmortizationRow[] = [];
  const annualMap = new Map<
    number,
    {
      annualPayment: number;
      principalPaid: number;
      interestPaid: number;
      rateSum: number;
      endingBalance: number;
    }
  >();

  let totalInterest = 0;
  let totalPayment = 0;
  let firstYearInterest = 0;
  let firstYearPrincipal = 0;

  // Determine initial effective rate
  const initialMargin = params.isSteppedMargin
    ? params.marginTiers.year1
    : params.bankMargin;
  const initialEffectiveRate = Math.max(
    params.floorRate,
    benchmarkRate + initialMargin
  );

  let currentYearPayment = calculateMonthlyPayment(
    remainingBalance,
    initialEffectiveRate,
    totalMonths,
    params.repaymentType
  );

  for (let month = 1; month <= totalMonths; month++) {
    const year = Math.ceil(month / 12);
    const monthsRemaining = totalMonths - month + 1;

    // Determine margin for current year if stepped
    let activeMargin = params.bankMargin;
    if (params.isSteppedMargin) {
      if (year === 1) activeMargin = params.marginTiers.year1;
      else if (year === 2) activeMargin = params.marginTiers.year2;
      else if (year === 3) activeMargin = params.marginTiers.year3;
      else activeMargin = params.marginTiers.thereafter;
    }

    const appliedRate = Math.max(params.floorRate, benchmarkRate + activeMargin);

    // If starting a new year and stepped margin is active, recalculate monthly instalment
    if (params.isSteppedMargin && (month - 1) % 12 === 0) {
      currentYearPayment = calculateMonthlyPayment(
        remainingBalance,
        appliedRate,
        monthsRemaining,
        params.repaymentType
      );
    }

    const monthlyInterestRate = appliedRate / 100 / 12;
    const interestPayment = remainingBalance * monthlyInterestRate;

    let principalPayment = 0;
    let actualPayment = currentYearPayment;

    if (params.repaymentType === 'interest_only') {
      principalPayment = 0;
      actualPayment = interestPayment;
      // On the final month of interest-only, full principal is due
      if (month === totalMonths) {
        principalPayment = remainingBalance;
        actualPayment += remainingBalance;
      }
    } else {
      if (month === totalMonths) {
        // Last month cleanup to hit zero exactly
        principalPayment = remainingBalance;
        actualPayment = interestPayment + principalPayment;
      } else {
        principalPayment = Math.min(
          remainingBalance,
          actualPayment - interestPayment
        );
      }
    }

    remainingBalance = Math.max(0, remainingBalance - principalPayment);
    totalInterest += interestPayment;
    totalPayment += actualPayment;

    if (year === 1) {
      firstYearInterest += interestPayment;
      firstYearPrincipal += principalPayment;
    }

    monthlySchedule.push({
      month,
      year,
      monthlyPayment: actualPayment,
      principalPaid: principalPayment,
      interestPaid: interestPayment,
      remainingBalance,
      appliedRate,
    });

    // Accumulate annual data
    const existingAnnual = annualMap.get(year) || {
      annualPayment: 0,
      principalPaid: 0,
      interestPaid: 0,
      rateSum: 0,
      endingBalance: 0,
    };

    existingAnnual.annualPayment += actualPayment;
    existingAnnual.principalPaid += principalPayment;
    existingAnnual.interestPaid += interestPayment;
    existingAnnual.rateSum += appliedRate;
    existingAnnual.endingBalance = remainingBalance;
    annualMap.set(year, existingAnnual);
  }

  const annualSchedule: AnnualAmortizationRow[] = Array.from(
    annualMap.entries()
  ).map(([year, data]) => ({
    year,
    annualPayment: data.annualPayment,
    principalPaid: data.principalPaid,
    interestPaid: data.interestPaid,
    endingBalance: data.endingBalance,
    averageRate: data.rateSum / 12,
  }));

  const initialMonthlyPayment = monthlySchedule[0]?.monthlyPayment || 0;

  return {
    effectiveRate: initialEffectiveRate,
    monthlyPayment: initialMonthlyPayment,
    totalPayment,
    totalInterest,
    firstYearInterest,
    firstYearPrincipal,
    monthlySchedule,
    annualSchedule,
  };
}

/**
 * Calculates sensitivity / stress testing scenarios for MAS TDSR compliance and rate shocks.
 */
export function calculateSensitivityScenarios(
  loanAmount: number,
  tenureYears: number,
  baseRate: number,
  repaymentType: 'amortizing' | 'interest_only' = 'amortizing'
): SensitivityScenario[] {
  const months = tenureYears * 12;
  const basePayment = calculateMonthlyPayment(
    loanAmount,
    baseRate,
    months,
    repaymentType
  );

  const deltas = [-0.5, 0.0, 0.5, 1.0, 2.0];
  const scenarios: SensitivityScenario[] = deltas.map((delta) => {
    const rate = Math.max(0.1, baseRate + delta);
    const payment = calculateMonthlyPayment(
      loanAmount,
      rate,
      months,
      repaymentType
    );
    const totalInt =
      repaymentType === 'interest_only'
        ? loanAmount * (rate / 100) * tenureYears
        : payment * months - loanAmount;

    let label = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
    if (delta === 0) label = 'Current Effective';

    return {
      label,
      rateDelta: delta,
      effectiveRate: rate,
      monthlyPayment: payment,
      monthlyDifference: payment - basePayment,
      totalInterest: Math.max(0, totalInt),
    };
  });

  // Add MAS Regulatory TDSR 4.0% Floor Stress Test
  const masStressRate = 4.0;
  const masPayment = calculateMonthlyPayment(
    loanAmount,
    masStressRate,
    months,
    repaymentType
  );
  const masTotalInt =
    repaymentType === 'interest_only'
      ? loanAmount * (masStressRate / 100) * tenureYears
      : masPayment * months - loanAmount;

  scenarios.push({
    label: 'MAS 4.0% TDSR Stress Floor',
    rateDelta: masStressRate - baseRate,
    effectiveRate: masStressRate,
    monthlyPayment: masPayment,
    monthlyDifference: masPayment - basePayment,
    totalInterest: Math.max(0, masTotalInt),
    isMasStressTest: true,
  });

  return scenarios;
}

/**
 * MAS Compounded SORA Calculation from a list of historical SORA records
 * Formula:
 * Compounded SORA = [ Product_{i=1}^{d_b} (1 + (r_i * n_i) / 365) - 1 ] * (365 / d) * 100%
 */
export function calculateCustomCompoundedSora(
  records: SoraRateRecord[],
  startDateStr: string,
  endDateStr: string
): CompoundingCalculationResult {
  // Filter and sort records chronologically
  const filtered = records
    .filter((r) => r.date >= startDateStr && r.date <= endDateStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (filtered.length === 0) {
    return {
      startDate: startDateStr,
      endDate: endDateStr,
      calendarDays: 0,
      businessDays: 0,
      compoundedAnnualRate: 0,
      items: [],
    };
  }

  const items: DailyCompoundingItem[] = [];
  let product = 1.0;
  let totalCalendarDays = 0;

  for (let i = 0; i < filtered.length; i++) {
    const cur = filtered[i];
    const curDate = new Date(cur.date);
    const dayOfWeek = curDate.toLocaleDateString('en-SG', { weekday: 'short' });

    // Determine calendar days n_i for this business day
    let n_i = 1;
    if (i < filtered.length - 1) {
      const nextDate = new Date(filtered[i + 1].date);
      const diffTime = nextDate.getTime() - curDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      n_i = Math.max(1, diffDays);
    } else {
      // Last business day in observation window
      // If it's Friday, default weight is 3 days
      if (dayOfWeek === 'Fri') {
        n_i = 3;
      } else {
        n_i = 1;
      }
    }

    const r_i = cur.sora / 100;
    const factor = 1 + (r_i * n_i) / 365;
    product *= factor;
    totalCalendarDays += n_i;

    items.push({
      date: cur.date,
      dayOfWeek,
      soraRate: cur.sora,
      calendarDaysWeight: n_i,
      dailyFactor: factor,
      cumulativeProduct: product,
    });
  }

  const compoundedAnnualRate =
    totalCalendarDays > 0 ? (product - 1) * (365 / totalCalendarDays) * 100 : 0;

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    calendarDays: totalCalendarDays,
    businessDays: filtered.length,
    compoundedAnnualRate: Math.max(0, compoundedAnnualRate),
    items,
  };
}

/**
 * Exports amortization schedule to CSV
 */
export function exportAmortizationCSV(
  schedule: AmortizationRow[],
  loanAmount: number,
  effectiveRate: number
): void {
  const headers = [
    'Month',
    'Year',
    'Applied Rate (%)',
    'Monthly Payment (SGD)',
    'Principal Paid (SGD)',
    'Interest Paid (SGD)',
    'Remaining Balance (SGD)',
  ];

  const rows = schedule.map((row) => [
    row.month,
    row.year,
    row.appliedRate.toFixed(4),
    row.monthlyPayment.toFixed(2),
    row.principalPaid.toFixed(2),
    row.interestPaid.toFixed(2),
    row.remainingBalance.toFixed(2),
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute(
    'download',
    `SORA_Mortgage_Schedule_${Math.round(loanAmount)}_SGD_${effectiveRate.toFixed(2)}pct.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
