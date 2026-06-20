import { writable, derived, get } from 'svelte/store';
import type {
	Trainer,
	Email,
	EmailVersion,
	RiskSample,
	Review,
	ReferenceSource,
	KnowledgeEntry,
	ForbiddenWord,
	MissingReason,
	HitRate,
	HitRateSummary
} from './types';

const now = () => new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const dateStr = (iso: string) => iso.split('T')[0];

const initialTrainers: Trainer[] = [
	{ id: 1, name: '张伟', email: 'zhangwei@company.com', team: '华东区', createdAt: daysAgo(30) },
	{ id: 2, name: '李娜', email: 'lina@company.com', team: '华北区', createdAt: daysAgo(28) },
	{ id: 3, name: '王强', email: 'wangqiang@company.com', team: '华南区', createdAt: daysAgo(25) },
	{ id: 4, name: '赵敏', email: 'zhaomin@company.com', team: '华中区', createdAt: daysAgo(20) }
];

const initialEmails: Email[] = [
	{
		id: 1,
		uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
		subject: '关于 Q3 合作方案的沟通',
		recipient: 'client@example.com',
		sender: 'sales@company.com',
		content:
			'您好客户：\n\n我们保证本季度合作方案收益率不低于 15%，绝对远超行业水平，请尽快签约。\n\n另外，我们可以提供独家回扣返点，具体细节面谈。\n\n此致\n销售团队',
		status: 'pending',
		trainerId: 1,
		riskLevel: 'high',
		needsReview: true,
		reviewed: false,
		createdAt: daysAgo(3),
		updatedAt: daysAgo(1)
	},
	{
		id: 2,
		uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
		subject: '产品演示安排确认',
		recipient: 'prospect@example.com',
		sender: 'sales@company.com',
		content:
			'您好：\n\n感谢您对我们产品的关注，以下是产品演示的时间安排：\n\n- 时间：本周五下午 2:00\n- 地点：线上会议\n- 议程：产品介绍 + Q&A\n\n请确认是否方便。\n\n谢谢',
		status: 'reviewed',
		trainerId: 2,
		riskLevel: 'low',
		needsReview: false,
		reviewed: true,
		reviewedAt: daysAgo(2),
		reviewedBy: '质检主管',
		createdAt: daysAgo(5),
		updatedAt: daysAgo(2)
	},
	{
		id: 3,
		uuid: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
		subject: '合同条款疑问解答',
		recipient: 'partner@example.com',
		sender: 'sales@company.com',
		content:
			'您好：\n\n关于您提到的合同条款，我们承诺所有服务均为行业最佳，没有任何问题。\n\n价格方面我们一定比竞争对手便宜 20%。\n\n请尽快回复。',
		status: 'draft',
		trainerId: 3,
		riskLevel: 'medium',
		needsReview: true,
		reviewed: false,
		createdAt: daysAgo(1),
		updatedAt: daysAgo(0)
	},
	{
		id: 4,
		uuid: 'd4e5f6a7-b8c9-0123-defa-234567890123',
		subject: '感谢您的订单',
		recipient: 'customer@example.com',
		sender: 'sales@company.com',
		content:
			'尊敬的客户：\n\n感谢您选择我们的服务！\n\n订单已确认，预计 3 个工作日内安排交付。\n\n如有任何问题，请随时联系。\n\n此致\n敬礼',
		status: 'sent',
		trainerId: 4,
		riskLevel: 'low',
		needsReview: false,
		reviewed: true,
		sentAt: daysAgo(1),
		reviewedAt: daysAgo(1),
		reviewedBy: '系统自动',
		createdAt: daysAgo(2),
		updatedAt: daysAgo(1)
	},
	{
		id: 5,
		uuid: 'e5f6a7b8-c9d0-1234-efab-345678901234',
		subject: '季度折扣活动通知',
		recipient: 'lead@example.com',
		sender: 'sales@company.com',
		content:
			'您好：\n\n本季度大促，买一送一，错过再等一年！\n\n这是行业最低价，绝对不会让您吃亏。\n\n点击链接立即抢购。',
		status: 'pending',
		trainerId: 1,
		riskLevel: 'medium',
		needsReview: true,
		reviewed: false,
		createdAt: daysAgo(0),
		updatedAt: daysAgo(0)
	}
];

