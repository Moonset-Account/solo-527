from __future__ import absolute_import, unicode_literals
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Q
from .models import PaymentOrder, CashierShift, PaymentTransaction
from apps.conversion.models import ConversionFunnel
from apps.dashboard.models import Alert
from apps.accounts.models import User


@shared_task
def check_pending_payments():
    now = timezone.now()
    thirty_minutes_ago = now - timedelta(minutes=30)
    
    pending_orders = PaymentOrder.objects.filter(
        status='pending',
        created_at__lte=thirty_minutes_ago
    )
    
    count = 0
    for order in pending_orders:
        order.status = 'cancelled'
        order.save()
        count += 1
    
    return f'Cancelled {count} expired pending payments'


@shared_task
def process_discrepancy_resolution(order_id):
    try:
        order = PaymentOrder.objects.get(id=order_id)
        
        if order.has_discrepancy and order.discrepancy_resolved:
            funnel = getattr(order, 'conversion_funnel', None)
            if funnel:
                funnel.updated_at = timezone.now()
                funnel.save()
            
            from apps.conversion.tasks import generate_daily_report
            generate_daily_report.delay(order.paid_at.date() if order.paid_at else timezone.now().date())
            
            Alert.objects.create(
                alert_type='success',
                source='payment',
                title='收银差异已处理',
                message=f'订单{order.order_no}的收银差异已处理，金额：¥{order.total_amount}，差异说明：{order.discrepancy_note}',
                related_id=order.id,
                related_model='payments.PaymentOrder',
                assigned_to=order.discrepancy_resolved_by,
                is_action_required=False,
                is_demo=order.is_demo
            )
            
            return f'Discrepancy for order {order_id} processed successfully'
        
        return f'Order {order_id} does not have resolved discrepancy'
    except PaymentOrder.DoesNotExist:
        return f'Order {order_id} not found'
    except Exception as e:
        return f'Error processing discrepancy for order {order_id}: {str(e)}'


@shared_task
def auto_close_shift():
    now = timezone.now()
    today = now.date()
    
    open_shifts = CashierShift.objects.filter(
        status='open',
        start_time__date__lt=today
    )
    
    count = 0
    for shift in open_shifts:
        demo_filter = Q()
        if not __import__('django.conf').settings.SHOW_DEMO_DATA:
            demo_filter = Q(is_demo=False)
        
        orders = PaymentOrder.objects.filter(
            cashier=shift.cashier,
            created_at__range=(shift.start_time, now),
            demo_filter
        )
        
        total_amount = orders.aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0
        
        shift.status = 'closed'
        shift.end_time = now
        shift.total_amount = total_amount
        shift.orders_count = orders.count()
        shift.save()
        
        Alert.objects.create(
            alert_type='warning',
            source='payment',
            title='班次自动关闭',
            message=f'收银员{shift.cashier.username}的班次{shift.shift_no}已自动关闭，请及时对账。',
            related_id=shift.id,
            related_model='payments.CashierShift',
            assigned_to=shift.cashier,
            is_action_required=True,
            is_demo=shift.is_demo
        )
        
        count += 1
    
    return f'Auto-closed {count} shifts'


@shared_task
def reconcile_shift(shift_id):
    try:
        shift = CashierShift.objects.get(id=shift_id)
        
        demo_filter = Q()
        if not __import__('django.conf').settings.SHOW_DEMO_DATA:
            demo_filter = Q(is_demo=False)
        
        orders = PaymentOrder.objects.filter(
            cashier=shift.cashier,
            payment_method='cash',
            paid_at__range=(shift.start_time, shift.end_time or timezone.now()),
            status='paid',
            demo_filter
        )
        
        expected_cash = orders.aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0
        cash_discrepancy = (shift.actual_cash or 0) - shift.opening_cash - expected_cash
        
        shift.expected_cash = expected_cash
        shift.cash_discrepancy = cash_discrepancy
        shift.status = 'reconciled'
        shift.save()
        
        if abs(cash_discrepancy) > 0:
            managers = User.objects.filter(role__in=['manager', 'admin'])
            for manager in managers:
                Alert.objects.create(
                    alert_type='danger' if abs(cash_discrepancy) > 100 else 'warning',
                    source='payment',
                    title='收银对账差异',
                    message=f'班次{shift.shift_no}对账发现差异：¥{cash_discrepancy:.2f}。应收：¥{expected_cash:.2f}，实收：¥{(shift.actual_cash or 0):.2f}',
                    related_id=shift.id,
                    related_model='payments.CashierShift',
                    assigned_to=manager,
                    is_action_required=True,
                    is_demo=shift.is_demo
                )
        
        return f'Shift {shift_id} reconciled. Discrepancy: ¥{cash_discrepancy:.2f}'
    except CashierShift.DoesNotExist:
        return f'Shift {shift_id} not found'
    except Exception as e:
        return f'Error reconciling shift {shift_id}: {str(e)}'


@shared_task
def create_transaction_record(order_id, transaction_type='payment'):
    try:
        order = PaymentOrder.objects.get(id=order_id)
        
        import uuid
        transaction_no = f'TXN{timezone.now().strftime("%Y%m%d%H%M%S")}{uuid.uuid4().hex[:8].upper()}'
        
        transaction = PaymentTransaction.objects.create(
            order=order,
            transaction_no=transaction_no,
            transaction_type=transaction_type,
            amount=order.paid_amount if transaction_type == 'payment' else order.refund_amount,
            payment_method=order.payment_method or 'other',
            third_party_transaction_id=order.transaction_id,
            status='success',
            operator=order.cashier,
            is_demo=order.is_demo
        )
        
        return f'Transaction {transaction.transaction_no} created for order {order_id}'
    except PaymentOrder.DoesNotExist:
        return f'Order {order_id} not found'
    except Exception as e:
        return f'Error creating transaction for order {order_id}: {str(e)}'


@shared_task
def send_payment_notification(order_id):
    try:
        order = PaymentOrder.objects.get(id=order_id)
        
        if order.status == 'paid':
            message = f'【支付成功】您的订单{order.order_no}已支付成功，金额：¥{order.paid_amount:.2f}。'
            
            Alert.objects.create(
                alert_type='success',
                source='payment',
                title='支付成功',
                message=message,
                related_id=order.id,
                related_model='payments.PaymentOrder',
                assigned_to=order.member,
                is_action_required=False,
                is_demo=order.is_demo
            )
            
            return f'Payment notification sent for order {order_id}'
        return f'Order {order_id} is not paid'
    except PaymentOrder.DoesNotExist:
        return f'Order {order_id} not found'
    except Exception as e:
        return f'Error sending payment notification for order {order_id}: {str(e)}'


@shared_task
def check_unresolved_discrepancies():
    now = timezone.now()
    twenty_four_hours_ago = now - timedelta(hours=24)
    
    unresolved = PaymentOrder.objects.filter(
        has_discrepancy=True,
        discrepancy_resolved=False,
        created_at__lte=twenty_four_hours_ago
    )
    
    count = 0
    for order in unresolved:
        managers = User.objects.filter(role__in=['manager', 'admin'])
        for manager in managers:
            Alert.objects.create(
                alert_type='danger',
                source='payment',
                title='收银差异超时未处理',
                message=f'订单{order.order_no}的收银差异已超过24小时未处理，请尽快处理。差异金额：¥{order.total_amount}',
                related_id=order.id,
                related_model='payments.PaymentOrder',
                assigned_to=manager,
                is_action_required=True,
                is_demo=order.is_demo
            )
        count += 1
    
    return f'Created alerts for {count} unresolved discrepancies'
