import type { Session } from '@/lib/types';

const INTENTS = [
	'账户登录问题',
	'密码重置',
	'订单查询',
	'退款申请',
	'物流查询',
	'商品咨询',
	'优惠券使用',
	'发票申请',
	'投诉建议',
	'售后服务',
	'会员权益',
	'活动咨询',
	'支付问题',
	'地址修改',
	'取消订单'
];

const CHANNELS = ['app', 'web', 'wechat', 'mini_program'];
const VERSIONS = ['v2.1.0', 'v2.2.0', 'v2.3.0', 'v2.4.0'];
const CUSTOMER_LEVELS = ['vip', 'high', 'normal', 'new'];
const TRANSFER_REASONS = [
	'机器人无法理解',
	'问题复杂需人工',
	'用户要求转人工',
	'涉及敏感信息',
	'系统异常'
];

const USER_QUESTIONS: Record<string, string[]> = {
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

const BOT_ANSWERS: Record<string, string[]> = {
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

function randomChoice<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDate(daysAgo: number): string {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	date.setHours(randomInt(8, 22), randomInt(0, 59));
	return date.toISOString();
}

function generateSession(id: number, daysAgo: number): Session {
	const intent = randomChoice(INTENTS);
	const channel = randomChoice(CHANNELS);
	const version = randomChoice(VERSIONS);
	const customerLevel = randomChoice(CUSTOMER_LEVELS);
	const isTransfer = Math.random() < 0.25;
	const totalRounds = isTransfer ? randomInt(2, 8) : randomInt(1, 4);
	const startTime = generateDate(daysAgo);
	const endTime = new Date(new Date(startTime).getTime() + randomInt(60000, 600000)).toISOString();
	const hourOfDay = new Date(startTime).getHours();
	const dayOfWeek = new Date(startTime).getDay();

	let satisfaction: number;
	if (isTransfer) {
		satisfaction = Math.random() < 0.6 ? randomInt(1, 3) : randomInt(3, 5);
	} else {
		satisfaction = Math.random() < 0.7 ? randomInt(4, 5) : randomInt(2, 4);
	}

	const questions = USER_QUESTIONS[intent] || ['您好，请问有什么可以帮您？'];
	const answers = BOT_ANSWERS[intent] || ['正在为您查询...'];

	return {
		session_id: `sess_${id.toString().padStart(6, '0')}`,
		user_id: `user_${randomInt(10000, 99999)}`,
		customer_level: customerLevel,
		channel,
		version,
		start_time: startTime,
		end_time: endTime,
		total_rounds: totalRounds,
		intent_tag: intent,
		is_transfer_to_human: isTransfer,
		satisfaction_score: satisfaction,
		user_question: randomChoice(questions),
		bot_answer: randomChoice(answers),
		transfer_reason: isTransfer ? randomChoice(TRANSFER_REASONS) : undefined,
		hour_of_day: hourOfDay,
		day_of_week: dayOfWeek
	};
}

export function generateMockSessions(count = 5000): Session[] {
	const sessions: Session[] = [];
	for (let i = 0; i < count; i++) {
		const daysAgo = randomInt(0, 14);
		sessions.push(generateSession(i + 1, daysAgo));
	}
	return sessions;
}

export const MOCK_SESSIONS = generateMockSessions(5000);
