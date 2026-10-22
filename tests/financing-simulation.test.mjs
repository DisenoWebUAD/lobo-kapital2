import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateRevolvingCredit,
  calculateLease,
  calculateFactoring,
  revolvingDefaults,
  getLeaseDefaults,
  factoringDefaults,
} from '../src/lib/financing-simulation.ts';

const revolving = { ...revolvingDefaults, startDate: '2026-01-15', annualInsurance: 0 };
const sum = (rows, field) => rows.reduce((total, row) => total + row[field], 0);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= Math.max(1e-7, Math.abs(expected) * 1e-12), `${actual} ≠ ${expected}`);

test('revolving reference separates initial fees from debt and excludes unconfirmed insurance', () => {
  const result = calculateRevolvingCredit(revolving);
  assert.equal(result.interest, 60_000);
  assert.equal(result.interestVat, 9_600);
  assert.equal(result.openingFee.toFixed(2), '29000.00');
  assert.equal(result.drawFee, 5_800);
  assert.equal(result.initialPayment, 34_800);
  assert.equal(result.totalPayments, 569_600);
  assert.equal(result.total, 604_400);
  assert.equal(result.insurance, 0);
  assert.equal(result.monthlyInsurance, 0);
  assert.equal(result.maturityDate, '2026-05-15');
  assert.equal(sum(result.schedule, 'principal'), revolving.amount);
  close(sum(result.schedule, 'total'), result.totalPayments);
  assert.ok(result.schedule.slice(0, -1).every((row) => row.principal === 0 && row.balance === revolving.amount));
  assert.equal(result.schedule.at(-1).balance, 0);
});

test('revolving monthly dates stay anchored through February and preserve exact maturity', () => {
  const leap = calculateRevolvingCredit({ ...revolving, startDate: '2024-01-31', days: 60 });
  assert.deepEqual(leap.schedule.map((row) => [row.date, row.days]), [['2024-02-29', 29], ['2024-03-31', 31]]);
  const ordinary = calculateRevolvingCredit({ ...revolving, startDate: '2025-01-31', days: 60 });
  assert.deepEqual(ordinary.schedule.map((row) => [row.date, row.days]), [['2025-02-28', 28], ['2025-04-01', 32]]);
  assert.equal(sum(ordinary.schedule, 'days'), 60);
  assert.equal(ordinary.schedule.at(-1).date, ordinary.maturityDate);
});

test('revolving source periods accrue all days and preserve the source overlap rejection', () => {
  for (const startDate of ['2024-02-29', '2025-02-28', '2026-08-31', '9996-12-31']) {
    for (const days of [60, 90, 120, 359, 360]) {
      for (const lineMonths of [12, 18, 24, 30, 36]) {
        const result = calculateRevolvingCredit({ ...revolving, startDate, days, lineMonths, annualInsurance: 12_001 });
        assert.equal(new Set(result.schedule.map((row) => row.date)).size, result.schedule.length);
        assert.ok(result.schedule.every((row, index) => row.date > (result.schedule[index - 1]?.date ?? startDate)));
        assert.equal(sum(result.schedule, 'days'), days);
        close(sum(result.schedule, 'interest'), result.interest);
        close(sum(result.schedule, 'total') + result.initialPayment, result.total);
        close(sum(result.schedule, 'insurance'), 12_001 * lineMonths / 12);
        close(sum(result.monthlyPayments, 'total'), result.totalPayments);
        assert.equal(result.monthlyPayments.length, lineMonths);
        assert.equal(sum(result.schedule, 'principal'), revolving.amount);
      }
    }
  }
  assert.throws(() => calculateRevolvingCredit({ ...revolving, startDate: '2026-05-01', days: 61 }), /fechas superpuestas/);
  assert.throws(() => calculateRevolvingCredit({ ...revolving, startDate: '2026-08-31', days: 61 }), /fechas superpuestas/);
});

