import { v4 as uuid } from 'uuid'

export function genId(): string {
  return uuid()
}

const MOCK_QUESTIONS = [
  '我的订单为什么还没发货？',
  '退款什么时候到账？',
  '商品有质量问题如何退换？',
  '如何修改收货地址？',
  '优惠券怎么使用？',
  '配送范围包括哪些地区？',
  '发票怎么开具？',
  '会员积分如何兑换？',
]

const MOCK_REPLIES = [
  '您好，您的订单正在处理中，预计1-2个工作日内发货，请您耐心等待。如有其他问题，欢迎随时咨询。',
  '您好，退款已提交处理，通常3-5个工作日到账，具体到账时间取决于您的支付方式。请您留意账户变动。',
  '您好，如商品存在质量问题，您可在7天内申请退换货。请在订单详情页提交售后申请，上传问题照片，我们会尽快为您处理。',
  '您好，订单未发货前可在订单详情页修改收货地址。如已发货，请联系客服协助处理。',
  '您好，在结算页面选择可用优惠券即可使用。请注意优惠券的使用条件和有效期。',
]

const MOCK_REFS = [
  { docTitle: '订单发货流程FAQ', docUrl: '/docs/shipping-faq', relevanceScore: 0.92 },
  { docTitle: '退款政策说明', docUrl: '/docs/refund-policy', relevanceScore: 0.88 },
  { docTitle: '售后服务指南', docUrl: '/docs/after-sales', relevanceScore: 0.85 },
  { docTitle: '配送范围与时效', docUrl: '/docs/delivery-range', relevanceScore: 0.80 },
  { docTitle: '优惠券使用规则', docUrl: '/docs/coupon-rules', relevanceScore: 0.75 },
]

export async function mockGenerateSuggestion(questionContent: string) {
  await new Promise(r => setTimeout(r, 300 + Math.random() * 700))
  const replyIdx = Math.floor(Math.random() * MOCK_REPLIES.length)
  const confidence = 0.6 + Math.random() * 0.4
  const refCount = 1 + Math.floor(Math.random() * 3)
  const shuffled = [...MOCK_REFS].sort(() => Math.random() - 0.5)
  const refs = shuffled.slice(0, refCount).map(r => ({
    ...r,
    relevanceScore: Math.min(r.relevanceScore + (Math.random() * 0.1 - 0.05), 1),
    isMissing: Math.random() < 0.15,
    missingReason: Math.random() < 0.15 ? ['文档已过期', '知识库未收录', '引用匹配失败'][Math.floor(Math.random() * 3)] : null,
  }))
  return {
    content: MOCK_REPLIES[replyIdx],
    confidence,
    isHit: confidence > 0.75,
    references: refs,
  }
}

export { MOCK_QUESTIONS, MOCK_REPLIES, MOCK_REFS }
