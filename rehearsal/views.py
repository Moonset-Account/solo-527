import json
from datetime import datetime, timedelta
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.contrib import messages
from django.utils import timezone
from django.db.models import Q, Count
from django.views.decorators.http import require_POST
from .models import (
    Rehearsal, Play, Room, Prop, Member, Attendance,
    Message, RoomMaintenance, CancelRecord, PropUsage
)
from .forms import RehearsalForm, CancelRehearsalForm
from .tasks import check_and_update_rehearsal_status, send_rehearsal_notification


def get_current_member(request):
    if request.user.is_authenticated:
        try:
            return Member.objects.get(user=request.user)
        except Member.DoesNotExist:
            pass
    return None


@login_required
def dashboard(request):
    check_and_update_rehearsal_status()
    current_member = get_current_member(request)
    today = timezone.localdate()

    today_rehearsals = Rehearsal.objects.filter(
        date=today,
        status__in=['approved', 'ongoing']
    ).order_by('start_time')

    upcoming_rehearsals = Rehearsal.objects.filter(
        date__gt=today,
        status='approved'
    ).order_by('date', 'start_time')[:10]

    pending_count = Rehearsal.objects.filter(status='pending').count()

    context = {
        'current_member': current_member,
        'today_rehearsals': today_rehearsals,
        'upcoming_rehearsals': upcoming_rehearsals,
        'pending_count': pending_count,
        'today': today,
    }
    return render(request, 'rehearsal/dashboard.html', context)


@login_required
def calendar_view(request):
    current_member = get_current_member(request)
    rooms = Room.objects.filter(is_available=True)
    context = {
        'current_member': current_member,
        'rooms': rooms,
    }
    return render(request, 'rehearsal/calendar.html', context)


@login_required
def api_calendar_events(request):
    start_date = request.GET.get('start')
    end_date = request.GET.get('end')
    room_id = request.GET.get('room')

    rehearsals = Rehearsal.objects.filter(
        status__in=['approved', 'ongoing', 'pending']
    )

    if start_date:
        rehearsals = rehearsals.filter(date__gte=start_date)
    if end_date:
        rehearsals = rehearsals.filter(date__lte=end_date)
    if room_id and room_id != 'all':
        rehearsals = rehearsals.filter(room_id=room_id)

    events = []
    for r in rehearsals:
        start_dt = datetime.combine(r.date, r.start_time).isoformat()
        end_dt = datetime.combine(r.date, r.end_time).isoformat()
        color_map = {
            'approved': '#10b981',
            'ongoing': '#3b82f6',
            'pending': '#f59e0b',
        }
        events.append({
            'id': r.id,
            'title': f'{r.play.title} - {r.room.name}',
            'start': start_dt,
            'end': end_dt,
            'backgroundColor': color_map.get(r.status, '#6b7280'),
            'borderColor': color_map.get(r.status, '#6b7280'),
            'extendedProps': {
                'play': r.play.title,
                'room': r.room.name,
                'director': r.director.name,
                'status': r.get_status_display(),
                'members': [m.name for m in r.members.all()],
            }
        })

    return JsonResponse(events, safe=False)


@login_required
def rehearsal_list(request):
    current_member = get_current_member(request)
    status = request.GET.get('status', '')
    play_id = request.GET.get('play', '')

    rehearsals = Rehearsal.objects.all()

    if status:
        rehearsals = rehearsals.filter(status=status)
    if play_id:
        rehearsals = rehearsals.filter(play_id=play_id)
    if current_member and not current_member.is_admin:
        rehearsals = rehearsals.filter(
            Q(director=current_member) | Q(members=current_member)
        ).distinct()

    plays = Play.objects.all()

    context = {
        'rehearsals': rehearsals.order_by('-date', '-start_time'),
        'plays': plays,
        'current_status': status,
        'current_member': current_member,
    }
    return render(request, 'rehearsal/rehearsal_list.html', context)


