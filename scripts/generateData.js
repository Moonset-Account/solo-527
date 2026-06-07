import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INTENTS = [
	{ name: '账户登录问题', baseTransferRate: 0.18, baseSatisfaction: 4.2 },
	{ name: '密码重置', baseTransferRate: 0.12, baseSatisfaction: 4.4 },
	{ name: '订单查询', baseTransferRate: 0.08, baseSatisfaction: 4.5 },
	{ name: '退款申请', baseTransferRate: 0.42, baseSatisfaction: 3.2 },
	{ name: '物流查询', baseTransferRate: 0.22, baseSatisfaction: 3.8 },
	{ name: '商品咨询', baseTransferRate: 0.15, baseSatisfaction: 4.3 },
	{ name: '优惠券使用', baseTransferRate: 0.28, baseSatisfaction: 3.6 },
	{ name: '发票申请', baseTransferRate: 0.35, baseSatisfaction: 3.4 },
	{ name: '投诉建议', baseTransferRate: 0.65, baseSatisfaction: 2.1 },
	{ name: '售后服务', baseTransferRate: 0.52, baseSatisfaction: 2.9 },
	{ name: '会员权益', baseTransferRate: 0.14, baseSatisfaction: 4.3 },
	{ name: '活动咨询', baseTransferRate: 0.20, baseSatisfaction: 4.0 },
	{ name: '支付问题', baseTransferRate: 0.38, baseSatisfaction: 3.1 },
	{ name: '地址修改', baseTransferRate: 0.16, baseSatisfaction: 4.2 },
	{ name: '取消订单', baseTransferRate: 0.30, baseSatisfaction: 3.5 }
];

const CHANNELS = [
	{ name: 'app', baseMultiplier: 0.9, volumeShare: 0.45 },
	{ name: 'web', baseMultiplier: 1.1, volumeShare: 0.25 },
	{ name: 'wechat', baseMultiplier: 1.0, volumeShare: 0.18 },
	{ name: 'mini_program', baseMultiplier: 1.3, volumeShare: 0.12 }
];

const VERSIONS = [
	{ name: 'v2.1.0', baseMultiplier: 1.2, dateRange: ['2026-05-20', '2026-05-31'] },
	{ name: 'v2.2.0', baseMultiplier: 1.0, dateRange: ['2026-05-25', '2026-06-03'] },
	{ name: 'v2.3.0', baseMultiplier: 0.85, dateRange: ['2026-06-01', '2026-06-07'] },
	{ name: 'v2.4.0-beta', baseMultiplier: 1.5, dateRange: ['2026-06-05', '2026-06-07'] }
];

const CUSTOMER_LEVELS = [
	{ name: 'vip', baseMultiplier: 0.7, volumeShare: 0.08 },
	{ name: 'high', baseMultiplier: 0.85, volumeShare: 0.15 },
	{ name: 'normal', baseMultiplier: 1.0, volumeShare: 0.62 },
	{ name: 'new', baseMultiplier: 1.4, volumeShare: 0.15 }
];

const HOUR_PATTERNS = [
	{ hour: 0, volume: 0.02, transferMult: 1.3 },
	{ hour: 1, volume: 0.01, transferMult: 1.4 },
	{ hour: 2, volume: 0.005, transferMult: 1.5 },
	{ hour: 3, volume: 0.003, transferMult: 1.6 },
	{ hour: 4, volume: 0.002, transferMult: 1.7 },
	{ hour: 5, volume: 0.005, transferMult: 1.5 },
	{ hour: 6, volume: 0.01, transferMult: 1.3 },
	{ hour: 7, volume: 0.02, transferMult: 1.2 },
	{ hour: 8, volume: 0.05, transferMult: 1.1 },
	{ hour: 9, volume: 0.08, transferMult: 1.0 },
	{ hour: 10, volume: 0.10, transferMult: 0.95 },
	{ hour: 11, volume: 0.09, transferMult: 0.98 },
	{ hour: 12, volume: 0.07, transferMult: 1.05 },
	{ hour: 13, volume: 0.06, transferMult: 1.02 },
	{ hour: 14, volume: 0.08, transferMult: 0.97 },
	{ hour: 15, volume: 0.10, transferMult: 0.95 },
	{ hour: 16, volume: 0.09, transferMult: 0.98 },
	{ hour: 17, volume: 0.07, transferMult: 1.0 },
	{ hour: 18, volume: 0.05, transferMult: 1.05 },
	{ hour: 19, volume: 0.04, transferMult: 1.1 },
	{ hour: 20, volume: 0.03, transferMult: 1.15 },
	{ hour: 21, volume: 0.025, transferMult: 1.2 },
	{ hour: 22, volume: 0.015, transferMult: 1.25 },
	{ hour: 23, volume: 0.01, transferMult: 1.3 }
];

