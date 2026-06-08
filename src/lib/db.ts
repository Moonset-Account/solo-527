import type {
	FilterState,
	BottleneckData,
	HeatmapData,
	VersionCompareData,
	PathFlowNode,
	PathFlowLink,
	ViewingRecord,
	QuizRecord,
	WrongAnswerRecord,
	DiscussionRecord,
	RefundRecord,
	ChapterVersion
} from './types';
import { generateMockData } from './mock-data';

type DuckDBConn = {
	query: (sql: string) => Promise<any[]>;
	close: () => Promise<void>;
};

let conn: DuckDBConn | null = null;
let useDuckDB = false;

const data: {
	viewings: ViewingRecord[];
	quizzes: QuizRecord[];
	wrongAnswers: WrongAnswerRecord[];
	discussions: DiscussionRecord[];
	refunds: RefundRecord[];
	chapterVersions: ChapterVersion[];
} = {
	viewings: [],
	quizzes: [],
	wrongAnswers: [],
	discussions: [],
	refunds: [],
	chapterVersions: []
};

function filterArray<T extends { date: string; chapter_id?: string; chapter_version?: string }>(
	arr: T[],
	filter: FilterState
): T[] {
	return arr.filter((r) => {
		if (filter.dateRange[0] && r.date < filter.dateRange[0]) return false;
		if (filter.dateRange[1] && r.date > filter.dateRange[1]) return false;
		if (filter.chapters.length > 0 && r.chapter_id && !filter.chapters.includes(r.chapter_id))
			return false;
		if (filter.versions.length > 0 && r.chapter_version && !filter.versions.includes(r.chapter_version))
			return false;
		return true;
	});
}

function buildWhere(filter: FilterState, tableAlias = ''): string {
	const parts: string[] = [];
	const prefix = tableAlias ? `${tableAlias}.` : '';
	if (filter.dateRange[0]) parts.push(`${prefix}date >= '${filter.dateRange[0]}'`);
	if (filter.dateRange[1]) parts.push(`${prefix}date <= '${filter.dateRange[1]}'`);
	if (filter.chapters.length > 0)
		parts.push(`${prefix}chapter_id IN (${filter.chapters.map((c) => `'${c}'`).join(',')})`);
	if (filter.versions.length > 0)
		parts.push(`${prefix}chapter_version IN (${filter.versions.map((v) => `'${v}'`).join(',')})`);
	return parts.length > 0 ? 'WHERE ' + parts.join(' AND ') : '';
}

