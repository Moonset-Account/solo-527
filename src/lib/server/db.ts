import duckdb from 'duckdb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: duckdb.Database | null = null;

export function getDb(): duckdb.Database {
	if (!db) {
		db = new duckdb.Database(':memory:');
		initializeTables(db);
		generateSampleData(db);
	}
	return db;
}

function initializeTables(database: duckdb.Database) {
	database.exec(`
		CREATE TABLE activities (
			activity_id VARCHAR PRIMARY KEY,
			name VARCHAR,
			type VARCHAR,
			start_time TIMESTAMP,
			community_id VARCHAR,
			community_name VARCHAR,
			weather VARCHAR
		);

		CREATE TABLE registrations (
			reg_id VARCHAR PRIMARY KEY,
			activity_id VARCHAR,
			user_id VARCHAR,
			register_time TIMESTAMP,
			original_register_time TIMESTAMP,
			channel VARCHAR,
			status VARCHAR,
			cancel_reason VARCHAR,
			cancel_reason_tag VARCHAR,
			is_waitlist_converted BOOLEAN DEFAULT false,
			checkin_time TIMESTAMP
		);

		CREATE TABLE users (
			user_id VARCHAR PRIMARY KEY,
			age INTEGER,
			age_group VARCHAR,
			is_minor BOOLEAN
		);

		CREATE TABLE feedbacks (
			feedback_id VARCHAR PRIMARY KEY,
			reg_id VARCHAR,
			rating INTEGER,
			content VARCHAR,
			topics VARCHAR[]
		);

		CREATE TABLE caliber_versions (
			version_id VARCHAR PRIMARY KEY,
			version_name VARCHAR,
			effective_date TIMESTAMP,
			type_mapping JSON,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			created_by VARCHAR,
			is_active BOOLEAN DEFAULT true
		);
	`);
}