@login_required
def rehearsal_detail(request, pk):
    current_member = get_current_member(request)
    rehearsal = get_object_or_404(Rehearsal, pk=pk)
    attendances = rehearsal.attendances.all()
    prop_usages = rehearsal.prop_usages.all()
    messages_list = rehearsal.messages.all().order_by('-created_at')[:5]

    can_edit = current_member and (current_member.is_admin or current_member == rehearsal.director)
    can_cancel = current_member and rehearsal.can_be_cancelled_by(current_member)
    is_in_performance_week = rehearsal.is_in_performance_week()

    context = {
        'rehearsal': rehearsal,
        'attendances': attendances,
        'prop_usages': prop_usages,
        'messages': messages_list,
        'current_member': current_member,
        'can_edit': can_edit,
        'can_cancel': can_cancel,
        'is_in_performance_week': is_in_performance_week,
    }
    return render(request, 'rehearsal/rehearsal_detail.html', context)


@login_required
def rehearsal_create(request):
    current_member = get_current_member(request)
    if not current_member or not current_member.is_director:
        messages.error(request, '您没有权限提交排练需求')
        return redirect('dashboard')

    if request.method == 'POST':
        form = RehearsalForm(request.POST, user=request.user)
        if form.is_valid():
            rehearsal = form.save(commit=False)
            rehearsal.created_by = current_member
            if current_member.is_admin:
                rehearsal.status = 'approved'
            else:
                rehearsal.status = 'pending'
            rehearsal.save()
            form.save_m2m()

            prop_quantities = request.POST.get('prop_quantities', '{}')
            try:
                prop_quantities = json.loads(prop_quantities)
                for prop_id, qty in prop_quantities.items():
                    try:
                        prop = Prop.objects.get(id=prop_id)
                        PropUsage.objects.create(
                            prop=prop,
                            rehearsal=rehearsal,
                            quantity=int(qty)
                        )
                    except (Prop.DoesNotExist, ValueError):
                        pass
            except json.JSONDecodeError:
                pass

            messages.success(request, '排练需求已提交' + ('并通过审批' if rehearsal.status == 'approved' else '，等待管理员审批'))
            return redirect('rehearsal_detail', pk=rehearsal.pk)
    else:
        form = RehearsalForm(user=request.user)

    props = Prop.objects.all()
    context = {
        'form': form,
        'props': props,
        'current_member': current_member,
    }
    return render(request, 'rehearsal/rehearsal_form.html', context)


@login_required
def rehearsal_edit(request, pk):
    current_member = get_current_member(request)
    rehearsal = get_object_or_404(Rehearsal, pk=pk)

    if not current_member or not (current_member.is_admin or current_member == rehearsal.director):
        messages.error(request, '您没有权限编辑此排练')
        return redirect('rehearsal_detail', pk=pk)

    if request.method == 'POST':
        form = RehearsalForm(request.POST, instance=rehearsal, user=request.user)
        if form.is_valid():
            form.save()

            prop_quantities_str = request.POST.get('prop_quantities', '{}')
            try:
                prop_quantities = json.loads(prop_quantities_str) if prop_quantities_str else {}
            except (json.JSONDecodeError, Exception):
                prop_quantities = {}

            existing_props = set(PropUsage.objects.filter(rehearsal=rehearsal).values_list('prop_id', flat=True))
            new_props = set(int(pid) for pid in prop_quantities.keys() if pid.isdigit())

            to_remove = existing_props - new_props
            PropUsage.objects.filter(rehearsal=rehearsal, prop_id__in=to_remove).delete()

            for prop_id, qty in prop_quantities.items():
                try:
                    prop_id = int(prop_id)
                    qty = int(qty)
                    prop = Prop.objects.get(id=prop_id)
                    usage, created = PropUsage.objects.get_or_create(
                        rehearsal=rehearsal,
                        prop=prop,
                        defaults={'quantity': qty}
                    )
                    if not created:
                        usage.quantity = qty
                        usage.save()
                except (Prop.DoesNotExist, ValueError):
                    pass

            messages.success(request, '排练信息已更新')
            return redirect('rehearsal_detail', pk=rehearsal.pk)
    else:
        form = RehearsalForm(instance=rehearsal, user=request.user)

    props = Prop.objects.all()
    selected_props = PropUsage.objects.filter(rehearsal=rehearsal)

    context = {
        'form': form,
        'rehearsal': rehearsal,
        'props': props,
        'selected_props': selected_props,
        'current_member': current_member,
    }
    return render(request, 'rehearsal/rehearsal_form.html', context)


