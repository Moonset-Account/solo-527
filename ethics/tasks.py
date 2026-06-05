from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


@shared_task
def send_notification_email(subject, template_name, context, recipient_list):
    html_message = render_to_string(template_name, context)
    plain_message = strip_tags(html_message)
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        html_message=html_message,
        fail_silently=False,
    )


@shared_task
def notify_project_submitted(project_id):
    from .models import Project
    project = Project.objects.get(id=project_id)
    from users.models import User
    secretaries = User.objects.filter(role=User.Role.SECRETARY)
    recipient_list = [s.email for s in secretaries if s.email]
    if recipient_list:
        send_notification_email.delay(
            subject=f'新课题提交: {project.project_code}',
            template_name='emails/project_submitted.html',
            context={'project': project},
            recipient_list=recipient_list,
        )


@shared_task
def notify_review_assigned(assignment_id):
    from .models import ReviewAssignment
    assignment = ReviewAssignment.objects.get(id=assignment_id)
    recipient_list = [assignment.committee_member.email] if assignment.committee_member.email else []
    if recipient_list:
        send_notification_email.delay(
            subject=f'新评审任务分配: {assignment.project.project_code}',
            template_name='emails/review_assigned.html',
            context={'assignment': assignment},
            recipient_list=recipient_list,
        )


@shared_task
def notify_comment_added(comment_id):
    from .models import ReviewComment
    comment = ReviewComment.objects.get(id=comment_id)
    project = comment.project
    recipient_list = [project.principal_investigator.email] if project.principal_investigator.email else []
    for researcher in project.researchers.all():
        if researcher.email and researcher.email not in recipient_list:
            recipient_list.append(researcher.email)
    if recipient_list:
        send_notification_email.delay(
            subject=f'新评审意见: {project.project_code}',
            template_name='emails/comment_added.html',
            context={'comment': comment, 'project': project},
            recipient_list=recipient_list,
        )


@shared_task
def notify_resubmission_created(resubmission_id):
    from .models import Resubmission
    resubmission = Resubmission.objects.get(id=resubmission_id)
    project = resubmission.project
    from users.models import User
    secretaries = User.objects.filter(role=User.Role.SECRETARY)
    recipient_list = [s.email for s in secretaries if s.email]
    if recipient_list:
        send_notification_email.delay(
            subject=f'补件提交: {project.project_code}',
            template_name='emails/resubmission_created.html',
            context={'resubmission': resubmission, 'project': project},
            recipient_list=recipient_list,
        )


@shared_task
def notify_project_archived(project_id):
    from .models import Project
    project = Project.objects.get(id=project_id)
    recipient_list = [project.principal_investigator.email] if project.principal_investigator.email else []
    for researcher in project.researchers.all():
        if researcher.email and researcher.email not in recipient_list:
            recipient_list.append(researcher.email)
    if recipient_list:
        send_notification_email.delay(
            subject=f'课题已归档: {project.project_code}',
            template_name='emails/project_archived.html',
            context={'project': project},
            recipient_list=recipient_list,
        )
