from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.utils import timezone
import json

from .models import User
from equipment.models import Equipment
from bookings.models import Booking
from training.models import TrainingCertification
from notifications.services import NotificationService


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
                    results.append({'client_id': op.get('client_id'), 'success': True, 'result': result})
                except Exception as e:
                    results.append({'client_id': op.get('client_id'), 'success': False, 'error': str(e)})

        return JsonResponse({'success': True, 'results': results})
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': '无效的JSON数据'}, status=400)


def _process_operation(user, operation):
    op_type = operation.get('type')
    data = operation.get('data', {})

    if op_type == 'fault_report':
        from maintenance.services import FaultTicketService
        service = FaultTicketService(user)
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

    elif op_type == 'consumable_usage':
        from consumables.services import ConsumableUsageService
        from consumables.models import Consumable
        service = ConsumableUsageService(user)
        consumable = Consumable.objects.get(id=data['consumable_id'])
        usage = service.record_usage(
            consumable=consumable,
            user=user,
            quantity=data['quantity'],
            notes=data.get('notes', '')
        )
        return {'usage_id': str(usage.id)}

    return {}


@login_required
@require_GET
def equipment_detail(request, pk):
    try:
        equipment = Equipment.objects.select_related('category').get(pk=pk)
        data = {
            'id': str(equipment.id),
            'name': equipment.name,
            'category': {'id': str(equipment.category.id), 'name': equipment.category.name},
            'status': equipment.status,
            'status_display': equipment.get_status_display(),
            'location': equipment.location,
            'description': equipment.description,
            'requires_training': equipment.requires_training,
            'is_dangerous': equipment.is_dangerous,
            'is_available': equipment.is_available,
            'max_booking_hours': equipment.max_booking_hours,
            'require_approval': equipment.require_approval,
            'usage_count': equipment.usage_count,
        }
        return JsonResponse({'success': True, 'data': data})
    except Equipment.DoesNotExist:
        return JsonResponse({'success': False, 'error': '设备不存在'}, status=404)


@login_required
@require_GET
def equipment_search(request):
    query = request.GET.get('q', '').strip()
    if len(query) < 2:
        return JsonResponse({'success': True, 'data': []})

    equipments = Equipment.objects.filter(
        status='available'
    ).filter(
        models.Q(name__icontains=query)
        | models.Q(model_number__icontains=query)
        | models.Q(location__icontains=query)
    ).select_related('category')[:10]

    data = [{
        'id': str(e.id),
        'name': e.name,
        'category': e.category.name,
        'status': e.get_status_display(),
        'location': e.location,
    } for e in equipments]

    return JsonResponse({'success': True, 'data': data})


@login_required
@require_GET
def check_booking_conflict(request):
    equipment_id = request.GET.get('equipment_id')
    start_time = request.GET.get('start_time')
    end_time = request.GET.get('end_time')
    exclude_booking_id = request.GET.get('exclude_booking_id')

    from datetime import datetime
    try:
        start = datetime.fromisoformat(start_time)
        end = datetime.fromisoformat(end_time)
    except (ValueError, TypeError):
        return JsonResponse({'success': False, 'error': '无效的时间格式'}, status=400)

    from bookings.services import BookingService
    service = BookingService(request.user)
    equipment = Equipment.objects.get(id=equipment_id)
    conflicts = service.check_conflicts(equipment, start, end, exclude_booking_id)

    conflict_data = [{
        'id': str(c.id),
        'user': c.user.real_name,
        'start_time': c.start_time.isoformat(),
        'end_time': c.end_time.isoformat(),
        'status': c.get_status_display(),
    } for c in conflicts]

    return JsonResponse({
        'success': True,
        'has_conflict': len(conflicts) > 0,
        'conflicts': conflict_data,
    })


@login_required
@require_GET
def unread_notification_count(request):
    service = NotificationService(request.user)
    count = service.get_unread_count(request.user.id)
    return JsonResponse({'success': True, 'count': count})


@login_required
@require_GET
def user_certifications(request):
    user_id = request.GET.get('user_id', request.user.id)
    certifications = TrainingCertification.objects.filter(
        user_id=user_id,
        status='valid'
    ).select_related('course', 'category')

    data = [{
        'id': str(c.id),
        'course': c.course.name,
        'category': {'id': str(c.category.id), 'name': c.category.name},
        'certificate_number': c.certificate_number,
        'issued_date': c.issued_date.isoformat(),
        'expiry_date': c.expiry_date.isoformat() if c.expiry_date else None,
    } for c in certifications]

    return JsonResponse({'success': True, 'data': data})


from django.db import models
