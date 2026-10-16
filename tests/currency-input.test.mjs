import assert from 'node:assert/strict';
import test from 'node:test';
import { formatCurrencyEdit, formatCurrencyInput, parseCurrencyInput } from '../src/lib/currency-input.ts';

test('formats loan amounts in whole pesos with thousands separators', () => {
  assert.equal(formatCurrencyInput(200000), '$200,000');
  assert.equal(formatCurrencyInput(125001), '$125,001');
  assert.equal(formatCurrencyInput(30000), '$30,000');
});

test('groups digits as they are typed and preserves the caret at the end', () => {
  for (const [input, text] of [['1', '$1'], ['123', '$123'], ['1234', '$1,234'], ['12345', '$12,345'], ['123456', '$123,456']]) {
    const result = formatCurrencyEdit(input);
    assert.equal(result.text, text);
    assert.equal(result.selectionStart, text.length);
    assert.equal(result.selectionEnd, text.length);
  }
});

test('retains the prefix without turning an empty amount into zero', () => {
  assert.deepEqual(formatCurrencyEdit(''), { text: '$', selectionStart: 1, selectionEnd: 1 });
  assert.deepEqual(formatCurrencyEdit('$'), { text: '$', selectionStart: 1, selectionEnd: 1 });
  assert.ok(Number.isNaN(parseCurrencyInput('')));
  assert.ok(Number.isNaN(parseCurrencyInput('$')));
});

test('retains caret and selection positions when editing inside a grouped number', () => {
  assert.deepEqual(formatCurrencyEdit('1295,000', 3), {
    text: '$1,295,000', selectionStart: 5, selectionEnd: 5,
  });
  assert.deepEqual(formatCurrencyEdit('125000', 2, 6), {
    text: '$125,000', selectionStart: 3, selectionEnd: 8,
  });
  assert.deepEqual(formatCurrencyEdit('12,000', 2), {
    text: '$12,000', selectionStart: 3, selectionEnd: 3,
  });
  assert.deepEqual(formatCurrencyEdit('$125,000', 0), {
    text: '$125,000', selectionStart: 1, selectionEnd: 1,
  });
});

test('accepts pasted MXN currency and parses the exact amount', () => {
  const pasted = '$ 125,000 MXN';
  assert.equal(formatCurrencyEdit(pasted).text, '$125,000');
  assert.equal(parseCurrencyInput(pasted), 125000);
  assert.equal(parseCurrencyInput('30,001'), 30001);
});

test('rejects cents, signs and invalid text without silently changing the amount', () => {
  for (const input of ['-125,000', '$-125,000', '1e5', 'abc', '125000.25', '125000.', '.', '12.3.4', '125.000,25']) {
    assert.equal(formatCurrencyEdit(input), null, input);
    assert.ok(Number.isNaN(parseCurrencyInput(input)), input);
  }
});
