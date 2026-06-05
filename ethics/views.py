from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.db.models import Q, Count
from django.utils import timezone
from .models import (
    Project, Material, MaterialVersion, MaterialType,
    ReviewComment, Resubmission, ReviewAssignment, ReviewClause, ExportLog
)
from .forms import (
    ProjectForm, MaterialVersionForm, ReviewCommentForm,
    ResubmissionForm, ReviewAssignmentForm, ProjectFilterForm
)
from .utils import export_review_sheet, export_project_detail


def is_secretary_or_admin(user):
    return user.is_authenticated and (user.is_secretary() or user.is_admin())


def is_committee(user):
    return user.is_authenticated and user.is_committee()


def is_researcher(user):
    return user.is_authenticated and user.is_researcher()


@login_required
def dashboard(request):
    user = request.user
    context = {}

    if user.is_secretary() or user.is_admin():
        context['total_projects'] = Project.objects.count()
        context['pending_pre_review'] = Project.objects.filter(
            status=Project.Status.SUBMITTED
        ).count()
        context['in_review'] = Project.objects.filter(
            status__in=[Project.Status.PRE_REVIEW, Project.Status.IN_REVIEW]
        ).count()
        context['need_revision'] = Project.objects.filter(
            status=Project.Status.NEED_REVISION
        ).count()
        context['recent_projects'] = Project.objects.order_by('-updated_at')[:10]
        context['exports'] = ExportLog.objects.select_related('user').order_by('-exported_at')[:10]

    elif user.is_committee():
        assignments = ReviewAssignment.objects.filter(
            committee_member=user,
            completed_at__isnull=True
        ).select_related('project')
        context['my_assignments'] = assignments
        context['pending_count'] = assignments.count()

    else:
        my_projects = Project.objects.filter(
            Q(principal_investigator=user) | Q(researchers=user)
        ).distinct()
        context['my_projects'] = my_projects.order_by('-updated_at')
        context['drafts'] = my_projects.filter(status=Project.Status.DRAFT).count()
        context['submitted'] = my_projects.filter(
            status__in=[
                Project.Status.SUBMITTED, Project.Status.PRE_REVIEW,
                Project.Status.IN_REVIEW
            ]
        ).count()
        context['need_revision'] = my_projects.filter(
            status=Project.Status.NEED_REVISION
        ).count()
        context['archived'] = my_projects.filter(status=Project.Status.ARCHIVED).count()

    return render(request, 'dashboard.html', context)


@login_required
def project_list(request):
    form = ProjectFilterForm(request.GET or None)
    projects = Project.objects.all().select_related(
        'principal_investigator'
    ).prefetch_related('researchers')

    user = request.user
    if not (user.is_secretary() or user.is_admin()):
        if user.is_committee():
            assigned_project_ids = ReviewAssignment.objects.filter(
                committee_member=user
            ).values_list('project_id', flat=True)
            projects = projects.filter(id__in=assigned_project_ids)
        else:
            projects = projects.filter(
                Q(principal_investigator=user) | Q(researchers=user)
            ).distinct()

    if form.is_valid():
        if form.cleaned_data['status']:
            projects = projects.filter(status=form.cleaned_data['status'])
        if form.cleaned_data['keyword']:
            keyword = form.cleaned_data['keyword']
            projects = projects.filter(
                Q(title__icontains=keyword) |
                Q(project_code__icontains=keyword) |
                Q(principal_investigator__first_name__icontains=keyword) |
                Q(principal_investigator__last_name__icontains=keyword)
            )
        if form.cleaned_data['department']:
            projects = projects.filter(
                department__icontains=form.cleaned_data['department']
            )
        if form.cleaned_data['start_date']:
            projects = projects.filter(
                created_at__date__gte=form.cleaned_data['start_date']
            )
        if form.cleaned_data['end_date']:
            projects = projects.filter(
                created_at__date__lte=form.cleaned_data['end_date']
            )

    context = {
        'projects': projects.order_by('-created_at'),
        'form': form,
    }
    return render(request, 'project_list.html', context)


