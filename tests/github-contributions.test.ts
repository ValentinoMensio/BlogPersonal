import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contributionWindow, getContributions, parseCalendar } from '../src/lib/github-contributions.ts';

// Synthetic responses for tests only; never used as a production fallback.
const from = '2025-12-30T00:00:00.000Z';
const to = '2026-01-03T12:00:00.000Z';
function fixture() {
	return {
		totalContributions: 10,
		weeks: [{ contributionDays: Array.from({ length: 5 }, (_, index) => {
			const date = new Date(Date.parse(from) + index * 86_400_000);
			return {
				date: date.toISOString().slice(0, 10), weekday: date.getUTCDay(),
				contributionCount: index,
				contributionLevel: ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'][index],
			};
		}) }],
	};
}

test('rolling UTC window includes today, across years and leap days', () => {
	assert.equal(contributionWindow(new Date('2026-11-09T10:00:00Z')).from, '2025-11-10T00:00:00.000Z');
	assert.equal(contributionWindow(new Date('2024-02-29T10:00:00Z')).from, '2023-03-01T00:00:00.000Z');
	assert.equal(contributionWindow(new Date('2025-02-28T10:00:00Z')).from, '2024-02-29T00:00:00.000Z');
	assert.equal(contributionWindow(new Date('2026-01-01T10:00:00Z')).to, '2026-01-01T10:00:00.000Z');
});

test('preserves real counts, GitHub intensity, weekdays and partial-week padding', () => {
	const result = parseCalendar(fixture(), from, to);
	assert.equal(result.total, 10);
	assert.deepEqual(result.weeks[0].slice(0, 2), [null, null]);
	assert.deepEqual(result.weeks[0].filter(Boolean).map(day => day!.level), [0, 1, 2, 3, 4]);
	assert.equal(result.weeks[0][2]?.date, '2025-12-30');
	assert.equal(result.months[0], 'ene');
});

test('zero real contributions are valid, not an error', () => {
	const value = fixture();
	value.totalContributions = 0;
	value.weeks[0].contributionDays.forEach(day => {
		day.contributionCount = 0;
		day.contributionLevel = 'NONE';
	});
	assert.equal(parseCalendar(value, from, to).total, 0);
});

test('rejects missing days, duplicates, wrong totals, dates, levels and counts', () => {
	const mutations = [
		(value: ReturnType<typeof fixture>) => { value.totalContributions++; },
		(value: ReturnType<typeof fixture>) => { value.weeks[0].contributionDays.pop(); },
		(value: ReturnType<typeof fixture>) => { value.weeks[0].contributionDays[1] = value.weeks[0].contributionDays[0]; },
		(value: ReturnType<typeof fixture>) => { value.weeks[0].contributionDays[0].weekday = 6; },
		(value: ReturnType<typeof fixture>) => { value.weeks[0].contributionDays[0].contributionCount = -1; },
		(value: ReturnType<typeof fixture>) => { value.weeks[0].contributionDays[0].contributionLevel = 'INVALID'; },
		(value: ReturnType<typeof fixture>) => { value.weeks[0].contributionDays[0].date = 'invalid'; },
	];
	for (const mutate of mutations) {
		const value = fixture();
		mutate(value);
		assert.throws(() => parseCalendar(value, from, to));
	}
});

test('missing token makes no network request', async () => {
	const result = await getContributions({ fetcher: async () => { throw new Error('Must not fetch'); } });
	assert.equal(result, null);
});

test('network, timeout, HTTP, GraphQL and malformed data fail without fabricated activity', async () => {
	const fetchers: typeof fetch[] = [
		async () => { throw new Error('Network unavailable'); },
		async () => { throw new DOMException('Timeout', 'TimeoutError'); },
		async () => new Response('', { status: 401 }),
		async () => new Response('', { status: 429 }),
		async () => Response.json({ errors: [{ message: 'Denied' }] }),
		async () => Response.json({ data: { user: null } }),
		async () => new Response('not JSON'),
	];
	for (const fetcher of fetchers) {
		assert.equal(await getContributions({ token: 'synthetic-test-token', fetcher }), null);
	}
});

test('one bounded request, only aggregate calendar fields, successful complete year', async () => {
	const now = new Date('2026-01-03T12:00:00Z');
	const window = contributionWindow(now);
	const weeks: ReturnType<typeof fixture>['weeks'] = [];
	for (let time = Date.parse(window.from); time <= now.getTime(); time += 86_400_000) {
		const date = new Date(time);
		if (!weeks.length || date.getUTCDay() === 0) weeks.push({ contributionDays: [] });
		weeks.at(-1)!.contributionDays.push({ date: date.toISOString().slice(0, 10), weekday: date.getUTCDay(), contributionCount: 1, contributionLevel: 'FIRST_QUARTILE' });
	}
	let calls = 0;
	const calendar = await getContributions({ token: 'synthetic-test-token', now, fetcher: async (url, options) => {
		calls++;
		assert.equal(url, 'https://api.github.com/graphql');
		assert.ok(options?.signal instanceof AbortSignal);
		const request = JSON.parse(options?.body as string);
		assert.deepEqual(request.variables, { login: 'ValentinoMensio', ...window });
		assert.ok(!request.query.includes('repositories'));
		return Response.json({ data: { user: { contributionsCollection: { contributionCalendar: { totalContributions: 365, weeks } } } } });
	} });
	assert.equal(calls, 1);
	assert.equal(calendar?.total, 365);
	assert.equal(calendar?.months.filter(Boolean).length, 13);
	assert.equal(calendar?.weeks.flat().filter(Boolean).length, 365);
});
