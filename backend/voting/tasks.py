from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import Vote, VotingStatistics
from topics.models import Topic
from residents.models import Resident
from tasks.services import create_qualification_exception_todo
from notifications.services import create_notification


@shared_task
def send_voting_reminders(topic_id):
    try:
        topic = Topic.objects.get(id=topic_id)
    except Topic.DoesNotExist:
        return

    residents = Resident.objects.filter(
        is_voter_qualified=True,
        user__community=topic.community if topic.community else ''
    ) if topic.community else Resident.objects.filter(is_voter_qualified=True)

    for resident in residents:
        if not Vote.objects.filter(topic=topic, voter=resident.user).exists():
            create_notification(
                user=resident.user,
                title='投票提醒',
                content=f'请及时参与议题「{topic.title}」的投票',
                type='voting',
                related_id=topic.id
            )

            if resident.user.email:
                try:
                    send_mail(
                        f'投票提醒：{topic.title}',
                        f'尊敬的居民，\n\n议题「{topic.title}」正在进行投票，请及时参与。\n\n投票截止时间：{topic.voting_end_time}\n\n感谢您的参与！',
                        settings.DEFAULT_FROM_EMAIL,
                        [resident.user.email],
                        fail_silently=True
                    )
                except Exception as e:
                    print(f"发送邮件失败: {e}")

    return f"已发送 {residents.count()} 条投票提醒"


@shared_task
def handle_qualification_exception(vote_id):
    try:
        vote = Vote.objects.get(id=vote_id)
    except Vote.DoesNotExist:
        return

    from users.models import User
    representatives = User.objects.filter(role='representative', is_active=True)

    for rep in representatives:
        create_qualification_exception_todo(vote, rep)

        create_notification(
            user=rep,
            title='投票资格异常待办',
            content=f'居民 {vote.voter.get_full_name()} 在议题「{vote.topic.title}」的投票存在资格异常，请处理',
            type='todo',
            related_id=vote.id
        )

    return f"已为投票 {vote_id} 生成资格异常待办"


@shared_task
def check_voting_qualification():
    now = timezone.now()
    active_topics = Topic.objects.filter(
        status='voting',
        voting_end_time__gt=now
    )

    for topic in active_topics:
        stats, _ = VotingStatistics.objects.get_or_create(topic=topic)
        stats.update_statistics()

        votes_with_exceptions = topic.votes.filter(
            has_qualification_exception=True,
            exception_handled=False
        )

        for vote in votes_with_exceptions:
            handle_qualification_exception.delay(vote.id)

    return f"已检查 {active_topics.count()} 个活跃议题的投票资格"


@shared_task
def update_voting_statistics(topic_id):
    try:
        stats = VotingStatistics.objects.get(topic_id=topic_id)
        stats.update_statistics()
        return f"已更新议题 {topic_id} 的投票统计"
    except VotingStatistics.DoesNotExist:
        return f"议题 {topic_id} 的投票统计不存在"
