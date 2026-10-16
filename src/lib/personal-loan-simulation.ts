import { calculateLoan, loanSimulations, type LoanInput } from './loan-simulation.ts';

export const personalLoanSimulation = loanSimulations.personal;
export type PersonalLoanInput = LoanInput;

export function calculatePersonalLoan(input: PersonalLoanInput) {
  return calculateLoan('personal', input);
}