test('revolving calendar-month payments reproduce the source rollup rather than adding extra interest periods', () => {
  const result = calculateRevolvingCredit({ ...revolving, startDate: '2027-01-31', days: 60, annualInsurance: 4_000 });
  assert.deepEqual(result.schedule.filter(row => row.interest > 0).map(row => [row.date, row.days, row.interest]), [
    ['2027-02-28', 28, 14_000], ['2027-04-01', 32, 16_000],
  ]);
  assert.deepEqual(result.monthlyPayments.slice(0, 3).map(row => [row.month, row.total.toFixed(2), row.principal]), [
    ['2027-02', '16573.33', 0], ['2027-03', '333.33', 0], ['2027-04', '518893.33', 500_000],
  ]);
  assert.equal(revolvingDefaults.annualInsurance, 0);
});

test('revolving insurance continues for the full line after capital has been returned without additional IVA', () => {
  const result = calculateRevolvingCredit({ ...revolving, annualInsurance: 12_000 });
  assert.equal(result.monthlyInsurance, 1_000);
  assert.equal(result.insurance, 24_000);
  assert.equal(result.schedule.at(-1).date, '2028-01-15');
  const later = result.schedule.filter((row) => row.date > result.maturityDate);
  assert.equal(later.length, 20);
  assert.ok(later.every((row) => row.interest === 0 && row.vat === 0 && row.balance === 0 && row.total === 1_000));
  assert.equal(result.total, 628_400);
});

test('revolving rejects invalid dates, unsupported line terms, excess draws and invalid monetary inputs', () => {
  for (const startDate of ['', '2026-2-01', '2026-02-29', '2024-02-30', '2026-13-01', '2026-01-01T00:00:00Z', '0000-01-01', '9997-01-01']) {
    assert.throws(() => calculateRevolvingCredit({ ...revolving, startDate }), RangeError);
  }
  for (const changes of [{ amount: 1_000_001 }, { lineMonths: 13 }, { lineMonths: NaN }, { days: 59 }, { days: 361 }, { days: 60.1 }, { annualInsurance: -1 }]) {
    assert.throws(() => calculateRevolvingCredit({ ...revolving, ...changes }), RangeError);
  }
  for (const key of ['amount', 'line', 'annualInsurance']) {
    for (const value of [NaN, Infinity, -Infinity, 1.005, 1_000_000_000_001]) {
      assert.throws(() => calculateRevolvingCredit({ ...revolving, [key]: value }), RangeError);
    }
  }
});

test('lease references reproduce both financial assets and pure leasing without insurance', () => {
  const vehicle = calculateLease(getLeaseDefaults('finance', 'vehicle'));
  const machinery = calculateLease(getLeaseDefaults('finance', 'machinery'));
  const pure = calculateLease(getLeaseDefaults('pure', 'vehicle'));
  assert.equal(vehicle.monthlyPayment.toFixed(2), '51299.16');
  assert.equal(machinery.monthlyPayment.toFixed(2), '52949.08');
  assert.equal(pure.monthlyPayment.toFixed(2), '53132.40');
  assert.equal(vehicle.terminalPayment.toFixed(2), '116000.00');
  assert.equal(machinery.terminalPayment.toFixed(2), '11600.00');
  assert.equal(pure.terminalPayment, 0);
  for (const result of [vehicle, machinery, pure]) {
    assert.equal(result.openingFee.toFixed(2), '29000.00');
    assert.equal(result.schedule.length, 37);
    close(sum(result.schedule, 'total'), result.totalWithoutPurchase);
    close(result.totalWithPurchase, result.totalWithoutPurchase + result.terminalPayment);
    assert.equal(result.monthlyInsurance, 0);
    assert.equal(result.monthlyServices, 0);
  }
});