@login_required
def project_detail(request, pk):
    project = get_object_or_404(Project, pk=pk)

    user = request.user
    can_view = (
        user.is_secretary() or user.is_admin() or
        user == project.principal_investigator or
        user in project.researchers.all() or
        ReviewAssignment.objects.filter(
            project=project, committee_member=user
        ).exists()
    )

    if not can_view:
        messages.error(request, '您没有权限查看此课题')
        return redirect('dashboard')

    materials = project.materials.select_related(
        'material_type', 'current_version'
    ).prefetch_related(
        'versions__uploader'
    ).all()

    comments = project.review_comments.select_related(
        'clause', 'reviewer', 'material_version'
    ).all()

    resubmissions = project.resubmissions.select_related(
        'submitter', 'material_version'
    ).prefetch_related('addressed_comments').all()

    if user.is_committee():
        assignment = ReviewAssignment.objects.filter(
            project=project, committee_member=user
        ).prefetch_related('material_types').first()
        if assignment:
            assigned_material_type_ids = assignment.material_types.values_list('id', flat=True)
            materials = materials.filter(material_type_id__in=assigned_material_type_ids)
            material_ids = materials.values_list('id', flat=True)
            version_ids = MaterialVersion.objects.filter(
                material_id__in=material_ids
            ).values_list('id', flat=True)
            comments = comments.filter(
                Q(material_version_id__in=version_ids) | Q(reviewer=user)
            )
            resubmissions = resubmissions.filter(material_version_id__in=version_ids)

            visible_comment_ids = set(comments.values_list('id', flat=True))
            for resub in resubmissions:
                resub.visible_addressed_comments = [
                    c for c in resub.addressed_comments.all()
                    if c.id in visible_comment_ids
                ]

    comments_by_clause = {}
    for comment in comments:
        clause_key = comment.clause.id if comment.clause else None
        if clause_key not in comments_by_clause:
            comments_by_clause[clause_key] = []
        comments_by_clause[clause_key].append(comment)

    assignments = project.review_assignments.select_related(
        'committee_member'
    ).prefetch_related('material_types').all()

    context = {
        'project': project,
        'materials': materials,
        'comments': comments,
        'comments_by_clause': comments_by_clause,
        'resubmissions': resubmissions,
        'assignments': assignments,
        'can_edit': project.can_edit(user),
        'is_archived': project.is_archived(),
        'is_secretary': user.is_secretary() or user.is_admin(),
        'is_committee': user.is_committee(),
    }
    return render(request, 'project_detail.html', context)


@login_required
@user_passes_test(lambda u: u.is_researcher() or u.is_secretary() or u.is_admin())
def project_create(request):
    if request.method == 'POST':
        form = ProjectForm(request.POST, user=request.user)
        if form.is_valid():
            project = form.save(commit=False)
            project.principal_investigator = request.user
            project.save()
            form.save_m2m()

            material_types = MaterialType.objects.all()
            for mt in material_types:
                Material.objects.create(project=project, material_type=mt)

            messages.success(request, '课题创建成功')
            return redirect('project_detail', pk=project.pk)
    else:
        form = ProjectForm(user=request.user)

    context = {'form': form, 'mode': 'create'}
    return render(request, 'project_form.html', context)


@login_required
def project_edit(request, pk):
    project = get_object_or_404(Project, pk=pk)
    if not project.can_edit(request.user):
        messages.error(request, '您没有权限编辑此课题，或课题已归档')
        return redirect('project_detail', pk=pk)

    if request.method == 'POST':
        form = ProjectForm(request.POST, instance=project, user=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, '课题更新成功')
            return redirect('project_detail', pk=pk)
    else:
        form = ProjectForm(instance=project, user=request.user)

    context = {'form': form, 'project': project, 'mode': 'edit'}
    return render(request, 'project_form.html', context)


@login_required
def project_submit(request, pk):
    project = get_object_or_404(Project, pk=pk)
    if not project.can_edit(request.user):
        messages.error(request, '您没有权限提交此课题')
        return redirect('project_detail', pk=pk)

    if project.status != Project.Status.DRAFT:
        messages.error(request, '只有草稿状态的课题可以提交')
        return redirect('project_detail', pk=pk)

    if request.method == 'POST':
        project._old_status = project.status
        project.status = Project.Status.SUBMITTED
        project.submitted_at = timezone.now()
        project.save()
        messages.success(request, '课题已提交，等待秘书预审')
        return redirect('project_detail', pk=pk)

    context = {'project': project}
    return render(request, 'project_confirm_submit.html', context)


@login_required
@user_passes_test(is_secretary_or_admin)
def project_start_pre_review(request, pk):
    project = get_object_or_404(Project, pk=pk)
    if project.is_archived():
        messages.error(request, '已归档的课题无法进行预审')
        return redirect('project_detail', pk=pk)
    if project.status != Project.Status.SUBMITTED:
        messages.error(request, '只有已提交的课题可以开始预审')
        return redirect('project_detail', pk=pk)

    project._old_status = project.status
    project.status = Project.Status.PRE_REVIEW
    project.save()
    messages.success(request, '已进入秘书预审阶段')
    return redirect('project_detail', pk=pk)


