import * as duckdb from '@duckdb/duckdb-wasm';
import type {
	Session,
	OverviewMetrics,
	FunnelDataPoint,
	DimensionDataPoint,
	DimensionType,
	TrendDataPoint,
	FilterState,
	Pagination,
	PaginatedResult
} from '@/lib/types';

let db: duckdb.AsyncDuckDB | null = null;
let initPromise: Promise<void> | null = null;

async function initDuckDB(): Promise<void> {
	if (db) return;
	if (initPromise) return initPromise;

	initPromise = (async () => {
		const DUCKDB_BUNDLE = duckdb.getJsDelivrBundles();
		const bundle = await duckdb.selectBundle(DUCKDB_BUNDLE);

		const worker = new Worker(bundle.mainWorker!);
		const logger = new duckdb.ConsoleLogger();
		db = new duckdb.AsyncDuckDB(logger, worker);
		await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

		const csvUrl = '/data/sessions.csv';
		const response = await fetch(csvUrl);
		const csvText = await response.text();

		const conn = await db.connect();
		await conn.query(`
			CREATE TABLE sessions AS 
			SELECT * FROM read_csv_auto(
				'${csvUrl}',
				header=true,
				columns={
					session_id: 'VARCHAR',
					user_id: 'VARCHAR',
					customer_level: 'VARCHAR',
					channel: 'VARCHAR',
					version: 'VARCHAR',
					start_time: 'TIMESTAMP',
					end_time: 'TIMESTAMP',
					total_rounds: 'INTEGER',
					intent_tag: 'VARCHAR',
					is_transfer_to_human: 'BOOLEAN',
					satisfaction_score: 'INTEGER',
					user_question: 'VARCHAR',
					bot_answer: 'VARCHAR',
					transfer_reason: 'VARCHAR',
					hour_of_day: 'INTEGER',
					day_of_week: 'INTEGER'
				}
			)
		`);
		await conn.close();

		console.log('DuckDB initialized with', csvUrl);
	})();

	return initPromise;
}

function buildWhereClause(filters: FilterState): { clause: string; params: any[] } {
	const conditions: string[] = [];
	const params: any[] = [];

	conditions.push('start_time >= ?');
	params.push(filters.startDate);

	conditions.push('start_time <= ?');
	params.push(filters.endDate + ' 23:59:59');

	if (filters.channels.length > 0) {
		conditions.push(`channel IN (${filters.channels.map(() => '?').join(',')})`);
		params.push(...filters.channels);
	}

	if (filters.versions.length > 0) {
		conditions.push(`version IN (${filters.versions.map(() => '?').join(',')})`);
		params.push(...filters.versions);
	}

	if (filters.customerLevels.length > 0) {
		conditions.push(`customer_level IN (${filters.customerLevels.map(() => '?').join(',')})`);
		params.push(...filters.customerLevels);
	}

	if (filters.intentTags.length > 0) {
		conditions.push(`intent_tag IN (${filters.intentTags.map(() => '?').join(',')})`);
		params.push(...filters.intentTags);
	}

	return {
		clause: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
		params
	};
}

export async function getOverviewMetrics(filters: FilterState): Promise<OverviewMetrics> {
	await initDuckDB();
	const conn = await db!.connect();
	const { clause, params } = buildWhereClause(filters);

	const result = await conn.query(
		`
		SELECT
			COUNT(*) as total_sessions,
			SUM(CASE WHEN is_transfer_to_human THEN 1 ELSE 0 END) as total_transfers,
			AVG(satisfaction_score) as avg_satisfaction,
			AVG(total_rounds) as avg_rounds
		FROM sessions
		${clause}
	`,
		params
	);

	const row = result.toArray()[0];
	const total = Number(row.total_sessions);
	const transfers = Number(row.total_transfers);

	await conn.close();

	return {
		total_sessions: total,
		transfer_rate: total > 0 ? transfers / total : 0,
		avg_satisfaction: Number(row.avg_satisfaction) || 0,
		avg_rounds: Number(row.avg_rounds) || 0,
		total_transfers: transfers,
		resolved_by_bot: total - transfers
	};
}

