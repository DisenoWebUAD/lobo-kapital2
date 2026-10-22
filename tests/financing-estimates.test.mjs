import assert from 'node:assert/strict';
import test from 'node:test';
import {
  estimateRevolvingDraw,
  estimateLease,
  estimateFactoringOperation,
} from '../src/lib/financing-estimates.ts';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= Math.max(1e-7, Math.abs(expected) * 1e-12), `${actual} ≠ ${expected}`);

test('public revolving estimate models a line equal to the disposition and separates initial charges', () => {
  const result = estimateRevolvingDraw({ amount: 500_000, days: 120 });
  assert.equal(result.amount, 500_000);
  assert.equal(result.days, 120);
  assert.equal(result.interest, 60_000);
  assert.equal(result.interestVat, 9_600);
  assert.equal(result.interestWithVat, 69_600);
  assert.equal(result.monthlyPayment.toFixed(2), '17400.00');
  assert.equal(result.regularPaymentCount, 3);
  assert.equal(result.finalPeriodDays, 30);
  assert.equal(result.finalPayment.toFixed(2), '517400.00');
  assert.equal(result.openingFee.toFixed(2), '14500.00');
  assert.equal(result.drawFee, 5_800);
  assert.equal(result.initialCharges, 20_300);
  assert.equal(result.total, 589_900);
});

test('revolving monthly references keep capital out of recurring payments and settle it in the last period', () => {
  const cases = [
    { days: 60, regularPayments: 1, finalDays: 30, finalPayment: '517400.00' },
    { days: 61, regularPayments: 2, finalDays: 1, finalPayment: '500580.00' },
    { days: 75, regularPayments: 2, finalDays: 15, finalPayment: '508700.00' },
    { days: 120, regularPayments: 3, finalDays: 30, finalPayment: '517400.00' },
    { days: 360, regularPayments: 11, finalDays: 30, finalPayment: '517400.00' },
  ];
  for (const example of cases) {
    const result = estimateRevolvingDraw({ amount: 500_000, days: example.days });
    assert.equal(result.paymentPeriodDays, 30);
    assert.equal(result.monthlyPayment.toFixed(2), '17400.00');
    assert.equal(result.regularPaymentCount, example.regularPayments);
    assert.equal(result.finalPeriodDays, example.finalDays);
    assert.equal(result.finalPayment.toFixed(2), example.finalPayment);
    close(result.finalPayment - result.amount, result.finalInterestWithVat);
    close(result.regularPaymentCount * result.monthlyPayment + result.finalPayment + result.initialCharges, result.total);
  }
});

test('revolving payment references reconcile every supported day without rounding monthly amounts', () => {
  for (const amount of [1, 12_345, 500_000, 1_000_000_000_000]) {
    for (let days = 60; days <= 360; days++) {
      const result = estimateRevolvingDraw({ amount, days });
      assert.ok(result.finalPeriodDays >= 1 && result.finalPeriodDays <= 30);
      assert.equal(result.regularPaymentCount * result.paymentPeriodDays + result.finalPeriodDays, days);
      close(result.regularPaymentCount * result.monthlyPayment + result.finalInterestWithVat, result.interestWithVat);
      close(result.regularPaymentCount * result.monthlyPayment + result.finalPayment + result.initialCharges, result.total);
    }
  }
  const result = estimateRevolvingDraw({ amount: 12_345, days: 75 });
  close(result.monthlyPayment, 429.606);
  close(result.finalInterestWithVat, 214.803);
  close(result.finalPayment, 12_559.803);
  assert.notEqual(result.monthlyPayment, Number(result.monthlyPayment.toFixed(2)));
});

test('public revolving estimate scales the modeled line and fees with the requested amount', () => {
  const result = estimateRevolvingDraw({ amount: 1_000_000, days: 120 });
  assert.equal(result.interest, 120_000);
  assert.equal(result.openingFee.toFixed(2), '29000.00');
  assert.equal(result.drawFee, 11_600);
  assert.equal(result.total, 1_179_800);
  const shorter = estimateRevolvingDraw({ amount: 500_000, days: 60 });
  assert.equal(shorter.interest, 30_000);
  assert.equal(shorter.initialCharges, 20_300);
  assert.equal(shorter.total, 555_100);
});

test('public revolving estimate preserves precision and reconciles the scenario at supported boundaries', () => {
  for (const amount of [1, 12_345, 1_000_000_000_000]) {
    for (const days of [60, 61, 120, 360]) {
      const result = estimateRevolvingDraw({ amount, days });
      close(result.total, amount + result.interestWithVat + result.initialCharges);
      close(result.interestWithVat, result.interest + result.interestVat);
      close(result.initialCharges, result.openingFee + result.drawFee);
    }
  }
  close(estimateRevolvingDraw({ amount: 1, days: 61 }).interest, 0.061);
  assert.notEqual(estimateRevolvingDraw({ amount: 1, days: 61 }).interest, 0.06);
});

test('public revolving estimate accepts only whole-peso amounts and whole days in the public range', () => {
  for (const amount of [0, -1, .5, 100.25, NaN, Infinity, 1_000_000_000_001]) {
    assert.throws(() => estimateRevolvingDraw({ amount, days: 120 }), RangeError);
  }
  for (const days of [0, 59, 361, 60.5, NaN, Infinity]) {
    assert.throws(() => estimateRevolvingDraw({ amount: 500_000, days }), RangeError);
  }
});

