from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.contrib import messages

from .models import FaultTicket, MaintenanceSchedule, FaultAttachment, FaultComment
from .services import FaultTicketService, MaintenanceScheduleService


@login_required
def ticket_list(request):
    tickets = FaultTicket.objects.all().order_by('-created_at')

    status = request.GET.get('status')
    priority = request.GET.get('priority')
    equipment_id = request.GET.get('equipment')

    if status:
        tickets = tickets.filter(status=status)
    if priority:
        tickets = tickets.filter(priority=priority)
    if equipment_id:
        tickets = tickets.filter(equipment_id=equipment_id)

    from equipment.models import Equipment
    equipments = Equipment.objects.all()
    context = {
        'tickets': tickets,
        'equipments': equipments,
        'selected_status': status,
        'selected_priority': priority,
        'selected_equipment': equipment_id,
    }
    return render(request, 'maintenance/ticket_list.html', context)


@login_required
@transaction.atomic
def ticket_create(request):
    service = FaultTicketService(request.user)

    if request.method == 'POST':
        try:
            from equipment.models import Equipment

            equipment_id = request.POST.get('equipment')
            equipment = get_object_or_404(Equipment, pk=equipment_id) if equipment_id else None

            data = {
                'title': request.POST.get('title'),
                'description': request.POST.get('description', ''),
                'priority': request.POST.get('priority', 'medium'),
                'equipment': equipment,
            }

            ticket = service.create(data, user=request.user)

            if request.FILES.getlist('attachments'):
                for file in request.FILES.getlist('attachments'):
                    FaultAttachment.objects.create(
                        ticket=ticket,
                        file=file,
                        file_name=file.name,
                        uploaded_by=request.user,
                    )

            messages.success(request, '故障单已提交')
            return redirect('maintenance:ticket_detail', pk=ticket.pk)
        except Exception as e:
            messages.error(request, str(e))

    from equipment.models import Equipment
    equipments = Equipment.objects.all()
    context = {'equipments': equipments}
    return render(request, 'maintenance/ticket_create.html', context)


@login_required
def ticket_detail(request, pk):
    ticket = get_object_or_404(FaultTicket, pk=pk)
    comments = FaultComment.objects.filter(ticket=ticket).order_by('created_at')
    attachments = FaultAttachment.objects.filter(ticket=ticket)
    context = {
        'ticket': ticket,
        'comments': comments,
        'attachments': attachments,
    }
    return render(request, 'maintenance/ticket_detail.html', context)


@login_required
@transaction.atomic
def ticket_update_status(request, pk):
    ticket = get_object_or_404(FaultTicket, pk=pk)
    service = FaultTicketService(request.user)

    if request.method == 'POST':
        try:
            status = request.POST.get('status')
            notes = request.POST.get('notes', '')
            service.update_status(ticket, status, request.user, notes)
            messages.success(request, '状态已更新')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('maintenance:ticket_detail', pk=pk)


@login_required
@transaction.atomic
def ticket_assign(request, pk):
    ticket = get_object_or_404(FaultTicket, pk=pk)
    service = FaultTicketService(request.user)

    if request.method == 'POST':
        try:
            from core.models import User
            assignee_id = request.POST.get('assignee')
            assignee = get_object_or_404(User, pk=assignee_id)
            service.assign(ticket, assignee, request.user)
            messages.success(request, '已分配技术人员')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('maintenance:ticket_detail', pk=pk)


@login_required
@transaction.atomic
def ticket_add_comment(request, pk):
    ticket = get_object_or_404(FaultTicket, pk=pk)
    service = FaultTicketService(request.user)

    if request.method == 'POST':
        try:
            content = request.POST.get('content', '')
            if content:
                service.add_comment(ticket, request.user, content)
                messages.success(request, '评论已添加')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('maintenance:ticket_detail', pk=pk)


@login_required
@transaction.atomic
def ticket_add_attachment(request, pk):
    ticket = get_object_or_404(FaultTicket, pk=pk)
    service = FaultTicketService(request.user)

    if request.method == 'POST':
        try:
            if request.FILES.get('file'):
                file = request.FILES['file']
                service.add_attachment(ticket, request.user, file, file.name)
                messages.success(request, '附件已上传')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('maintenance:ticket_detail', pk=pk)


@login_required
def schedule_list(request):
    schedules = MaintenanceSchedule.objects.all().order_by('-scheduled_date')
    context = {'schedules': schedules}
    return render(request, 'maintenance/schedule_list.html', context)


@login_required
def schedule_detail(request, pk):
    schedule = get_object_or_404(MaintenanceSchedule, pk=pk)
    context = {'schedule': schedule}
    return render(request, 'maintenance/schedule_detail.html', context)


@login_required
@transaction.atomic
def schedule_complete(request, pk):
    schedule = get_object_or_404(MaintenanceSchedule, pk=pk)
    service = MaintenanceScheduleService(request.user)

    if request.method == 'POST':
        try:
            notes = request.POST.get('notes', '')
            service.complete(schedule, request.user, notes)
            messages.success(request, '维护计划已完成')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('maintenance:schedule_detail', pk=pk)
