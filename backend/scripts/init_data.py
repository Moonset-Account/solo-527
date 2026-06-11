import os
import sys
import django
from datetime import datetime, timedelta
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.conversations.models import Conversation, Message
from apps.prompts.models import Prompt, PromptCategory
from apps.risks.models import RiskRule, RiskSample
from apps.reviews.models import Review
from apps.analytics.models import DailyStats, AccuracyStats

User = get_user_model()


def create_users():
    users = []
    for i in range(1, 4):
        user, created = User.objects.get_or_create(
            username=f'agent{i:02d}',
            defaults={
                'email': f'agent{i:02d}@example.com',
                'first_name': f'客服{i:02d}',
                'is_active': True,
                'is_staff': True,
            }
        )
        if created:
            user.set_password('123456')
            user.save()
        users.append(user)
    
    admin, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@example.com',
            'first_name': '管理员',
            'is_active': True,
            'is_staff': True,
            'is_superuser': True,
        }
    )
    if created:
        admin.set_password('admin123')
        admin.save()
    
    print(f'创建了 {len(users)} 个客服用户 + 1个管理员')
    return users + [admin]


def create_prompt_categories():
    categories = [
        {'name': '售前咨询', 'description': '产品购买前的咨询'},
        {'name': '售后服务', 'description': '订单售后相关'},
        {'name': '投诉建议', 'description': '客户投诉与建议'},
        {'name': '技术支持', 'description': '技术问题解答'},
    ]
    created = []
    for cat in categories:
        obj, _ = PromptCategory.objects.get_or_create(name=cat['name'], defaults=cat)
        created.append(obj)
    print(f'创建了 {len(created)} 个提示词分类')
    return created


def create_prompts(categories, users):
    prompts_data = [
        {
            'title': '标准客服回复模板',
            'version': 'v1.2.0',
            'status': 'enabled',
            'category': categories[0],
            'content': '你是一位专业的客服代表，请用友好、专业的语气回复客户问题。回复结构：1. 问候并确认收到问题 2. 详细解答问题 3. 提供后续帮助建议',
            'gray_scale_percent': 100,
            'target_sales_operations': ['销售一组', '销售二组', '运营组'],
            'is_current_version': True,
        },
        {
            'title': '售后处理模板',
            'version': 'v2.0.0',
            'status': 'enabled',
            'category': categories[1],
            'content': '你是售后客服专家，请用同理心处理客户的售后问题。步骤：1. 表达歉意和理解 2. 了解具体问题 3. 提供解决方案 4. 确认客户满意',
            'gray_scale_percent': 80,
            'target_sales_operations': ['运营组'],
            'is_current_version': True,
        },
        {
            'title': '投诉安抚模板',
            'version': 'v1.0.0',
            'status': 'enabled',
            'category': categories[2],
            'content': '你是投诉处理专员，请用真诚的态度处理客户投诉。原则：先处理情绪，再处理问题。确保客户感受到被重视。',
            'gray_scale_percent': 100,
            'target_sales_operations': ['运营组'],
            'is_current_version': True,
        },
        {
            'title': '技术支持模板',
            'version': 'v1.5.0',
            'status': 'enabled',
            'category': categories[3],
            'content': '你是技术支持工程师，请用清晰、有条理的方式解答技术问题。引导客户逐步排查，提供具体的操作步骤。',
            'gray_scale_percent': 60,
            'target_sales_operations': ['销售一组', '销售二组'],
            'is_current_version': True,
        },
        {
            'title': '新品推荐话术',
            'version': 'v0.9.0',
            'status': 'draft',
            'category': categories[0],
            'content': '你是销售顾问，根据客户需求推荐最合适的产品。突出产品价值，避免过度推销。',
            'gray_scale_percent': 0,
            'target_sales_operations': ['销售一组'],
            'is_current_version': False,
        },
        {
            'title': '退款流程指引',
            'version': 'v1.1.0',
            'status': 'disabled',
            'category': categories[1],
            'content': '指引客户完成退款流程，说明退款条件和到账时间。',
            'gray_scale_percent': 0,
            'target_sales_operations': ['运营组'],
            'is_current_version': False,
        },
    ]
    
    prompts = []
    for data in prompts_data:
        prompt, created = Prompt.objects.get_or_create(
            title=data['title'],
            version=data['version'],
            defaults={
                **data,
                'author': users[0],
                'description': data['content'][:50] + '...',
            }
        )
        prompts.append(prompt)
    
    print(f'创建了 {len(prompts)} 个提示词')
    return prompts


