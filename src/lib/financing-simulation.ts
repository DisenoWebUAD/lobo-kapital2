/** Illustrative assumptions from the source calculators, never contractual pricing or a CAT. */
export const financingAssumptions = {
  vatRate: 0.16,
  maxAmount: 1_000_000_000_000,
  revolving: { annualRate: 0.36, openingFeeRate: 0.025, drawFeeRate: 0.01, lineMonths: [12, 18, 24, 30, 36] },
  lease: { annualRate: 0.36, openingFeeRate: 0.025, annualAdministration: 2_500 },
  factoring: { annualRate: { 'with-recourse': 0.30, 'without-recourse': 0.36 }, openingFeeRate: 0.015, operationFeeRate: 0.01, administration: 2_500, maxDays: 3_600, maxAdministrationCount: 1_000_000_000_000 },
} as const;

export interface RevolvingInput {
  amount: number;
  line: number;
  days: number;
  startDate: string;
  lineMonths: number;
  /** Annual premium supplied by the visitor; zero excludes unconfirmed insurance. */
  annualInsurance: number;
}

export interface RevolvingScheduleRow {
  date: string;
  days: number;
  interest: number;
  vat: number;
  principal: number;
  insurance: number;
  total: number;
  balance: number;
}

/** Calendar-month rollup used by the original calculator's displayed payments. */
export interface RevolvingMonthlyPayment {
  month: string;
  interest: number;
  vat: number;
  principal: number;
  insurance: number;
  total: number;
}

export interface RevolvingResult {
  openingFee: number;
  drawFee: number;
  initialPayment: number;
  interest: number;
  interestVat: number;
  insurance: number;
  total: number;
  totalPayments: number;
  maturityDate: string;
  monthlyInsurance: number;
  schedule: RevolvingScheduleRow[];
  monthlyPayments: RevolvingMonthlyPayment[];
}

export const revolvingDefaults: Readonly<RevolvingInput> = {
  amount: 500_000,
  line: 1_000_000,
  days: 120,
  startDate: '',
  lineMonths: 24,
  annualInsurance: 0,
};

export type LeaseKind = 'pure' | 'finance';
export type LeaseAsset = 'vehicle' | 'machinery';

export interface LeaseInput {
  kind: LeaseKind;
  asset: LeaseAsset;
  value: number;
  months: number;
  advance: number;
  residualPercent: number;
  /** Monthly amounts: before IVA except in financial machinery leasing, where they are final. */
  insurance: number;
  services: number;
}

export interface LeaseScheduleRow {
  month: number;
  baseRent: number;
  vat: number;
  insurance: number;
  services: number;
  administration: number;
  advance: number;
  openingFee: number;
  total: number;
}

export interface LeaseResult {
  baseRent: number;
  /** IVA on the rent alone; monthlyVat also includes IVA on eligible extras. */
  rentVat: number;
  extrasVat: number;
  monthlyVat: number;
  monthlyInsurance: number;
  monthlyServices: number;
  monthlyPayment: number;
  openingFee: number;
  initialPayment: number;
  administrationTotal: number;
  terminalPayment: number;
  totalWithoutPurchase: number;
  totalWithPurchase: number;
  residual: number;
  financedAmount: number;
  schedule: LeaseScheduleRow[];
}

export function getLeaseDefaults(kind: LeaseKind, asset: LeaseAsset = 'vehicle'): LeaseInput {
  return {
    kind,
    asset,
    value: 1_000_000,
    months: 36,
    advance: 0,
    residualPercent: kind === 'pure' ? 0 : asset === 'vehicle' ? 10 : 1,
    insurance: 0,
    services: 0,
  };
}

export const leaseDefaults = getLeaseDefaults;

export type FactoringMode = 'with-recourse' | 'without-recourse';

export interface FactoringInput {
  mode: FactoringMode;
  amount: number;
  days: number;
  line: number;
  includeOpening: boolean;
  advancePercent: number;
  administrationCount: number;
  expenses: number;
}

