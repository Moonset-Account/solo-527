import logging
import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal

from celery import shared_task
from django.db import transaction
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone

from apps.conversations.models import Conversation, Message
from apps.ai_service.models import AILog, AIModel
from apps.ai_service.services.ai_generator import AIService
from apps.ai_service.services.risk_detector import RiskDetector
from apps.risks.models import RiskSample, RiskRule
from apps.reviews.models import Review
from apps.analytics.models import DailyStats, AccuracyStats
from apps.prompts.models import Prompt

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_ai_suggestion(self, conversation_id, message_id, prompt_id=None):
    logger.info(f'开始生成AI建议 - conversation_id={conversation_id}, message_id={message_id}, prompt_id={prompt_id}')

    try:
        message = Message.objects.select_related('conversation').get(id=message_id)
        conversation = message.conversation

        if message.role != 'user':
            logger.warning(f'消息 {message_id} 不是用户消息，跳过AI生成')
            return {'status': 'skipped', 'reason': 'not_user_message'}

        prompt_content = ''
        prompt_version = ''
        prompt_obj = None

        if prompt_id:
            try:
                prompt_obj = Prompt.objects.get(id=prompt_id, status='enabled')
                prompt_content = prompt_obj.content
                prompt_version = prompt_obj.version
            except Prompt.DoesNotExist:
                logger.warning(f'提示词 {prompt_id} 不存在或未启用，使用默认提示词')

        if not prompt_content:
            prompt_content = '你是一位专业的客服助手，请根据用户的问题提供友好、专业的回答。'

        conversation_history = []
        messages = Message.objects.filter(conversation_id=conversation_id).order_by('created_at')
        for msg in messages:
            conversation_history.append({
                'role': msg.role,
                'content': msg.content,
            })

        variables = {
            'customer_name': conversation.customer_name,
            'sales_operation': conversation.sales_operation,
            'channel': conversation.channel,
        }

        ai_result = AIService.generate_reply(
            conversation_history=conversation_history,
            prompt_content=prompt_content,
            variables=variables,
            model='gpt-4',
        )

        request_id = str(uuid.uuid4())
        ai_model_instance = None
        try:
            ai_model_instance = AIModel.objects.filter(model_id=ai_result.get('model', ''), is_active=True).first()
        except Exception:
            pass

        ai_log = AILog.objects.create(
            user=conversation.user,
            model=ai_model_instance,
            prompt=prompt_content,
            response=ai_result.get('content', ''),
            prompt_tokens=ai_result.get('tokens', {}).get('prompt', 0),
            completion_tokens=ai_result.get('tokens', {}).get('completion', 0),
            total_tokens=ai_result.get('tokens', {}).get('total', 0),
            cost=Decimal('0.0'),
            latency=ai_result.get('latency', 0),
            status='success' if ai_result.get('success') else 'failed',
            error_message=ai_result.get('error_message', ''),
            request_id=request_id,
        )

        if ai_result.get('success'):
            message.suggested_reply = ai_result['content']
            message.is_ai_suggestion = True
            message.ai_model = ai_result.get('model', '')
            message.prompt_version = prompt_version
            message.tokens_used = ai_result.get('tokens', {}).get('total', 0)
            message.review_status = 'pending'
            message.save()

            if prompt_obj:
                update_prompt_usage_stats.delay(prompt_id)

            detect_risk.delay(message_id)

            auto_review.delay(message_id)

            logger.info(f'AI建议生成成功 - message_id={message_id}, tokens={ai_result["tokens"]["total"]}')
            return {
                'status': 'success',
                'message_id': message_id,
                'ai_log_id': ai_log.id,
                'tokens': ai_result.get('tokens', {}),
            }
        else:
            error_type = ai_result.get('error_type', 'api_error')
            message.error_type = error_type
            message.error_message = ai_result.get('error_message', '')
            message.is_ai_suggestion = True
            message.ai_model = ai_result.get('model', '')
            message.prompt_version = prompt_version
            message.save()

            logger.warning(f'AI建议生成失败 - message_id={message_id}, error={error_type}')
            return {
                'status': 'failed',
                'message_id': message_id,
                'error_type': error_type,
                'error_message': ai_result.get('error_message', ''),
            }

    except Message.DoesNotExist:
        logger.error(f'消息不存在 - message_id={message_id}')
        return {'status': 'error', 'message': 'message_not_found'}
    except Exception as e:
        logger.error(f'生成AI建议失败: {e}', exc_info=True)
        try:
            self.retry(exc=e)
        except Exception as retry_error:
            logger.error(f'重试失败: {retry_error}')
            return {'status': 'error', 'message': str(e)}


