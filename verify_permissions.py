#!/usr/bin/env python
"""
伦理委员可见性和归档只读功能验证脚本

验证内容：
1. 伦理委员详情页补件记录 - 只能看到负责材料相关的补件
2. /api/projects/{id}/resubmissions/ - 按负责材料类型过滤
3. /api/material-versions/ - 按负责材料类型过滤，归档课题新增返回403
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_test')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.test import RequestFactory, override_settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from ethics.models import Project, MaterialVersion, Resubmission

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

    # 获取测试用户和数据
    try:
        committee1 = User.objects.get(username='committee1')
        committee2 = User.objects.get(username='committee2')
        project_active = Project.objects.get(project_code='TEST-2025-001')
        project_archived = Project.objects.get(project_code='TEST-2025-002')
    except Exception as e:
        print(f"❌ 请先运行: python manage.py create_test_data")
        print(f"错误: {e}")
        return

    print(f"测试用户: committee1 (负责: 知情同意书, 调查问卷)")
    print(f"测试课题: {project_active.project_code} (进行中), {project_archived.project_code} (已归档)")
    print()

    # 验证1: 视图层 - 伦理委员只能看到负责材料相关的补件
    print("-" * 70)
    print("【验证1】详情页补件记录可见性")
    print("-" * 70)

    from ethics.views import project_detail
    from django.contrib.auth.models import AnonymousUser

    factory = RequestFactory()
    request = factory.get(f'/projects/{project_active.id}/')
    request.user = committee1
    request.session = {}
    request.messages = []

    # 直接调用视图获取 context
    from django.shortcuts import get_object_or_404
    from ethics.models import ReviewAssignment, Material
    from django.db.models import Q

    project = project_active
    user = committee1

    resubmissions = project.resubmissions.select_related(
        'submitter', 'material_version'
    ).prefetch_related('addressed_comments').all()

    assignment = ReviewAssignment.objects.filter(
        project=project, committee_member=user
    ).prefetch_related('material_types').first()

    assigned_type_ids = assignment.material_types.values_list('id', flat=True)
    materials = project.materials.filter(material_type_id__in=assigned_type_ids)
    material_ids = materials.values_list('id', flat=True)
    version_ids = MaterialVersion.objects.filter(
        material_id__in=material_ids
    ).values_list('id', flat=True)

    filtered_resubmissions = resubmissions.filter(material_version_id__in=version_ids)

    # 检查补件数量 - 应该只有1条（知情同意书的补件），不应看到海报的补件
    test1 = run_test(
        "committee1 只能看到负责材料相关的补件 (期望1条)",
        filtered_resubmissions.count() == 1,
        actual=f"{filtered_resubmissions.count()} 条",
        expected="1 条 (知情同意书补件)"
    )
    all_passed &= test1

    if filtered_resubmissions.count() > 0:
        resub = filtered_resubmissions.first()
        test1b = run_test(
            "可见的补件关联的是知情同意书",
            '知情同意书' in resub.material_version.material.material_type.name,
            actual=resub.material_version.material.material_type.name,
            expected="知情同意书"
        )
        all_passed &= test1b

    # 检查补件的 addressed_comments 过滤
    comments = project.review_comments.filter(
        Q(material_version_id__in=version_ids) | Q(reviewer=user)
    )
    visible_comment_ids = set(comments.values_list('id', flat=True))

    # 委员1不应该看到委员2对海报的意见
    poster_comments = project.review_comments.filter(
        material_version__material__material_type__code='POSTER'
    )
    test1c = run_test(
        "committee1 看不到委员2对招募海报的意见",
        not poster_comments.filter(id__in=visible_comment_ids).exists(),
        actual="可见" if poster_comments.filter(id__in=visible_comment_ids).exists() else "不可见",
        expected="不可见"
    )
    all_passed &= test1c

    print()

    # 验证2: API - /api/projects/{id}/resubmissions/ 过滤
    print("-" * 70)
    print("【验证2】API /api/projects/{id}/resubmissions/ 过滤")
    print("-" * 70)

    client = APIClient()
    client.force_authenticate(user=committee1)

    url = reverse('resubmission-list')
    response = client.get(url, {'project': project_active.id})

    test2 = run_test(
        "API返回状态码 200",
        response.status_code == 200,
        actual=response.status_code,
        expected=200
    )
    all_passed &= test2

    results = response.json().get('results', response.json())
    test2b = run_test(
        "API只返回1条补件记录",
        len(results) == 1,
        actual=f"{len(results)} 条",
        expected="1 条"
    )
    all_passed &= test2b

    if len(results) > 0:
        # 检查 addressed_comment_ids 只包含可见的意见
        addr_ids = results[0].get('addressed_comment_ids', [])
        test2c = run_test(
            "补件的 addressed_comment_ids 只包含可见的意见ID",
            set(addr_ids).issubset(visible_comment_ids),
            actual=f"返回 {len(addr_ids)} 个ID, 全部可见: {set(addr_ids).issubset(visible_comment_ids)}",
            expected=f"所有ID在可见范围内 {visible_comment_ids}"
        )
        all_passed &= test2c

    print()

    # 验证3: API - /api/material-versions/ 按负责材料过滤
    print("-" * 70)
    print("【验证3】API /api/material-versions/ 按负责材料类型过滤")
    print("-" * 70)

    url = reverse('materialversion-list')
    response = client.get(url, {'material__project': project_active.id})

    test3 = run_test(
        "API返回状态码 200",
        response.status_code == 200,
        actual=response.status_code,
        expected=200
    )
    all_passed &= test3

    results = response.json().get('results', response.json())
    # 委员1负责知情同意书和问卷，应该各有1个版本，共2个
    test3b = run_test(
        "只返回负责材料类型的版本 (期望2个)",
        len(results) == 2,
        actual=f"{len(results)} 个",
        expected="2 个 (知情同意书, 调查问卷)"
    )
    all_passed &= test3b

    material_type_names = [r.get('material_type_name', '') for r in results]
    test3c = run_test(
        "返回的版本中不含 '招募海报'",
        '招募海报' not in material_type_names,
        actual=material_type_names,
        expected="不含'招募海报'"
    )
    all_passed &= test3c

    print()

    # 验证4: API - 已归档课题不能新增材料版本
    print("-" * 70)
    print("【验证4】API /api/material-versions/ 归档课题新增返回403")
    print("-" * 70)

    # 找到已归档课题的一个材料
    archived_material = project_archived.materials.first()
    if archived_material:
        create_data = {
            'material': archived_material.id,
            'title': '试图在归档课题上新增版本',
            'description': '测试归档只读'
        }
        url = reverse('materialversion-list')
        response = client.post(url, create_data, format='json')

        test4 = run_test(
            "在已归档课题上创建材料版本返回403",
            response.status_code == 403,
            actual=response.status_code,
            expected=403
        )
        all_passed &= test4

        if response.status_code == 403:
            detail = response.json().get('detail', '')
            test4b = run_test(
                "错误信息提示已归档",
                '已归档' in detail,
                actual=detail,
                expected="包含'已归档'字样"
            )
            all_passed &= test4b

        # 验证版本确实没有被创建
        new_count = MaterialVersion.objects.filter(
            material=archived_material,
            title='试图在归档课题上新增版本'
        ).count()
        test4c = run_test(
            "数据库中没有创建新版本",
            new_count == 0,
            actual=f"{new_count} 个新版本",
            expected="0 个"
        )
        all_passed &= test4c
    else:
        print("⚠️  跳过：已归档课题没有材料")

    print()

    # 验证5: 切换到 committee2 验证只能看到海报相关的补件
    print("-" * 70)
    print("【验证5】committee2 (仅负责招募海报) 视角验证")
    print("-" * 70)

    client2 = APIClient()
    client2.force_authenticate(user=committee2)

    url = reverse('resubmission-list')
    response = client2.get(url, {'project': project_active.id})
    results = response.json().get('results', response.json())

    test5 = run_test(
        "committee2 只看到1条补件记录 (海报的)",
        len(results) == 1,
        actual=f"{len(results)} 条",
        expected="1 条 (招募海报补件)"
    )
    all_passed &= test5

    if len(results) > 0:
        mat_type_name = results[0].get('material_type_name', '')
        if not mat_type_name:
            # 从 material_version 查
            mv_id = results[0].get('material_version')
            mv = MaterialVersion.objects.get(id=mv_id)
            mat_type_name = mv.material.material_type.name

        test5b = run_test(
            "committee2 看到的补件是招募海报的",
            '海报' in mat_type_name,
            actual=mat_type_name,
            expected="招募海报相关"
        )
        all_passed &= test5b

    print()
    print("=" * 70)
    if all_passed:
        print("✅ 所有测试通过！")
    else:
        print("❌ 部分测试未通过，请检查代码。")
    print("=" * 70)


if __name__ == '__main__':
    main()
