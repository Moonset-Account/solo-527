#!/usr/bin/env python3
"""
伦理委员可见性和归档只读功能验证脚本 - 独立版

直接在脚本中创建测试数据并验证所有功能点
"""
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_test')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 在 Django.setup 之前禁用所有 Celery 相关的东西
import django
from django.conf import settings

# 确保 Celery 任务不执行
settings.CELERY_TASK_ALWAYS_EAGER = False
settings.CELERY_TASK_EAGER_PROPAGATES = False

django.setup()

# 现在禁用信号，避免 Celery 任务触发
from django.db.models.signals import post_save
from ethics import signals
from ethics.models import (
    Project, Material, MaterialVersion, MaterialType,
    ReviewComment, Resubmission, ReviewAssignment, ReviewClause
)

# 断开所有可能触发 Celery 的信号
post_save.disconnect(signals.project_status_changed, sender=Project)
post_save.disconnect(signals.resubmission_created, sender=Resubmission)
post_save.disconnect(signals.review_comment_created, sender=ReviewComment)
post_save.disconnect(signals.review_assignment_created, sender=ReviewAssignment)

from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.test import APIClient

User = get_user_model()


def run_test(name, condition, actual=None, expected=None):
    """辅助打印测试结果"""
    status = "✅ PASS" if condition else "❌ FAIL"
    print(f"{status}: {name}")
    if not condition:
        if actual is not None and expected is not None:
            print(f"       期望: {expected}")
            print(f"       实际: {actual}")
    return condition