@shared_task
def detect_risk(message_id):
    logger.info(f'开始风险检测 - message_id={message_id}')

    try:
        message = Message.objects.select_related('conversation').get(id=message_id)
        conversation = message.conversation

        text_to_check = message.content
        if message.suggested_reply:
            text_to_check += '\n' + message.suggested_reply

        detector = RiskDetector()
        risks = detector.detect(text_to_check)

        if risks:
            highest_level = detector.get_highest_risk_level(risks)

            message.review_status = 'flagged'
            message.save(update_fields=['review_status'])

            for risk in risks:
                risk_sample = RiskSample.objects.create(
                    title=f'风险检测 - {risk["rule_name"]}',
                    content=text_to_check,
                    risk_level=risk['risk_level'],
                    risk_category=risk['category'],
                    source='ai_flag',
                    status='pending',
                    tags=[r['rule_name'] for r in risks],
                    conversation=conversation,
                    message=message,
                )
                logger.info(f'创建风险样本 - id={risk_sample.id}, level={risk["risk_level"]}')

            logger.info(f'风险检测完成 - message_id={message_id}, 发现 {len(risks)} 个风险')
            return {
                'status': 'flagged',
                'message_id': message_id,
                'risk_count': len(risks),
                'highest_level': highest_level,
            }
        else:
            logger.info(f'风险检测完成 - message_id={message_id}, 未发现风险')
            return {
                'status': 'clean',
                'message_id': message_id,
                'risk_count': 0,
            }

    except Message.DoesNotExist:
        logger.error(f'消息不存在 - message_id={message_id}')
        return {'status': 'error', 'message': 'message_not_found'}
    except Exception as e:
        logger.error(f'风险检测失败: {e}', exc_info=True)
        return {'status': 'error', 'message': str(e)}


@shared_task
def auto_review(message_id):
    logger.info(f'开始自动审核 - message_id={message_id}')

    try:
        message = Message.objects.select_related('conversation').get(id=message_id)
        conversation = message.conversation

        if not message.is_ai_suggestion:
            logger.warning(f'消息 {message_id} 不是AI生成的，跳过自动审核')
            return {'status': 'skipped', 'reason': 'not_ai_suggestion'}

        detector = RiskDetector()
        risks = detector.detect(message.suggested_reply)

        has_risks = len(risks) > 0
        highest_level = detector.get_highest_risk_level(risks) if risks else 'none'

        if has_risks:
            if highest_level in ['high', 'critical']:
                review_status = 'rejected'
                comment = f'自动审核：检测到{len(risks)}个风险点，最高风险等级：{highest_level}'
                is_accurate = False
            else:
                review_status = 'flagged'
                comment = f'自动审核：检测到{len(risks)}个风险点，需人工关注'
                is_accurate = None
        else:
            review_status = 'approved'
            comment = '自动审核通过：未检测到风险内容'
            is_accurate = True

        review = Review.objects.create(
            message=message,
            review_type='content',
            status=review_status,
            reviewer=None,
            comment=comment,
            risk_level=highest_level if has_risks else '',
            flagged_by_ai=True,
            sales_operation=conversation.sales_operation,
            prompt_version=message.prompt_version,
            ai_model=message.ai_model,
            is_accurate=is_accurate,
            risk_tags=[r['rule_name'] for r in risks],
            reviewed_at=timezone.now(),
        )

        if review_status != 'flagged':
            message.review_status = review_status
            message.save(update_fields=['review_status'])

        update_accuracy_stats.delay()

        logger.info(f'自动审核完成 - message_id={message_id}, status={review_status}')
        return {
            'status': 'success',
            'review_id': review.id,
            'review_status': review_status,
            'risk_count': len(risks),
        }

    except Message.DoesNotExist:
        logger.error(f'消息不存在 - message_id={message_id}')
        return {'status': 'error', 'message': 'message_not_found'}
    except Exception as e:
        logger.error(f'自动审核失败: {e}', exc_info=True)
        return {'status': 'error', 'message': str(e)}


