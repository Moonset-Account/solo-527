import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procurement_system.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import UserRole
from consumables.models import ConsumableCategory, ConsumableSpecification
from suppliers.models import Supplier, SupplierRisk
from contracts.models import FrameworkContract, ContractPrice, PriceHistory
from approvals.models import ApprovalLevel, ApprovalFlow, FlowLevelRelation
from datetime import date, timedelta

User = get_user_model()

def create_users():
    print('Creating users...')
    users_data = [
        {'email': 'admin@example.com', 'password': 'Admin@123', 'first_name': '系统', 'last_name': '管理员', 'role': UserRole.ADMIN, 'is_staff': True, 'is_superuser': True},
        {'email': 'procurement@example.com', 'password': 'Test@1234', 'first_name': '张', 'last_name': '采购', 'role': UserRole.PROCUREMENT_MANAGER, 'department': '采购部', 'phone': '13800000001'},
        {'email': 'project@example.com', 'password': 'Test@1234', 'first_name': '李', 'last_name': '项目', 'role': UserRole.PROJECT_MANAGER, 'department': '项目部', 'phone': '13800000002'},
        {'email': 'duty@example.com', 'password': 'Test@1234', 'first_name': '王', 'last_name': '值班', 'role': UserRole.DUTY_OFFICER, 'department': '运营部', 'phone': '13800000003'},
        {'email': 'finance@example.com', 'password': 'Test@1234', 'first_name': '赵', 'last_name': '财务', 'role': UserRole.FINANCE, 'department': '财务部', 'phone': '13800000004'},
        {'email': 'approver@example.com', 'password': 'Test@1234', 'first_name': '孙', 'last_name': '审批', 'role': UserRole.APPROVER, 'department': '审批部', 'phone': '13800000005'},
    ]
    created_users = {}
    for data in users_data:
        if not User.objects.filter(email=data['email']).exists():
            user = User.objects.create_user(**data)
            print('  Created user:', data['email'])
        else:
            user = User.objects.get(email=data['email'])
            print('  User exists:', data['email'])
        created_users[data['email']] = user
    return created_users

def create_consumables(admin_user):
    print('Creating consumables...')
    categories_data = [
        {'name': '打印耗材', 'code': 'PRINT', 'parent': None, 'description': '打印机、复印机耗材'},
        {'name': '办公文具', 'code': 'STATIONERY', 'parent': None, 'description': '日常办公文具'},
        {'name': '纸张', 'code': 'PAPER', 'parent': None, 'description': '办公用纸'},
    ]
    created_cats = {}
    for data in categories_data:
        cat, created = ConsumableCategory.objects.get_or_create(
            code=data['code'],
            defaults=data
        )
        created_cats[data['code']] = cat

    specs_data = [
        {'name': 'A4复印纸', 'specification': '70g 500张/包', 'brand': 'Double A', 'unit': 'pack', 'unit_price': 25.00, 'category': created_cats['PAPER'], 'status': 'active'},
        {'name': 'A3复印纸', 'specification': '70g 500张/包', 'brand': 'Double A', 'unit': 'pack', 'unit_price': 45.00, 'category': created_cats['PAPER'], 'status': 'active'},
        {'name': '黑色硒鼓', 'specification': 'HP CF280A', 'brand': 'HP', 'unit': 'piece', 'unit_price': 580.00, 'category': created_cats['PRINT'], 'status': 'active'},
        {'name': '彩色硒鼓套装', 'specification': 'HP 202A 三色套装', 'brand': 'HP', 'unit': 'set', 'unit_price': 1680.00, 'category': created_cats['PRINT'], 'status': 'active'},
        {'name': '中性笔', 'specification': '0.5mm 黑色', 'brand': '晨光', 'unit': 'piece', 'unit_price': 2.50, 'category': created_cats['STATIONERY'], 'status': 'active'},
    ]
    created_specs = []
    for data in specs_data:
        spec, created = ConsumableSpecification.objects.get_or_create(
            category=data['category'],
            name=data['name'],
            specification=data['specification'],
            defaults=dict(data, created_by=admin_user)
        )
        created_specs.append(spec)
    print('  Total specifications:', len(created_specs))
    return created_specs

def create_suppliers(admin_user, procurement_user):
    print('Creating suppliers...')
    suppliers_data = [
        {
            'name': '北京办公用品有限公司',
            'unified_social_credit_code': '91110000MA001TEST1',
            'contact_person': '刘经理',
            'contact_phone': '010-12345678',
            'contact_email': 'liu@bgoffice.com',
            'address': '北京市朝阳区建国路88号',
            'registered_capital': 500,
            'status': 'active',
            'credit_rating': 'aa',
        },
        {
            'name': '上海文仪商贸有限公司',
            'unified_social_credit_code': '91310000MA002TEST2',
            'contact_person': '陈总',
            'contact_phone': '021-87654321',
            'contact_email': 'chen@shwenyi.com',
            'address': '上海市浦东新区张江路100号',
            'registered_capital': 300,
            'status': 'active',
            'credit_rating': 'a',
        },
        {
            'name': '广州打印设备服务公司',
            'unified_social_credit_code': '91440000MA003TEST3',
            'contact_person': '周主管',
            'contact_phone': '020-11223344',
            'contact_email': 'zhou@gzprint.com',
            'address': '广州市天河区体育西路10号',
            'registered_capital': 100,
            'status': 'active',
            'credit_rating': 'b',
        },
    ]
    created_suppliers = []
    for data in suppliers_data:
        supplier, created = Supplier.objects.get_or_create(
            unified_social_credit_code=data['unified_social_credit_code'],
            defaults=dict(data, created_by=admin_user)
        )
        created_suppliers.append(supplier)
    print('  Created suppliers:', len(created_suppliers))

    if created_suppliers and SupplierRisk.objects.filter(supplier=created_suppliers[2]).count() == 0:
        SupplierRisk.objects.create(
            supplier=created_suppliers[2],
            risk_type='delivery',
            risk_level='medium',
            title='近期交货延迟风险',
            description='近3个月连续3次出现交货延迟超过3天的情况，影响办公效率',
            source='月度评估',
            discovered_date=date.today() - timedelta(days=10),
            status='open',
            identified_by=procurement_user,
            assigned_to=procurement_user
        )
        print('  Created sample risk record')

    return created_suppliers