test('lease annuity preserves full precision and discounts rents and residual to financed capital', () => {
  for (const kind of ['finance', 'pure']) {
    for (const asset of ['vehicle', 'machinery']) {
      const input = { ...getLeaseDefaults(kind, asset), value: 1_234_567, advance: kind === 'finance' ? 123_456 : 0, residualPercent: 7.35 };
      const result = calculateLease(input);
      const presentValue = result.baseRent * -Math.expm1(-input.months * Math.log1p(.03)) / .03 + result.residual * Math.exp(-input.months * Math.log1p(.03));
      close(presentValue, input.value - input.advance);
      assert.notEqual(result.baseRent, Number(result.baseRent.toFixed(2)));
      assert.equal(result.schedule[0].advance, input.advance);
      assert.equal(result.schedule[0].openingFee, result.openingFee);
      assert.equal(result.schedule[0].baseRent, 0);
    }
  }
});

test('lease IVA applies to extras except financial machinery final amounts', () => {
  for (const [kind, asset, extraVat] of [['finance', 'vehicle', 240], ['finance', 'machinery', 0], ['pure', 'vehicle', 240], ['pure', 'machinery', 240]]) {
    const input = { ...getLeaseDefaults(kind, asset), insurance: 1_000, services: 500 };
    const result = calculateLease(input);
    assert.equal(result.extrasVat, extraVat);
    assert.equal(result.monthlyInsurance, 1_000);
    assert.equal(result.monthlyServices, 500);
    close(result.monthlyPayment, result.baseRent * 1.16 + 1_500 + extraVat);
    for (const row of result.schedule) {
      close(row.total, row.baseRent + row.vat + row.insurance + row.services + row.administration + row.advance + row.openingFee);
    }
  }
});

test('financial machinery administration is initial and every anniversary strictly before maturity', () => {
  for (const [months, chargedMonths] of [[1, [0]], [12, [0]], [13, [0, 12]], [24, [0, 12]], [25, [0, 12, 24]], [60, [0, 12, 24, 36, 48]]]) {
    const result = calculateLease({ ...getLeaseDefaults('finance', 'machinery'), months });
    assert.deepEqual(result.schedule.filter((row) => row.administration > 0).map((row) => row.month), chargedMonths);
    assert.equal(result.administrationTotal, chargedMonths.length * 2_900);
    assert.equal(result.initialPayment.toFixed(2), '31900.00');
    close(sum(result.schedule, 'total'), result.totalWithoutPurchase);
  }
  for (const input of [getLeaseDefaults('finance', 'vehicle'), getLeaseDefaults('pure', 'machinery')]) {
    assert.equal(calculateLease(input).administrationTotal, 0);
  }
});

test('pure residual changes the rent but never creates a terminal purchase payment', () => {
  const initial = calculateLease(getLeaseDefaults('pure', 'vehicle'));
  const adjusted = calculateLease({ ...getLeaseDefaults('pure', 'vehicle'), residualPercent: 20 });
  assert.ok(adjusted.monthlyPayment < initial.monthlyPayment);
  assert.equal(adjusted.residual, 200_000);
  assert.equal(adjusted.terminalPayment, 0);
  assert.equal(adjusted.totalWithoutPurchase, adjusted.totalWithPurchase);
});

test('lease validates mode, asset, term, advance, residual and bounded monetary amounts', () => {
  const input = getLeaseDefaults('finance', 'vehicle');
  for (const changes of [{ kind: 'unknown' }, { asset: 'unknown' }, { months: 0 }, { months: 121 }, { months: 12.5 }, { advance: input.value }, { residualPercent: 101 }, { residualPercent: NaN }, { advance: 950_000, residualPercent: 10 }]) {
    assert.throws(() => calculateLease({ ...input, ...changes }), RangeError);
  }
  assert.doesNotThrow(() => calculateLease({ ...input, months: 120 }));
  assert.doesNotThrow(() => calculateLease({ ...input, advance: 900_000, residualPercent: 10 }));
  assert.throws(() => calculateLease({ ...getLeaseDefaults('finance', 'machinery'), months: 61 }), RangeError);
  for (const months of [17, 37]) assert.throws(() => calculateLease({ ...getLeaseDefaults('pure'), months }), RangeError);
  assert.throws(() => calculateLease({ ...getLeaseDefaults('pure'), advance: 1 }), RangeError);
  for (const key of ['value', 'advance', 'insurance', 'services']) {
    for (const value of [NaN, Infinity, -Infinity, -1, .005, 1_000_000_000_001]) {
      assert.throws(() => calculateLease({ ...input, [key]: value }), RangeError);
    }
  }
});