@login_required
@user_passes_test(is_secretary_or_admin)
def project_assign_review(request, pk):
    project = get_object_or_404(Project, pk=pk)
    if project.is_archived():
        messages.error(request, '已归档的课题无法分配评审')
        return redirect('project_detail', pk=pk)
    if project.status not in [Project.Status.PRE_REVIEW, Project.Status.IN_REVIEW]:
        messages.error(request, '只有预审或评审中的课题可以分配评审')
        return redirect('project_detail', pk=pk)

    if request.method == 'POST':
        form = ReviewAssignmentForm(request.POST)
        if form.is_valid():
            assignment = form.save(commit=False)
            assignment.project = project
            assignment.save()
            form.save_m2m()

            if project.status == Project.Status.PRE_REVIEW:
                project._old_status = project.status
                project.status = Project.Status.IN_REVIEW
                project.save()

            messages.success(request, '评审任务已分配')
            return redirect('project_detail', pk=pk)
    else:
        form = ReviewAssignmentForm()

    existing_assignments = ReviewAssignment.objects.filter(project=project)
    assigned_member_ids = existing_assignments.values_list('committee_member_id', flat=True)

    context = {
        'form': form,
        'project': project,
        'existing_assignments': existing_assignments,
        'assigned_member_ids': list(assigned_member_ids),
    }
    return render(request, 'project_assign_review.html', context)


@login_required
def material_version_upload(request, material_pk):
    material = get_object_or_404(Material, pk=material_pk)
    project = material.project

    if not project.can_edit(request.user):
        messages.error(request, '您没有权限上传材料，或课题已归档')
        return redirect('project_detail', pk=project.pk)

    if request.method == 'POST':
        form = MaterialVersionForm(request.POST, request.FILES)
        if form.is_valid():
            version = form.save(commit=False)
            version.material = material
            version.uploader = request.user
            version.save()

            material.current_version = version
            material.save()

            messages.success(request, f'{material.material_type.name} v{version.version_number} 上传成功')
            return redirect('project_detail', pk=project.pk)
    else:
        form = MaterialVersionForm()

    context = {'form': form, 'material': material, 'project': project}
    return render(request, 'material_upload.html', context)


@login_required
def review_comment_add(request, project_pk):
    project = get_object_or_404(Project, pk=project_pk)
    user = request.user
    assignment = None

    if project.is_archived():
        messages.error(request, '已归档的课题无法添加评审意见')
        return redirect('project_detail', pk=project_pk)

    if user.is_committee():
        assignment = ReviewAssignment.objects.filter(
            project=project, committee_member=user, completed_at__isnull=True
        ).prefetch_related('material_types').first()
        if not assignment:
            messages.error(request, '您没有被分配此课题的评审任务')
            return redirect('project_detail', pk=project_pk)
    elif not (user.is_secretary() or user.is_admin()):
        messages.error(request, '您没有权限添加评审意见')
        return redirect('project_detail', pk=project_pk)

    if request.method == 'POST':
        form = ReviewCommentForm(request.POST)
        if form.is_valid():
            material_version_pk = request.POST.get('material_version')
            material_version = get_object_or_404(MaterialVersion, pk=material_version_pk)

            if assignment:
                assigned_type_ids = assignment.material_types.values_list('id', flat=True)
                if material_version.material.material_type_id not in assigned_type_ids:
                    messages.error(request, '您只能对分配给您的材料类型提交意见')
                    return redirect('project_detail', pk=project_pk)

            comment = form.save(commit=False)
            comment.project = project
            comment.material_version = material_version
            comment.reviewer = user
            comment.save()

            messages.success(request, '评审意见已提交')
            return redirect('project_detail', pk=project_pk)
    else:
        form = ReviewCommentForm()

    materials = project.materials.select_related('current_version').filter(
        current_version__isnull=False
    )

    if assignment:
        assigned_type_ids = assignment.material_types.values_list('id', flat=True)
        materials = materials.filter(material_type_id__in=assigned_type_ids)

    context = {
        'form': form,
        'project': project,
        'materials': materials,
    }
    return render(request, 'review_comment_add.html', context)


@login_required
@user_passes_test(is_secretary_or_admin)
def project_request_revision(request, pk):
    project = get_object_or_404(Project, pk=pk)
    if project.is_archived():
        messages.error(request, '已归档的课题无法要求补件')
        return redirect('project_detail', pk=pk)
    if project.status != Project.Status.IN_REVIEW:
        messages.error(request, '只有评审中的课题可以要求补件')
        return redirect('project_detail', pk=pk)

    if request.method == 'POST':
        project._old_status = project.status
        project.status = Project.Status.NEED_REVISION
        project.save()
        messages.success(request, '已通知研究者补件')
        return redirect('project_detail', pk=pk)

    context = {'project': project}
    return render(request, 'project_confirm_revision.html', context)


