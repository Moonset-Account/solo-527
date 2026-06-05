from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.contrib import messages
from django.utils import timezone

from .models import SafetyIncident, SafetyInspection, SafetyTrainingRecord, SafetyAttachment
from .services import SafetyIncidentService, SafetyInspectionService, SafetyTrainingRecordService


@login_required
def incident_list(request):
    service = SafetyIncidentService(request.user)
    incidents = service.get_all().order_by('-incident_time')

    severity = request.GET.get('severity')
    status = request.GET.get('status')

    if severity:
        incidents = incidents.filter(severity=severity)
    if status:
        incidents = incidents.filter(status=status)

    context = {
        'incidents': incidents,
        'selected_severity': severity,
        'selected_status': status,
    }
    return render(request, 'safety/incident_list.html', context)


@login_required
@transaction.atomic
def incident_create(request):
    service = SafetyIncidentService(request.user)

    if request.method == 'POST':
        try:
            from equipment.models import Equipment
            equipment_id = request.POST.get('equipment')
            equipment = get_object_or_404(Equipment, pk=equipment_id) if equipment_id else None

            data = {
                'title': request.POST.get('title'),
                'description': request.POST.get('description', ''),
                'severity': request.POST.get('severity', 'moderate'),
                'location': request.POST.get('location', ''),
                'incident_time': request.POST.get('incident_time', timezone.now()),
                'equipment': equipment,
            }

            incident = service.create(data, user=request.user)

            if request.FILES.getlist('attachments'):
                for file in request.FILES.getlist('attachments'):
                    service.add_attachment(incident, request.user, file, file.name)

            messages.success(request, '安全事件已上报')
            return redirect('safety:incident_detail', pk=incident.pk)
        except Exception as e:
            messages.error(request, str(e))

    from equipment.models import Equipment
    equipments = Equipment.objects.all()
    context = {'equipments': equipments}
    return render(request, 'safety/incident_create.html', context)


@login_required
def incident_detail(request, pk):
    incident = get_object_or_404(SafetyIncident, pk=pk)
    attachments = SafetyAttachment.objects.filter(incident=incident)
    context = {
        'incident': incident,
        'attachments': attachments,
    }
    return render(request, 'safety/incident_detail.html', context)


@login_required
@transaction.atomic
def incident_update_status(request, pk):
    incident = get_object_or_404(SafetyIncident, pk=pk)
    service = SafetyIncidentService(request.user)

    if request.method == 'POST':
        try:
            status = request.POST.get('status')
            notes = {
                'root_cause': request.POST.get('root_cause', ''),
                'corrective_actions': request.POST.get('corrective_actions', ''),
                'preventive_measures': request.POST.get('preventive_measures', ''),
            }
            service.update_status(incident, status, request.user, notes)
            messages.success(request, '状态已更新')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('safety:incident_detail', pk=pk)


@login_required
@transaction.atomic
def incident_add_attachment(request, pk):
    incident = get_object_or_404(SafetyIncident, pk=pk)
    service = SafetyIncidentService(request.user)

    if request.method == 'POST':
        try:
            if request.FILES.get('file'):
                file = request.FILES['file']
                service.add_attachment(incident, request.user, file, file.name)
                messages.success(request, '附件已上传')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('safety:incident_detail', pk=pk)


@login_required
def inspection_list(request):
    service = SafetyInspectionService(request.user)
    inspections = service.get_all().order_by('-scheduled_date')

    status = request.GET.get('status')
    if status:
        inspections = inspections.filter(status=status)

    context = {
        'inspections': inspections,
        'selected_status': status,
    }
    return render(request, 'safety/inspection_list.html', context)


@login_required
def inspection_detail(request, pk):
    inspection = get_object_or_404(SafetyInspection, pk=pk)
    context = {'inspection': inspection}
    return render(request, 'safety/inspection_detail.html', context)


@login_required
@transaction.atomic
def inspection_complete(request, pk):
    inspection = get_object_or_404(SafetyInspection, pk=pk)
    service = SafetyInspectionService(request.user)

    if request.method == 'POST':
        try:
            findings = request.POST.get('findings', '')
            recommendations = request.POST.get('recommendations', '')
            service.complete(inspection, request.user, findings, recommendations)
            messages.success(request, '安全检查已完成')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('safety:inspection_detail', pk=pk)


@login_required
def training_record_list(request):
    service = SafetyTrainingRecordService(request.user)
    records = service.get_all().order_by('-training_date')

    if not request.user.is_staff:
        records = records.filter(user=request.user)

    context = {'records': records}
    return render(request, 'safety/training_record_list.html', context)