export async function getFunnelData(filters: FilterState): Promise<FunnelDataPoint[]> {
	await initDuckDB();
	const conn = await db!.connect();
	const { clause, params } = buildWhereClause(filters);

	const result = await conn.query(
		`
		SELECT
			COUNT(*) as total,
			SUM(CASE WHEN intent_tag IS NOT NULL AND intent_tag != '' THEN 1 ELSE 0 END) as with_intent,
			SUM(CASE WHEN is_transfer_to_human THEN 1 ELSE 0 END) as transfers,
			SUM(CASE WHEN satisfaction_score > 0 THEN 1 ELSE 0 END) as with_satisfaction
		FROM sessions
		${clause}
	`,
		params
	);

	const row = result.toArray()[0];
	const total = Number(row.total);
	const withIntent = Number(row.with_intent);
	const transfers = Number(row.transfers);
	const withSatisfaction = Number(row.with_satisfaction);

	await conn.close();

	return [
		{ name: '会话接入', value: total, rate: 1 },
		{ name: '意图识别', value: withIntent, rate: total > 0 ? withIntent / total : 0 },
		{ name: '机器人回复', value: total - transfers, rate: total > 0 ? (total - transfers) / total : 0 },
		{ name: '转人工', value: transfers, rate: total > 0 ? transfers / total : 0 },
		{ name: '满意度评价', value: withSatisfaction, rate: total > 0 ? withSatisfaction / total : 0 }
	];
}

export async function getDimensionAnalysis(
	dimension: DimensionType,
	filters: FilterState
): Promise<DimensionDataPoint[]> {
	await initDuckDB();
	const conn = await db!.connect();
	const { clause, params } = buildWhereClause(filters);

	const dimensionColumn = {
		intent: 'intent_tag',
		channel: 'channel',
		hour: "STRFTIME('%H:00', start_time)",
		level: 'customer_level',
		version: 'version'
	}[dimension];

	const result = await conn.query(
		`
		SELECT
			${dimensionColumn} as dimension_value,
			COUNT(*) as total_sessions,
			SUM(CASE WHEN is_transfer_to_human THEN 1 ELSE 0 END) as transfer_count,
			AVG(satisfaction_score) as avg_satisfaction,
			AVG(total_rounds) as avg_rounds
		FROM sessions
		${clause}
		GROUP BY dimension_value
		ORDER BY transfer_count * 1.0 / COUNT(*) DESC
	`,
		params
	);

	const rows = result.toArray();
	await conn.close();

	return rows.map((row) => ({
		dimension,
		dimension_value: String(row.dimension_value),
		total_sessions: Number(row.total_sessions),
		transfer_count: Number(row.transfer_count),
		transfer_rate:
			Number(row.total_sessions) > 0
				? Number(row.transfer_count) / Number(row.total_sessions)
				: 0,
		avg_satisfaction: Number(row.avg_satisfaction) || 0,
		avg_rounds: Number(row.avg_rounds) || 0,
		is_low_sample: Number(row.total_sessions) < 30
	}));
}

export async function getSatisfactionTrend(
	granularity: 'hour' | 'day',
	filters: FilterState
): Promise<TrendDataPoint[]> {
	await initDuckDB();
	const conn = await db!.connect();
	const { clause, params } = buildWhereClause(filters);

	const timeFormat = granularity === 'hour' ? "'%m/%d %H:00'" : "'%Y-%m-%d'";

	const result = await conn.query(
		`
		SELECT
			STRFTIME(${timeFormat}, start_time) as time,
			COUNT(*) as total_sessions,
			SUM(CASE WHEN is_transfer_to_human THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as transfer_rate,
			AVG(satisfaction_score) as avg_satisfaction
		FROM sessions
		${clause}
		GROUP BY time
		ORDER BY time ASC
	`,
		params
	);

	const rows = result.toArray();
	await conn.close();

	return rows.map((row) => ({
		time: String(row.time),
		avg_satisfaction: Number(row.avg_satisfaction) || 0,
		transfer_rate: Number(row.transfer_rate) || 0,
		total_sessions: Number(row.total_sessions)
	}));
}

