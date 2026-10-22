import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceCriticalSpring } from '../src/lib/guide-motion.ts';

const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≈ ${expected}`);

test('critical spring settles monotonically without overshooting from rest in either direction', () => {
	for (const [start, target] of [[0, 480], [480, 0], [140, 620], [620, 140]]) {
		let state = { position: start, velocity: 0 };
		const direction = Math.sign(target - start);
		for (let frame = 0; frame < 240; frame++) {
			const previous = state;
			state = advanceCriticalSpring(state, target, 1 / 120);
			assert.ok((state.position - previous.position) * direction >= -1e-10);
			assert.ok((target - state.position) * direction >= -1e-10);
			assert.ok(Number.isFinite(state.position) && Number.isFinite(state.velocity));
		}
		near(state.position, target);
		near(state.velocity, 0);
	}
});

test('exact integration is stable across frame rates, dropped frames and large elapsed times', () => {
	const initial = { position: 32, velocity: 110 };
	const direct = advanceCriticalSpring(initial, 520, 0.25);
	for (const rate of [30, 60, 120, 240]) {
		let state = initial;
		for (let frame = 0; frame < rate; frame++) state = advanceCriticalSpring(state, 520, 0.25 / rate);
		near(state.position, direct.position);
		near(state.velocity, direct.velocity);
	}
	assert.deepEqual(advanceCriticalSpring(initial, 520, 60), { position: 520, velocity: 0 });
});

test('retargeting starts from the current presented position and velocity, without a reset', () => {
	const presented = advanceCriticalSpring({ position: 0, velocity: 0 }, 600, 0.08);
	assert.ok(presented.position > 0 && presented.velocity > 0);
	assert.deepEqual(advanceCriticalSpring(presented, 0, 0), presented);
	const shortStep = advanceCriticalSpring(presented, 0, 1e-8);
	near(shortStep.position, presented.position + presented.velocity * 1e-8, 1e-8);
	near(shortStep.velocity, presented.velocity, 0.02);
	assert.notEqual(shortStep.velocity, 0);
	let state = presented;
	for (let frame = 0; frame < 360; frame++) state = advanceCriticalSpring(state, 0, 1 / 120);
	near(state.position, 0);
	near(state.velocity, 0);
});

test('rapid 60–100ms reversals retain finite state and settle after the final choice', () => {
	let state = { position: 0, velocity: 0 };
	for (let change = 0; change < 50; change++) {
		state = advanceCriticalSpring(state, change % 2 ? 84 : 620, 0.06 + (change % 5) * 0.01);
		assert.ok(Number.isFinite(state.position) && Number.isFinite(state.velocity));
	}
	for (let frame = 0; frame < 180; frame++) state = advanceCriticalSpring(state, 248, 1 / 60);
	near(state.position, 248);
	near(state.velocity, 0);
});

test('spring rejects invalid parameters rather than scheduling non-finite geometry', () => {
	const state = { position: 0, velocity: 0 };
	for (const elapsed of [-1, NaN, Infinity]) assert.throws(() => advanceCriticalSpring(state, 10, elapsed), RangeError);
	for (const response of [0, -1, NaN, Infinity]) assert.throws(() => advanceCriticalSpring(state, 10, 0.1, response), RangeError);
	assert.throws(() => advanceCriticalSpring({ position: NaN, velocity: 0 }, 10, 0.1), RangeError);
	assert.deepEqual(state, { position: 0, velocity: 0 });
});