@login_required
def rehearsal_cancel(request, pk):
    current_member = get_current_member(request)
    rehearsal = get_object_or_404(Rehearsal, pk=pk)

    if not current_member or not rehearsal.can_be_cancelled_by(current_member):
        messages.error(request, '您没有权限取消此排练')
        return redirect('rehearsal_detail', pk=pk)

    if rehearsal.is_in_performance_week() and not current_member.is_admin:
        messages.error(request, '演出周的排练不能被普通成员取消')
        return redirect('rehearsal_detail', pk=pk)

    if request.method == 'POST':
        form = CancelRehearsalForm(request.POST)
        if form.is_valid():
            cancel_record = form.save(commit=False)
            cancel_record.rehearsal = rehearsal
            cancel_record.cancelled_by = current_member
            cancel_record.save()

            rehearsal.status = 'cancelled'
            rehearsal.save()

            messages.success(request, '排练已取消，通知已发送给所有成员')
            return redirect('rehearsal_detail', pk=pk)
    else:
        form = CancelRehearsalForm()

    context = {
        'form': form,
        'rehearsal': rehearsal,
        'current_member': current_member,
    }
    return render(request, 'rehearsal/rehearsal_cancel.html', context)


@login_required
def rehearsal_approve(request, pk):
    current_member = get_current_member(request)
    if not current_member or not current_member.is_admin:
        messages.error(request, '您没有权限审批')
        return redirect('rehearsal_list')

    rehearsal = get_object_or_404(Rehearsal, pk=pk)

    if rehearsal.status != 'pending':
        messages.warning(request, '该排练状态不是待审批，无法审批')
        return redirect('rehearsal_detail', pk=pk)

    member_count = rehearsal.members.count()
    if member_count > rehearsal.room.capacity:
        messages.error(
            request,
            f'审批失败：参与人数({member_count})超过排练室容量({rehearsal.room.capacity})'
        )
        return redirect('rehearsal_detail', pk=pk)

    if rehearsal.need_lighting and not rehearsal.room.has_lighting:
        messages.error(
            request,
            f'审批失败：{rehearsal.room.name} 没有灯光设备'
        )
        return redirect('rehearsal_detail', pk=pk)

    conflicts = rehearsal.get_conflicts()
    if conflicts:
        conflict_info = '; '.join([f'{c.play.title} ({c.start_time}-{c.end_time})' for c in conflicts])
        messages.error(
            request,
            f'审批失败：时间冲突 - {conflict_info}'
        )
        return redirect('rehearsal_detail', pk=pk)

    rehearsal.status = 'approved'
    rehearsal.save()

    for member in rehearsal.members.all():
        Attendance.objects.get_or_create(
            rehearsal=rehearsal,
            member=member,
            defaults={'status': 'absent'}
        )

    send_rehearsal_notification.delay(rehearsal.id, 'info')
    messages.success(request, '排练已通过审批，通知已发送')
    return redirect('rehearsal_detail', pk=pk)


@login_required
def rehearsal_reject(request, pk):
    current_member = get_current_member(request)
    if not current_member or not current_member.is_admin:
        messages.error(request, '您没有权限审批')
        return redirect('rehearsal_list')

    rehearsal = get_object_or_404(Rehearsal, pk=pk)
    if request.method == 'POST':
        reason = request.POST.get('reason', '')
        rehearsal.status = 'rejected'
        rehearsal.notes = f'拒绝原因: {reason}\n{rehearsal.notes}'
        rehearsal.save()
        messages.success(request, '排练已拒绝')
        return redirect('rehearsal_detail', pk=pk)

    return render(request, 'rehearsal/rehearsal_reject.html', {'rehearsal': rehearsal})