const TRANSFER_REASONS = [
	'机器人无法理解',
	'问题复杂需人工',
	'用户要求转人工',
	'涉及敏感信息',
	'系统异常'
];

const USER_QUESTIONS = {
	'账户登录问题': [
		'我登录不进去怎么办？',
		'登录一直显示失败',
		'收不到验证码',
		'账号被锁定了',
		'扫码登录没反应'
	],
	'密码重置': ['忘记密码了怎么找回？', '重置密码收不到邮件', '密码修改失败', '原密码不记得了'],
	'订单查询': [
		'我的订单在哪里看？',
		'订单状态一直没更新',
		'查不到历史订单',
		'订单编号忘了'
	],
	'退款申请': [
		'怎么申请退款？',
		'退款什么时候到账？',
		'退款被拒绝了',
		'只退了一部分钱'
	],
	'物流查询': ['物流一直没更新', '快递发错了', '显示签收但我没收到', '怎么改收货地址？'],
	'商品咨询': [
		'这个商品有货吗？',
		'支持什么尺码？',
		'和另外一款有什么区别？',
		'有没有优惠？'
	],
	'优惠券使用': [
		'优惠券怎么用不了？',
		'满足条件但不能用',
		'优惠券过期了能补发吗？',
		'优惠券可以叠加吗？'
	],
	'发票申请': ['怎么开发票？', '发票信息填错了', '发票一直没收到', '可以开专票吗？'],
	'投诉建议': ['我要投诉', '服务态度太差了', '建议增加功能', '体验很不好'],
	'售后服务': ['怎么申请售后？', '售后审核要多久？', '商品坏了能换吗？', '过了售后期怎么办？'],
	'会员权益': ['会员有什么福利？', '怎么升级会员？', '会员积分怎么用？', '会员快到期了'],
	'活动咨询': ['这个活动什么时候结束？', '活动规则是什么？', '参与了活动没收到奖励', '新用户有什么优惠？'],
	'支付问题': ['支付失败怎么办？', '重复扣款了', '支付成功但订单没显示', '可以分期付款吗？'],
	'地址修改': ['收货地址错了怎么改？', '已经发货了能改地址吗？', '怎么添加新地址？', '默认地址怎么设置？'],
	'取消订单': ['怎么取消订单？', '取消了还能恢复吗？', '取消后钱什么时候退？', '已经发货了能取消吗？']
};

const BOT_ANSWERS = {
	'账户登录问题': [
		'请您检查网络连接后重试，如仍有问题可以尝试重置密码。',
		'建议您清除浏览器缓存后重新尝试登录。',
		'验证码可能有延迟，请您稍等片刻再试。'
	],
	'密码重置': ['请点击登录页的"忘记密码"，按照指引操作即可重置。', '已为您发送重置邮件，请查收。'],
	'订单查询': ['您可以在"我的订单"中查看所有订单状态。', '正在为您查询订单信息...'],
	'退款申请': ['您可以在订单详情页申请退款，审核周期为1-3个工作日。', '退款将原路返回，请耐心等待。'],
	'物流查询': ['物流信息可能有延迟，请您稍后再查询。', '正在为您同步最新物流信息...'],
	'商品咨询': ['该商品目前有货，您可以放心下单。', '商品详情页有详细参数说明哦。'],
	'优惠券使用': ['请您检查优惠券的使用条件和有效期。', '每张订单只能使用一张优惠券。'],
	'发票申请': ['您可以在订单完成后申请电子发票。', '发票将在3个工作日内开具。'],
	'投诉建议': ['非常抱歉给您带来不好的体验，您可以详细描述问题吗？', '感谢您的反馈，我们会认真处理。'],
	'售后服务': ['请在订单详情页提交售后申请，我们会尽快处理。', '售后审核时间一般为24小时。'],
	'会员权益': ['会员享有专属折扣、积分加倍等权益。', '您可以在会员中心查看详细权益说明。'],
	'活动咨询': ['活动详情请查看活动页面的规则说明。', '活动奖励将在结束后7个工作日内发放。'],
	'支付问题': ['请检查支付方式余额是否充足。', '如遇重复扣款，我们会在1-3个工作日内退回。'],
	'地址修改': ['您可以在"我的地址"中修改收货地址。', '订单发货前可以修改地址哦。'],
	'取消订单': ['您可以在订单详情页点击"取消订单"按钮。', '取消后款项将在1-3个工作日内退回。']
};