@login_required
def resubmission_create(request, project_pk):
    project = get_object_or_404(Project, pk=project_pk)
    user = request.user

    if project.is_archived():
        messages.error(request, '已归档的课题无法提交补件')
        return redirect('project_detail', pk=project_pk)

    if project.status != Project.Status.NEED_REVISION:
        messages.error(request, '只有需补件状态的课题可以提交补件')
        return redirect('project_detail', pk=project_pk)

    if not (user == project.principal_investigator or user in project.researchers.all()):
        messages.error(request, '您没有权限提交补件')
        return redirect('project_detail', pk=project_pk)

    pending_comments = project.review_comments.filter(
        status=ReviewComment.Status.PENDING
    ).select_related('clause', 'reviewer')

    if not pending_comments.exists():
        messages.warning(request, '没有待处理的评审意见')
        return redirect('project_detail', pk=project_pk)

    if request.method == 'POST':
        form = ResubmissionForm(request.POST, project=project)
        material_version_pk = request.POST.get('material_version')

        if form.is_valid() and material_version_pk:
            material_version = get_object_or_404(MaterialVersion, pk=material_version_pk)

            resubmission = form.save(commit=False)
            resubmission.project = project
            resubmission.material_version = material_version
            resubmission.submitter = user
            resubmission.save()
            form.save_m2m()

            for comment in resubmission.addressed_comments.all():
                comment.status = ReviewComment.Status.ADDRESSED
                comment.save(update_fields=['status', 'updated_at'])

            messages.success(request, '补件已提交')
            return redirect('project_detail', pk=project_pk)
    else:
        form = ResubmissionForm(project=project)

    materials = project.materials.select_related('current_version').filter(
        current_version__isnull=False
    )

    context = {
        'form': form,
        'project': project,
        'materials': materials,
        'pending_comments': pending_comments,
    }
    return render(request, 'resubmission_create.html', context)


@login_required
@user_passes_test(is_secretary_or_admin)
def project_archive(request, pk):
    project = get_object_or_404(Project, pk=pk)
    if project.status not in [Project.Status.IN_REVIEW, Project.Status.NEED_REVISION]:
        messages.error(request, '此状态的课题不能归档')
        return redirect('project_detail', pk=pk)

    if request.method == 'POST':
        project._old_status = project.status
        project.status = Project.Status.ARCHIVED
        project.archived_at = timezone.now()
        project.save()

        messages.success(request, '课题已归档，所有材料版本已标记为只读')
        return redirect('project_detail', pk=pk)

    context = {'project': project}
    return render(request, 'project_confirm_archive.html', context)


@login_required
@user_passes_test(is_secretary_or_admin)
def export_review_list(request):
    form = ProjectFilterForm(request.GET or None)
    projects = Project.objects.all().select_related('principal_investigator')

    if form.is_valid():
        if form.cleaned_data['status']:
            projects = projects.filter(status=form.cleaned_data['status'])
        if form.cleaned_data['keyword']:
            keyword = form.cleaned_data['keyword']
            projects = projects.filter(
                Q(title__icontains=keyword) |
                Q(project_code__icontains=keyword)
            )
        if form.cleaned_data['department']:
            projects = projects.filter(
                department__icontains=form.cleaned_data['department']
            )
        if form.cleaned_data['start_date']:
            projects = projects.filter(
                created_at__date__gte=form.cleaned_data['start_date']
            )
        if form.cleaned_data['end_date']:
            projects = projects.filter(
                created_at__date__lte=form.cleaned_data['end_date']
            )

    filter_params = {k: v for k, v in request.GET.items() if v}

    return export_review_sheet(
        projects=projects,
        user=request.user,
        filter_params=filter_params
    )


@login_required
def export_project(request, pk):
    project = get_object_or_404(Project, pk=pk)
    user = request.user

    can_view = (
        user.is_secretary() or user.is_admin() or
        user == project.principal_investigator or
        user in project.researchers.all()
    )
    if not can_view:
        messages.error(request, '您没有权限导出此课题')
        return redirect('project_detail', pk=pk)

    return export_project_detail(project, user)


@login_required
@user_passes_test(is_secretary_or_admin)
def export_log_list(request):
    exports = ExportLog.objects.select_related('user').order_by('-exported_at')
    context = {'exports': exports}
    return render(request, 'export_log_list.html', context)
