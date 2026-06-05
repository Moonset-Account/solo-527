from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.http import JsonResponse

from .models import Notification, NotificationTemplate
from .services import NotificationService


@login_required
def notification_list(request):
    service = NotificationService(request.user)
    notifications = service.get_user_notifications(request.user).order_by('-created_at')

    unread_count = notifications.filter(is_read=False).count()

    read = request.GET.get('read')
    if read is not None:
        notifications = notifications.filter(is_read=(read == '1'))

    context = {
        'notifications': notifications,
        'unread_count': unread_count,
    }
    return render(request, 'notifications/list.html', context)


@login_required
@transaction.atomic
def notification_detail(request, pk):
    notification = get_object_or_404(Notification, pk=pk, recipient=request.user)
    service = NotificationService(request.user)
    service.mark_as_read(str(notification.pk), request.user)
    context = {'notification': notification}
    return render(request, 'notifications/detail.html', context)


@login_required
def template_list(request):
    templates = NotificationTemplate.objects.filter(is_active=True)
    context = {'templates': templates}
    return render(request, 'notifications/template_list.html', context)


@login_required
@transaction.atomic
def mark_all_read(request):
    service = NotificationService(request.user)
    count = service.mark_all_as_read(request.user)
    if request.headers.get('HX-Request'):
        return JsonResponse({'marked': count})
    return redirect('notifications:list')


@login_required
def unread_count(request):
    service = NotificationService(request.user)
    count = service.get_unread_count(str(request.user.pk))
    return JsonResponse({'count': count})