const initialEmailVersions: EmailVersion[] = [
	{
		id: 1,
		emailId: 1,
		version: 1,
		subject: '关于 Q3 合作方案的沟通',
		content:
			'您好客户：\n\n我们的合作方案具有竞争力，请尽快签约。\n\n此致\n销售团队',
		changeNote: '初版草稿',
		createdBy: '张伟',
		createdAt: daysAgo(3)
	},
	{
		id: 2,
		emailId: 1,
		version: 2,
		subject: '关于 Q3 合作方案的沟通',
		content:
			'您好客户：\n\n我们保证本季度合作方案收益率不低于 15%，绝对远超行业水平，请尽快签约。\n\n此致\n销售团队',
		changeNote: '添加收益率承诺',
		createdBy: '张伟',
		createdAt: daysAgo(2)
	},
	{
		id: 3,
		emailId: 1,
		version: 3,
		subject: '关于 Q3 合作方案的沟通',
		content:
			'您好客户：\n\n我们保证本季度合作方案收益率不低于 15%，绝对远超行业水平，请尽快签约。\n\n另外，我们可以提供独家回扣返点，具体细节面谈。\n\n此致\n销售团队',
		changeNote: '增加返点内容',
		createdBy: '张伟',
		createdAt: daysAgo(1)
	},
	{
		id: 4,
		emailId: 3,
		version: 1,
		subject: '合同条款疑问解答',
		content:
			'您好：\n\n关于您提到的合同条款，我们承诺所有服务均为行业最佳，没有任何问题。\n\n请尽快回复。',
		changeNote: '初版',
		createdBy: '王强',
		createdAt: daysAgo(1)
	},
	{
		id: 5,
		emailId: 3,
		version: 2,
		subject: '合同条款疑问解答',
		content:
			'您好：\n\n关于您提到的合同条款，我们承诺所有服务均为行业最佳，没有任何问题。\n\n价格方面我们一定比竞争对手便宜 20%。\n\n请尽快回复。',
		changeNote: '增加价格承诺',
		createdBy: '王强',
		createdAt: daysAgo(0)
	}
];

const initialRiskSamples: RiskSample[] = [
	{
		id: 1,
		emailId: 1,
		emailVersionId: 2,
		riskType: '收益承诺',
		description: '邮件中承诺收益率不低于 15%，违反合规规定',
		severity: 'high',
		location: '正文第一段',
		markedBy: '系统自动',
		resolved: false,
		createdAt: daysAgo(2)
	},
	{
		id: 2,
		emailId: 1,
		emailVersionId: 3,
		riskType: '商业贿赂',
		description: '提及提供回扣返点，涉嫌商业贿赂',
		severity: 'critical',
		location: '正文第二段',
		markedBy: '系统自动',
		resolved: false,
		createdAt: daysAgo(1)
	},
	{
		id: 3,
		emailId: 3,
		emailVersionId: 4,
		riskType: '绝对化用语',
		description: '使用"行业最佳"、"没有任何问题"等绝对化用语',
		severity: 'medium',
		location: '正文第一段',
		markedBy: '系统自动',
		resolved: false,
		createdAt: daysAgo(1)
	},
	{
		id: 4,
		emailId: 3,
		emailVersionId: 5,
		riskType: '价格承诺',
		description: '承诺比竞争对手便宜 20%，无事实依据',
		severity: 'high',
		location: '正文第二段',
		markedBy: '质检主管',
		resolved: false,
		createdAt: daysAgo(0)
	},
	{
		id: 5,
		emailId: 5,
		riskType: '绝对化用语',
		description: '使用"最低价"、"绝对不会吃亏"等绝对化宣传用语',
		severity: 'medium',
		location: '正文',
		markedBy: '系统自动',
		resolved: false,
		createdAt: daysAgo(0)
	}
];

const initialReviews: Review[] = [
	{
		id: 1,
		emailId: 1,
		reviewer: '质检主管',
		comment: '存在严重合规风险，请立即修改收益承诺和返点内容',
		verdict: 'rejected',
		assignedAt: daysAgo(2),
		dueDate: dateStr(daysAgo(0))
	},
	{
		id: 2,
		emailId: 3,
		reviewer: '质检主管',
		verdict: 'pending',
		assignedAt: daysAgo(0),
		dueDate: dateStr(daysAgo(-1))
	},
	{
		id: 3,
		emailId: 5,
		reviewer: '李娜',
		verdict: 'pending',
		assignedAt: daysAgo(0),
		dueDate: dateStr(daysAgo(-2))
	}
];

