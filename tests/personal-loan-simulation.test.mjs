import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculatePersonalLoan,
  personalLoanSimulation,
} from '../src/lib/personal-loan-simulation.ts';

const example = {
  amount: 200_000,
  termMonths: 12,
  totalInsurance: 12_000,
};

test('excludes unconfirmed insurance when no premium is supplied', () => {
  const initial = calculatePersonalLoan({ amount: 200_000, termMonths: 12 });
  assert.equal(initial.monthlyPayment.toFixed(2), '22109.25');
  assert.equal(initial.monthlyPayment, initial.creditPayment);
  assert.equal(initial.monthlyInsurance, 0);
  assert.equal(initial.openingFee.toFixed(2), '6960.00');

  const extended = calculatePersonalLoan({ amount: 200_000, termMonths: 24 });
  assert.equal(extended.monthlyPayment.toFixed(2), '13990.84');
  assert.equal(extended.monthlyInsurance, 0);
});

test('reproduces the published personal-loan reference scenarios', () => {
  const initial = calculatePersonalLoan(example);
  assert.equal(initial.monthlyPayment.toFixed(2), '23109.25');
  assert.equal(initial.openingFee.toFixed(2), '6960.00');

  const extended = calculatePersonalLoan({ ...example, termMonths: 24 });
  assert.equal(extended.monthlyPayment.toFixed(2), '14490.84');
  assert.equal(extended.openingFee.toFixed(2), '6960.00');
});

test('keeps insurance outside amortization and opening outside the monthly payment', () => {
  const withoutInsurance = calculatePersonalLoan({ ...example, totalInsurance: 0 });
  const withInsurance = calculatePersonalLoan(example);

  assert.equal(withoutInsurance.monthlyInsurance, 0);
  assert.equal(withoutInsurance.monthlyPayment, withoutInsurance.creditPayment);
  assert.equal(withInsurance.monthlyInsurance, 1_000);
  assert.equal(withInsurance.creditPayment, withoutInsurance.creditPayment);
  assert.equal(withInsurance.monthlyPayment - withoutInsurance.monthlyPayment, 1_000);
  assert.equal(withInsurance.openingFee, withoutInsurance.openingFee);
});

test('amortizes both amount boundaries for every published term', () => {
  const monthlyRate = (0.48 / 12) * 1.16;

  for (const amount of [personalLoanSimulation.amount.min, personalLoanSimulation.amount.max]) {
    for (const termMonths of personalLoanSimulation.term.options) {
      const result = calculatePersonalLoan({ amount, termMonths, totalInsurance: 0 });
      let remaining = amount;

      for (let month = 0; month < termMonths; month += 1) {
        remaining = remaining * (1 + monthlyRate) - result.creditPayment;
      }

      assert.ok(Math.abs(remaining) < 1e-7, `Outstanding principal: ${remaining}`);
      assert.ok(result.monthlyPayment > 0);
      assert.ok(Number.isFinite(result.monthlyPayment));
    }
  }
});

test('retains precision with cent amounts and insurance that does not divide into cents', () => {
  const amount = 30_000.25;
  const termMonths = 18;
  const totalInsurance = 123.45;
  const result = calculatePersonalLoan({ amount, termMonths, totalInsurance });
  const monthlyRate = (0.48 / 12) * 1.16;
  const presentValue = Array.from(
    { length: termMonths },
    (_, index) => result.creditPayment / (1 + monthlyRate) ** (index + 1),
  ).reduce((sum, discountedPayment) => sum + discountedPayment, 0);

  assert.ok(Math.abs(presentValue - amount) < 1e-8);
  assert.equal(result.monthlyInsurance, totalInsurance / termMonths);
  assert.equal(result.monthlyPayment, result.creditPayment + totalInsurance / termMonths);
  assert.ok(Math.abs(result.openingFee - 1_044.0087) < 1e-10);
  assert.notEqual(result.monthlyPayment, Number(result.monthlyPayment.toFixed(2)));
});

test('rejects invalid amounts instead of silently clamping them', () => {
  for (const amount of [NaN, Infinity, -Infinity, 0, -1, 29_999.99, 200_000.01]) {
    assert.throws(() => calculatePersonalLoan({ ...example, amount }), RangeError);
  }
});

test('rejects unsupported or non-finite terms, including the unused internal six-month term', () => {
  for (const termMonths of [NaN, Infinity, -Infinity, -12, 0, 6, 12.5, 13, 36]) {
    assert.throws(() => calculatePersonalLoan({ ...example, termMonths }), RangeError);
  }
});

test('rejects negative and non-finite total insurance', () => {
  for (const totalInsurance of [NaN, Infinity, -Infinity, -0.01]) {
    assert.throws(() => calculatePersonalLoan({ ...example, totalInsurance }), RangeError);
  }
});