test('public leasing estimates preserve the source references and exclude optional extras', () => {
  const vehicle = estimateLease({ kind: 'finance', value: 1_000_000, months: 36 });
  const machinery = estimateLease({ kind: 'finance', asset: 'machinery', value: 1_000_000, months: 36 });
  const pure = estimateLease({ kind: 'pure', value: 1_000_000, months: 36 });
  assert.equal(vehicle.monthlyPayment.toFixed(2), '51299.16');
  assert.equal(vehicle.residual, 100_000);
  assert.equal(vehicle.terminalPayment.toFixed(2), '116000.00');
  assert.equal(machinery.monthlyPayment.toFixed(2), '52949.08');
  assert.equal(machinery.residual, 10_000);
  assert.equal(machinery.administrationTotal, 8_700);
  assert.equal(pure.monthlyPayment.toFixed(2), '53132.40');
  assert.equal(pure.residual, 0);
  assert.equal(pure.terminalPayment, 0);
  for (const result of [vehicle, machinery, pure]) {
    assert.equal(result.monthlyInsurance, 0);
    assert.equal(result.monthlyServices, 0);
    assert.equal(result.schedule[0].advance, 0);
  }
});

test('pure leasing does not change with the unused asset category', () => {
  assert.deepEqual(
    estimateLease({ kind: 'pure', value: 725_000, months: 18 }),
    estimateLease({ kind: 'pure', asset: 'machinery', value: 725_000, months: 18 }),
  );
});

test('a known financial advance reduces principal without changing the reference residual', () => {
  const result = estimateLease({ kind: 'finance', value: 1_000_000, months: 36, advance: 900_000 });
  assert.equal(result.financedAmount, 100_000);
  assert.equal(result.residual, 100_000);
  assert.equal(result.monthlyPayment, 3_480);
  assert.equal(result.initialPayment, 929_000);
  assert.equal(result.terminalPayment.toFixed(2), '116000.00');
});

test('public lease inputs preserve term, residual and advance validation', () => {
  const input = { kind: 'finance', value: 1_000_000, months: 36 };
  for (const changes of [{ kind: 'invalid' }, { asset: 'invalid' }, { value: .5 }, { value: 0 }, { value: 1_000_000_000_001 }, { advance: .5 }, { advance: -1 }, { advance: 900_001 }, { advance: 1_000_000 }, { months: 0 }, { months: 121 }, { months: 12.5 }]) {
    assert.throws(() => estimateLease({ ...input, ...changes }), RangeError);
  }
  assert.throws(() => estimateLease({ ...input, asset: 'machinery', months: 61 }), RangeError);
  assert.throws(() => estimateLease({ ...input, kind: 'pure', months: 17 }), RangeError);
  assert.throws(() => estimateLease({ ...input, kind: 'pure', months: 37 }), RangeError);
  assert.throws(() => estimateLease({ ...input, kind: 'pure', advance: 1 }), RangeError);
});

test('public factoring references keep both modalities and a ninety-percent advance', () => {
  for (const [mode, net, discount] of [['without-recourse', '805460.00', 54_000], ['with-recourse', '815900.00', 45_000]]) {
    const result = estimateFactoringOperation({ mode, amount: 1_000_000, days: 60 });
    assert.equal(result.netLiquidity.toFixed(2), net);
    assert.equal(result.discount, discount);
    assert.equal(result.advance, 900_000);
    assert.equal(result.reserve, 100_000);
    assert.equal(result.openingFee, 15_000);
    assert.equal(result.administrationFee, 2_500);
    assert.equal(result.expenses, 0);
    close(result.netLiquidity + result.totalDeductions + result.reserve, 1_000_000);
  }
});

test('public factoring bases opening on the invoices rather than a hidden fixed million-peso line', () => {
  const without = estimateFactoringOperation({ mode: 'without-recourse', amount: 550_000, days: 60 });
  const withRecourse = estimateFactoringOperation({ mode: 'with-recourse', amount: 550_000, days: 60 });
  assert.equal(without.openingFee, 8_250);
  assert.equal(without.operationFee, 5_500);
  assert.equal(without.administrationFee, 2_500);
  assert.equal(without.netLiquidity.toFixed(2), '441698.00');
  assert.equal(withRecourse.netLiquidity.toFixed(2), '447440.00');
  assert.equal(without.reserve, 55_000);
});

test('an exhausted factoring modality does not prevent independently estimating the valid modality', () => {
  assert.throws(() => estimateFactoringOperation({ mode: 'without-recourse', amount: 1_000_000, days: 900 }), /igualan o superan/);
  assert.equal(estimateFactoringOperation({ mode: 'with-recourse', amount: 1_000_000, days: 900 }).netLiquidity.toFixed(2), '85100.00');
});

test('public factoring estimates reject invalid amounts, modes and collection days', () => {
  const input = { mode: 'without-recourse', amount: 1_000_000, days: 60 };
  for (const changes of [{ amount: 0 }, { amount: .5 }, { amount: 100.25 }, { amount: NaN }, { amount: Infinity }, { amount: 1_000_000_000_001 }, { mode: 'invalid' }, { days: 0 }, { days: 3601 }, { days: 1.5 }]) {
    assert.throws(() => estimateFactoringOperation({ ...input, ...changes }), RangeError);
  }
});
