import random
import time
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class AIService:
    MODELS = {
        'gpt-4': {'provider': 'openai', 'avg_tokens': 800, 'error_rate': 0.05},
        'gpt-3.5-turbo': {'provider': 'openai', 'avg_tokens': 600, 'error_rate': 0.03},
        'claude-3-opus': {'provider': 'anthropic', 'avg_tokens': 900, 'error_rate': 0.04},
        'claude-3-sonnet': {'provider': 'anthropic', 'avg_tokens': 700, 'error_rate': 0.03},
        'gemini-pro': {'provider': 'google', 'avg_tokens': 650, 'error_rate': 0.06},
        'qwen-turbo': {'provider': 'local', 'avg_tokens': 500, 'error_rate': 0.02},
    }

    ERROR_TYPES = ['timeout', 'rate_limit', 'api_error', 'content_filter']

    REPLY_TEMPLATES = [
        "尊敬的客户，感谢您的咨询。关于您提到的{topic}问题，我来为您详细解答一下。",
        "您好！非常理解您的心情。针对{topic}，我们有以下几种解决方案供您参考：",
        "感谢您的耐心等待。关于{topic}，我已经为您查询到相关信息如下：",
        "亲爱的客户，您好！关于{topic}的问题，我来帮您分析一下：",
        "非常感谢您的咨询。针对您提到的{topic}，请允许我为您做一个详细的说明。",
    ]

    DETAIL_TEMPLATES = [
        "首先，我们需要确认您的具体需求。建议您可以{action1}，这样能更好地帮助您解决问题。",
        "根据您的描述，我建议您可以尝试{action1}。如果问题仍然存在，可以进一步{action2}。",
        "我们的产品支持多种功能，包括{feature1}和{feature2}，这些都能很好地满足您的需求。",
        "目前我们有相应的优惠活动，如果您现在办理，可以享受{benefit}，非常划算。",
        "请您放心，我们会全程为您提供支持。如有任何疑问，随时可以联系我们。",
    ]

    CLOSING_TEMPLATES = [
        "希望以上解答对您有帮助。如果还有其他问题，请随时告诉我，我会尽力为您服务。",
        "感谢您的理解与支持。祝您生活愉快，再见！",
        "如果您对我的回答满意，麻烦您稍后对我的服务进行评价，非常感谢！",
        "还有什么可以帮到您的吗？欢迎随时提问。",
        "期待能继续为您服务。祝您一切顺利！",
    ]

    TOPICS = [
        '产品功能', '价格优惠', '售后服务', '退换货政策', '使用教程',
        '账户问题', '支付方式', '配送时间', '会员权益', '活动详情',
    ]

    ACTIONS = [
        '查看我们的官方帮助文档', '联系在线客服获取进一步支持',
        '在个人中心进行相关设置', '参考用户手册中的详细说明',
        '提交工单让技术团队处理', '使用自助服务功能快速解决',
    ]

    FEATURES = [
        '智能推荐', '数据分析', '多端同步', '安全加密', '实时监控',
        '自动化处理', '自定义配置', '批量操作', '报表导出', 'API对接',
    ]

    BENEFITS = [
        '首月免费体验', '八折优惠', '赠送额外服务时长',
        '专属客服支持', '优先处理特权', '积分双倍奖励',
    ]

    @classmethod
    def generate_reply(
        cls,
        conversation_history: List[Dict[str, Any]],
        prompt_content: str,
        variables: Dict[str, Any] = None,
        model: str = 'gpt-4',
    ) -> Dict[str, Any]:
        variables = variables or {}

        if model not in cls.MODELS:
            model = 'gpt-4'

        model_config = cls.MODELS[model]

        if random.random() < model_config['error_rate']:
            error_type = random.choice(cls.ERROR_TYPES)
            error_messages = {
                'timeout': '请求超时，请稍后重试',
                'rate_limit': '请求频率过高，请稍后再试',
                'api_error': 'API调用出错，请联系管理员',
                'content_filter': '内容被安全策略过滤',
            }
            logger.warning(f'AI调用失败: {error_type} - {error_messages[error_type]}')
            return {
                'success': False,
                'error_type': error_type,
                'error_message': error_messages[error_type],
                'model': model,
                'latency': random.uniform(0.1, 1.0),
            }

        latency = random.uniform(0.5, 3.0)
        time.sleep(latency * 0.01)

        topic = variables.get('topic', random.choice(cls.TOPICS))
        action1 = random.choice(cls.ACTIONS)
        action2 = random.choice(cls.ACTIONS)
        while action2 == action1:
            action2 = random.choice(cls.ACTIONS)
        feature1 = random.choice(cls.FEATURES)
        feature2 = random.choice(cls.FEATURES)
        while feature2 == feature1:
            feature2 = random.choice(cls.FEATURES)
        benefit = random.choice(cls.BENEFITS)

        reply_parts = [
            random.choice(cls.REPLY_TEMPLATES).format(topic=topic),
            '',
            random.choice(cls.DETAIL_TEMPLATES).format(
                action1=action1, action2=action2,
                feature1=feature1, feature2=feature2,
                benefit=benefit,
            ),
            '',
        ]

        extra_details = random.randint(1, 3)
        for i in range(extra_details):
            detail_templates = [
                f"{i+1}. {random.choice(cls.FEATURES)}：提供{random.choice(['全方位', '个性化', '专业化', '智能化'])}的解决方案",
                f"• 关于{random.choice(cls.TOPICS)}，我们{random.choice(['承诺', '保证', '确保'])}为您提供最优质的服务",
            ]
            reply_parts.append(random.choice(detail_templates))

        reply_parts.extend(['', random.choice(cls.CLOSING_TEMPLATES)])

        content = '\n'.join(reply_parts)

        prompt_tokens = len(prompt_content) // 4 + random.randint(50, 200)
        completion_tokens = len(content) // 4 + random.randint(20, 100)
        total_tokens = prompt_tokens + completion_tokens

        result = {
            'success': True,
            'content': content,
            'model': model,
            'tokens': {
                'prompt': prompt_tokens,
                'completion': completion_tokens,
                'total': total_tokens,
            },
            'latency': round(latency, 2),
            'provider': model_config['provider'],
        }

        logger.info(f'AI生成完成 - 模型: {model}, Token: {total_tokens}, 耗时: {latency:.2f}s')
        return result

    @classmethod
    def get_available_models(cls) -> List[Dict[str, Any]]:
        models = []
        for model_id, config in cls.MODELS.items():
            models.append({
                'id': model_id,
                'provider': config['provider'],
                'avg_tokens': config['avg_tokens'],
                'error_rate': config['error_rate'],
            })
        return models

    @classmethod
    def health_check(cls) -> Dict[str, Any]:
        return {
            'status': 'healthy',
            'available_models': len(cls.MODELS),
            'timestamp': time.time(),
        }