const initialReferenceSources: ReferenceSource[] = [
	{
		id: 1,
		title: '广告法（2021 修订）',
		category: '法律法规',
		url: 'https://example.com/ad-law',
		source: '国家法律法规数据库',
		publishedAt: '2021-04-29',
		createdAt: daysAgo(60)
	},
	{
		id: 2,
		title: '反不正当竞争法',
		category: '法律法规',
		url: 'https://example.com/competition-law',
		source: '国家法律法规数据库',
		publishedAt: '2019-04-23',
		createdAt: daysAgo(60)
	},
	{
		id: 3,
		title: '销售人员合规手册 v3.0',
		category: '内部规范',
		source: '合规部',
		publishedAt: '2024-01-15',
		createdAt: daysAgo(45)
	},
	{
		id: 4,
		title: '邮件话术规范指南',
		category: '内部规范',
		source: '销售运营部',
		publishedAt: '2024-02-20',
		createdAt: daysAgo(30)
	}
];

const initialKnowledge: KnowledgeEntry[] = [
	{
		id: 1,
		category: '合规要求',
		title: '禁止承诺投资收益率',
		content: '根据《广告法》第二十五条，招商等有投资回报预期的商品或服务广告，不得对未来效果、收益作出保证性承诺，不得明示或暗示保本、无风险或保收益。',
		referenceSourceId: 1,
		tags: '合规,广告法,收益率',
		active: true,
		createdAt: daysAgo(50),
		updatedAt: daysAgo(50)
	},
	{
		id: 2,
		category: '合规要求',
		title: '禁止使用绝对化用语',
		content: '根据《广告法》第九条，广告不得使用"国家级"、"最高级"、"最佳"、"第一"等绝对化用语。包括但不限于：最好、最强、最低价、绝对等。',
		referenceSourceId: 1,
		tags: '合规,广告法,绝对化用语',
		active: true,
		createdAt: daysAgo(50),
		updatedAt: daysAgo(50)
	},
	{
		id: 3,
		category: '合规要求',
		title: '禁止商业贿赂',
		content: '根据《反不正当竞争法》第七条，不得采用财物或其他手段贿赂交易相对方。不得承诺或提供回扣、返点等。',
		referenceSourceId: 2,
		tags: '合规,反不正当竞争法,回扣',
		active: true,
		createdAt: daysAgo(48),
		updatedAt: daysAgo(48)
	},
	{
		id: 4,
		category: '话术模板',
		title: '产品优势表达示例',
		content: '推荐表达：\n- "我们的产品在行业内具有较强的竞争力"\n- "根据第三方评测数据，我们的表现处于行业前列"\n- "许多客户反馈使用效果良好"',
		referenceSourceId: 4,
		tags: '话术,模板,表达',
		active: true,
		createdAt: daysAgo(25),
		updatedAt: daysAgo(10)
	},
	{
		id: 5,
		category: '话术模板',
		title: '邮件开头与结尾规范',
		content: '开头：尊敬的 XX 先生/女士，您好！\n结尾：感谢您的时间，期待您的回复。此致 / 祝商祺',
		referenceSourceId: 4,
		tags: '话术,模板,邮件格式',
		active: true,
		createdAt: daysAgo(25),
		updatedAt: daysAgo(25)
	}
];

const initialForbiddenWords: ForbiddenWord[] = [
	{ id: 1, word: '保证收益', category: '绝对化承诺', severity: 'high', description: '承诺投资收益类词汇', active: true, createdAt: daysAgo(50) },
	{ id: 2, word: '收益率', category: '绝对化承诺', severity: 'high', description: '涉及投资收益率承诺', active: true, createdAt: daysAgo(50) },
	{ id: 3, word: '最佳', category: '绝对化用语', severity: 'medium', description: '《广告法》禁止的绝对化用语', active: true, createdAt: daysAgo(50) },
	{ id: 4, word: '最低价', category: '绝对化用语', severity: 'medium', description: '《广告法》禁止的绝对化用语', active: true, createdAt: daysAgo(50) },
	{ id: 5, word: '绝对', category: '绝对化用语', severity: 'medium', description: '《广告法》禁止的绝对化用语', active: true, createdAt: daysAgo(50) },
	{ id: 6, word: '第一', category: '绝对化用语', severity: 'medium', description: '《广告法》禁止的绝对化用语', active: true, createdAt: daysAgo(50) },
	{ id: 7, word: '回扣', category: '商业贿赂', severity: 'critical', description: '涉嫌商业贿赂词汇', active: true, createdAt: daysAgo(50) },
	{ id: 8, word: '返点', category: '商业贿赂', severity: 'critical', description: '涉嫌商业贿赂词汇', active: true, createdAt: daysAgo(50) },
	{ id: 9, word: '比竞争对手便宜', category: '价格承诺', severity: 'high', description: '无事实依据的价格对比', active: true, createdAt: daysAgo(30) },
	{ id: 10, word: '没有任何问题', category: '绝对化用语', severity: 'medium', description: '过度承诺类词汇', active: true, createdAt: daysAgo(30) }
];

