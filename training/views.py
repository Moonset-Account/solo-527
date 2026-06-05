from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.contrib import messages

from .models import TrainingCourse, TrainingSession, TrainingApplication, TrainingCertification
from .services import (
    TrainingCourseService, TrainingSessionService,
    TrainingApplicationService, TrainingCertificationService
)


@login_required
def course_list(request):
    service = TrainingCourseService(request.user)
    courses = service.get_all()
    context = {'courses': courses}
    return render(request, 'training/course_list.html', context)


@login_required
def course_detail(request, pk):
    course = get_object_or_404(TrainingCourse, pk=pk)
    sessions = TrainingSession.objects.filter(course=course).order_by('-start_time')
    context = {
        'course': course,
        'sessions': sessions,
    }
    return render(request, 'training/course_detail.html', context)


@login_required
def session_list(request):
    service = TrainingSessionService(request.user)
    sessions = service.get_all().order_by('-start_time')

    status = request.GET.get('status')
    if status:
        sessions = sessions.filter(status=status)

    context = {'sessions': sessions}
    return render(request, 'training/session_list.html', context)


@login_required
def session_detail(request, pk):
    session = get_object_or_404(TrainingSession, pk=pk)
    applications = TrainingApplication.objects.filter(session=session)
    context = {
        'session': session,
        'applications': applications,
    }
    return render(request, 'training/session_detail.html', context)


@login_required
@transaction.atomic
def apply_session(request, pk):
    session = get_object_or_404(TrainingSession, pk=pk)
    service = TrainingApplicationService(request.user)

    if request.method == 'POST':
        try:
            notes = request.POST.get('notes', '')
            application = service.apply(session, request.user, notes)
            messages.success(request, '培训申请已提交')
            return redirect('training:session_detail', pk=pk)
        except Exception as e:
            messages.error(request, str(e))

    return redirect('training:session_detail', pk=pk)


@login_required
def application_list(request):
    service = TrainingApplicationService(request.user)
    applications = service.get_all().order_by('-created_at')

    if not request.user.is_staff:
        applications = applications.filter(user=request.user)

    status = request.GET.get('status')
    if status:
        applications = applications.filter(status=status)

    context = {'applications': applications}
    return render(request, 'training/application_list.html', context)


@login_required
def application_detail(request, pk):
    application = get_object_or_404(TrainingApplication, pk=pk)
    context = {'application': application}
    return render(request, 'training/application_detail.html', context)


@login_required
@transaction.atomic
def approve_application(request, pk):
    application = get_object_or_404(TrainingApplication, pk=pk)
    service = TrainingApplicationService(request.user)

    if request.method == 'POST':
        try:
            notes = request.POST.get('notes', '')
            service.approve(application, request.user, notes)
            messages.success(request, '申请已批准')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('training:application_detail', pk=pk)


@login_required
@transaction.atomic
def reject_application(request, pk):
    application = get_object_or_404(TrainingApplication, pk=pk)
    service = TrainingApplicationService(request.user)

    if request.method == 'POST':
        try:
            reason = request.POST.get('reason', '')
            service.reject(application, request.user, reason)
            messages.success(request, '申请已拒绝')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('training:application_detail', pk=pk)


@login_required
@transaction.atomic
def cancel_application(request, pk):
    application = get_object_or_404(TrainingApplication, pk=pk)
    service = TrainingApplicationService(request.user)

    if request.method == 'POST':
        try:
            service.cancel(application, request.user)
            messages.success(request, '申请已取消')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('training:application_detail', pk=pk)


@login_required
def certification_list(request):
    service = TrainingCertificationService(request.user)
    certifications = service.get_all().order_by('-issued_date')

    if not request.user.is_staff:
        certifications = certifications.filter(user=request.user)

    context = {'certifications': certifications}
    return render(request, 'training/certification_list.html', context)


@login_required
def certification_detail(request, pk):
    certification = get_object_or_404(TrainingCertification, pk=pk)
    context = {'certification': certification}
    return render(request, 'training/certification_detail.html', context)