test('factoring references reconcile advance, deductions, net liquidity and reserve for both modes', () => {
  for (const [mode, expected] of [['without-recourse', '805460.00'], ['with-recourse', '815900.00']]) {
    const result = calculateFactoring({ ...factoringDefaults, mode });
    assert.equal(result.netLiquidity.toFixed(2), expected);
    assert.equal(result.advance, 900_000);
    assert.equal(result.reserve, 100_000);
    assert.equal(result.openingFee, 15_000);
    assert.equal(result.operationFee, 10_000);
    assert.equal(result.administrationFee, 2_500);
    close(result.advance, result.netLiquidity + result.totalDeductions);
    close(result.advance + result.reserve, factoringDefaults.amount);
    close(result.vat, (result.discount + result.openingFee + result.operationFee + result.administrationFee + result.expenses) * .16);
  }
});

test('factoring optional opening is independent of recurring operation and administration charges', () => {
  const result = calculateFactoring({ ...factoringDefaults, includeOpening: false, line: 0, administrationCount: 3, expenses: 1_001 });
  assert.equal(result.openingFee, 0);
  assert.equal(result.operationFee, 10_000);
  assert.equal(result.administrationFee, 7_500);
  assert.equal(result.expenses, 1_001);
  close(result.totalDeductions, (54_000 + 10_000 + 7_500 + 1_001) * 1.16);
  const fullyAdvanced = calculateFactoring({ ...factoringDefaults, advancePercent: 100 });
  assert.equal(fullyAdvanced.reserve, 0);
  assert.ok(fullyAdvanced.netLiquidity > 0);
});

test('factoring rejects exhausted liquidity and invalid model controls', () => {
  for (const changes of [{ mode: 'unknown' }, { includeOpening: 'yes' }, { days: 0 }, { days: 3601 }, { days: 1.5 }, { advancePercent: 0 }, { advancePercent: .001 }, { advancePercent: 101 }, { advancePercent: NaN }, { administrationCount: -1 }, { administrationCount: 1.5 }, { administrationCount: 1_000_000_000_001 }, { line: 0 }, { advancePercent: 1 }, { expenses: 900_000 }]) {
    assert.throws(() => calculateFactoring({ ...factoringDefaults, ...changes }), RangeError);
  }
  for (const key of ['amount', 'line', 'expenses']) {
    for (const value of [NaN, Infinity, -Infinity, -1, .005, 1_000_000_000_001]) {
      assert.throws(() => calculateFactoring({ ...factoringDefaults, [key]: value }), RangeError);
    }
  }
});


test('source monetary inputs accept cents without rounding intermediate payments', () => {
  const lease = calculateLease({ ...getLeaseDefaults('finance'), value: 999_999.99, insurance: 32.25, services: 125.75 });
  assert.equal(lease.monthlyPayment.toFixed(2), '51482.44');
  assert.doesNotThrow(() => calculateLease({ ...getLeaseDefaults('finance'), value: 0.01, residualPercent: 0 }));
  const factored = calculateFactoring({ ...factoringDefaults, amount: 999_999.99, expenses: 125.75 });
  assert.equal(factored.netLiquidity.toFixed(2), '805314.12');
  assert.doesNotThrow(() => calculateFactoring({ ...factoringDefaults, amount: 1_000_000_000_000, includeOpening: false, line: 0, administrationCount: 3_601 }));
  const credit = calculateRevolvingCredit({ ...revolving, amount: 500_000.25, annualInsurance: 4_000.75, startDate: '2026-10-21' });
  assert.equal(credit.monthlyPayments[0].total.toFixed(2), '18313.40');
});