def create_risk_rules():
    rules_data = [
        {'name': '敏感词检测', 'rule_type': 'keyword', 'pattern': '违禁,敏感词,违法', 'risk_level': 'high', 'is_active': True},
        {'name': '隐私信息检测', 'rule_type': 'regex', 'pattern': r'\b1[3-9]\d{9}\b|\b\d{15,18}\b', 'risk_level': 'medium', 'is_active': True},
        {'name': '辱骂言语检测', 'rule_type': 'keyword', 'pattern': '垃圾,骗子,傻逼,去死', 'risk_level': 'medium', 'is_active': True},
        {'name': '政治敏感检测', 'rule_type': 'keyword', 'pattern': '政治,政府,抗议,游行', 'risk_level': 'critical', 'is_active': True},
        {'name': '错误信息检测', 'rule_type': 'ai_detect', 'pattern': 'false_info_detection', 'risk_level': 'high', 'is_active': False},
    ]
    
    rules = []
    for data in rules_data:
        rule, _ = RiskRule.objects.get_or_create(name=data['name'], defaults=data)
        rules.append(rule)
    
    print(f'创建了 {len(rules)} 条风险规则')
    return rules


def create_sample_conversations(users, prompts):
    sales_ops = ['销售一组', '销售二组', '运营组']
    channels = ['web', 'app', 'wechat', 'phone']
    priorities = ['normal', 'high', 'urgent']
    statuses = ['active', 'active', 'active', 'archived']
    
    customer_names = ['张三', '李四', '王五', '赵六', '陈七', '刘八', '周九', '吴十', '郑十一', '孙十二']
    
    conversations = []
    for i in range(15):
        conv = Conversation.objects.create(
            title=f'客户咨询 - {customer_names[i % len(customer_names)]}',
            user=users[i % len(users)],
            customer_name=customer_names[i % len(customer_names)],
            customer_phone=f'138{random.randint(10000000, 99999999)}',
            sales_operation=sales_ops[i % len(sales_ops)],
            channel=channels[i % len(channels)],
            priority=priorities[i % len(priorities)],
            status=statuses[i % len(statuses)],
            created_at=datetime.now() - timedelta(days=random.randint(0, 7), hours=random.randint(0, 23)),
        )
        conversations.append(conv)
        
        user_messages = [
            '你好，我想咨询一下你们的产品',
            '请问这个产品有什么功能？',
            '价格是多少？有没有优惠？',
            '我想退货，怎么操作？',
            '物流太慢了，什么时候能到？',
            '产品质量有问题，我要投诉',
            '帮我查一下我的订单',
            '这个怎么安装使用？',
            '能不能再便宜点？',
            '服务态度太差了！',
        ]
        
        ai_replies = [
            '您好！感谢您的咨询。我是客服小王，很高兴为您服务。请问有什么可以帮助您的？',
            '您好，我们的产品具有以下主要功能：1. 智能客服辅助 2. 内容审核 3. 数据分析。请问您对哪个功能比较感兴趣呢？',
            '您好，我们产品的标准版是999元/月，专业版是2999元/月。目前新用户有首月8折的优惠活动，您需要我详细介绍一下吗？',
            '非常抱歉给您带来不便。退货流程很简单：1. 在订单详情页点击"申请退货" 2. 填写退货原因 3. 将商品寄回指定地址。退款会在收到商品后3个工作日内原路返回。',
            '实在不好意思让您久等了。我帮您查一下，您的订单预计明天可以送达。由于最近订单量较大，物流稍有延迟，请您谅解。',
            '非常抱歉产品给您带来了不好的体验。请问具体是什么质量问题呢？我们会尽快为您处理，给您一个满意的解决方案。',
            '好的，请稍等，我帮您查询一下。请问您的订单号是多少？或者您提供一下手机号也可以查询。',
            '您好，安装使用很简单的：1. 下载安装包 2. 运行安装程序 3. 按照向导完成配置。如果遇到问题，我们可以远程协助您。',
            '非常理解您的想法。我们的定价是基于产品价值和服务质量来制定的。不过如果您是企业客户，我们可以申请批量优惠，您需要了解一下吗？',
            '非常抱歉让您感到不满意。请您告诉我具体是什么问题，我会认真处理并改进我们的服务。',
        ]
        
        for j in range(random.randint(2, 6)):
            msg_user = Message.objects.create(
                conversation=conv,
                role='user',
                content=user_messages[(i + j) % len(user_messages)],
                created_at=conv.created_at + timedelta(minutes=j * 10),
            )
            
            prompt = prompts[j % len(prompts)]
            has_error = random.random() < 0.1
            error_type = random.choice(['timeout', 'rate_limit', 'api_error', 'content_filter']) if has_error else ''
            
            msg_ai = Message.objects.create(
                conversation=conv,
                role='assistant',
                content=ai_replies[(i + j) % len(ai_replies)],
                is_ai_suggestion=True,
                is_adopted=random.random() > 0.3,
                ai_model='gpt-4',
                prompt_version=prompt.version,
                error_type=error_type if has_error else 'none',
                error_message='请求超时，请稍后重试' if has_error and error_type == 'timeout' else '',
                suggested_reply=ai_replies[(i + j) % len(ai_replies)],
                review_status=random.choice(['pending', 'approved', 'approved', 'approved', 'flagged']),
                tokens_used=random.randint(100, 500),
                created_at=conv.created_at + timedelta(minutes=j * 10 + 2),
            )
    
    print(f'创建了 {len(conversations)} 个示例会话')
    return conversations


