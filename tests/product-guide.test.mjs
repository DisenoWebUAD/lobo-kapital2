import assert from 'node:assert/strict';
import test from 'node:test';
import { getProductGuideContext, getProductRecommendations, validateProductGuide } from '../src/lib/product-guide.ts';

const fields = (overrides = {}) => ({ need: 'capital', capitalUse: 'one-time', equipmentUse: '', amount: '', ...overrides });
const ids = (input) => getProductRecommendations(input).map(({ id }) => id);
const allProducts = ['business', 'revolving', 'finance-lease', 'lease', 'factoring'];

const routes = [
	{ input: { need: 'capital' }, products: ['business', 'revolving'], optionalFields: [] },
	{ input: { need: 'capital', capitalUse: '' }, products: ['business', 'revolving'], optionalFields: [] },
	{ input: { need: 'capital', capitalUse: 'undecided' }, products: ['business', 'revolving'], optionalFields: [] },
	{ input: { need: 'capital', capitalUse: 'one-time' }, products: ['business'], optionalFields: ['amount'] },
	{ input: { need: 'capital', capitalUse: 'recurring' }, products: ['revolving'], optionalFields: [] },
	{ input: { need: 'equipment' }, products: ['business', 'finance-lease', 'lease'], optionalFields: [] },
	{ input: { need: 'equipment', equipmentUse: '' }, products: ['business', 'finance-lease', 'lease'], optionalFields: [] },
	{ input: { need: 'equipment', equipmentUse: 'undecided' }, products: ['business', 'finance-lease', 'lease'], optionalFields: [] },
	{ input: { need: 'equipment', equipmentUse: 'buy-now' }, products: ['business'], optionalFields: ['amount'] },
	{ input: { need: 'equipment', equipmentUse: 'lease-buy' }, products: ['finance-lease'], optionalFields: [] },
	{ input: { need: 'equipment', equipmentUse: 'use-only' }, products: ['lease'], optionalFields: [] },
	{ input: { need: 'invoices' }, products: ['factoring'], optionalFields: [] },
	{ input: { need: 'undecided' }, products: allProducts, optionalFields: [] },
];

test('every need and active preference routes to its alternatives in a stable order', () => {
	for (const { input, products, optionalFields } of routes) {
		assert.deepEqual(getProductGuideContext(input), { products, optionalFields }, JSON.stringify(input));
		assert.deepEqual(ids(input), products);
		for (const result of getProductRecommendations(input)) {
			assert.equal(result.status, 'explore');
			assert.deepEqual(result.warnings, []);
			assert.equal(result.amountMatch, null);
			assert.ok(result.reasons.length > 0 && result.reasons.every((reason) => typeof reason === 'string' && reason.length > 0));
			assert.ok(result.href.startsWith('/') && result.title && result.description);
		}
	}
});

test('unknown needs have no context, and only active preference values are validated', () => {
	for (const need of ['', 'personal', 'unknown']) {
		assert.deepEqual(getProductGuideContext({ need }), { products: [], optionalFields: [] });
		const validation = validateProductGuide(fields({ need, capitalUse: 'garbage', equipmentUse: 'garbage', amount: 'bad' }));
		assert.equal(validation.valid, false);
		assert.deepEqual(Object.keys(validation.errors), ['need']);
	}
	for (const [need, key] of [['capital', 'capitalUse'], ['equipment', 'equipmentUse']]) {
		const result = validateProductGuide(fields({ need, [key]: 'invalid' }));
		assert.equal(result.valid, false);
		assert.deepEqual(Object.keys(result.errors), [key]);
	}
	assert.equal(validateProductGuide(fields({ equipmentUse: 'invalid' })).valid, true);
	assert.equal(validateProductGuide(fields({ need: 'equipment', capitalUse: 'invalid' })).valid, true);
});

test('a missing preference is exploratory and normalized active/inactive answers cannot leak across branches', () => {
	const result = validateProductGuide(fields({ capitalUse: '', equipmentUse: 'lease-buy', amount: 'bad' }));
	assert.deepEqual(result, { valid: true, value: { need: 'capital', capitalUse: null, equipmentUse: null, amount: null } });
	for (const { input, optionalFields } of routes) {
		const raw = fields({ ...input, capitalUse: input.capitalUse ?? '', equipmentUse: input.equipmentUse ?? '', amount: '1000000' });
		const validation = validateProductGuide(raw);
		assert.equal(validation.valid, true);
		assert.equal(validation.value.amount, optionalFields.includes('amount') ? 1000000 : null);
	}
});