@shared_task
def calculate_daily_stats(target_date=None):
    if target_date is None:
        target_date = (timezone.now() - timedelta(days=1)).date()
    elif isinstance(target_date, str):
        try:
            target_date = datetime.strptime(target_date, '%Y-%m-%d').date()
        except ValueError as e:
            logger.error(f'日期格式错误: {target_date}')
            return {'status': 'error', 'message': f'invalid_date_format: {e}'}

    logger.info(f'开始计算每日统计 - date={target_date}')

    try:
        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date + timedelta(days=1), datetime.min.time())

        with transaction.atomic():
            total_conversations = Conversation.objects.filter(
                created_at__gte=start_datetime,
                created_at__lt=end_datetime,
            ).count()

            total_messages = Message.objects.filter(
                created_at__gte=start_datetime,
                created_at__lt=end_datetime,
            ).count()

            ai_suggestions = Message.objects.filter(
                created_at__gte=start_datetime,
                created_at__lt=end_datetime,
                is_ai_suggestion=True,
            )
            ai_suggestion_count = ai_suggestions.count()

            ai_adoption_count = ai_suggestions.filter(is_adopted=True).count()

            ai_adoption_rate = (ai_adoption_count / ai_suggestion_count) if ai_suggestion_count > 0 else 0.0

            total_reviews = Review.objects.filter(
                created_at__gte=start_datetime,
                created_at__lt=end_datetime,
            ).count()

            approved_reviews = Review.objects.filter(
                created_at__gte=start_datetime,
                created_at__lt=end_datetime,
                status='approved',
            ).count()

            rejected_reviews = Review.objects.filter(
                created_at__gte=start_datetime,
                created_at__lt=end_datetime,
                status='rejected',
            ).count()

            pending_reviews = Review.objects.filter(
                created_at__gte=start_datetime,
                created_at__lt=end_datetime,
                status='pending',
            ).count()

            total_risks = RiskSample.objects.filter(
                created_at__gte=start_datetime,
                created_at__lt=end_datetime,
            ).count()

            resolved_risks = RiskSample.objects.filter(
                created_at__gte=start_datetime,
                created_at__lt=end_datetime,
                status__in=['resolved', 'confirmed'],
            ).count()

            ai_logs = AILog.objects.filter(
                created_at__gte=start_datetime,
                created_at__lt=end_datetime,
                status='success',
            )
            avg_response_time = ai_logs.aggregate(avg_latency=Avg('latency'))['avg_latency'] or 0.0

            total_tokens = ai_logs.aggregate(total=Sum('total_tokens'))['total'] or 0

            total_cost = ai_logs.aggregate(total=Sum('cost'))['total'] or Decimal('0.0')

            daily_stats, created = DailyStats.objects.update_or_create(
                date=target_date,
                defaults={
                    'total_conversations': total_conversations,
                    'total_messages': total_messages,
                    'ai_suggestion_count': ai_suggestion_count,
                    'ai_adoption_count': ai_adoption_count,
                    'ai_adoption_rate': ai_adoption_rate,
                    'total_reviews': total_reviews,
                    'approved_reviews': approved_reviews,
                    'rejected_reviews': rejected_reviews,
                    'pending_reviews': pending_reviews,
                    'total_risks': total_risks,
                    'resolved_risks': resolved_risks,
                    'avg_response_time': avg_response_time,
                    'total_tokens': total_tokens,
                    'total_cost': total_cost,
                },
            )

            _update_accuracy_stats_for_date(target_date, start_datetime, end_datetime)

        logger.info(f'每日统计计算完成 - date={target_date}')
        return {
            'status': 'success',
            'date': str(target_date),
            'created': created,
            'total_conversations': total_conversations,
            'total_messages': total_messages,
            'ai_suggestion_count': ai_suggestion_count,
            'ai_adoption_count': ai_adoption_count,
            'ai_adoption_rate': ai_adoption_rate,
        }

    except Exception as e:
        logger.error(f'计算每日统计失败: {e}', exc_info=True)
        return {'status': 'error', 'message': str(e)}