async function tryInitDuckDB(): Promise<DuckDBConn | null> {
	try {
		const duckdb = await import('@duckdb/duckdb-wasm');

		const DUCKDB_BASE = '/duckdb';

		const bundles = {
			mvp: {
				mainModule: `${DUCKDB_BASE}/duckdb-mvp.wasm`,
				mainWorker: `${DUCKDB_BASE}/duckdb-browser-mvp.worker.js`,
			},
			eh: {
				mainModule: `${DUCKDB_BASE}/duckdb-eh.wasm`,
				mainWorker: `${DUCKDB_BASE}/duckdb-browser-eh.worker.js`,
			}
		};

		const bundle = await duckdb.selectBundle(bundles);

		const worker = new Worker(bundle.mainWorker!, { type: 'module' });
		const logger = new duckdb.ConsoleLogger();
		const db = new duckdb.AsyncDuckDB(logger, worker);
		await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
		const c = await db.connect();

		await c.query(`CREATE TABLE viewings (student_id VARCHAR, chapter_id VARCHAR, chapter_version VARCHAR, watch_duration INTEGER, completion_rate DOUBLE, date VARCHAR, is_transition BOOLEAN)`);
		await c.query(`CREATE TABLE quizzes (student_id VARCHAR, chapter_id VARCHAR, chapter_version VARCHAR, quiz_id VARCHAR, score INTEGER, total INTEGER, date VARCHAR)`);
		await c.query(`CREATE TABLE wrong_answers (student_id VARCHAR, chapter_id VARCHAR, chapter_version VARCHAR, quiz_id VARCHAR, question_id VARCHAR, selected_option VARCHAR, correct_option VARCHAR, date VARCHAR)`);
		await c.query(`CREATE TABLE discussions (student_id VARCHAR, chapter_id VARCHAR, topic VARCHAR, content VARCHAR, topic_summary VARCHAR, date VARCHAR)`);
		await c.query(`CREATE TABLE refunds (student_id VARCHAR, chapter_id VARCHAR, reason VARCHAR, feedback VARCHAR, date VARCHAR)`);
		await c.query(`CREATE TABLE chapter_versions (chapter_id VARCHAR, version VARCHAR, release_date VARCHAR, changes_summary VARCHAR)`);

		function toInsert(table: string, rows: Record<string, unknown>[]) {
			if (rows.length === 0) return '';
			const cols = Object.keys(rows[0]);
			const vals = rows.map((r) =>
				`(${cols.map((c) => {
					const v = r[c];
					if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
					if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
					return String(v);
				}).join(',')})`
			).join(',');
			return `INSERT INTO ${table} (${cols.join(',')}) VALUES ${vals}`;
		}

		const batch = 500;
		for (let i = 0; i < data.viewings.length; i += batch) {
			await c.query(toInsert('viewings', data.viewings.slice(i, i + batch) as any));
		}
		for (let i = 0; i < data.quizzes.length; i += batch) {
			await c.query(toInsert('quizzes', data.quizzes.slice(i, i + batch) as any));
		}
		for (let i = 0; i < data.wrongAnswers.length; i += batch) {
			await c.query(toInsert('wrong_answers', data.wrongAnswers.slice(i, i + batch) as any));
		}
		for (let i = 0; i < data.discussions.length; i += batch) {
			await c.query(toInsert('discussions', data.discussions.slice(i, i + batch) as any));
		}
		for (let i = 0; i < data.refunds.length; i += batch) {
			await c.query(toInsert('refunds', data.refunds.slice(i, i + batch) as any));
		}
		await c.query(toInsert('chapter_versions', data.chapterVersions as any));

		return {
			query: async (sql: string) => {
				const result = await c.query(sql);
				return result.toArray().map((row: any) => row.toJSON());
			},
			close: async () => {
				await c.close();
				await db.terminate();
				await worker.terminate();
			}
		};
	} catch (e) {
		console.warn('DuckDB-WASM init failed, using in-memory fallback:', e);
		return null;
	}
}

export async function initDB(): Promise<boolean> {
	const mock = generateMockData();
	data.viewings = mock.viewings;
	data.quizzes = mock.quizzes;
	data.wrongAnswers = mock.wrongAnswers;
	data.discussions = mock.discussions;
	data.refunds = mock.refunds;
	data.chapterVersions = mock.chapterVersions;

	conn = await tryInitDuckDB();
	useDuckDB = conn !== null;
	return useDuckDB;
}

export function isDuckDBActive(): boolean {
	return useDuckDB;
}

export function getChapterVersions(): ChapterVersion[] {
	return data.chapterVersions;
}

export function getChapterList(): string[] {
	return [...new Set(data.viewings.map((v) => v.chapter_id))];
}

export function getVersionList(): string[] {
	return [...new Set(data.viewings.map((v) => v.chapter_version))];
}

export function getSampleSize(filter: FilterState): number {
	const filtered = filterArray(data.viewings, filter);
	return new Set(filtered.map((v) => v.student_id)).size;
}

