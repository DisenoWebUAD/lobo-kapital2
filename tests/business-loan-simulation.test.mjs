import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateLoan, loanSimulations } from '../src/lib/loan-simulation.ts';

test('estimates the initial mortgage scenario without unconfirmed insurance', () => {
  const config = loanSimulations.business;
  const result = calculateLoan('business', { amount: config.amount.initial, termMonths: config.term.initial });
  assert.equal(config.amount.initial, 1_000_000);
  assert.equal(config.term.initial, 36);
  assert.equal(result.monthlyPayment.toFixed(2), '45122.92');
  assert.equal(result.openingFee.toFixed(2), '29000.00');
  assert.equal(result.monthlyInsurance, 0);
  assert.equal(result.monthlyPayment, result.creditPayment);
});

test('reproduces the archived mortgage example only when its insurance is explicitly supplied', () => {
  const result = calculateLoan('business', { amount: 1_000_000, termMonths: 36, totalInsurance: 12_000 });
  assert.equal(result.monthlyPayment.toFixed(2), '45456.25');
  assert.equal(result.openingFee.toFixed(2), '29000.00');
  assert.equal(result.monthlyInsurance, 12_000 / 36);
});

test('amortizes both business amount limits for all four available terms', () => {
  assert.deepEqual(loanSimulations.business.term.options, [12, 18, 24, 36]);
  const monthlyRate = (0.30 / 12) * 1.16;
  for (const amount of [250_000, 10_150_000]) {
    for (const termMonths of loanSimulations.business.term.options) {
      const result = calculateLoan('business', { amount, termMonths });
      let outstanding = amount;
      for (let month = 0; month < termMonths; month++) {
        outstanding = outstanding * (1 + monthlyRate) - result.creditPayment;
      }
      assert.ok(Math.abs(outstanding) < 0.000001, `Remaining principal: ${outstanding}`);
      assert.equal(result.openingFee, amount * 0.025 * 1.16);
    }
  }
});

test('retains full precision rather than rounding each monthly payment in the model', () => {
  const amount = 2_475_001;
  const termMonths = 18;
  const result = calculateLoan('business', { amount, termMonths });
  const monthlyRate = (0.30 / 12) * 1.16;
  const presentValue = Array.from({ length: termMonths }, (_, index) =>
    result.monthlyPayment / (1 + monthlyRate) ** (index + 1),
  ).reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(presentValue - amount) < 0.000001);
  assert.notEqual(result.monthlyPayment, Number(result.monthlyPayment.toFixed(2)));
});

test('enforces the business limits independently of the personal product', () => {
  for (const amount of [NaN, Infinity, -Infinity, 0, -1, 200_000, 249_999.99, 10_150_000.01]) {
    assert.throws(() => calculateLoan('business', { amount, termMonths: 36 }), RangeError);
  }
  for (const termMonths of [NaN, Infinity, -Infinity, 0, 6, 12.5, 13, 30, 48]) {
    assert.throws(() => calculateLoan('business', { amount: 1_000_000, termMonths }), RangeError);
  }
  for (const totalInsurance of [NaN, Infinity, -Infinity, -0.01]) {
    assert.throws(() => calculateLoan('business', { amount: 1_000_000, termMonths: 36, totalInsurance }), RangeError);
  }
});