def create_contracts(suppliers, specs, admin_user, project_user, procurement_user):
    print('Creating contracts...')
    if not suppliers or not specs:
        return

    today = date.today()
    contracts_data = [
        {
            'contract_number': 'HT-2025-001',
            'title': '2025年度办公耗材框架协议',
            'supplier': suppliers[0],
            'project_manager': project_user,
            'start_date': today.replace(month=1, day=1),
            'end_date': today.replace(month=12, day=31),
            'total_amount': 500000,
            'minimum_order_amount': 5000,
            'payment_terms': 'monthly',
            'status': 'active',
            'categories': [spec.category for spec in specs[:3]],
            'specifications': specs[:3],
        },
        {
            'contract_number': 'HT-2025-002',
            'title': '2025年度打印设备耗材协议',
            'supplier': suppliers[2],
            'project_manager': project_user,
            'start_date': today.replace(month=1, day=1),
            'end_date': today + timedelta(days=15),
            'total_amount': 200000,
            'minimum_order_amount': 3000,
            'payment_terms': 'monthly',
            'status': 'active',
            'categories': [specs[2].category],
            'specifications': specs[2:4],
        },
    ]

    price_list = [25.00, 45.00, 580.00, 1680.00, 2.50]

    for data in contracts_data:
        cats = data.pop('categories', [])
        specs_list = data.pop('specifications', [])
        contract, created = FrameworkContract.objects.get_or_create(
            contract_number=data['contract_number'],
            defaults=dict(data, created_by=procurement_user)
        )
        if created:
            contract.categories.set(cats)
            contract.specifications.set(specs_list)

            for idx, spec in enumerate(specs_list):
                ContractPrice.objects.create(
                    contract=contract,
                    specification=spec,
                    unit_price=price_list[idx % len(price_list)],
                    effective_date=contract.start_date,
                    created_by=procurement_user
                )
                PriceHistory.objects.create(
                    specification=spec,
                    contract=contract,
                    unit_price=price_list[idx % len(price_list)],
                    price_date=contract.start_date,
                    source='contract',
                    change_reason='合同签订',
                    recorded_by=procurement_user
                )
    print('  Contracts setup complete')

def create_approvals(users):
    print('Creating approval setup...')
    procurement_user = users.get('procurement@example.com')
    finance_user = users.get('finance@example.com')
    approver_user = users.get('approver@example.com')

    levels_data = [
        {'name': '采购专员审核', 'level_order': 1},
        {'name': '采购经理审批', 'level_order': 2},
        {'name': '财务审核', 'level_order': 3},
        {'name': '总经理审批', 'level_order': 4},
    ]
    created_levels = []
    for data in levels_data:
        level, _ = ApprovalLevel.objects.get_or_create(
            name=data['name'],
            defaults=data
        )
        created_levels.append(level)

    flows_data = [
        {'name': '合同审批流程', 'flow_type': 'contract', 'level_config': [(created_levels[0], [procurement_user]), (created_levels[1], [approver_user]), (created_levels[2], [finance_user])]},
        {'name': '发票审核流程', 'flow_type': 'invoice', 'level_config': [(created_levels[0], [procurement_user]), (created_levels[2], [finance_user])]},
        {'name': '供应商准入流程', 'flow_type': 'supplier', 'level_config': [(created_levels[0], [procurement_user]), (created_levels[1], [approver_user])]},
        {'name': '价格调整审批', 'flow_type': 'price_adjustment', 'level_config': [(created_levels[1], [approver_user]), (created_levels[2], [finance_user])]},
        {'name': '风险处理审批', 'flow_type': 'risk_handle', 'level_config': [(created_levels[1], [approver_user])]},
    ]
    for data in flows_data:
        level_config = data.pop('level_config')
        flow, created = ApprovalFlow.objects.get_or_create(
            flow_type=data['flow_type'],
            defaults={'name': data['name'], 'is_active': True}
        )
        if created:
            for idx, (level, approvers) in enumerate(level_config):
                relation = FlowLevelRelation.objects.create(
                    flow=flow,
                    level=level,
                    order=idx + 1
                )
                for approver in approvers:
                    if approver:
                        relation.required_approvers.add(approver)
    print('  Approval setup complete')

def main():
    print('=' * 50)
    print('Initializing demo data...')
    print('=' * 50)

    users = create_users()
    admin = users.get('admin@example.com')
    procurement = users.get('procurement@example.com')
    project = users.get('project@example.com')

    specs = create_consumables(admin)
    suppliers = create_suppliers(admin, procurement)
    create_contracts(suppliers, specs, admin, project, procurement)
    create_approvals(users)

    print('=' * 50)
    print('Demo data initialization complete!')
    print('')
    print('Login accounts:')
    print('  管理员:    admin@example.com   / Admin@123')
    print('  采购经理:  procurement@example.com / Test@1234')
    print('  项目负责人: project@example.com    / Test@1234')
    print('  值班人员:  duty@example.com       / Test@1234')
    print('  财务人员:  finance@example.com    / Test@1234')
    print('  审批人:    approver@example.com   / Test@1234')
    print('=' * 50)

if __name__ == '__main__':
    main()