def main():
    print("=" * 70)
    print("科研伦理系统 - 伦理委员可见性与归档只读 功能验证")
    print("=" * 70)
    print()

    all_passed = True

    # 清理旧数据
    Resubmission.objects.all().delete()
    ReviewComment.objects.all().delete()
    ReviewAssignment.objects.all().delete()
    MaterialVersion.objects.all().delete()
    Material.objects.all().delete()
    Project.objects.filter(project_code__startswith='TEST').delete()
    User.objects.filter(username__startswith='researcher1').delete()
    User.objects.filter(username__startswith='secretary1').delete()
    User.objects.filter(username__startswith='committee').delete()
    MaterialType.objects.all().delete()
    ReviewClause.objects.all().delete()

    # ========== 1. 创建测试数据 ==========
    print("创建测试数据...")

    # 创建材料类型
    type_consent = MaterialType.objects.create(
        name='知情同意书', code='CONSENT', description=''
    )
    type_poster = MaterialType.objects.create(
        name='招募海报', code='POSTER', description=''
    )
    type_survey = MaterialType.objects.create(
        name='调查问卷', code='SURVEY', description=''
    )

    # 创建评审条款
    clause1 = ReviewClause.objects.create(
        clause_number='1.1', title='伦理原则', content='研究需符合伦理原则',
        category='基本原则', sort_order=1
    )

    # 创建用户
    researcher = User.objects.create_user(
        username='researcher1', password='testpass123',
        email='researcher1@test.com', role='researcher'
    )
    User.objects.create_user(
        username='secretary1', password='testpass123',
        email='secretary1@test.com', role='secretary'
    )
    committee1 = User.objects.create_user(
        username='committee1', password='testpass123',
        email='committee1@test.com', role='committee'
    )
    committee2 = User.objects.create_user(
        username='committee2', password='testpass123',
        email='committee2@test.com', role='committee'
    )

    # 创建进行中课题
    project_active = Project.objects.create(
        project_code='TEST-2025-001',
        title='测试课题-进行中',
        principal_investigator=researcher,
        status=Project.Status.IN_REVIEW,
        department='测试科室'
    )

    # 创建3种材料
    mat_consent = Material.objects.create(
        project=project_active, material_type=type_consent
    )
    mat_poster = Material.objects.create(
        project=project_active, material_type=type_poster
    )
    mat_survey = Material.objects.create(
        project=project_active, material_type=type_survey
    )

    # 创建版本
    v_consent = MaterialVersion.objects.create(
        material=mat_consent, title='知情同意书V1',
        description='初始版本', uploader=researcher, version_number=1
    )
    v_poster = MaterialVersion.objects.create(
        material=mat_poster, title='招募海报V1',
        description='初始版本', uploader=researcher, version_number=1
    )
    v_survey = MaterialVersion.objects.create(
        material=mat_survey, title='调查问卷V1',
        description='初始版本', uploader=researcher, version_number=1
    )

    # 分配评审
    assign1 = ReviewAssignment.objects.create(
        project=project_active, committee_member=committee1
    )
    assign1.material_types.add(type_consent, type_survey)

    assign2 = ReviewAssignment.objects.create(
        project=project_active, committee_member=committee2
    )
    assign2.material_types.add(type_poster)

    # 创建3条意见
    comment1 = ReviewComment.objects.create(
        project=project_active, material_version=v_consent,
        reviewer=committee1, clause=clause1,
        content='知情同意书需要补充风险说明',
        status=ReviewComment.Status.PENDING
    )
    comment2 = ReviewComment.objects.create(
        project=project_active, material_version=v_poster,
        reviewer=committee2, clause=clause1,
        content='招募海报需要调整字体大小',
        status=ReviewComment.Status.PENDING
    )
    comment3 = ReviewComment.objects.create(
        project=project_active, material_version=v_survey,
        reviewer=committee1, clause=clause1,
        content='问卷需要增加隐私声明',
        status=ReviewComment.Status.PENDING
    )

    # 创建2条补件记录
    resub1 = Resubmission.objects.create(
        project=project_active, material_version=v_consent,
        submitter=researcher, response_note='已补充风险说明'
    )
    resub1.addressed_comments.add(comment1)

    resub2 = Resubmission.objects.create(
        project=project_active, material_version=v_poster,
        submitter=researcher, response_note='已调整字体大小'
    )
    resub2.addressed_comments.add(comment2)

    # 创建已归档课题
    project_archived = Project.objects.create(
        project_code='TEST-2025-002',
        title='测试课题-已归档',
        principal_investigator=researcher,
        status=Project.Status.ARCHIVED,
        department='测试科室'
    )
    mat_archived = Material.objects.create(
        project=project_archived, material_type=type_consent
    )
    v_archived = MaterialVersion.objects.create(
        material=mat_archived, title='归档版本',
        description='归档版本', uploader=researcher, version_number=1,
        is_archived=True
    )

    print("测试数据创建完成")
    print()

    # ========== 2. 验证详情页逻辑 ==========
    print("-" * 70)
    print("【验证1】详情页补件记录可见性 (committee1 视角)")
    print("-" * 70)

    user = committee1
    assignment = ReviewAssignment.objects.filter(
        project=project_active, committee_member=user
    ).prefetch_related('material_types').first()

    assigned_type_ids = assignment.material_types.values_list('id', flat=True)
    materials = project_active.materials.filter(material_type_id__in=assigned_type_ids)
    material_ids = materials.values_list('id', flat=True)
    version_ids = MaterialVersion.objects.filter(
        material_id__in=material_ids
    ).values_list('id', flat=True)

    resubmissions = project_active.resubmissions.filter(
        material_version_id__in=version_ids
    )

    # 测试1: 只能看到1条补件（知情同意书的）
    t1 = run_test(
        "committee1 只能看到1条补件记录",
        resubmissions.count() == 1,
        actual=f"{resubmissions.count()} 条",
        expected="1 条"
    )
    all_passed &= t1

    # 测试2: 补件是知情同意书的
    if resubmissions.count() > 0:
        resub = resubmissions.first()
        t1b = run_test(
            "可见的补件是知情同意书的补件",
            resub.material_version.material.material_type == type_consent,
            actual=resub.material_version.material.material_type.name,
            expected="知情同意书"
        )
        all_passed &= t1b

    # 测试3: 看不到海报的补件
    poster_resub_count = resubmissions.filter(
        material_version__material__material_type=type_poster
    ).count()
    t1c = run_test(
        "committee1 看不到招募海报的补件",
        poster_resub_count == 0,
        actual=f"{poster_resub_count} 条海报补件",
        expected="0 条"
    )
    all_passed &= t1c

    # 测试4: 过滤回应意见
    comments = project_active.review_comments.filter(
        Q(material_version_id__in=version_ids) | Q(reviewer=user)
    )
    visible_comment_ids = set(comments.values_list('id', flat=True))

    t1d = run_test(
        "committee1 只能看到2条意见（知情同意书+问卷的）",
        len(visible_comment_ids) == 2,
        actual=f"{len(visible_comment_ids)} 条意见",
        expected="2 条"
    )
    all_passed &= t1d

    t1e = run_test(
        "committee1 看不到委员2对海报的意见",
        comment2.id not in visible_comment_ids,
        actual="可见" if comment2.id in visible_comment_ids else "不可见",
        expected="不可见"
    )
    all_passed &= t1e

    # 测试5: 补件的 addressed_comments 只包含可见的
    for resub in resubmissions:
        visible_addressed = [
            c for c in resub.addressed_comments.all()
            if c.id in visible_comment_ids
        ]
        all_visible = all(c.id in visible_comment_ids for c in visible_addressed)
        t1f = run_test(
            "补件的 addressed_comments 只包含可见的意见",
            all_visible,
            actual="存在不可见意见" if not all_visible else "全部可见",
            expected="全部可见"
        )
        all_passed &= t1f

    print()

    # ========== 3. 验证 API - /resubmissions/ ==========
    print("-" * 70)
    print("【验证2】API /api/resubmissions/ 过滤")
    print("-" * 70)

    client = APIClient()
    client.force_authenticate(user=committee1)

    response = client.get('/api/resubmissions/', {'project': project_active.id})
    t2 = run_test(
        "API返回状态码 200",
        response.status_code == 200,
        actual=response.status_code,
        expected=200
    )
    all_passed &= t2

    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    t2b = run_test(
        "API只返回1条补件记录",
        len(results) == 1,
        actual=f"{len(results)} 条",
        expected="1 条"
    )
    all_passed &= t2b

    if len(results) > 0:
        mat_type_name = results[0].get('material_type_name', '')
        t2c = run_test(
            "返回的补件是知情同意书的",
            '知情同意书' in mat_type_name,
            actual=mat_type_name,
            expected="知情同意书"
        )
        all_passed &= t2c

        # 验证 addressed_comment_ids 过滤
        addr_ids = results[0].get('addressed_comment_ids', [])
        all_in_visible = set(addr_ids).issubset(visible_comment_ids)
        t2d = run_test(
            "addressed_comment_ids 只包含可见的意见ID",
            all_in_visible,
            actual=f"返回ID: {addr_ids}, 可见ID: {sorted(visible_comment_ids)}",
            expected="全部在可见范围内"
        )
        all_passed &= t2d

    print()

    # ========== 4. 验证 API - /material-versions/ ==========
    print("-" * 70)
    print("【验证3】API /api/material-versions/ 按负责材料类型过滤")
    print("-" * 70)

    response = client.get('/api/material-versions/', {'material__project': project_active.id})
    t3 = run_test(
        "API返回状态码 200",
        response.status_code == 200,
        actual=response.status_code,
        expected=200
    )
    all_passed &= t3

    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data

    t3b = run_test(
        "只返回负责材料类型的版本（期望2个：知情同意书+问卷）",
        len(results) == 2,
        actual=f"{len(results)} 个版本",
        expected="2 个"
    )
    all_passed &= t3b

    type_names = [r.get('material_type_name', '') for r in results]
    t3c = run_test(
        "返回的版本中不含 '招募海报'",
        '招募海报' not in type_names,
        actual=type_names,
        expected="不含'招募海报'"
    )
    all_passed &= t3c

    print()

    # ========== 5. 验证归档课题不能新增版本 ==========
    print("-" * 70)
    print("【验证4】已归档课题新增材料版本返回 403")
    print("-" * 70)

    create_data = {
        'material': mat_archived.id,
        'title': '试图在归档课题上新增版本',
        'description': '测试归档只读'
    }
    response = client.post('/api/material-versions/', create_data, format='json')

    t4 = run_test(
        "在已归档课题上创建材料版本返回403",
        response.status_code == 403,
        actual=response.status_code,
        expected=403
    )
    all_passed &= t4

    if response.status_code == 403:
        detail = ''
        try:
            detail = response.json().get('detail', '')
        except:
            pass
        t4b = run_test(
            "错误信息提示已归档",
            '已归档' in detail,
            actual=detail,
            expected="包含'已归档'字样"
        )
        all_passed &= t4b

    # 验证数据库中没有创建新版本
    new_count = MaterialVersion.objects.filter(
        material=mat_archived,
        title='试图在归档课题上新增版本'
    ).count()
    t4c = run_test(
        "数据库中没有创建新版本",
        new_count == 0,
        actual=f"{new_count} 个新版本",
        expected="0 个"
    )
    all_passed &= t4c

    print()

    # ========== 6. 验证 committee2 视角 ==========
    print("-" * 70)
    print("【验证5】committee2 (仅负责招募海报) 视角验证")
    print("-" * 70)

    client2 = APIClient()
    client2.force_authenticate(user=committee2)

    response = client2.get('/api/resubmissions/', {'project': project_active.id})
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data

    t5 = run_test(
        "committee2 只看到1条补件记录",
        len(results) == 1,
        actual=f"{len(results)} 条",
        expected="1 条 (海报的补件)"
    )
    all_passed &= t5

    if len(results) > 0:
        mat_type_name = results[0].get('material_type_name', '')
        t5b = run_test(
            "committee2 看到的补件是招募海报的",
            '海报' in mat_type_name,
            actual=mat_type_name,
            expected="招募海报相关"
        )
        all_passed &= t5b

    print()

    # ========== 总结 ==========
    print("=" * 70)
    if all_passed:
        print("✅ 所有测试通过！")
    else:
        print("❌ 部分测试未通过，请检查代码。")
    print("=" * 70)


if __name__ == '__main__':
    main()
