from django.core.management.base import BaseCommand
from ethics.models import MaterialType, ReviewClause


class Command(BaseCommand):
    help = '初始化系统基础数据：材料类型和评审条款'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化基础数据...')

        material_types = [
            {'name': '知情同意书', 'code': 'ICF', 'description': '受试者知情同意书', 'sort_order': 1},
            {'name': '招募海报', 'code': 'POSTER', 'description': '受试者招募宣传材料', 'sort_order': 2},
            {'name': '调查问卷', 'code': 'QUESTIONNAIRE', 'description': '研究用调查问卷', 'sort_order': 3},
            {'name': '研究方案', 'code': 'PROTOCOL', 'description': '详细研究方案', 'sort_order': 4, 'is_required': False},
            {'name': '其他材料', 'code': 'OTHER', 'description': '其他补充材料', 'sort_order': 10, 'is_required': False},
        ]

        for mt_data in material_types:
            obj, created = MaterialType.objects.get_or_create(
                code=mt_data['code'],
                defaults=mt_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'创建材料类型: {mt_data["name"]}'))
            else:
                self.stdout.write(f'材料类型已存在: {mt_data["name"]}')

        clauses = [
            {
                'clause_number': '1.1',
                'title': '知情同意原则',
                'content': '研究者必须向受试者充分说明研究的目的、方法、预期受益和潜在风险，确保受试者在完全知情的情况下自愿参与。',
                'category': '知情同意',
                'sort_order': 1
            },
            {
                'clause_number': '1.2',
                'title': '知情同意书内容完整性',
                'content': '知情同意书应包含研究目的、流程、风险、受益、保密措施、补偿方式、退出权利等必要信息。',
                'category': '知情同意',
                'sort_order': 2
            },
            {
                'clause_number': '1.3',
                'title': '弱势群体保护',
                'content': '涉及未成年人、老年人、认知障碍者等弱势群体时，应制定额外的保护措施。',
                'category': '知情同意',
                'sort_order': 3
            },
            {
                'clause_number': '2.1',
                'title': '招募信息真实性',
                'content': '招募材料中的信息应真实、准确，不得夸大研究收益或隐瞒潜在风险。',
                'category': '招募',
                'sort_order': 10
            },
            {
                'clause_number': '2.2',
                'title': '招募方式合规性',
                'content': '招募方式应符合伦理规范，不得采用强迫、利诱等不当方式。',
                'category': '招募',
                'sort_order': 11
            },
            {
                'clause_number': '3.1',
                'title': '隐私保护',
                'content': '调查问卷应采取必要措施保护受试者隐私，敏感信息应有额外保护。',
                'category': '隐私与保密',
                'sort_order': 20
            },
            {
                'clause_number': '3.2',
                'title': '数据保密',
                'content': '研究数据的存储、使用和披露应符合保密要求，不得泄露可识别的个人信息。',
                'category': '隐私与保密',
                'sort_order': 21
            },
            {
                'clause_number': '4.1',
                'title': '风险控制',
                'content': '研究设计应将潜在风险最小化，风险与收益比应合理。',
                'category': '风险与受益',
                'sort_order': 30
            },
            {
                'clause_number': '4.2',
                'title': '不良事件处理',
                'content': '应有明确的不良事件报告和处理机制。',
                'category': '风险与受益',
                'sort_order': 31
            },
        ]

        for clause_data in clauses:
            obj, created = ReviewClause.objects.get_or_create(
                clause_number=clause_data['clause_number'],
                defaults=clause_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'创建评审条款: {clause_data["clause_number"]}'))
            else:
                self.stdout.write(f'评审条款已存在: {clause_data["clause_number"]}')

        self.stdout.write(self.style.SUCCESS('基础数据初始化完成！'))