export async function queryPathFlow(
	filter: FilterState
): Promise<{ nodes: PathFlowNode[]; links: PathFlowLink[] }> {
	if (useDuckDB && conn) {
		const where = buildWhere(filter, 'v');
		const flowRows = await conn.query(`
			WITH distinct_chapters AS (
				SELECT DISTINCT student_id, chapter_id FROM viewings v ${where}
			),
			ordered AS (
				SELECT student_id, chapter_id,
					ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY chapter_id) as step
				FROM distinct_chapters
			),
			with_source AS (
				SELECT
					CASE WHEN step = 1 THEN '开始' ELSE LAG(chapter_id) OVER (PARTITION BY student_id ORDER BY step) END as source,
					chapter_id as target
				FROM ordered
			)
			SELECT source, target, COUNT(*)::INTEGER as value
			FROM with_source GROUP BY source, target
		`);
		const dropRows = await conn.query(`
			WITH distinct_chapters AS (
				SELECT DISTINCT student_id, chapter_id FROM viewings v ${where}
			),
			last_ch AS (
				SELECT student_id, chapter_id,
					ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY chapter_id DESC) as rn
				FROM distinct_chapters
			)
			SELECT chapter_id as source, '流失' as target, COUNT(*)::INTEGER as value
			FROM last_ch WHERE rn = 1 GROUP BY chapter_id
		`);
		const rows = [...flowRows, ...dropRows];
		const nodeSet = new Set<string>();
		rows.forEach((r: any) => { nodeSet.add(r.source); nodeSet.add(r.target); });
		return {
			nodes: [...nodeSet].map((name) => ({
				name,
				itemStyle: name === '开始' ? { color: '#5470c6' } : name === '流失' ? { color: '#ee6666' } : undefined
			})),
			links: rows.map((r: any) => ({
				source: r.source,
				target: r.target,
				value: r.value,
				lineStyle: r.target === '流失' ? { color: '#ee6666' } : undefined
			}))
		};
	}

	const filtered = filterArray(data.viewings, filter);
	const chapterOrder = getChapterList();
	const studentChapters = new Map<string, string[]>();
	filtered.forEach((v) => {
		if (!studentChapters.has(v.student_id)) studentChapters.set(v.student_id, []);
		const chs = studentChapters.get(v.student_id)!;
		if (!chs.includes(v.chapter_id)) chs.push(v.chapter_id);
	});

	const flowMap = new Map<string, number>();
	studentChapters.forEach((chs) => {
		const sorted = chs.sort((a, b) => chapterOrder.indexOf(a) - chapterOrder.indexOf(b));
		for (let i = 0; i < sorted.length; i++) {
			const src = i === 0 ? '开始' : sorted[i - 1];
			const tgt = sorted[i];
			const key = `${src}|${tgt}`;
			flowMap.set(key, (flowMap.get(key) || 0) + 1);
		}
		flowMap.set(`${sorted[sorted.length - 1]}|流失`, (flowMap.get(`${sorted[sorted.length - 1]}|流失`) || 0) + 1);
	});

	const nodeSet = new Set<string>();
	const links: PathFlowLink[] = [];
	flowMap.forEach((value, key) => {
		const [source, target] = key.split('|');
		nodeSet.add(source);
		nodeSet.add(target);
		links.push({ source, target, value, lineStyle: target === '流失' ? { color: '#ee6666' } : undefined });
	});

	return {
		nodes: [...nodeSet].map((name) => ({
			name,
			itemStyle: name === '开始' ? { color: '#5470c6' } : name === '流失' ? { color: '#ee6666' } : undefined
		})),
		links
	};
}

export async function queryBottleneck(filter: FilterState): Promise<BottleneckData[]> {
	if (useDuckDB && conn) {
		const where = buildWhere(filter, 'v');
		const whereQ = buildWhere(filter, 'q');
		const rows = await conn.query(`
			WITH v_stats AS (
				SELECT
					v.chapter_id,
					1.0 - SUM(CASE WHEN v.completion_rate >= 0.8 THEN 1 ELSE 0 END)::DOUBLE / COUNT(*) as dropoff_rate,
					AVG(v.completion_rate) as avg_completion,
					COUNT(*)::INTEGER as sample_size,
					BOOL_OR(v.is_transition) as is_transition
				FROM viewings v ${where}
				GROUP BY v.chapter_id
			),
			q_stats AS (
				SELECT
					q.chapter_id,
					AVG(q.score::DOUBLE / q.total) as avg_score
				FROM quizzes q ${whereQ}
				GROUP BY q.chapter_id
			)
			SELECT v.chapter_id, v.dropoff_rate, v.avg_completion,
				COALESCE(q.avg_score, 0) as avg_score, v.sample_size, v.is_transition
			FROM v_stats v
			LEFT JOIN q_stats q ON v.chapter_id = q.chapter_id
			ORDER BY v.dropoff_rate DESC
		`);
		return rows.map((r: any) => ({
			chapter_id: r.chapter_id,
			dropoff_rate: Math.round(r.dropoff_rate * 100) / 100,
			avg_completion: Math.round(r.avg_completion * 100) / 100,
			avg_score: Math.round(r.avg_score * 100) / 100,
			sample_size: r.sample_size,
			is_transition: r.is_transition
		}));
	}

	const fv = filterArray(data.viewings, filter);
	const fq = filterArray(data.quizzes, filter);
	const stats = new Map<string, { total: number; completed: number; scores: number[]; isTransition: boolean }>();
	fv.forEach((v) => {
		if (!stats.has(v.chapter_id)) stats.set(v.chapter_id, { total: 0, completed: 0, scores: [], isTransition: false });
		const s = stats.get(v.chapter_id)!;
		s.total++;
		if (v.completion_rate >= 0.8) s.completed++;
		if (v.is_transition) s.isTransition = true;
	});
	fq.forEach((q) => {
		if (stats.has(q.chapter_id)) stats.get(q.chapter_id)!.scores.push(q.score / q.total);
	});
	const results: BottleneckData[] = [];
	stats.forEach((s, chapter_id) => {
		results.push({
			chapter_id,
			dropoff_rate: Math.round((1 - s.completed / s.total) * 100) / 100,
			avg_completion: Math.round(fv.filter((v) => v.chapter_id === chapter_id).reduce((a, v) => a + v.completion_rate, 0) / s.total * 100) / 100,
			avg_score: Math.round((s.scores.length > 0 ? s.scores.reduce((a, b) => a + b, 0) / s.scores.length : 0) * 100) / 100,
			sample_size: s.total,
			is_transition: s.isTransition
		});
	});
	return results.sort((a, b) => b.dropoff_rate - a.dropoff_rate);
}

