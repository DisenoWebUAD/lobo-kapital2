/** Reference assumptions extracted from the source; these are not contractual terms. */
export const loanSimulations = {
  personal: {
    amount: { min: 30_000, max: 200_000, initial: 200_000, dragStep: 1_000, pageStep: 10_000 },
    term: { options: [12, 18, 24], initial: 12 },
    annualRate: 0.48,
    openingFeeRate: 0.03,
    vatRate: 0.16,
  },
  business: {
    // The source calculator models only a simple loan with a mortgage guarantee.
    amount: { min: 250_000, max: 10_150_000, initial: 1_000_000, dragStep: 10_000, pageStep: 100_000 },
    term: { options: [12, 18, 24, 36], initial: 36 },
    annualRate: 0.30,
    openingFeeRate: 0.025,
    vatRate: 0.16,
  },
} as const;

export type LoanProduct = keyof typeof loanSimulations;

export interface LoanInput {
  amount: number;
  termMonths: number;
  /** Excluded by default. Explicit values are retained only to audit source examples. */
  totalInsurance?: number;
}

/** Keep full precision until presentation; opening fees are outside the monthly payment. */
export function calculateLoan(product: LoanProduct, {
  amount,
  termMonths,
  totalInsurance = 0,
}: LoanInput) {
  const config = loanSimulations[product];

  if (!Number.isFinite(amount) || amount < config.amount.min || amount > config.amount.max) {
    throw new RangeError('El monto está fuera del rango del crédito.');
  }
  if (!Number.isFinite(termMonths) || !config.term.options.some((months) => months === termMonths)) {
    throw new RangeError('Selecciona uno de los plazos disponibles para este crédito.');
  }
  if (!Number.isFinite(totalInsurance) || totalInsurance < 0) {
    throw new RangeError('El seguro total debe ser un importe no negativo.');
  }

  const monthlyRate = (config.annualRate / 12) * (1 + config.vatRate);
  const creditPayment = (amount * monthlyRate) / -Math.expm1(-termMonths * Math.log1p(monthlyRate));
  const monthlyInsurance = totalInsurance / termMonths;

  return {
    monthlyPayment: creditPayment + monthlyInsurance,
    openingFee: amount * config.openingFeeRate * (1 + config.vatRate),
    creditPayment,
    monthlyInsurance,
  };
}
