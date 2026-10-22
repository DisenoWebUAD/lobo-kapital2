import assert from 'node:assert/strict';
import test from 'node:test';
import { getProductRecommendations, validateProductGuide } from '../src/lib/product-guide.ts';

const fields = (overrides = {}) => ({ objective: 'project', amount: '', termMonths: '', operatingHistory: '', ...overrides });

test('each objective recommends its corresponding service; an undecided objective shows all five', () => {
	const choices = {
		project: ['business'], liquidity: ['revolving'], purchase: ['finance-lease'],
		use: ['lease'], invoices: ['factoring'], undecided: ['business', 'revolving', 'finance-lease', 'lease', 'factoring'],
	};
	for (const [objective, expected] of Object.entries(choices)) {
		const results = getProductRecommendations({ objective });
		assert.deepEqual(results.map(({ id }) => id), expected);
		assert.ok(results.every(({ warnings, href, title, description }) => warnings.length === 0 && href.startsWith('/') && title && description));
	}
});

test('optional answers add only the applicable cautions, without filtering or reordering recommendations', () => {
	const results = getProductRecommendations({ objective: 'undecided', amount: 1, termMonths: 3, operatingHistory: 'under-24' });
	assert.deepEqual(results.map(({ id }) => id), ['business', 'revolving', 'finance-lease', 'lease', 'factoring']);
	assert.deepEqual(results.map(({ warnings }) => warnings.map(({ code }) => code)), [
		['amount', 'term', 'history'], ['term'], [], ['term'], ['history'],
	]);
	assert.match(results[0].warnings[0].text, /250,000.*10,150,000/);
	assert.match(results[0].warnings[2].text, /24 meses/);
	assert.match(results[1].warnings[0].text, /12 a 36.*cada disposición/);
	assert.match(results[3].warnings[0].text, /18 a 36/);
});

test('amount and term boundaries come from product references and do not produce cautions at their limits', () => {
	for (const amount of [250_000, 10_150_000]) {
		for (const termMonths of [12, 36]) {
			assert.deepEqual(getProductRecommendations({ objective: 'project', amount, termMonths, operatingHistory: '24-or-more' })[0].warnings, []);
		}
	}
	for (const amount of [249_999, 10_150_001]) {
		assert.deepEqual(getProductRecommendations({ objective: 'project', amount })[0].warnings.map(({ code }) => code), ['amount']);
	}
	for (const termMonths of [12, 18, 24, 36]) assert.deepEqual(getProductRecommendations({ objective: 'liquidity', termMonths })[0].warnings, []);
	for (const termMonths of [18, 24, 36]) assert.deepEqual(getProductRecommendations({ objective: 'use', termMonths })[0].warnings, []);
	for (const objective of ['project', 'liquidity', 'use']) {
		assert.ok(getProductRecommendations({ objective, termMonths: 48 })[0].warnings.some(({ code }) => code === 'term'));
	}
	assert.deepEqual(getProductRecommendations({ objective: 'invoices', operatingHistory: '24-or-more' })[0].warnings, []);
});

test('the guide requires a supported objective and accepts optional empty answers', () => {
	for (const objective of ['', 'personal', 'unknown']) {
		const result = validateProductGuide(fields({ objective }));
		assert.equal(result.valid, false);
		assert.ok(result.errors.objective);
	}
	assert.deepEqual(validateProductGuide(fields()), {
		valid: true, value: { objective: 'project', amount: null, termMonths: null, operatingHistory: null },
	});
	assert.equal(validateProductGuide(fields({ amount: '$' })).valid, true);
});

test('amount capture accepts only positive whole pesos up to the public guide maximum', () => {
	for (const amount of ['1', '$250,000', '$999,999,999', '  $1,000 MXN  ']) assert.equal(validateProductGuide(fields({ amount })).valid, true);
	for (const amount of ['0', '-1', '1.5', '$1,000.00', '1e6', '999999999.5', '1,000,000,000', 'NaN', 'Infinity', 'abc']) {
		const result = validateProductGuide(fields({ amount }));
		assert.equal(result.valid, false, amount);
		assert.ok(result.errors.amount);
	}
});

test('only the offered optional terms and operating history are accepted', () => {
	for (const termMonths of ['', '3', '6', '12', '18', '24', '36', '48', '60']) assert.equal(validateProductGuide(fields({ termMonths })).valid, true);
	for (const termMonths of ['0', '-1', '12.5', '120', 'foo']) assert.equal(validateProductGuide(fields({ termMonths })).valid, false);
	for (const operatingHistory of ['', 'under-24', '24-or-more']) assert.equal(validateProductGuide(fields({ operatingHistory })).valid, true);
	for (const operatingHistory of ['24', 'new', 'foo']) assert.equal(validateProductGuide(fields({ operatingHistory })).valid, false);
});

test('the recommendation API rejects malformed values instead of silently recommending from invalid data', () => {
	for (const input of [
		{ objective: 'invalid' },
		{ objective: 'project', amount: 0 },
		{ objective: 'project', amount: Infinity },
		{ objective: 'project', amount: 1.5 },
		{ objective: 'project', amount: 1_000_000_000 },
		{ objective: 'project', termMonths: 11 },
		{ objective: 'project', operatingHistory: 'invalid' },
	]) assert.throws(() => getProductRecommendations(input), RangeError);
});