def create_risk_samples(conversations):
    risk_categories = ['敏感词', '隐私泄露', '错误信息', '合规风险', '不当言论']
    sources = ['ai_flag', 'manual', 'review', 'import']
    statuses = ['pending', 'confirmed', 'resolved', 'false_positive']
    risk_levels = ['low', 'medium', 'high', 'critical']
    
    samples = []
    for i in range(20):
        conv = conversations[i % len(conversations)]
        msg = conv.messages.first()
        sample = RiskSample.objects.create(
            title=f'风险样本 {i+1}: {risk_categories[i % len(risk_categories)]}',
            content=f'检测到内容中包含{risk_categories[i % len(risk_categories)]}相关内容，请及时处理。涉及内容为："这是一段示例文本，包含潜在的风险要素..."',
            risk_level=risk_levels[i % len(risk_levels)],
            risk_category=risk_categories[i % len(risk_categories)],
            source=sources[i % len(sources)],
            status=statuses[i % len(statuses)],
            tags=[f'标签{i}', '示例'],
            conversation=conv,
            message=msg,
            created_at=datetime.now() - timedelta(days=random.randint(0, 14)),
        )
        samples.append(sample)
    
    print(f'创建了 {len(samples)} 个风险样本')
    return samples


def create_reviews(conversations, users):
    reviews = []
    for conv in conversations:
        for msg in conv.messages.filter(is_ai_suggestion=True):
            review_status = random.choice(['pending', 'approved', 'approved', 'approved', 'rejected', 'flagged'])
            review = Review.objects.create(
                message=msg,
                review_type=random.choice(['content', 'quality', 'safety']),
                status=review_status,
                reviewer=users[random.randint(0, len(users)-1)] if review_status != 'pending' else None,
                comment='内容合规，表述清晰' if review_status == 'approved' else ('需要调整措辞' if review_status == 'rejected' else ''),
                risk_level=random.choice(['', 'low', 'medium', 'high']),
                flagged_by_ai=random.random() > 0.7,
                sales_operation=conv.sales_operation,
                prompt_version=msg.prompt_version,
                ai_model=msg.ai_model,
                is_accurate=random.choice([True, True, True, True, False]) if review_status != 'pending' else None,
                inaccuracy_reason='' if (review_status != 'pending' and random.random() > 0.3) else '信息不准确',
                risk_tags=[],
                reviewed_at=datetime.now() - timedelta(days=random.randint(0, 7)) if review_status != 'pending' else None,
                created_at=msg.created_at + timedelta(minutes=random.randint(5, 120)),
            )
            reviews.append(review)
    
    print(f'创建了 {len(reviews)} 条审核记录')
    return reviews