test('inactive optional answers, even malformed API values, do not add warnings or change results', () => {
	const stale = { amount: NaN };
	for (const input of [
		{ need: 'capital' }, { need: 'capital', capitalUse: 'undecided' }, { need: 'capital', capitalUse: 'recurring' },
		{ need: 'equipment' }, { need: 'equipment', equipmentUse: 'lease-buy' }, { need: 'invoices' }, { need: 'undecided' },
	]) {
		assert.deepEqual(getProductRecommendations({ ...input, ...stale }), getProductRecommendations(input));
	}
	assert.deepEqual(getProductRecommendations({ need: 'invoices', amount: -1, equipmentUse: 'invalid', capitalUse: 'invalid' }), getProductRecommendations({ need: 'invoices' }));
	assert.deepEqual(getProductRecommendations({ need: 'equipment', equipmentUse: 'use-only', amount: NaN }), getProductRecommendations({ need: 'equipment', equipmentUse: 'use-only' }));
});

test('business discrepancies mark review without replacing, removing or reordering the selected product', () => {
	for (const input of [{ need: 'capital', capitalUse: 'one-time' }, { need: 'equipment', equipmentUse: 'buy-now' }]) {
		const result = getProductRecommendations({ ...input, amount: 1 });
		assert.deepEqual(result.map(({ id }) => id), ['business']);
		assert.equal(result[0].status, 'review');
		assert.deepEqual(result[0].warnings.map(({ code }) => code), ['amount']);
		assert.equal(result[0].reasons.length, 1);
		assert.equal(result[0].amountMatch, null);
		assert.match(result[0].warnings[0].text, /250,000.*10,150,000/);
	}
});

test('a business amount match is explicit at both boundaries, without approval claims', () => {
	for (const amount of [250_000, 1_000_000, 10_150_000]) {
		const result = getProductRecommendations({ need: 'capital', capitalUse: 'one-time', amount })[0];
		assert.equal(result.status, 'explore');
		assert.deepEqual(result.warnings, []);
		assert.equal(result.reasons.length, 1);
		assert.match(result.amountMatch, /rango publicado.*250,000.*10,150,000/);
		assert.doesNotMatch(result.amountMatch, /aprob|autoriz|elegib/i);
	}
	for (const amount of [249_999, 10_150_001]) {
		const [result] = getProductRecommendations({ need: 'capital', capitalUse: 'one-time', amount });
		assert.deepEqual(result.warnings.map(({ code }) => code), ['amount']);
		assert.equal(result.amountMatch, null);
	}
	const [purchase] = getProductRecommendations({ need: 'equipment', equipmentUse: 'buy-now', amount: 250_000 });
	assert.equal(purchase.status, 'explore');
	assert.deepEqual(purchase.warnings, []);
	assert.match(purchase.amountMatch, /250,000.*10,150,000/);
});

test('active amount capture accepts empty or positive whole pesos up to the guide maximum', () => {
	for (const amount of ['', '$', '1', '$250,000', '$999,999,999', '  $1,000 MXN  ']) assert.equal(validateProductGuide(fields({ amount })).valid, true);
	for (const amount of ['0', '-1', '1.5', '$1,000.00', '1e6', '999999999.5', '1,000,000,000', 'NaN', 'Infinity', 'abc']) {
		const result = validateProductGuide(fields({ amount }));
		assert.equal(result.valid, false, amount);
		assert.ok(result.errors.amount);
	}
});

test('the recommendation API rejects invalid active answers rather than producing misleading alternatives', () => {
	for (const input of [
		{ need: 'invalid' }, { need: 'capital', capitalUse: 'invalid' }, { need: 'equipment', equipmentUse: 'invalid' },
		...[0, Infinity, 1.5, 1_000_000_000].map((amount) => ({ need: 'capital', capitalUse: 'one-time', amount })),
	]) assert.throws(() => getProductRecommendations(input), RangeError);
});