export async function getSessionDetails(
	filters: FilterState,
	pagination: Pagination,
	dimension?: DimensionType,
	dimensionValue?: string
): Promise<PaginatedResult<Session>> {
	await initDuckDB();
	const conn = await db!.connect();

	let { clause, params } = buildWhereClause(filters);

	if (dimension && dimensionValue) {
		const dimensionColumn = {
			intent: 'intent_tag',
			channel: 'channel',
			hour: "STRFTIME('%H:00', start_time)",
			level: 'customer_level',
			version: 'version'
		}[dimension];

		if (clause) {
			clause += ` AND ${dimensionColumn} = ?`;
		} else {
			clause = `WHERE ${dimensionColumn} = ?`;
		}
		params.push(dimensionValue);
	}

	const countResult = await conn.query(
		`SELECT COUNT(*) as total FROM sessions ${clause}`,
		params
	);
	const total = Number(countResult.toArray()[0].total);

	const dataResult = await conn.query(
		`
		SELECT * FROM sessions
		${clause}
		ORDER BY start_time DESC
		LIMIT ? OFFSET ?
	`,
		[...params, pagination.pageSize, (pagination.page - 1) * pagination.pageSize]
	);

	const rows = dataResult.toArray();
	await conn.close();

	return {
		data: rows.map((row) => ({
			session_id: String(row.session_id),
			user_id: String(row.user_id),
			customer_level: String(row.customer_level),
			channel: String(row.channel),
			version: String(row.version),
			start_time: String(row.start_time),
			end_time: String(row.end_time),
			total_rounds: Number(row.total_rounds),
			intent_tag: String(row.intent_tag),
			is_transfer_to_human: Boolean(row.is_transfer_to_human),
			satisfaction_score: Number(row.satisfaction_score),
			user_question: String(row.user_question),
			bot_answer: String(row.bot_answer),
			transfer_reason: row.transfer_reason ? String(row.transfer_reason) : undefined,
			hour_of_day: Number(row.hour_of_day),
			day_of_week: Number(row.day_of_week)
		})),
		total,
		page: pagination.page,
		pageSize: pagination.pageSize
	};
}

export async function getFailureExamples(
	filters: FilterState,
	limit = 10
): Promise<Session[]> {
	const result = await getSessionDetails(
		{ ...filters, intentTags: [], channels: [], customerLevels: [], versions: [] },
		{ page: 1, pageSize: limit }
	);
	return result.data.filter((s) => s.is_transfer_to_human).slice(0, limit);
}

export async function getDistinctValues(): Promise<{
	intents: string[];
	channels: string[];
	versions: string[];
	customerLevels: string[];
}> {
	await initDuckDB();
	const conn = await db!.connect();

	const [intentsRes, channelsRes, versionsRes, levelsRes] = await Promise.all([
		conn.query("SELECT DISTINCT intent_tag FROM sessions WHERE intent_tag IS NOT NULL ORDER BY intent_tag"),
		conn.query("SELECT DISTINCT channel FROM sessions ORDER BY channel"),
		conn.query("SELECT DISTINCT version FROM sessions ORDER BY version"),
		conn.query("SELECT DISTINCT customer_level FROM sessions ORDER BY customer_level")
	]);

	await conn.close();

	return {
		intents: intentsRes.toArray().map((r) => String(r.intent_tag)),
		channels: channelsRes.toArray().map((r) => String(r.channel)),
		versions: versionsRes.toArray().map((r) => String(r.version)),
		customerLevels: levelsRes.toArray().map((r) => String(r.customer_level))
	};
}
