/** Compatibility adapters for the earlier simplified interfaces; current public forms use the detailed engines. */
import {
  calculateFactoring,
  calculateLease,
  financingAssumptions,
  factoringDefaults,
  getLeaseDefaults,
  type FactoringMode,
  type FactoringResult,
  type LeaseAsset,
  type LeaseKind,
  type LeaseResult,
} from './financing-simulation.ts';

export interface RevolvingDrawEstimateInput {
  amount: number;
  days: number;
}

/** Date-free payment references use 30-day periods; actual calendar payments may vary. */
export const revolvingEstimateAssumptions = { paymentPeriodDays: 30 } as const;

export interface RevolvingDrawEstimate {
  amount: number;
  days: number;
  interest: number;
  interestVat: number;
  interestWithVat: number;
  paymentPeriodDays: number;
  /** Interest and IVA for a reference month; no principal amortization or insurance. */
  monthlyPayment: number;
  /** Complete reference periods paid before the final capital settlement. */
  regularPaymentCount: number;
  finalPeriodDays: number;
  finalInterestWithVat: number;
  /** Full principal plus interest and IVA for the last 1–30 days. */
  finalPayment: number;
  /** Opening and disposition charges include IVA and are paid separately at the start. */
  openingFee: number;
  drawFee: number;
  initialCharges: number;
  /** Capital plus interest, IVA and initial charges; excludes unconfirmed insurance. */
  total: number;
}

export interface LeaseEstimateInput {
  kind: LeaseKind;
  asset?: LeaseAsset;
  value: number;
  months: number;
  advance?: number;
}

export interface FactoringOperationEstimateInput {
  mode: FactoringMode;
  amount: number;
  days: number;
}

function wholePesos(value: number, label: string, allowZero = false): void {
  if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1) || value > financingAssumptions.maxAmount) {
    throw new RangeError(`Revisa ${label}: indica pesos enteros ${allowZero ? 'desde cero' : 'mayores que cero'}, hasta $1,000,000,000,000.`);
  }
}

/** Full disposition, 30-day payment references and final capital settlement; no dates or insurance. */
export function estimateRevolvingDraw({ amount, days }: RevolvingDrawEstimateInput): RevolvingDrawEstimate {
  wholePesos(amount, 'el monto de la disposición');
  if (!Number.isInteger(days) || days < 60 || days > 360) {
    throw new RangeError('Revisa los días de la disposición: indica un entero de 60 a 360.');
  }
  const assumptions = financingAssumptions.revolving;
  const vatRate = financingAssumptions.vatRate;
  const interest = amount * assumptions.annualRate * days / 360;
  const interestVat = interest * vatRate;
  const interestWithVat = interest + interestVat;
  const { paymentPeriodDays } = revolvingEstimateAssumptions;
  const monthlyPayment = amount * assumptions.annualRate * paymentPeriodDays / 360 * (1 + vatRate);
  const regularPaymentCount = Math.ceil(days / paymentPeriodDays) - 1;
  const finalPeriodDays = days - regularPaymentCount * paymentPeriodDays;
  const finalInterestWithVat = interestWithVat - regularPaymentCount * monthlyPayment;
  const finalPayment = amount + finalInterestWithVat;
  const openingFee = amount * assumptions.openingFeeRate * (1 + vatRate);
  const drawFee = amount * assumptions.drawFeeRate * (1 + vatRate);
  const initialCharges = openingFee + drawFee;
  return {
    amount, days, interest, interestVat, interestWithVat,
    paymentPeriodDays, monthlyPayment, regularPaymentCount, finalPeriodDays, finalInterestWithVat, finalPayment,
    openingFee, drawFee, initialCharges, total: amount + interestWithVat + initialCharges,
  };
}

/** Public scenario: source residual assumptions, without insurance or services. */
export function estimateLease({ kind, asset = 'vehicle', value, months, advance = 0 }: LeaseEstimateInput): LeaseResult {
  wholePesos(value, 'el valor del bien');
  wholePesos(advance, 'el anticipo', true);
  return calculateLease({ ...getLeaseDefaults(kind, asset), value, months, advance });
}

/** Each modality is independent; the modeled line equals the invoices, not an approved limit. */
export function estimateFactoringOperation({ mode, amount, days }: FactoringOperationEstimateInput): FactoringResult {
  wholePesos(amount, 'el valor de las facturas');
  return calculateFactoring({
    mode,
    amount,
    days,
    line: amount,
    includeOpening: factoringDefaults.includeOpening,
    advancePercent: factoringDefaults.advancePercent,
    administrationCount: factoringDefaults.administrationCount,
    expenses: factoringDefaults.expenses,
  });
}