def _update_accuracy_stats_for_date(target_date, start_datetime, end_datetime):
    reviews = Review.objects.filter(
        created_at__gte=start_datetime,
        created_at__lt=end_datetime,
        is_accurate__isnull=False,
    )

    groups = reviews.values('sales_operation', 'prompt_version').annotate(
        total_calls=Count('id'),
        accurate_calls=Count('id', filter=Q(is_accurate=True)),
        error_timeout=Count('id', filter=Q(message__error_type='timeout')),
        error_rate_limit=Count('id', filter=Q(message__error_type='rate_limit')),
        error_api_error=Count('id', filter=Q(message__error_type='api_error')),
        error_content_filter=Count('id', filter=Q(message__error_type='content_filter')),
    )

    for group in groups:
        sales_op = group['sales_operation'] or 'default'
        prompt_ver = group['prompt_version'] or 'default'

        total = group['total_calls']
        accurate = group['accurate_calls']
        accuracy_rate = (accurate / total) if total > 0 else 0.0

        AccuracyStats.objects.update_or_create(
            date=target_date,
            sales_operation=sales_op,
            prompt_version=prompt_ver,
            defaults={
                'total_calls': total,
                'accurate_calls': accurate,
                'accuracy_rate': accuracy_rate,
                'error_timeout': group['error_timeout'],
                'error_rate_limit': group['error_rate_limit'],
                'error_api_error': group['error_api_error'],
                'error_content_filter': group['error_content_filter'],
            },
        )


@shared_task
def update_accuracy_stats():
    logger.info('开始增量更新准确率统计')

    try:
        today = timezone.now().date()
        start_date = today - timedelta(days=7)

        for day_offset in range(8):
            target_date = start_date + timedelta(days=day_offset)
            start_datetime = datetime.combine(target_date, datetime.min.time())
            end_datetime = datetime.combine(target_date + timedelta(days=1), datetime.min.time())

            _update_accuracy_stats_for_date(target_date, start_datetime, end_datetime)

        logger.info('准确率统计更新完成')
        return {'status': 'success', 'date_range': f'{start_date} to {today}'}

    except Exception as e:
        logger.error(f'更新准确率统计失败: {e}', exc_info=True)
        return {'status': 'error', 'message': str(e)}


@shared_task
def update_prompt_usage_stats(prompt_id):
    logger.info(f'开始更新提示词使用统计 - prompt_id={prompt_id}')

    try:
        prompt = Prompt.objects.get(id=prompt_id)

        usage_count = Message.objects.filter(
            is_ai_suggestion=True,
            prompt_version=prompt.version,
        ).count()

        reviews = Review.objects.filter(
            prompt_version=prompt.version,
            is_accurate__isnull=False,
        )

        total_reviews = reviews.count()
        if total_reviews > 0:
            accurate_count = reviews.filter(is_accurate=True).count()
            accuracy_rate = accurate_count / total_reviews
        else:
            accuracy_rate = 0.0

        prompt.usage_count = usage_count
        prompt.accuracy_rate = accuracy_rate
        prompt.save(update_fields=['usage_count', 'accuracy_rate', 'updated_at'])

        logger.info(f'提示词使用统计更新完成 - prompt_id={prompt_id}, usage={usage_count}, accuracy={accuracy_rate}')
        return {
            'status': 'success',
            'prompt_id': prompt_id,
            'usage_count': usage_count,
            'accuracy_rate': accuracy_rate,
        }

    except Prompt.DoesNotExist:
        logger.error(f'提示词不存在 - prompt_id={prompt_id}')
        return {'status': 'error', 'message': 'prompt_not_found'}
    except Exception as e:
        logger.error(f'更新提示词使用统计失败: {e}', exc_info=True)
        return {'status': 'error', 'message': str(e)}


@shared_task
def cleanup_old_conversations():
    logger.info('开始清理旧会话')
    try:
        thirty_days_ago = timezone.now() - timedelta(days=30)
        old_conversations = Conversation.objects.filter(
            updated_at__lt=thirty_days_ago,
            status='archived',
        )
        count = old_conversations.update(status='deleted')
        logger.info(f'清理完成 - 删除了 {count} 个旧会话')
        return {'status': 'success', 'deleted_count': count}
    except Exception as e:
        logger.error(f'清理旧会话失败: {e}', exc_info=True)
        return {'status': 'error', 'message': str(e)}
