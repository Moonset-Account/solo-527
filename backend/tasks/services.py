from .models import Task
from residents.models import Resident


def create_qualification_exception_todo(source, assigned_user):
    resident = None
    title = ''
    description = ''

    if hasattr(source, 'voter'):
        try:
            resident = Resident.objects.get(user=source.voter)
        except Resident.DoesNotExist:
            pass
        title = f'投票资格异常：{source.voter.get_full_name()}'
        description = f'居民 {source.voter.get_full_name()} 在议题「{source.topic.title}」的投票存在资格异常，请核实处理。\n异常原因：{source.exception_remark or "未填写"}'

    elif isinstance(source, Resident):
        resident = source
        title = f'投票资格异常：{source.user.get_full_name()}'
        description = f'居民 {source.user.get_full_name()} 的投票资格存在异常，请核实处理。\n异常原因：{source.qualification_exception_reason or "未填写"}'

    task = Task.objects.create(
        title=title,
        description=description,
        type='qualification_exception',
        priority='high',
        status='pending',
        assigned_to=assigned_user,
        related_resident=resident,
        source='voting' if hasattr(source, 'voter') else 'resident',
        source_id=source.id,
        community=resident.user.community if resident else ''
    )

    return task


def create_reminder_task(user, title, description, deadline=None):
    task = Task.objects.create(
        title=title,
        description=description,
        type='reminder',
        priority='medium',
        status='pending',
        assigned_to=user,
        deadline=deadline
    )
    return task


def auto_assign_task(task):
    from users.models import User

    representatives = User.objects.filter(
        role='representative',
        is_active=True,
        community=task.community if task.community else ''
    )

    if representatives.exists():
        rep = representatives.first()
        task.assigned_to = rep
        task.status = 'in_progress' if task.status == 'pending' else task.status
        task.save()
    return task
