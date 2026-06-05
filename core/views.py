from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_POST
from django.utils import timezone
from django.db import transaction
import json

from .models import User
from notifications.services import NotificationService
from bookings.models import Booking
from equipment.models import Equipment
from training.models import TrainingApplication, TrainingCertification
from maintenance.models import FaultTicket
from consumables.models import Consumable
from safety.models import SafetyIncident


def home(request):
    if request.user.is_authenticated:
        return redirect('core:dashboard')
    return render(request, 'core/home.html')


@login_required
def dashboard(request):
    user = request.user

    context = {
        'upcoming_bookings': Booking.objects.filter(
            user=user,
            status__in=['approved', 'in_progress'],
            end_time__gte=timezone.now()
        ).select_related('equipment')[:5],
        'my_certifications': TrainingCertification.objects.filter(
            user=user,
            status='valid'
        ).select_related('course', 'category')[:5],
        'pending_training': TrainingApplication.objects.filter(
            user=user,
            status='pending'
        ).select_related('session', 'session__course').count(),
        'open_faults': FaultTicket.objects.filter(
            reporter=user,
            status__in=['open', 'in_progress', 'waiting_parts']
        ).count(),
        'available_equipment': Equipment.objects.filter(
            status='available'
        ).count(),
        'notifications_count': NotificationService(user).get_unread_count(user.id),
        'low_stock_consumables': Consumable.objects.filter(
            is_active=True,
            current_stock__lte=10
        ).count(),
    }

    if request.htmx:
        return render(request, 'core/partials/dashboard_content.html', context)

    return render(request, 'core/dashboard.html', context)


@login_required
def profile(request):
    certifications = TrainingCertification.objects.filter(
        user=request.user
    ).select_related('course', 'category')

    context = {
        'user': request.user,
        'certifications': certifications,
    }
    return render(request, 'core/profile.html', context)


@login_required
def profile_edit(request):
    if request.method == 'POST':
        user = request.user
        user.real_name = request.POST.get('real_name', user.real_name)
        user.phone = request.POST.get('phone', user.phone)
        user.bio = request.POST.get('bio', user.bio)

        if request.FILES.get('avatar'):
            user.avatar = request.FILES['avatar']

        user.save()
        messages.success(request, '个人资料已更新')
        return redirect('core:profile')

    return render(request, 'core/profile_edit.html')


@login_required
def scan_qr(request):
    return render(request, 'core/scan_qr.html')


@login_required
def scan_qr_result(request):
    code = request.GET.get('code', '')
    result = {'found': False, 'type': None, 'id': None, 'url': None}

    if code.startswith('equipment:'):
        equipment_id = code.split(':')[1]
        from equipment.models import Equipment
        if Equipment.objects.filter(pk=equipment_id).exists():
            result = {
                'found': True,
                'type': 'equipment',
                'id': equipment_id,
                'url': f'/equipment/{equipment_id}/',
            }
    elif code.startswith('booking:'):
        booking_id = code.split(':')[1]
        from bookings.models import Booking
        if Booking.objects.filter(pk=booking_id).exists():
            result = {
                'found': True,
                'type': 'booking',
                'id': booking_id,
                'url': f'/bookings/{booking_id}/',
            }

    return JsonResponse(result)


@login_required
def history(request):
    from auditlog.models import LogEntry
    from django.contrib.contenttypes.models import ContentType

    content_type = request.GET.get('content_type')
    object_id = request.GET.get('object_id')
    action = request.GET.get('action')

    queryset = LogEntry.objects.select_related('content_type', 'actor').order_by('-timestamp')

    if content_type:
        queryset = queryset.filter(content_type__model=content_type)
    if object_id:
        queryset = queryset.filter(object_pk=object_id)
    if action:
        queryset = queryset.filter(action=action)

    logs = queryset[:100]

    context = {
        'logs': logs,
        'selected_content_type': content_type,
        'selected_action': action,
        'content_types': ContentType.objects.filter(
            app_label__in=['equipment', 'training', 'bookings', 'consumables', 'maintenance', 'safety']
        ).distinct(),
    }
    return render(request, 'core/history.html', context)


@login_required
@require_POST
def offline_sync(request):
    try:
        data = json.loads(request.body)
        pending_operations = data.get('pending_operations', [])
        results = []

        with transaction.atomic():
            for op in pending_operations:
                try:
                    result = _process_operation(request.user, op)
                    results.append({'id': op.get('id'), 'success': True, 'result': result})
                except Exception as e:
                    results.append({'id': op.get('id'), 'success': False, 'error': str(e)})

        request.offline_sync_results = results
        return JsonResponse({'success': True, 'results': results})
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': '无效的JSON数据'}, status=400)


def _process_operation(user, operation):
    op_type = operation.get('type')
    data = operation.get('data', {})

    if op_type == 'fault_report':
        from maintenance.services import FaultTicketService
        service = FaultTicketService(user)
        from equipment.models import Equipment
        equipment = Equipment.objects.get(id=data['equipment_id'])
        ticket = service.create({
            'equipment': equipment,
            'title': data['title'],
            'description': data['description'],
            'priority': data.get('priority', 'medium'),
        })
        return {'ticket_id': str(ticket.id)}

    elif op_type == 'safety_incident':
        from safety.services import SafetyIncidentService
        service = SafetyIncidentService(user)
        incident = service.create({
            'title': data['title'],
            'description': data['description'],
            'incident_time': data['incident_time'],
            'location': data['location'],
            'severity': data.get('severity', 'moderate'),
        })
        return {'incident_id': str(incident.id)}

    return {}


@login_required
def notifications_list(request):
    service = NotificationService(request.user)
    notifications = service.get_user_notifications(request.user.id)

    if request.htmx:
        return render(request, 'core/partials/notifications_list.html', {'notifications': notifications})

    context = {
        'notifications': notifications,
        'unread_count': service.get_unread_count(request.user.id),
    }
    return render(request, 'notifications/list.html', context)


@login_required
@require_POST
def notification_mark_read(request, pk):
    service = NotificationService(request.user)
    notification = service.mark_as_read(str(pk), request.user)

    if request.htmx:
        return HttpResponse('')

    return redirect('core:notifications')


@login_required
@require_POST
def notification_mark_all_read(request):
    service = NotificationService(request.user)
    count = service.mark_all_as_read(request.user)

    if request.htmx:
        return HttpResponse('')

    messages.success(request, f'已标记 {count} 条通知为已读')
    return redirect('core:notifications')