const initialMissingReasons: MissingReason[] = [
	{ id: 1, name: '未引用法律法规', description: '合规声明未引用具体法律条文', createdAt: daysAgo(40) },
	{ id: 2, name: '未引用内部规范', description: '内容未按内部规范话术模板撰写', createdAt: daysAgo(40) },
	{ id: 3, name: '未标注风险提示', description: '涉及投资类内容未附带风险提示语', createdAt: daysAgo(40) },
	{ id: 4, name: '数据来源缺失', description: '引用数据未标注权威来源', createdAt: daysAgo(40) }
];

const initialHitRates: HitRate[] = [
	{ id: 1, emailId: 1, emailVersionId: 2, forbiddenWordId: 2, trainerId: 1, hitType: 'forbidden', matchText: '收益率', hitDate: dateStr(daysAgo(2)), count: 1, createdAt: daysAgo(2) },
	{ id: 2, emailId: 1, emailVersionId: 2, knowledgeId: 1, trainerId: 1, hitType: 'missing_reference', missingReasonId: 1, hitDate: dateStr(daysAgo(2)), count: 1, createdAt: daysAgo(2) },
	{ id: 3, emailId: 1, emailVersionId: 3, forbiddenWordId: 7, trainerId: 1, hitType: 'forbidden', matchText: '回扣', hitDate: dateStr(daysAgo(1)), count: 1, createdAt: daysAgo(1) },
	{ id: 4, emailId: 1, emailVersionId: 3, forbiddenWordId: 8, trainerId: 1, hitType: 'forbidden', matchText: '返点', hitDate: dateStr(daysAgo(1)), count: 1, createdAt: daysAgo(1) },
	{ id: 5, emailId: 1, emailVersionId: 3, knowledgeId: 3, trainerId: 1, hitType: 'missing_reference', missingReasonId: 1, hitDate: dateStr(daysAgo(1)), count: 1, createdAt: daysAgo(1) },
	{ id: 6, emailId: 3, emailVersionId: 4, forbiddenWordId: 3, trainerId: 3, hitType: 'forbidden', matchText: '最佳', hitDate: dateStr(daysAgo(1)), count: 1, createdAt: daysAgo(1) },
	{ id: 7, emailId: 3, emailVersionId: 4, forbiddenWordId: 10, trainerId: 3, hitType: 'forbidden', matchText: '没有任何问题', hitDate: dateStr(daysAgo(1)), count: 1, createdAt: daysAgo(1) },
	{ id: 8, emailId: 3, emailVersionId: 5, forbiddenWordId: 9, trainerId: 3, hitType: 'forbidden', matchText: '比竞争对手便宜', hitDate: dateStr(daysAgo(0)), count: 1, createdAt: daysAgo(0) },
	{ id: 9, emailId: 3, emailVersionId: 5, knowledgeId: 2, trainerId: 3, hitType: 'missing_reference', missingReasonId: 2, hitDate: dateStr(daysAgo(0)), count: 1, createdAt: daysAgo(0) },
	{ id: 10, emailId: 5, forbiddenWordId: 4, trainerId: 1, hitType: 'forbidden', matchText: '最低价', hitDate: dateStr(daysAgo(0)), count: 1, createdAt: daysAgo(0) },
	{ id: 11, emailId: 5, forbiddenWordId: 5, trainerId: 1, hitType: 'forbidden', matchText: '绝对', hitDate: dateStr(daysAgo(0)), count: 1, createdAt: daysAgo(0) },
	{ id: 12, emailId: 2, trainerId: 2, hitType: 'knowledge', knowledgeId: 5, hitDate: dateStr(daysAgo(2)), count: 1, createdAt: daysAgo(2) }
];