def create_daily_stats():
    sales_ops = ['销售一组', '销售二组', '运营组']
    
    for day_offset in range(14):
        date = (datetime.now() - timedelta(days=day_offset)).date()
        total_conv = random.randint(20, 80)
        total_msg = total_conv * random.randint(3, 8)
        ai_suggestions = random.randint(int(total_msg * 0.4), int(total_msg * 0.7))
        ai_adoptions = int(ai_suggestions * random.uniform(0.6, 0.9))
        
        DailyStats.objects.get_or_create(
            date=date,
            defaults={
                'total_conversations': total_conv,
                'total_messages': total_msg,
                'ai_suggestion_count': ai_suggestions,
                'ai_adoption_count': ai_adoptions,
                'ai_adoption_rate': round(ai_adoptions / ai_suggestions * 100, 2) if ai_suggestions > 0 else 0,
                'pending_reviews': random.randint(5, 20),
                'approved_reviews': random.randint(30, 80),
                'rejected_reviews': random.randint(2, 15),
                'total_reviews': random.randint(50, 120),
                'total_risks': random.randint(1, 10),
                'resolved_risks': random.randint(0, 5),
                'total_tokens': random.randint(50000, 200000),
                'total_cost': round(random.uniform(50, 300), 2),
                'avg_response_time': round(random.uniform(0.8, 3.5), 2),
            }
        )
        
        for sales_op in sales_ops:
            for version in ['v1.0.0', 'v1.2.0', 'v2.0.0']:
                total_calls = random.randint(10, 50)
                accurate = int(total_calls * random.uniform(0.7, 0.95))
                AccuracyStats.objects.get_or_create(
                    date=date,
                    sales_operation=sales_op,
                    prompt_version=version,
                    defaults={
                        'total_calls': total_calls,
                        'accurate_calls': accurate,
                        'accuracy_rate': round(accurate / total_calls * 100, 2),
                        'error_timeout': random.randint(0, 3),
                        'error_rate_limit': random.randint(0, 2),
                        'error_api_error': random.randint(0, 2),
                        'error_content_filter': random.randint(0, 1),
                        'error_other': random.randint(0, 2),
                        'avg_response_time': round(random.uniform(0.8, 3.5), 2),
                    }
                )
    
    print('创建了最近14天的统计数据')


def main():
    print('=' * 50)
    print('开始初始化数据...')
    print('=' * 50)
    
    users = create_users()
    categories = create_prompt_categories()
    prompts = create_prompts(categories, users)
    rules = create_risk_rules()
    conversations = create_sample_conversations(users, prompts)
    risk_samples = create_risk_samples(conversations)
    reviews = create_reviews(conversations, users)
    create_daily_stats()
    
    print('=' * 50)
    print('数据初始化完成！')
    print('=' * 50)
    print('\n登录账号：')
    print('  管理员: admin / admin123')
    print('  客服01: agent01 / 123456')
    print('  客服02: agent02 / 123456')
    print('  客服03: agent03 / 123456')


if __name__ == '__main__':
    main()
