// Build-time only. Never import this module from a client script.
export const GITHUB_LOGIN = 'ValentinoMensio';
const LEVELS = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];

export type ContributionDay = { date: string; count: number; level: number; weekday: number };
export type ContributionCalendar = {
	from: string;
	to: string;
	total: number;
	weeks: (ContributionDay | null)[][];
	months: string[];
};

export function contributionWindow(now = new Date()) {
	const start = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()));
	// Clamp February 29 before advancing to the first included day.
	if (start.getUTCMonth() !== now.getUTCMonth()) start.setUTCDate(0);
	start.setUTCDate(start.getUTCDate() + 1);
	return { from: start.toISOString(), to: now.toISOString() };
}

export function parseCalendar(value: unknown, from: string, to: string): ContributionCalendar {
	const calendar = value as { totalContributions?: unknown; weeks?: { contributionDays?: unknown[] }[] };
	if (!calendar || !Number.isSafeInteger(calendar.totalContributions) || (calendar.totalContributions as number) < 0 || !Array.isArray(calendar.weeks)) {
		throw new Error('Invalid calendar');
	}
	const firstDate = from.slice(0, 10);
	const lastDate = to.slice(0, 10);
	let expected = Date.parse(firstDate);
	let total = 0;
	const weeks = calendar.weeks.map((week) => {
		if (!Array.isArray(week?.contributionDays)) throw new Error('Invalid week');
		const days: (ContributionDay | null)[] = Array(7).fill(null);
		for (const raw of week.contributionDays) {
			const day = raw as { date: string; weekday: number; contributionCount: number; contributionLevel: string };
			if (!day || typeof day.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day.date)) throw new Error('Invalid day');
			if (day.date < firstDate || day.date > lastDate) continue;
			const timestamp = Date.parse(day.date);
			const level = LEVELS.indexOf(day.contributionLevel);
			if (timestamp !== expected || new Date(timestamp).toISOString().slice(0, 10) !== day.date ||
				!Number.isSafeInteger(day.contributionCount) || day.contributionCount < 0 || level < 0 ||
				day.weekday !== new Date(timestamp).getUTCDay() || days[day.weekday] !== null) {
				throw new Error('Invalid contribution data');
			}
			days[day.weekday] = { date: day.date, count: day.contributionCount, level, weekday: day.weekday };
			total += day.contributionCount;
			expected += 86_400_000;
		}
		return days;
	}).filter((week) => week.some(Boolean));
	if (expected !== Date.parse(lastDate) + 86_400_000 || total !== calendar.totalContributions) throw new Error('Incomplete calendar');
	const monthFormat = new Intl.DateTimeFormat('es-AR', { month: 'short', timeZone: 'UTC' });
	const months = weeks.map((week, index) => {
		const firstOfMonth = week.find((day) => day?.date.endsWith('-01'));
		const day = firstOfMonth ?? (index === 0 ? week.find(Boolean) : null);
		return day ? monthFormat.format(new Date(day.date)) : '';
	});
	return { from: firstDate, to: lastDate, total, weeks, months };
}

export async function getContributions({
	token,
	now = new Date(),
	fetcher = fetch,
}: { token?: string; now?: Date; fetcher?: typeof fetch } = {}): Promise<ContributionCalendar | null> {
	if (!token?.trim()) {
		console.warn('[github-calendar] Sin token de build; se mostrará el estado no disponible.');
		return null;
	}
	const { from, to } = contributionWindow(now);
	try {
		const response = await fetcher('https://api.github.com/graphql', {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'BlogPersonal-build' },
			signal: AbortSignal.timeout(8_000),
			body: JSON.stringify({
				query: `query Calendar($login: String!, $from: DateTime!, $to: DateTime!) {
					user(login: $login) { contributionsCollection(from: $from, to: $to) {
						contributionCalendar { totalContributions weeks { contributionDays {
							date weekday contributionCount contributionLevel
						} } }
					} }
				}`,
				variables: { login: GITHUB_LOGIN, from, to },
			}),
		});
		if (!response.ok) throw new Error('GitHub HTTP error');
		const result = await response.json();
		if (result.errors?.length) throw new Error('GitHub GraphQL error');
		return parseCalendar(result.data?.user?.contributionsCollection?.contributionCalendar, from, to);
	} catch {
		// Do not log upstream errors, headers or payloads: they may contain sensitive data.
		console.warn('[github-calendar] No se pudo obtener un calendario válido; se mostrará el estado no disponible.');
		return null;
	}
}
