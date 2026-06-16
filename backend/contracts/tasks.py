from celery import shared_task
from django.core.mail import send_mail
from django.contrib.auth.models import User
from .models import ContractReview, RejectionNotification, ProgressRecord


@shared_task
def send_rejection_notification(review_id, rejected_by_id, compliance_manager_id, reason):
    try:
        review = ContractReview.objects.get(id=review_id)
        rejected_by = User.objects.get(id=rejected_by_id)
        compliance_manager = User.objects.get(id=compliance_manager_id)

        notification = RejectionNotification.objects.filter(
            contract_review=review,
            rejected_by=rejected_by,
            compliance_manager=compliance_manager,
        ).first()

        if notification:
            notification.reason = reason
            notification.save()

        print(
            f'[退回提醒] 合同 {review.contract.contract_number} 被退回。'
            f'退回人: {rejected_by.get_full_name()}, '
            f'合规经理: {compliance_manager.get_full_name()}, '
            f'原因: {reason}'
        )
    except (ContractReview.DoesNotExist, User.DoesNotExist):
        pass


@shared_task
def sync_progress_to_board(review_id):
    try:
        review = ContractReview.objects.get(id=review_id)
        notifications = review.rejection_notifications.filter(synced_to_board=False)
        for n in notifications:
            n.synced_to_board = True
            n.save()

        ProgressRecord.objects.create(
            business_form=review,
            stage='archive',
            action='审查完成，同步至办理进度看板',
        )
        print(f'[进度同步] 合同审查 {review.contract.contract_number} 已同步至看板')
    except ContractReview.DoesNotExist:
        pass


@shared_task
def check_overdue_reviews():
    from django.utils import timezone
    from datetime import timedelta

    threshold = timezone.now() - timedelta(hours=48)
    overdue_reviews = ContractReview.objects.filter(
        status='in_progress',
        updated_at__lt=threshold,
    )

    for review in overdue_reviews:
        if review.current_step:
            print(
                f'[超时提醒] 合同 {review.contract.contract_number} '
                f'在步骤 "{review.current_step.name}" 已超过48小时未处理'
            )