@login_required
def check_in(request, rehearsal_id):
    current_member = get_current_member(request)
    if not current_member:
        return JsonResponse({'success': False, 'message': '请先登录'})

    rehearsal = get_object_or_404(Rehearsal, id=rehearsal_id)

    attendance, created = Attendance.objects.get_or_create(
        rehearsal=rehearsal,
        member=current_member,
        defaults={'status': 'absent'}
    )

    if not attendance.check_in_time:
        now = timezone.now()
        attendance.check_in_time = now
        attendance.status = 'present'

        try:
            from datetime import datetime
            from django.conf import settings
            rehearsal_start = datetime.combine(rehearsal.date, rehearsal.start_time)
            check_in = now.replace(tzinfo=None)
            delta = check_in - rehearsal_start
            late_minutes = int(delta.total_seconds() / 60)
            if late_minutes > settings.LATE_THRESHOLD_MINUTES:
                attendance.status = 'late'
                attendance.late_minutes = late_minutes
        except Exception:
            pass

        attendance.save()

    return JsonResponse({
        'success': True,
        'status': attendance.get_status_display(),
        'status_code': attendance.status,
        'check_in_time': attendance.check_in_time.strftime('%H:%M:%S'),
        'late_minutes': attendance.late_minutes,
    })


@login_required
def message_list(request):
    current_member = get_current_member(request)
    if not current_member:
        return redirect('dashboard')

    messages = current_member.received_messages.all().order_by('-created_at')
    unread_count = messages.exclude(read_by=current_member).count()

    context = {
        'messages': messages,
        'unread_count': unread_count,
        'current_member': current_member,
    }
    return render(request, 'rehearsal/message_list.html', context)


@login_required
def message_read(request, pk):
    current_member = get_current_member(request)
    message = get_object_or_404(Message, pk=pk)
    if current_member in message.recipients.all():
        message.read_by.add(current_member)
    return redirect('message_list')


@login_required
def prop_list(request):
    current_member = get_current_member(request)
    props = Prop.objects.all()
    category = request.GET.get('category', '')
    if category:
        props = props.filter(category=category)

    context = {
        'props': props,
        'current_category': category,
        'current_member': current_member,
    }
    return render(request, 'rehearsal/prop_list.html', context)


@login_required
def room_list(request):
    current_member = get_current_member(request)
    rooms = Room.objects.filter(is_available=True)
    context = {
        'rooms': rooms,
        'current_member': current_member,
    }
    return render(request, 'rehearsal/room_list.html', context)


@login_required
def attendance_stats(request):
    current_member = get_current_member(request)
    if not current_member or not current_member.is_admin:
        messages.error(request, '您没有权限查看统计')
        return redirect('dashboard')

    rehearsals = Rehearsal.objects.filter(status='completed').order_by('-date')
    stats = []
    for rehearsal in rehearsals:
        total = rehearsal.attendances.count()
        present = rehearsal.attendances.filter(status='present').count()
        late = rehearsal.attendances.filter(status='late').count()
        absent = rehearsal.attendances.filter(status='absent').count()
        stats.append({
            'rehearsal': rehearsal,
            'total': total,
            'present': present,
            'late': late,
            'absent': absent,
            'rate': f'{(present + late) / total * 100:.1f}%' if total > 0 else '0%'
        })

    context = {
        'stats': stats,
        'current_member': current_member,
    }
    return render(request, 'rehearsal/attendance_stats.html', context)


@login_required
def check_conflict_api(request):
    room_id = request.GET.get('room_id')
    date = request.GET.get('date')
    start_time = request.GET.get('start_time')
    end_time = request.GET.get('end_time')
    exclude_id = request.GET.get('exclude_id')

    if not all([room_id, date, start_time, end_time]):
        return JsonResponse({'conflicts': []})

    conflicts = Rehearsal.objects.filter(
        room_id=room_id,
        date=date,
        status__in=['pending', 'approved', 'ongoing']
    )
    if exclude_id:
        conflicts = conflicts.exclude(id=exclude_id)

    result = []
    for c in conflicts:
        if (start_time < str(c.end_time) and end_time > str(c.start_time)):
            result.append({
                'id': c.id,
                'play': c.play.title,
                'start_time': str(c.start_time),
                'end_time': str(c.end_time),
                'director': c.director.name,
            })

    return JsonResponse({'conflicts': result})
