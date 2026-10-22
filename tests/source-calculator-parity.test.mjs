import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateLoan } from '../src/lib/loan-simulation.ts';

// Values read from the live source calculator UI on 2026-10-21, not derived from this implementation.
// Sources: https://www.lobokapital.mx/credito-personal and /credito-empresarial.
const loanCases = [
  ['personal', 200000, 12, 12000, '23109.25', '6960.00'],
  ['personal', 200000, 12, 0, '22109.25', '6960.00'],
  ['personal', 30000, 24, 0, '2098.63', '1044.00'],
  ['personal', 100001, 18, 4500, '8565.78', '3480.03'],
  ['personal', 75000.45, 24, 12000.67, '5746.62', '2610.02'],
  ['business', 1000000, 36, 12000, '45456.25', '29000.00'],
  ['business', 1000000, 36, 0, '45122.92', '29000.00'],
  ['business', 250000, 12, 0, '24965.83', '7250.00'],
  ['business', 10150000, 36, 0, '457997.64', '294350.00'],
  ['business', 1500000.45, 24, 12000.67, '88119.80', '43500.01'],
];

test('matches live-source personal and business monthly payments and separate opening fees to the cent', () => {
  for (const [product, amount, termMonths, totalInsurance, monthlyPayment, openingFee] of loanCases) {
    const result = calculateLoan(product, { amount, termMonths, totalInsurance });
    const label = `${product}: ${amount}, ${termMonths} months, insurance ${totalInsurance}`;
    assert.equal(result.monthlyPayment.toFixed(2), monthlyPayment, label);
    assert.equal(result.openingFee.toFixed(2), openingFee, label);
  }
});
