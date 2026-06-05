from django.core.management.base import BaseCommand
from django.db.models.signals import post_save
from django.contrib.auth import get_user_model
from ethics.models import (
    Project, Material, MaterialVersion, MaterialType,
    ReviewComment, Resubmission, ReviewAssignment, ReviewClause
)
from ethics import signals

User = get_user_model()


class Command(BaseCommand):
    help = '生成测试数据用于验证伦理委员可见性和归档只读'

    def handle(self, *args, **options):
        # 临时禁用 post_save 信号，避免 Celery 任务问题
        post_save.disconnect(signals.project_status_changed, sender=Project)
        post_save.disconnect(signals.resubmission_created, sender=Resubmission)
        post_save.disconnect(signals.review_comment_created, sender=ReviewComment)
        post_save.disconnect(signals.review_assignment_created, sender=ReviewAssignment)

        try:
            self._create_data()
        finally:
            # 重新连接信号
            post_save.connect(signals.project_status_changed, sender=Project)
            post_save.connect(signals.resubmission_created, sender=Resubmission)
            post_save.connect(signals.review_comment_created, sender=ReviewComment)
            post_save.connect(signals.review_assignment_created, sender=ReviewAssignment)

    def _create_data(self):
        self.stdout.write('开始生成测试数据...\n')

        # 1. 创建用户
        researcher, _ = User.objects.get_or_create(
            username='researcher1',
            defaults={
                'email': 'researcher1@example.com',
                'first_name': '张',
                'last_name': '研究员',
                'role': User.Role.RESEARCHER,
                'department': '生物医学工程系',
            }
        )
        researcher.set_password('testpass123')
        researcher.save()
        self.stdout.write(self.style.SUCCESS(f'创建研究者: {researcher.username}'))

        secretary, _ = User.objects.get_or_create(
            username='secretary1',
            defaults={
                'email': 'secretary1@example.com',
                'first_name': '李',
                'last_name': '秘书',
                'role': User.Role.SECRETARY,
                'department': '科研处',
            }
        )
        secretary.set_password('testpass123')
        secretary.save()
        self.stdout.write(self.style.SUCCESS(f'创建秘书: {secretary.username}'))

        committee1, _ = User.objects.get_or_create(
            username='committee1',
            defaults={
                'email': 'committee1@example.com',
                'first_name': '王',
                'last_name': '委员',
                'role': User.Role.COMMITTEE,
                'department': '伦理委员会',
                'expertise': '生物医学伦理',
            }
        )
        committee1.set_password('testpass123')
        committee1.save()
        self.stdout.write(self.style.SUCCESS(f'创建伦理委员1: {committee1.username} (负责: 知情同意书, 问卷)'))

        committee2, _ = User.objects.get_or_create(
            username='committee2',
            defaults={
                'email': 'committee2@example.com',
                'first_name': '赵',
                'last_name': '委员',
                'role': User.Role.COMMITTEE,
                'department': '伦理委员会',
                'expertise': '招募与隐私',
            }
        )
        committee2.set_password('testpass123')
        committee2.save()
        self.stdout.write(self.style.SUCCESS(f'创建伦理委员2: {committee2.username} (负责: 招募海报)'))

        # 2. 确保材料类型存在
        icf_type, _ = MaterialType.objects.get_or_create(
            code='ICF',
            defaults={'name': '知情同意书', 'sort_order': 1}
        )
        poster_type, _ = MaterialType.objects.get_or_create(
            code='POSTER',
            defaults={'name': '招募海报', 'sort_order': 2}
        )
        survey_type, _ = MaterialType.objects.get_or_create(
            code='QUESTIONNAIRE',
            defaults={'name': '调查问卷', 'sort_order': 3}
        )

        # 3. 确保评审条款存在
        clause1, _ = ReviewClause.objects.get_or_create(
            clause_number='1.1',
            defaults={
                'title': '知情同意原则',
                'content': '研究者必须向受试者充分说明研究的目的、方法、预期受益和潜在风险。',
                'category': '知情同意',
                'sort_order': 1
            }
        )
        clause2, _ = ReviewClause.objects.get_or_create(
            clause_number='2.1',
            defaults={
                'title': '招募信息真实性',
                'content': '招募材料中的信息应真实、准确，不得夸大研究收益。',
                'category': '招募',
                'sort_order': 10
            }
        )

        # 4. 创建进行中的课题
        project_active, _ = Project.objects.get_or_create(
            project_code='TEST-2025-001',
            defaults={
                'title': '基因检测对疾病预防作用的研究',
                'principal_investigator': researcher,
                'department': '生物医学工程系',
                'description': '本研究旨在探讨基因检测在疾病预防中的应用价值。',
                'status': Project.Status.IN_REVIEW,
            }
        )
        self.stdout.write(self.style.SUCCESS(f'创建课题: {project_active.project_code} (进行中)'))

        # 5. 创建已归档的课题
        project_archived, _ = Project.objects.get_or_create(
            project_code='TEST-2025-002',
            defaults={
                'title': '已完成的心理健康调查',
                'principal_investigator': researcher,
                'department': '心理系',
                'description': '已完成的心理健康调查研究，已归档。',
                'status': Project.Status.ARCHIVED,
            }
        )
        from django.utils import timezone
        project_archived.archived_at = timezone.now()
        project_archived.save()
        self.stdout.write(self.style.SUCCESS(f'创建课题: {project_archived.project_code} (已归档)'))

        # 6. 为进行中的课题创建材料和版本
        materials_to_create = [
            (project_active, icf_type, '知情同意书v1.pdf'),
            (project_active, poster_type, '招募海报v1.pdf'),
            (project_active, survey_type, '调查问卷v1.pdf'),
        ]

        created_materials = {}
        for proj, mtype, fname in materials_to_create:
            material, _ = Material.objects.get_or_create(
                project=proj,
                material_type=mtype
            )
            version, created = MaterialVersion.objects.get_or_create(
                material=material,
                version_number=1,
                defaults={
                    'title': f'{mtype.name} 初版',
                    'file': f'test/{fname}',
                    'uploader': researcher,
                    'description': '初始提交版本'
                }
            )
            if created:
                material.current_version = version
                material.save()
            created_materials[mtype.code] = {
                'material': material,
                'version': version
            }
        self.stdout.write('  为进行中课题创建材料和版本')

        # 7. 为已归档课题创建材料和版本（标记为已归档）
        materials_archived = [
            (project_archived, icf_type, '知情同意书_final.pdf'),
            (project_archived, poster_type, '招募海报_final.pdf'),
        ]
        for proj, mtype, fname in materials_archived:
            material, _ = Material.objects.get_or_create(
                project=proj,
                material_type=mtype
            )
            version, created = MaterialVersion.objects.get_or_create(
                material=material,
                version_number=1,
                defaults={
                    'title': f'{mtype.name} 最终版',
                    'file': f'test/{fname}',
                    'uploader': researcher,
                    'description': '归档版本',
                    'is_archived': True
                }
            )
            if created:
                material.current_version = version
                material.save()
        self.stdout.write('  为已归档课题创建材料和版本')

        # 8. 分配评审
        # 委员1负责: 知情同意书 + 问卷
        assign1, _ = ReviewAssignment.objects.get_or_create(
            project=project_active,
            committee_member=committee1,
        )
        assign1.material_types.set([icf_type, survey_type])
        self.stdout.write(f'  分配委员1负责: 知情同意书, 调查问卷')

        # 委员2负责: 招募海报
        assign2, _ = ReviewAssignment.objects.get_or_create(
            project=project_active,
            committee_member=committee2,
        )
        assign2.material_types.set([poster_type])
        self.stdout.write(f'  分配委员2负责: 招募海报')

        # 9. 创建评审意见
        # 委员1对知情同意书的意见
        comment1, _ = ReviewComment.objects.get_or_create(
            project=project_active,
            material_version=created_materials['ICF']['version'],
            clause=clause1,
            reviewer=committee1,
            defaults={
                'content': '知情同意书中风险说明部分不够明确，请补充具体的风险描述。',
                'status': ReviewComment.Status.PENDING
            }
        )

        # 委员1对问卷的意见
        comment2, _ = ReviewComment.objects.get_or_create(
            project=project_active,
            material_version=created_materials['QUESTIONNAIRE']['version'],
            clause=None,
            reviewer=committee1,
            defaults={
                'content': '问卷第5题涉及隐私，请增加匿名说明。',
                'status': ReviewComment.Status.PENDING
            }
        )

        # 委员2对招募海报的意见
        comment3, _ = ReviewComment.objects.get_or_create(
            project=project_active,
            material_version=created_materials['POSTER']['version'],
            clause=clause2,
            reviewer=committee2,
            defaults={
                'content': '海报中"治愈率高达90%"的表述不准确，请修改。',
                'status': ReviewComment.Status.PENDING
            }
        )
        self.stdout.write('  创建3条评审意见')

        # 10. 创建补件记录
        # 知情同意书的补件（关联委员1的意见）
        icf_version2, _ = MaterialVersion.objects.get_or_create(
            material=created_materials['ICF']['material'],
            version_number=2,
            defaults={
                'title': '知情同意书 v2 (修订)',
                'file': 'test/知情同意书v2.pdf',
                'uploader': researcher,
                'description': '根据评审意见补充了风险说明'
            }
        )
        resub1, _ = Resubmission.objects.get_or_create(
            project=project_active,
            material_version=icf_version2,
            submitter=researcher,
            defaults={
                'response_note': '已根据意见补充了具体风险描述，详见第3页。'
            }
        )
        resub1.addressed_comments.add(comment1)

        # 海报的补件（关联委员2的意见）
        poster_version2, _ = MaterialVersion.objects.get_or_create(
            material=created_materials['POSTER']['material'],
            version_number=2,
            defaults={
                'title': '招募海报 v2 (修订)',
                'file': 'test/招募海报v2.pdf',
                'uploader': researcher,
                'description': '修正了治愈率表述'
            }
        )
        resub2, _ = Resubmission.objects.get_or_create(
            project=project_active,
            material_version=poster_version2,
            submitter=researcher,
            defaults={
                'response_note': '已修改为"有效率约70%"，增加了数据来源说明。'
            }
        )
        resub2.addressed_comments.add(comment3)

        self.stdout.write('  创建2条补件记录')

        self.stdout.write('\n' + self.style.SUCCESS('=' * 50))
        self.stdout.write(self.style.SUCCESS('测试数据生成完成！'))
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write('')
        self.stdout.write('测试账号（密码均为 testpass123）：')
        self.stdout.write(f'  研究者: researcher1')
        self.stdout.write(f'  秘书: secretary1')
        self.stdout.write(f'  伦理委员1: committee1 (负责: 知情同意书, 问卷)')
        self.stdout.write(f'  伦理委员2: committee2 (负责: 招募海报)')
        self.stdout.write('')
        self.stdout.write('测试课题：')
        self.stdout.write(f'  进行中: TEST-2025-001')
        self.stdout.write(f'  已归档: TEST-2025-002')
        self.stdout.write('')
        self.stdout.write('预期结果：')
        self.stdout.write('  1. committee1 登录后只能看到 "知情同意书" 和 "调查问卷" 的材料')
        self.stdout.write('  2. committee1 只能看到知情同意书相关的补件记录')
        self.stdout.write('  3. committee1 看不到委员2对招募海报的意见')
        self.stdout.write('  4. 已归档课题 TEST-2025-002 无法新增材料版本 (API 返回 403)')