export interface FactoringResult {
  advance: number;
  discount: number;
  openingFee: number;
  operationFee: number;
  administrationFee: number;
  expenses: number;
  vat: number;
  totalDeductions: number;
  netLiquidity: number;
  reserve: number;
}

export const factoringDefaults: Readonly<FactoringInput> = {
  mode: 'without-recourse',
  amount: 1_000_000,
  days: 60,
  line: 1_000_000,
  includeOpening: true,
  advancePercent: 90,
  administrationCount: 1,
  expenses: 0,
};

function money(value: number, label: string, allowZero = false): void {
  const cents = value * 100;
  const isCurrency = Number.isFinite(value) && Math.abs(cents - Math.round(cents)) <= Number.EPSILON * Math.max(1, Math.abs(cents)) * 2;
  if (!isCurrency || value < (allowZero ? 0 : 0.01) || value > financingAssumptions.maxAmount) {
    throw new RangeError(`Revisa ${label}: indica un importe ${allowZero ? 'desde cero' : 'de al menos $0.01'}, hasta $1,000,000,000,000 y con hasta dos decimales.`);
  }
}

function integer(value: number, min: number, max: number, label: string): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`Revisa ${label}: indica un entero de ${min} a ${max}.`);
  }
}

function percentage(value: number, min: number, label: string): void {
  if (!Number.isFinite(value) || value < min || value > 100) {
    throw new RangeError(`Revisa ${label}: indica un porcentaje de ${min} a 100.`);
  }
}

const DAY_MS = 86_400_000;

function parseCivilDate(value: string): number {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RangeError('Indica una fecha de disposición válida.');
  }
  const year = Number(value.slice(0, 4));
  const timestamp = new Date(`${value}T00:00:00.000Z`).getTime();
  // Leave room for the longest line to finish within a four-digit civil year.
  if (year < 1 || year > 9_996 || !Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) {
    throw new RangeError('Indica una fecha de disposición válida, entre los años 0001 y 9996.');
  }
  return timestamp / DAY_MS;
}

function dateFromParts(year: number, month: number, day: number): number {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month, day);
  return date.getTime() / DAY_MS;
}

function monthAnchor(startDay: number, months: number): number {
  const start = new Date(startDay * DAY_MS);
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth() + months;
  const lastDay = new Date(dateFromParts(year, month + 1, 0) * DAY_MS).getUTCDate();
  return dateFromParts(year, month, Math.min(start.getUTCDate(), lastDay));
}