export const trainersStore = writable<Trainer[]>(initialTrainers);
export const emailsStore = writable<Email[]>(initialEmails);
export const emailVersionsStore = writable<EmailVersion[]>(initialEmailVersions);
export const riskSamplesStore = writable<RiskSample[]>(initialRiskSamples);
export const reviewsStore = writable<Review[]>(initialReviews);
export const referenceSourcesStore = writable<ReferenceSource[]>(initialReferenceSources);
export const knowledgeStore = writable<KnowledgeEntry[]>(initialKnowledge);
export const forbiddenWordsStore = writable<ForbiddenWord[]>(initialForbiddenWords);
export const missingReasonsStore = writable<MissingReason[]>(initialMissingReasons);
export const hitRatesStore = writable<HitRate[]>(initialHitRates);

export const pendingReviewsCount = derived(reviewsStore, ($reviews) =>
	$reviews.filter((r) => r.verdict === 'pending').length
);

export const pendingRiskCount = derived(riskSamplesStore, ($risks) =>
	$risks.filter((r) => !r.resolved).length
);

export const getTrainerName = (id?: number) => {
	if (!id) return '未分配';
	return get(trainersStore).find((t) => t.id === id)?.name || '未分配';
};

export const getKnowledgeTitle = (id?: number) => {
	if (!id) return '';
	return get(knowledgeStore).find((k) => k.id === id)?.title || '';
};

export const getForbiddenWord = (id?: number) => {
	if (!id) return '';
	return get(forbiddenWordsStore).find((w) => w.id === id)?.word || '';
};

export const getMissingReasonName = (id?: number) => {
	if (!id) return '';
	return get(missingReasonsStore).find((r) => r.id === id)?.name || '';
};

export const getHitRateSummary = (): HitRateSummary => {
	const hits = get(hitRatesStore);
	const trainers = get(trainersStore);
	const reasons = get(missingReasonsStore);

	const byTrainerMap = new Map<number, number>();
	const byDateMap = new Map<string, number>();
	const byReasonMap = new Map<number, number>();
	const byTypeMap = new Map<string, number>();

	for (const hit of hits) {
		if (hit.trainerId) {
			byTrainerMap.set(hit.trainerId, (byTrainerMap.get(hit.trainerId) || 0) + hit.count);
		}
		byDateMap.set(hit.hitDate, (byDateMap.get(hit.hitDate) || 0) + hit.count);
		if (hit.missingReasonId) {
			byReasonMap.set(hit.missingReasonId, (byReasonMap.get(hit.missingReasonId) || 0) + hit.count);
		}
		byTypeMap.set(hit.hitType, (byTypeMap.get(hit.hitType) || 0) + hit.count);
	}

	return {
		totalHits: hits.reduce((sum, h) => sum + h.count, 0),
		byTrainer: Array.from(byTrainerMap.entries())
			.map(([trainerId, count]) => ({
				trainerId,
				trainerName: trainers.find((t) => t.id === trainerId)?.name || '未分配',
				count
			}))
			.sort((a, b) => b.count - a.count),
		byDate: Array.from(byDateMap.entries())
			.map(([date, count]) => ({ date, count }))
			.sort((a, b) => a.date.localeCompare(b.date)),
		byMissingReason: Array.from(byReasonMap.entries())
			.map(([reasonId, count]) => ({
				reasonId,
				reasonName: reasons.find((r) => r.id === reasonId)?.name || '未知',
				count
			}))
			.sort((a, b) => b.count - a.count),
		byHitType: Array.from(byTypeMap.entries())
			.map(([type, count]) => ({ type, count }))
			.sort((a, b) => b.count - a.count)
	};
};

export const scanEmailForRisks = (content: string, subject: string) => {
	const forbidden = get(forbiddenWordsStore).filter((w) => w.active);
	const risks: { word: ForbiddenWord; matchText: string }[] = [];
	const text = `${subject}\n${content}`;

	for (const w of forbidden) {
		if (text.includes(w.word)) {
			risks.push({ word: w, matchText: w.word });
		}
	}
	return risks;
};

let nextId = 1000;
export const genId = () => ++nextId;