function generateSampleData(database: duckdb.Database) {
	const communities = [
		{ id: 'c001', name: '阳光社区' },
		{ id: 'c002', name: '和平社区' },
		{ id: 'c003', name: '幸福社区' },
		{ id: 'c004', name: '新华社区' },
		{ id: 'c005', name: '东方社区' }
	];

	const activityTypes = ['亲子活动', '健身运动', '文化讲座', '手工制作', '户外探险', '音乐表演', '美食节', '科技体验'];
	const weatherConditions = ['晴天', '多云', '小雨', '阴天', '阵雨'];
	const channels = ['微信公众号', '社区公告', '朋友推荐', 'APP推送', '短信通知'];
	const ageGroups = ['18以下', '18-25', '26-35', '36-45', '46-55', '56以上'];
	const cancelReasons = [
		{ reason: '临时有事', tag: '时间冲突' },
		{ reason: '天气不好', tag: '天气原因' },
		{ reason: '身体不适', tag: '个人原因' },
		{ reason: '活动内容不符预期', tag: '内容问题' },
		{ reason: '距离太远', tag: '位置问题' },
		{ reason: '家人反对', tag: '个人原因' },
		{ reason: '名额太少没抢到', tag: '名额问题' }
	];
	const feedbackTopics = ['活动有趣', '组织很好', '场地不错', '时间合适', '内容丰富', '希望多办', '建议改进'];

	let activitiesInsert = 'INSERT INTO activities VALUES ';
	const activityValues: string[] = [];
	for (let i = 1; i <= 30; i++) {
		const community = communities[Math.floor(Math.random() * communities.length)];
		const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
		const weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
		const month = Math.floor(Math.random() * 3) + 4;
		const day = Math.floor(Math.random() * 28) + 1;
		activityValues.push(
			`('a${String(i).padStart(3, '0')}', '${activityType}活动${i}', '${activityType}', '2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 14:00:00', '${community.id}', '${community.name}', '${weather}')`
		);
	}
	activitiesInsert += activityValues.join(', ') + ';';
	database.exec(activitiesInsert);

	let usersInsert = 'INSERT INTO users VALUES ';
	const userValues: string[] = [];
	for (let i = 1; i <= 500; i++) {
		const age = Math.floor(Math.random() * 70) + 8;
		let ageGroup: string;
		if (age < 18) ageGroup = '18以下';
		else if (age <= 25) ageGroup = '18-25';
		else if (age <= 35) ageGroup = '26-35';
		else if (age <= 45) ageGroup = '36-45';
		else if (age <= 55) ageGroup = '46-55';
		else ageGroup = '56以上';
		userValues.push(`('u${String(i).padStart(3, '0')}', ${age}, '${ageGroup}', ${age < 18})`);
	}
	usersInsert += userValues.join(', ') + ';';
	database.exec(usersInsert);

	let regInsert = 'INSERT INTO registrations VALUES ';
	const regValues: string[] = [];
	let regId = 1;
	for (let a = 1; a <= 30; a++) {
		const numReg = Math.floor(Math.random() * 80) + 20;
		const activityId = `a${String(a).padStart(3, '0')}`;
		for (let r = 0; r < numReg; r++) {
			const userId = `u${String(Math.floor(Math.random() * 500) + 1).padStart(3, '0')}`;
			const channel = channels[Math.floor(Math.random() * channels.length)];
			const month = Math.floor(Math.random() * 3) + 4;
			const day = Math.floor(Math.random() * 28) + 1;
			const hour = Math.floor(Math.random() * 12) + 8;
			const registerTime = `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;
			
			const isWaitlist = Math.random() < 0.15;
			const waitlistDays = isWaitlist ? Math.floor(Math.random() * 5) + 1 : 0;
			const originalTime = isWaitlist 
				? `2025-${String(month).padStart(2, '0')}-${String(Math.max(1, day - waitlistDays)).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`
				: registerTime;

			const rand = Math.random();
			let status: string;
			let cancelReason: string | null = null;
			let cancelTag: string | null = null;
			let checkinTime: string | null = null;

			if (rand < 0.6) {
				status = 'checked_in';
				checkinTime = `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 14:15:00`;
			} else if (rand < 0.8) {
				status = 'registered';
			} else {
				status = 'cancelled';
				const cr = cancelReasons[Math.floor(Math.random() * cancelReasons.length)];
				cancelReason = `'${cr.reason}'`;
				cancelTag = `'${cr.tag}'`;
			}

			regValues.push(
				`('r${String(regId).padStart(4, '0')}', '${activityId}', '${userId}', '${registerTime}', '${originalTime}', '${channel}', '${status}', ${cancelReason}, ${cancelTag}, ${isWaitlist}, ${checkinTime ? `'${checkinTime}'` : null})`
			);
			regId++;
		}
	}
	regInsert += regValues.join(', ') + ';';
	database.exec(regInsert);

	let feedbackInsert = 'INSERT INTO feedbacks VALUES ';
	const feedbackValues: string[] = [];
	let fbId = 1;
	for (let r = 1; r < regId; r++) {
		if (Math.random() < 0.4) {
			const rating = Math.floor(Math.random() * 3) + 3;
			const numTopics = Math.floor(Math.random() * 3) + 1;
			const topics: string[] = [];
			for (let t = 0; t < numTopics; t++) {
				topics.push(feedbackTopics[Math.floor(Math.random() * feedbackTopics.length)]);
			}
			const uniqueTopics = [...new Set(topics)];
			feedbackValues.push(
				`('f${String(fbId).padStart(4, '0')}', 'r${String(r).padStart(4, '0')}', ${rating}, '活动很棒，收获很多！', ARRAY[${uniqueTopics.map(t => `'${t}'`).join(', ')}]::VARCHAR[])`
			);
			fbId++;
		}
	}
	feedbackInsert += feedbackValues.join(', ') + ';';
	database.exec(feedbackInsert);

	database.exec(`
		INSERT INTO caliber_versions VALUES
		('v1', '初始口径', '2025-01-01 00:00:00', '{}', '2025-01-01 00:00:00', 'admin', true),
		('v2', '分类优化版', '2025-05-01 00:00:00', '{"户外探险": "户外运动", "健身运动": "户外运动"}', '2025-05-01 00:00:00', 'admin', false)
	`);

	console.log('Sample data generated successfully');
}

function convertBigIntToNumber(obj: any): any {
	if (obj === null || obj === undefined) return obj;
	if (typeof obj === 'bigint') return Number(obj);
	if (Array.isArray(obj)) return obj.map(convertBigIntToNumber);
	if (typeof obj === 'object') {
		const converted: Record<string, any> = {};
		for (const key of Object.keys(obj)) {
			converted[key] = convertBigIntToNumber(obj[key]);
		}
		return converted;
	}
	return obj;
}

export function query(sql: string, params: any[] = []): Promise<any[]> {
	return new Promise((resolve, reject) => {
		const db = getDb();
		db.all(sql, ...params, (err, rows) => {
			if (err) reject(err);
			else resolve(convertBigIntToNumber(rows));
		});
	});
}
