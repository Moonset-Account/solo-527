from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from .models import Ticket
from .services import TicketService
from apps.accounts.models import User
import logging

logger = logging.getLogger(__name__)


@shared_task
def check_sla_deadlines():
    now = timezone.now()
    warning_threshold = now + timedelta(hours=1)
    
    urgent_tickets = Ticket.objects.filter(
        status__in=['pending', 'processing', 'escalated'],
        sla_deadline__lte=warning_threshold,
        sla_deadline__gt=now
    )
    
    overdue_tickets = Ticket.objects.filter(
        status__in=['pending', 'processing', 'escalated'],
        sla_deadline__lte=now
    )
    
    for ticket in urgent_tickets:
        if ticket.assignee:
            send_sla_warning.delay(ticket.id, 'urgent')
    
    for ticket in overdue_tickets:
        if ticket.assignee:
            send_sla_warning.delay(ticket.id, 'overdue')
    
    return f'Checked {urgent_tickets.count() + overdue_tickets.count()} tickets'


@shared_task
def send_sla_warning(ticket_id, warning_type):
    try:
        ticket = Ticket.objects.get(id=ticket_id)
        if not ticket.assignee or not ticket.assignee.email:
            return
        
        subject = f'【SLA{"预警" if warning_type == "urgent" else "超时"}】工单 #{ticket.ticket_no}'
        message = f'''
        工单标题: {ticket.title}
        工单编号: {ticket.ticket_no}
        当前状态: {ticket.get_status_display()}
        优先级: {ticket.get_priority_display()}
        SLA截止时间: {ticket.sla_deadline.strftime('%Y-%m-%d %H:%M:%S')}
        
        请及时处理该工单！
        '''
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[ticket.assignee.email],
            fail_silently=True
        )
        
        logger.info(f'Sent SLA {warning_type} warning for ticket {ticket_id}')
    except Ticket.DoesNotExist:
        logger.error(f'Ticket {ticket_id} not found')


@shared_task
def send_escalation_notification(ticket_id):
    try:
        ticket = Ticket.objects.get(id=ticket_id)
        if not ticket.escalated_to or not ticket.escalated_to.email:
            return
        
        subject = f'【工单升级】#{ticket.ticket_no} 需要您处理'
        message = f'''
        工单标题: {ticket.title}
        工单编号: {ticket.ticket_no}
        升级原因: {ticket.escalation_reason or '未填写'}
        升级时间: {ticket.escalated_at.strftime('%Y-%m-%d %H:%M:%S') if ticket.escalated_at else ''}
        原处理人: {ticket.assignee.name if ticket.assignee else '未分配'}
        
        客户信息:
        姓名: {ticket.customer_name}
        电话: {ticket.customer_phone}
        
        请尽快登录系统处理！
        '''
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[ticket.escalated_to.email],
            fail_silently=True
        )
        
        if ticket.assignee and ticket.assignee.email:
            send_mail(
                subject=f'【工单已升级】#{ticket.ticket_no}',
                message=f'您处理的工单 #{ticket.ticket_no} 已升级给 {ticket.escalated_to.name} 处理。',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[ticket.assignee.email],
                fail_silently=True
            )
        
        logger.info(f'Sent escalation notification for ticket {ticket_id}')
    except Ticket.DoesNotExist:
        logger.error(f'Ticket {ticket_id} not found')


@shared_task
def send_ticket_assignment_notification(ticket_id):
    try:
        ticket = Ticket.objects.get(id=ticket_id)
        if not ticket.assignee or not ticket.assignee.email:
            return
        
        subject = f'【新工单分配】#{ticket.ticket_no}'
        message = f'''
        您有新的工单需要处理：
        
        工单标题: {ticket.title}
        工单编号: {ticket.ticket_no}
        工单类型: {ticket.get_type_display()}
        优先级: {ticket.get_priority_display()}
        创建时间: {ticket.created_at.strftime('%Y-%m-%d %H:%M:%S')}
        
        客户信息:
        姓名: {ticket.customer_name}
        电话: {ticket.customer_phone}
        订单号: {ticket.order_no or '无'}
        商品: {ticket.product_name or '无'}
        
        请及时登录系统处理！
        '''
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[ticket.assignee.email],
            fail_silently=True
        )
        
        logger.info(f'Sent assignment notification for ticket {ticket_id}')
    except Ticket.DoesNotExist:
        logger.error(f'Ticket {ticket_id} not found')


@shared_task
def send_knowledge_reminder(query_id):
    from apps.knowledge.models import KnowledgeQuery
    
    try:
        query = KnowledgeQuery.objects.get(id=query_id)
        if not query.user or not query.user.email or not query.has_reminder:
            return
        
        if query.hit_item:
            item = query.hit_item
            subject = f'【知识更新提醒】{item.title}'
            message = f'''
            您之前查询的知识条目有更新：
            
            标题: {item.title}
            分类: {item.get_category_display()}
            更新时间: {item.updated_at.strftime('%Y-%m-%d %H:%M:%S')}
            
            点击查看详情: {settings.FRONTEND_URL}/knowledge/{item.id}
            '''
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[query.user.email],
                fail_silently=True
            )
            
            logger.info(f'Sent knowledge reminder for query {query_id}')
    except KnowledgeQuery.DoesNotExist:
        logger.error(f'Knowledge query {query_id} not found')


@shared_task
def generate_daily_report():
    from apps.reports.services import TrendReportService
    
    today = timezone.now().date()
    stats = TrendReportService.get_trend_data(days=1)
    
    operators = User.objects.filter(role__in=['manager', 'operator', 'admin'])
    recipient_emails = [u.email for u in operators if u.email]
    
    if not recipient_emails:
        return 'No recipients'
    
    subject = f'【日报】{today} 售后工单统计'
    message = f'''
    {today} 售后工单日报
    
    今日新增工单: {stats.get('ticket_counts', [0])[-1]}
    今日完结工单: {stats.get('resolved_count', 0)}
    平均响应时长: {stats.get('avg_response_time', 0)} 分钟
    解决率: {stats.get('resolution_rate', 0)}%
    
    请登录系统查看详细报表。
    '''
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_emails,
        fail_silently=True
    )
    
    return f'Sent daily report to {len(recipient_emails)} recipients'


@shared_task
def cleanup_old_tickets():
    threshold = timezone.now() - timedelta(days=180)
    
    closed_tickets = Ticket.objects.filter(
        status='closed',
        closed_at__lte=threshold
    )
    
    count = closed_tickets.count()
    closed_tickets.delete()
    
    logger.info(f'Cleaned up {count} old closed tickets')
    return f'Cleaned up {count} tickets'