function randomChoice(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedRandom(items, weightKey) {
	const totalWeight = items.reduce((sum, item) => sum + item[weightKey], 0);
	let random = Math.random() * totalWeight;
	for (const item of items) {
		random -= item[weightKey];
		if (random <= 0) return item;
	}
	return items[items.length - 1];
}

function generateSession(id, date) {
	const intent = weightedRandom(INTENTS, 'baseTransferRate');
	const channel = weightedRandom(CHANNELS, 'volumeShare');
	const level = weightedRandom(CUSTOMER_LEVELS, 'volumeShare');
	const hourPattern = weightedRandom(HOUR_PATTERNS, 'volume');

	const version = VERSIONS.find(v => {
		const start = new Date(v.dateRange[0]);
		const end = new Date(v.dateRange[1]);
		return date >= start && date <= end;
	}) || VERSIONS[VERSIONS.length - 1];

	const baseTransferRate = intent.baseTransferRate * channel.baseMultiplier * level.baseMultiplier * version.baseMultiplier * hourPattern.transferMult;
	const transferRate = Math.min(0.95, Math.max(0.01, baseTransferRate + (Math.random() - 0.5) * 0.1));
	const isTransfer = Math.random() < transferRate;

	const totalRounds = isTransfer ? randomInt(3, 10) : randomInt(1, 5);

	const hour = hourPattern.hour;
	const minute = randomInt(0, 59);
	const startTime = new Date(date);
	startTime.setHours(hour, minute, 0, 0);
	const endTime = new Date(startTime.getTime() + randomInt(60000, 600000));

	let baseSatisfaction = intent.baseSatisfaction;
	if (isTransfer) baseSatisfaction -= 1.5;
	if (level.name === 'vip') baseSatisfaction += 0.3;
	if (version.name.includes('beta')) baseSatisfaction -= 0.5;
	const satisfaction = Math.max(1, Math.min(5, Math.round(baseSatisfaction + (Math.random() - 0.5) * 1.5)));

	const questions = USER_QUESTIONS[intent.name] || ['您好，请问有什么可以帮您？'];
	const answers = BOT_ANSWERS[intent.name] || ['正在为您查询...'];

	return {
		session_id: `sess_${id.toString().padStart(6, '0')}`,
		user_id: `user_${randomInt(10000, 99999)}`,
		customer_level: level.name,
		channel: channel.name,
		version: version.name,
		start_time: startTime.toISOString(),
		end_time: endTime.toISOString(),
		total_rounds: totalRounds,
		intent_tag: intent.name,
		is_transfer_to_human: isTransfer,
		satisfaction_score: satisfaction,
		user_question: randomChoice(questions),
		bot_answer: randomChoice(answers),
		transfer_reason: isTransfer ? randomChoice(TRANSFER_REASONS) : '',
		hour_of_day: hour,
		day_of_week: startTime.getDay()
	};
}

function generateSessions(startDate, endDate, count = 8000) {
	const sessions = [];
	const days = [];
	const start = new Date(startDate);
	const end = new Date(endDate);

	for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
		days.push(new Date(d));
	}

	for (let i = 0; i < count; i++) {
		const date = days[randomInt(0, days.length - 1)];
		sessions.push(generateSession(i + 1, date));
	}

	return sessions;
}

const sessions = generateSessions('2026-05-20', '2026-06-07', 8000);

const csvHeader = Object.keys(sessions[0]).join(',');
const csvRows = sessions.map(s =>
	Object.values(s).map(v => {
		if (typeof v === 'string' && (v.includes(',') || v.includes('"') || v.includes('\n'))) {
			return `"${v.replace(/"/g, '""')}"`;
		}
		return v;
	}).join(',')
);
const csvContent = [csvHeader, ...csvRows].join('\n');

const outputPath = path.join(__dirname, '../static/data/sessions.csv');
fs.writeFileSync(outputPath, csvContent, 'utf-8');

console.log(`Generated ${sessions.length} sessions`);
console.log(`Output: ${outputPath}`);

const summary = {
	total: sessions.length,
	transfers: sessions.filter(s => s.is_transfer_to_human).length,
	transferRate: sessions.filter(s => s.is_transfer_to_human).length / sessions.length,
	avgSatisfaction: sessions.reduce((sum, s) => sum + s.satisfaction_score, 0) / sessions.length,
	intentBreakdown: INTENTS.map(i => ({
		intent: i.name,
		count: sessions.filter(s => s.intent_tag === i.name).length,
		transferRate: sessions.filter(s => s.intent_tag === i.name && s.is_transfer_to_human).length /
			Math.max(1, sessions.filter(s => s.intent_tag === i.name).length)
	}))
};

console.log('\nData Summary:');
console.log(JSON.stringify(summary, null, 2));