export async function queryHeatmap(filter: FilterState): Promise<HeatmapData[]> {
	if (useDuckDB && conn) {
		const where = buildWhere(filter, 'w');
		const rows = await conn.query(`
			SELECT chapter_id, question_id, COUNT(*)::INTEGER as wrong_count
			FROM wrong_answers w ${where}
			GROUP BY chapter_id, question_id ORDER BY wrong_count DESC
		`);
		return rows as HeatmapData[];
	}

	const filtered = filterArray(data.wrongAnswers, filter);
	const map = new Map<string, number>();
	filtered.forEach((w) => {
		const key = `${w.chapter_id}|${w.question_id}`;
		map.set(key, (map.get(key) || 0) + 1);
	});
	const results: HeatmapData[] = [];
	map.forEach((count, key) => {
		const [chapter_id, question_id] = key.split('|');
		results.push({ chapter_id, question_id, wrong_count: count });
	});
	return results;
}

export async function queryVersionCompare(filter: FilterState): Promise<VersionCompareData[]> {
	if (useDuckDB && conn) {
		const where = buildWhere(filter, 'v');
		const rows = await conn.query(`
			SELECT v.chapter_id, v.chapter_version as version, '完成率' as metric,
				AVG(v.completion_rate) as value, COUNT(DISTINCT v.student_id)::INTEGER as sample_size
			FROM viewings v ${where}
			GROUP BY v.chapter_id, v.chapter_version
		`);
		const rows2 = await conn.query(`
			SELECT q.chapter_id, q.chapter_version as version, '平均分' as metric,
				AVG(q.score::DOUBLE / q.total) as value, COUNT(DISTINCT q.student_id)::INTEGER as sample_size
			FROM quizzes q ${buildWhere(filter, 'q')}
			GROUP BY q.chapter_id, q.chapter_version
		`);
		return [...rows, ...rows2].map((r: any) => ({
			chapter_id: r.chapter_id,
			version: r.version,
			metric: r.metric,
			value: Math.round(r.value * 100) / 100,
			sample_size: r.sample_size
		}));
	}

	const fv = filterArray(data.viewings, filter);
	const fq = filterArray(data.quizzes, filter);
	const vs = new Map<string, { completions: number[]; scores: number[]; count: number }>();
	fv.forEach((v) => {
		const key = `${v.chapter_id}|${v.chapter_version}`;
		if (!vs.has(key)) vs.set(key, { completions: [], scores: [], count: 0 });
		const s = vs.get(key)!;
		s.completions.push(v.completion_rate);
		s.count++;
	});
	fq.forEach((q) => {
		const key = `${q.chapter_id}|${q.chapter_version}`;
		if (vs.has(key)) vs.get(key)!.scores.push(q.score / q.total);
	});
	const results: VersionCompareData[] = [];
	vs.forEach((s, key) => {
		const [chapter_id, version] = key.split('|');
		results.push({
			chapter_id, version, metric: '完成率',
			value: Math.round((s.completions.reduce((a, b) => a + b, 0) / s.completions.length) * 100) / 100,
			sample_size: s.count
		});
		results.push({
			chapter_id, version, metric: '平均分',
			value: Math.round((s.scores.length > 0 ? s.scores.reduce((a, b) => a + b, 0) / s.scores.length : 0) * 100) / 100,
			sample_size: s.count
		});
	});
	return results;
}

export async function queryDiscussions(filter: FilterState): Promise<DiscussionRecord[]> {
	return filterArray(data.discussions, filter);
}

export async function queryRefunds(filter: FilterState): Promise<RefundRecord[]> {
	return filterArray(data.refunds, filter);
}