function civilDate(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** One disposition, daily simple interest (360-day basis), with capital returned at maturity. */
export function calculateRevolvingCredit(input: RevolvingInput): RevolvingResult {
  const { amount, line, days, startDate, lineMonths, annualInsurance } = input;
  const assumptions = financingAssumptions.revolving;
  const vatRate = financingAssumptions.vatRate;
  money(amount, 'el monto de la disposición');
  money(line, 'el importe de la línea');
  money(annualInsurance, 'el seguro anual', true);
  integer(days, 60, 360, 'los días de la disposición');
  if (!assumptions.lineMonths.some((months) => months === lineMonths)) {
    throw new RangeError('Selecciona una vigencia de línea de 12, 18, 24, 30 o 36 meses.');
  }
  if (amount > line) throw new RangeError('La disposición no puede superar la línea de crédito.');
  const start = parseCivilDate(startDate);
  const maturity = start + days;
  if (maturity > monthAnchor(start, lineMonths)) {
    throw new RangeError('La disposición no puede vencer después de la vigencia de la línea.');
  }

  const openingFee = line * assumptions.openingFeeRate * (1 + vatRate);
  const drawFee = amount * assumptions.drawFeeRate * (1 + vatRate);
  const initialPayment = openingFee + drawFee;
  const interest = amount * assumptions.annualRate * days / 360;
  const interestVat = interest * vatRate;
  const monthlyInsurance = annualInsurance / 12;
  const insurance = monthlyInsurance * lineMonths;
  const totalPayments = amount + interest + interestVat + insurance;

  // Preserve the source model's period count, including its explicit overlap rejection.
  // A 60-day disposition has two interest events even when two month anchors fall before maturity.
  const interestEvents: { day: number; days: number; interest: number; principal: number }[] = [];
  const periods = Math.ceil(days / 30);
  let previousInterestDate = start;
  for (let period = 1; period <= periods; period += 1) {
    const day = period === periods ? maturity : monthAnchor(start, period);
    if (day <= previousInterestDate) {
      throw new RangeError('El plazo genera fechas superpuestas en el modelo; solicita revisión del calendario.');
    }
    const elapsedDays = day - previousInterestDate;
    interestEvents.push({ day, days: elapsedDays, interest: amount * assumptions.annualRate * elapsedDays / 360, principal: period === periods ? amount : 0 });
    previousInterestDate = day;
  }

  const events = new Map<number, { days: number; interest: number; principal: number; insurance: number }>();
  const event = (day: number) => {
    const current = events.get(day) ?? { days: 0, interest: 0, principal: 0, insurance: 0 };
    events.set(day, current);
    return current;
  };
  for (const entry of interestEvents) Object.assign(event(entry.day), entry);
  for (let month = 1; month <= lineMonths; month += 1) {
    if (monthlyInsurance > 0) event(monthAnchor(start, month)).insurance += monthlyInsurance;
  }
  const schedule = [...events.entries()].sort(([a], [b]) => a - b).map(([day, entry]): RevolvingScheduleRow => {
    const vat = entry.interest * vatRate;
    return {
      date: civilDate(day),
      days: entry.days,
      interest: entry.interest,
      vat,
      principal: entry.principal,
      insurance: entry.insurance,
      total: entry.interest + vat + entry.principal + entry.insurance,
      balance: day < maturity ? amount : 0,
    };
  });
  const monthlyPayments = Array.from({ length: lineMonths }, (_, index): RevolvingMonthlyPayment => {
    const anchor = new Date(monthAnchor(start, index + 1) * DAY_MS);
    const monthStart = dateFromParts(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1);
    const monthEnd = dateFromParts(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1);
    const entries = interestEvents.filter(entry => entry.day >= monthStart && entry.day < monthEnd);
    const monthlyInterest = entries.reduce((sum, entry) => sum + entry.interest, 0);
    const principal = entries.reduce((sum, entry) => sum + entry.principal, 0);
    return {
      month: civilDate(monthStart).slice(0, 7),
      interest: monthlyInterest,
      vat: monthlyInterest * vatRate,
      principal,
      insurance: monthlyInsurance,
      total: monthlyInsurance + entries.reduce((sum, entry) => sum + entry.principal + entry.interest * (1 + vatRate), 0),
    };
  });

  return { openingFee, drawFee, initialPayment, interest, interestVat, insurance, total: initialPayment + totalPayments, totalPayments, maturityDate: civilDate(maturity), monthlyInsurance, schedule, monthlyPayments };
}

/** Monthly annuity with residual; initial charges and an optional financial purchase stay separate. */
export function calculateLease(input: LeaseInput): LeaseResult {
  const { kind, asset, value, months, advance, residualPercent, insurance, services } = input;
  if (kind !== 'pure' && kind !== 'finance') throw new RangeError('Selecciona una modalidad de arrendamiento válida.');
  if (asset !== 'vehicle' && asset !== 'machinery') throw new RangeError('Selecciona un tipo de activo válido.');
  money(value, 'el valor del bien');
  money(advance, 'el anticipo', true);
  money(insurance, 'el seguro mensual', true);
  money(services, 'los servicios mensuales', true);
  percentage(residualPercent, 0, 'el valor residual');
  integer(months, kind === 'pure' ? 18 : 1, kind === 'pure' ? 36 : asset === 'vehicle' ? 120 : 60, 'el plazo en meses');
  if (kind === 'pure' && advance !== 0) throw new RangeError('El modelo de arrendamiento puro no descuenta un anticipo de la renta.');
  if (advance >= value) throw new RangeError('El anticipo debe ser menor que el valor del bien.');
  const financedAmount = value - advance;
  const residual = value * residualPercent / 100;
  if (residual > financedAmount) throw new RangeError('El valor residual no puede superar el monto financiado.');

  const assumptions = financingAssumptions.lease;
  const vatRate = financingAssumptions.vatRate;
  const monthlyRate = assumptions.annualRate / 12;
  const baseRent = monthlyRate * (financedAmount + (financedAmount - residual) / Math.expm1(months * Math.log1p(monthlyRate)));
  const rentVat = baseRent * vatRate;
  const financialMachinery = kind === 'finance' && asset === 'machinery';
  const extrasVat = financialMachinery ? 0 : (insurance + services) * vatRate;
  const monthlyVat = rentVat + extrasVat;
  const monthlyPayment = baseRent + monthlyVat + insurance + services;
  const openingFee = value * assumptions.openingFeeRate * (1 + vatRate);
  const annualAdministration = financialMachinery ? assumptions.annualAdministration * (1 + vatRate) : 0;
  const initialPayment = advance + openingFee + annualAdministration;
  const terminalPayment = kind === 'finance' ? residual * (1 + vatRate) : 0;
  const schedule: LeaseScheduleRow[] = [{ month: 0, baseRent: 0, vat: 0, insurance: 0, services: 0, administration: annualAdministration, advance, openingFee, total: initialPayment }];
  for (let month = 1; month <= months; month += 1) {
    const administration = month % 12 === 0 && month < months ? annualAdministration : 0;
    schedule.push({ month, baseRent, vat: monthlyVat, insurance, services, administration, advance: 0, openingFee: 0, total: monthlyPayment + administration });
  }
  const administrationTotal = annualAdministration * Math.ceil(months / 12);
  const totalWithoutPurchase = initialPayment + months * monthlyPayment + administrationTotal - annualAdministration;
  return { baseRent, rentVat, extrasVat, monthlyVat, monthlyInsurance: insurance, monthlyServices: services, monthlyPayment, openingFee, initialPayment, administrationTotal, terminalPayment, totalWithoutPurchase, totalWithPurchase: totalWithoutPurchase + terminalPayment, residual, financedAmount, schedule };
}

/** Discount and fees are deducted from the advance; the reserve is conditional on collection. */
export function calculateFactoring(input: FactoringInput): FactoringResult {
  const { mode, amount, days, line, includeOpening, advancePercent, administrationCount, expenses } = input;
  const assumptions = financingAssumptions.factoring;
  if (mode !== 'with-recourse' && mode !== 'without-recourse') throw new RangeError('Selecciona una modalidad de factoraje válida.');
  if (typeof includeOpening !== 'boolean') throw new RangeError('Indica si el escenario incluye apertura.');
  money(amount, 'el valor de las facturas');
  money(line, 'el importe de la línea', !includeOpening);
  money(expenses, 'los gastos externos', true);
  integer(days, 1, assumptions.maxDays, 'los días hasta el cobro');
  integer(administrationCount, 0, assumptions.maxAdministrationCount, 'el número de cargos de administración');
  percentage(advancePercent, 0.01, 'el porcentaje de anticipo');

  const advance = amount * advancePercent / 100;
  const discount = advance * assumptions.annualRate[mode] * days / 360;
  const openingFee = includeOpening ? line * assumptions.openingFeeRate : 0;
  const operationFee = amount * assumptions.operationFeeRate;
  const administrationFee = administrationCount * assumptions.administration;
  const deductionsBeforeVat = discount + openingFee + operationFee + administrationFee + expenses;
  const vat = deductionsBeforeVat * financingAssumptions.vatRate;
  const totalDeductions = deductionsBeforeVat + vat;
  const netLiquidity = advance - totalDeductions;
  if (netLiquidity <= 0) throw new RangeError('Los cargos igualan o superan el anticipo. Solicita revisión de la operación.');
  return { advance, discount, openingFee, operationFee, administrationFee, expenses, vat, totalDeductions, netLiquidity, reserve: amount - advance };
}
