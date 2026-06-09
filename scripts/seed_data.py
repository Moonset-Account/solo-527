import hashlib
import random
import uuid
from datetime import datetime, timedelta

# 先导入所有模型，让SQLAlchemy Base.metadata收集到表定义
from app.models.user import User, UserRole
from app.models.contract import (
    ContractDocument, ContractClause, ContractSummary, RiskAlert,
    ContractType, ContractStatus, ClauseCategory, RiskLevel, RiskType
)
from app.models.dataset import (
    Dataset, DatasetSample, ErrorSample,
    DatasetType, SampleStatus, SampleType, ErrorType, ErrorSeverity
)
from app.models.ml import (
    ModelVersion, ModelMetric, ModelStatus, MetricType, TaskType as MLTaskType
)
from app.models.task import (
    Task, TaskResult, Feedback, AuditLog, AlertEvent,
    TaskStatus, TaskPriority, TaskType as TaskTaskType,
    FeedbackType, AlertType, AlertSeverity, AuditAction
)

# 现在再建表
from app.core.database import SyncSessionLocal as SessionLocal, init_db
init_db()


PASSWORD_HASH = hashlib.sha256("test123456".encode()).hexdigest()


def seed_users(db):
    users_data = [
        {"username": "admin", "email": "admin@example.com", "full_name": "系统管理员", "role": UserRole.ADMIN},
        {"username": "legal1", "email": "legal1@example.com", "full_name": "法务助理李磊", "role": UserRole.LEGAL_ASSISTANT},
        {"username": "reviewer1", "email": "reviewer1@example.com", "full_name": "审核员王芳", "role": UserRole.REVIEWER},
        {"username": "annotator1", "email": "annotator1@example.com", "full_name": "标注员张明", "role": UserRole.ANNOTATOR},
        {"username": "viewer1", "email": "viewer1@example.com", "full_name": "查看员刘静", "role": UserRole.VIEWER},
    ]
    users = []
    for ud in users_data:
        u = User(
            username=ud["username"],
            email=ud["email"],
            full_name=ud["full_name"],
            hashed_password=PASSWORD_HASH,
            role=ud["role"],
            is_active=True,
            created_at=datetime.utcnow() - timedelta(days=90),
        )
        db.add(u)
        users.append(u)
    db.flush()
    return users


def seed_model_version(db):
    mv = ModelVersion(
        model_name="contract-summary",
        version="v1.0.0",
        status=ModelStatus.PRODUCTION,
        is_default=True,
        provider="mock",
        task_type=MLTaskType.SUMMARY,
        eval_metrics={"f1": 0.89, "rouge_l": 0.85},
        tags=["default"],
        description="默认合同摘要模型v1.0.0",
        created_at=datetime.utcnow() - timedelta(days=60),
        published_at=datetime.utcnow() - timedelta(days=30),
    )
    db.add(mv)
    db.flush()
    return mv


def seed_dataset(db, admin_id):
    ds = Dataset(
        name="Golden_Sample_v1",
        dataset_type=DatasetType.GOLDEN,
        version="1.0",
        owner_id=admin_id,
        is_active=True,
        is_public=True,
        tags=["seed"],
        description="种子金标数据集，覆盖常见合同类型",
        created_at=datetime.utcnow() - timedelta(days=45),
    )
    db.add(ds)
    db.flush()
    return ds


CONTRACT_1_HT2025001 = {
    "title": "房屋租赁合同",
    "contract_no": "HT2025001",
    "contract_type": ContractType.LEASE,
    "party_a": "上海鑫源置业有限公司（统一社会信用代码：91310000MA1FL00001）",
    "party_b": "上海智联科技有限公司（统一社会信用代码：91310000MA1FL00002）",
    "total_amount": 60000.0,
    "sign_date": datetime(2025, 6, 15),
    "effective_date": datetime(2025, 7, 1),
    "expiry_date": datetime(2026, 6, 30),
    "page_count": 3,
    "word_count": 3820,
    "clauses": [
        ("1", "合同双方", ClauseCategory.PARTIES, "第1条 合同双方\n出租方（甲方）：上海鑫源置业有限公司，地址：上海市浦东新区陆家嘴环路1000号，法定代表人：陈建国。\n承租方（乙方）：上海智联科技有限公司，地址：上海市张江高科技园区科苑路88号，法定代表人：李明辉。", 1),
        ("2", "租赁标的", ClauseCategory.OBJECT, "第2条 租赁标的\n甲方同意将位于上海市浦东新区陆家嘴环路1000号恒生银行大厦18层1801-1803单元，建筑面积共计450平方米的房屋出租给乙方使用。租赁用途仅限于办公及商务活动。", 1),
        ("3", "租赁期限", ClauseCategory.TERM, "第3条 租赁期限\n3.1 租赁期限为12个月，自2025年7月1日起至2026年6月30日止。\n3.2 租赁期满，乙方如需续租，应在期满前30日书面通知甲方，经甲方同意后重新签订租赁合同。", 1),
        ("4", "租金及支付方式", ClauseCategory.PRICE_PAYMENT, "第4条 租金及支付方式\n4.1 月租金为人民币5000元整（大写：伍仟元整）。\n4.2 租金按季支付或以双方书面约定。\n4.3 乙方应于每期期初5个工作日内将租金支付至甲方指定账户。\n4.4 甲方收款账户：工商银行上海分行营业部，账号6222081001001234567。", 1),
        ("5", "押金", ClauseCategory.PRICE_PAYMENT, "第5条 押金\n5.1 乙方应于本合同签订之日起3日内向甲方支付租赁押金人民币10000元整（大写：壹万元整），相当于2个月租金。\n5.2 租赁期满或合同解除后，扣除应由乙方承担的费用后，押金应无息退还乙方。", 2),
        ("6", "违约责任", ClauseCategory.LIABILITY, "第6条 违约责任\n6.1 乙方逾期支付租金的，每逾期一日应按日租金的0.5%支付滞纳金。\n6.2 承租方逾期超过7日，出租方有权单方解除合同且没收全部押金及已付租金。\n6.3 任何一方违约给对方造成损失的，违约方应承担相应的赔偿责任。", 2),
        ("7", "违约金条款", ClauseCategory.LIABILITY, "第7条 违约金\n7.1 任何一方违反本合同约定，应向守约方支付违约金，违约金金额相当于30天租金。\n7.2 违约金不足以弥补守约方损失的，违约方还应赔偿差额部分。", 2),
        ("8", "房屋维修与保养", ClauseCategory.WARRANTY, "第8条 房屋维修与保养\n8.1 租赁期间，房屋主体结构及公共设施的维修由甲方负责。\n8.2 乙方自行添置的设施设备由乙方负责维护。\n8.3 乙方应合理使用房屋及其附属设施，因使用不当造成损坏的，乙方应负责修复或赔偿。", 2),
        ("9", "合同解除", ClauseCategory.TERMINATION, "第9条 合同解除\n9.1 经双方协商一致，可以解除本合同。\n9.2 有下列情形之一的，任何一方有权书面通知对方解除本合同：（一）因不可抗力致使合同目的不能实现；（二）一方迟延履行主要义务，经催告后在合理期限内仍未履行。", 3),
        ("10", "保密条款", ClauseCategory.CONFIDENTIALITY, "第10条 保密\n双方对在签订和履行本合同过程中知悉的对方商业秘密、技术秘密及其他未公开信息负有保密义务。保密期限为合同终止后3年。", 3),
        ("11", "争议解决", ClauseCategory.DISPUTE, "第11条 争议解决\n因本合同引起的或与本合同有关的任何争议，双方应协商解决；协商不成的，任何一方均有权提交上海仲裁委员会按照该会现行仲裁规则进行仲裁。仲裁裁决是终局的，对双方均有约束力。", 3),
        ("12", "适用法律", ClauseCategory.GOVERNING_LAW, "第12条 适用法律\n本合同的订立、生效、解释、履行及争议解决均适用中华人民共和国法律。", 3),
        ("13", "不可抗力", ClauseCategory.FORCE_MAJEURE, "第13条 不可抗力\n13.1 因地震、台风、洪水、火灾、战争及其他不能预见、不能避免且不能克服的不可抗力事件，致使任何一方不能履行或不能完全履行本合同的，遭受不可抗力的一方应立即通知对方。\n13.2 根据不可抗力的影响程度，部分或全部免除责任。", 3),
        ("14", "其他约定", ClauseCategory.MISCELLANEOUS, "第14条 其他\n14.1 本合同未尽事宜，双方可另行签订补充协议。\n14.2 本合同一式四份，甲乙双方各执两份，具有同等法律效力。\n14.3 本合同自双方签字盖章之日起生效。", 3),
    ],
    "summary_text": "本合同为房屋租赁合同，甲方上海鑫源置业有限公司将位于上海市浦东新区陆家嘴环路1000号恒生银行大厦18层1801-1803单元（建筑面积450平方米）出租给乙方上海智联科技有限公司，租赁期限12个月（2025年7月1日至2026年6月30日），月租金5000元，押金10000元。合同约定了逾期支付的违约责任，存在解除合同时没收全部押金及已付租金的高风险条款。争议解决方式为上海仲裁委仲裁。",
    "key_parties": [
        {"name": "上海鑫源置业有限公司", "role": "出租方(甲方)"},
        {"name": "上海智联科技有限公司", "role": "承租方(乙方)"},
    ],
    "key_amounts": [
        {"item": "月租金", "amount": 5000, "currency": "CNY"},
        {"item": "押金", "amount": 10000, "currency": "CNY"},
        {"item": "合同总金额", "amount": 60000, "currency": "CNY"},
        {"item": "违约金标准", "amount": 5000, "currency": "CNY", "note": "30天租金"},
    ],
    "key_dates": [
        {"event": "签署日期", "date": "2025-06-15"},
        {"event": "生效日期", "date": "2025-07-01"},
        {"event": "到期日期", "date": "2026-06-30"},
    ],
    "key_obligations_a": [
        "按约交付符合办公条件的房屋",
        "负责房屋主体结构及公共设施维修",
        "租赁期满退还押金（扣除合理费用后）",
    ],
    "key_obligations_b": [
        "按期支付租金和相关费用",
        "合理使用房屋及附属设施",
        "未经甲方同意不得擅自转租",
    ],
    "risks": [
        ("excessive_penalty_risk", RiskType.EXCESSIVE_PENALTY, RiskLevel.HIGH, 0.92,
         "解除合同时没收全部押金+已付租金（惩罚比例>30%）",
         "建议修改为仅没收押金或按实际损失计赔，惩罚比例建议控制在合同总额20%以内",
         "6.2 承租方逾期超过7日，出租方有权单方解除合同且没收全部押金及已付租金。",
         "6", 2, ["R001", "R015"]),
        ("ambiguous_payment", RiskType.AMBIGUOUS_LANGUAGE, RiskLevel.MEDIUM, 0.75,
         "租金支付条款存在歧义：\"按季支付或以双方书面约定\"表述不清晰",
         "建议明确具体支付周期，避免两种支付方式并存造成执行歧义",
         "4.2 租金按季支付或以双方书面约定。",
         "4", 1, ["R007"]),
        ("liability_cap_check", RiskType.UNCLEAR_LIABILITY, RiskLevel.LOW, 0.62,
         "违约责任条款中损失赔偿范围未明确界定",
         "建议增加\"损失包括直接损失和可预见的间接损失\"的定义",
         "6.3 任何一方违约给对方造成损失的，违约方应承担相应的赔偿责任。",
         "6", 2, ["R012"]),
        ("usage_restriction", RiskType.OTHER, RiskLevel.INFO, 0.95,
         "租赁用途限定为办公及商务活动，符合常规商业租赁约定",
         None,
         "租赁用途仅限于办公及商务活动。",
         "2", 1, ["R099"]),
        ("dispute_resolution", RiskType.OTHER, RiskLevel.LOW, 0.88,
         "仲裁条款设置合理，管辖机构明确",
         None,
         "提交上海仲裁委员会按照该会现行仲裁规则进行仲裁",
         "11", 3, ["R099"]),
        ("termination_right_balance", RiskType.UNFAVORABLE_TERMINATION, RiskLevel.MEDIUM, 0.70,
         "单方解除合同的触发条件（逾期7日）偏短，对乙方不利",
         "建议将逾期期限调整为15-30日，给予合理宽限期",
         "承租方逾期超过7日，出租方有权单方解除合同",
         "6", 2, ["R003", "R015"]),
    ],
}


CONTRACT_2_HT2025002 = {
    "title": "软件开发服务合同",
    "contract_no": "HT2025002",
    "contract_type": ContractType.SERVICE,
    "party_a": "北京华宇数据科技股份有限公司（统一社会信用代码：91110000588888888）",
    "party_b": "深圳蓝图软件技术有限公司（统一社会信用代码：91440300599999999）",
    "total_amount": 300000.0,
    "sign_date": datetime(2025, 5, 20),
    "effective_date": datetime(2025, 6, 1),
    "expiry_date": datetime(2025, 12, 31),
    "page_count": 4,
    "word_count": 4950,
    "clauses": [
        ("1", "合作双方", ClauseCategory.PARTIES, "第1条 合作双方\n甲方（委托方）：北京华宇数据科技股份有限公司，地址：北京市海淀区中关村大街1号，法定代表人：赵文博。\n乙方（服务方）：深圳蓝图软件技术有限公司，地址：深圳市南山区科技园南区高新南一道9号，法定代表人：钱晓东。", 1),
        ("2", "项目内容", ClauseCategory.OBJECT, "第2条 项目内容\n2.1 乙方接受甲方委托，为甲方开发企业级客户关系管理系统（CRM）V2.0版本。\n2.2 具体功能需求详见附件一《功能需求规格说明书》。\n2.3 技术栈要求：前端Vue3+TypeScript，后端SpringBoot 3.x，数据库MySQL 8.0。", 1),
        ("3", "合同金额与付款", ClauseCategory.PRICE_PAYMENT, "第3条 合同金额与付款\n3.1 本合同总金额为人民币300,000元整（大写：叁拾万元整），含税。\n3.2 预付款：合同签订后5个工作日内，甲方向乙方支付合同总金额的60%，即人民币180,000元整。\n3.3 进度款：项目通过用户验收测试（UAT）后5个工作日内，支付30%即90,000元。\n3.4 尾款：质保期届满后5个工作日内，支付剩余10%即30,000元。", 1),
        ("4", "交付里程碑", ClauseCategory.DELIVERY, "第4条 交付里程碑\n4.1 M1（需求确认）：合同签订后15个工作日内，乙方提交需求规格说明书并获甲方签字确认。\n4.2 M2（原型交付）：合同签订后45个工作日内，乙方提交可交互原型供甲方评审。\n4.3 M3（UAT交付）：合同签订后90个工作日内，系统部署至UAT环境。\n4.4 M4（正式上线）：UAT通过后10个工作日内完成生产部署。", 2),
        ("5", "验收标准", ClauseCategory.QUALITY, "第5条 验收标准\n5.1 系统功能实现率不低于95%。\n5.2 系统响应时间：普通查询不超过3秒，复杂报表不超过10秒。\n5.3 并发用户数≥200人时系统稳定运行。\n5.4 代码覆盖率≥70%。", 2),
        ("6", "质保与维护", ClauseCategory.WARRANTY, "第6条 质保与维护\n6.1 系统正式上线后，乙方提供为期1个月的免费质保期。\n6.2 质保期内乙方负责修复系统缺陷和Bug。\n6.3 质保期满后，双方可另行签订运维服务合同。", 2),
        ("7", "知识产权", ClauseCategory.IP, "第7条 知识产权\n7.1 本项目开发完成的软件源代码、文档及相关知识产权归甲方所有。\n7.2 乙方保留其通用技术组件和框架的使用权。\n7.3 乙方不得将本项目开发成果用于第三方项目。", 2),
        ("8", "双方权利义务", ClauseCategory.MISCELLANEOUS, "第8条 双方权利义务\n8.1 甲方权利义务：（1）及时提供项目所需业务资料；（2）指定专人对接需求；（3）按约支付费用。\n8.2 乙方权利义务：（1）按进度完成开发交付；（2）保证代码质量；（3）配合甲方验收工作。", 3),
        ("9", "违约责任", ClauseCategory.LIABILITY, "第9条 违约责任\n9.1 任何一方违反本合同约定，应向守约方支付合同总金额35%的违约金。\n9.2 乙方逾期交付的，每逾期一日按合同总金额的0.3‰支付违约金。\n9.3 甲方逾期付款的，每逾期一日按应付未付金额的0.3‰支付滞纳金。", 3),
        ("10", "合同变更与解除", ClauseCategory.TERMINATION, "第10条 合同变更与解除\n10.1 本合同变更须经双方书面确认。\n10.2 一方严重违约致使合同目的无法实现的，守约方有权解除合同。\n10.3 合同解除不影响守约方追究违约方的违约责任。", 3),
        ("11", "自动续期", ClauseCategory.TERM, "第11条 服务续期\n11.1 本合同约定服务期满后，如双方均无书面异议，本合同自动续期2年。\n11.2 任一方如需终止续期服务，需提前180天向对方发出书面通知。\n11.3 续期期间服务费用按本合同标准上浮8%执行。", 4),
        ("12", "不可抗力", ClauseCategory.FORCE_MAJEURE, "第12条 不可抗力\n因不可抗力事件导致合同迟延履行或部分不能履行的，受影响方不承担违约责任，但应及时通知对方并提供证明。", 4),
        ("13", "争议解决", ClauseCategory.DISPUTE, "第13条 争议解决\n因本合同引起的争议，双方应友好协商解决；协商不成的，任何一方均可向甲方所在地有管辖权的人民法院提起诉讼。", 4),
        ("14", "适用法律", ClauseCategory.GOVERNING_LAW, "第14条 适用法律\n本合同适用中华人民共和国法律。", 4),
        ("15", "其他条款", ClauseCategory.MISCELLANEOUS, "第15条 附则\n15.1 本合同附件为本合同不可分割的组成部分。\n15.2 本合同一式陆份，甲乙双方各执叁份。\n15.3 本合同自双方法定代表人或授权代表签字并加盖公章之日起生效。", 4),
    ],
    "summary_text": "本合同为软件开发服务合同，甲方北京华宇数据科技股份有限公司委托乙方深圳蓝图软件技术有限公司开发CRM系统V2.0版本，合同总金额300,000元。项目分4个里程碑交付（需求确认→原型→UAT→上线）。预付款比例高达60%存在付款风险，违约金比例35%偏高，质保期仅1个月低于行业常规的6个月，自动续期180天通知期过长。合同缺失保密条款。争议管辖为甲方所在地法院。",
    "key_parties": [
        {"name": "北京华宇数据科技股份有限公司", "role": "委托方(甲方)"},
        {"name": "深圳蓝图软件技术有限公司", "role": "服务方(乙方)"},
    ],
    "key_amounts": [
        {"item": "合同总金额", "amount": 300000, "currency": "CNY"},
        {"item": "预付款(60%)", "amount": 180000, "currency": "CNY"},
        {"item": "UAT进度款(30%)", "amount": 90000, "currency": "CNY"},
        {"item": "尾款(10%)", "amount": 30000, "currency": "CNY"},
        {"item": "违约金(总金额35%)", "amount": 105000, "currency": "CNY"},
    ],
    "key_dates": [
        {"event": "签署日期", "date": "2025-05-20"},
        {"event": "生效日期", "date": "2025-06-01"},
        {"event": "M1需求确认截止", "date": "2025-06-21"},
        {"event": "M2原型交付截止", "date": "2025-08-02"},
        {"event": "M3 UAT交付截止", "date": "2025-10-03"},
        {"event": "合同到期", "date": "2025-12-31"},
    ],
    "key_obligations_a": [
        "提供业务资料并指定专人对接",
        "按里程碑比例及时支付款项",
        "配合验收工作并及时反馈意见",
    ],
    "key_obligations_b": [
        "按里程碑计划完成开发交付",
        "保证代码质量和系统性能达标",
        "交付后提供系统使用培训",
    ],
    "risks": [
        ("high_prepayment", RiskType.PAYMENT_RISK, RiskLevel.HIGH, 0.90,
         "预付款比例高达60%（>50%），资金占用风险大",
         "建议预付款比例降至30%以内，增加中间里程碑付款节点降低风险",
         "3.2 预付款：合同签订后5个工作日内，甲方向乙方支付合同总金额的60%",
         "3", 1, ["R002", "R018"]),
        ("high_penalty_rate", RiskType.EXCESSIVE_PENALTY, RiskLevel.HIGH, 0.88,
         "违约金比例35%超过法定30%合理阈值，过高可能不被法院支持",
         "建议将违约金调整为合同总金额的20%-30%之间",
         "9.1 任何一方违反本合同约定，应向守约方支付合同总金额35%的违约金。",
         "9", 3, ["R001"]),
        ("short_warranty", RiskType.WARRANTY_RISK, RiskLevel.MEDIUM, 0.78,
         "质保期仅1个月，远低于软件开发行业常规6个月标准",
         "建议质保期延长至至少6个月，核心功能12个月",
         "6.1 系统正式上线后，乙方提供为期1个月的免费质保期。",
         "6", 2, ["R010"]),
        ("missing_confidentiality", RiskType.MISSING_KEY_CLAUSE, RiskLevel.HIGH, 0.95,
         "合同缺失保密条款，双方商业秘密和技术信息缺乏保护",
         "必须增加保密条款，约定保密范围、期限（建议3-5年）及泄密违约责任",
         "[合同全文无保密条款章节]",
         "N/A", 2, ["R004", "R011"]),
        ("long_notice_period", RiskType.DEADLINE_RISK, RiskLevel.MEDIUM, 0.72,
         "自动续期提前180天通知期过长，乙方被锁定时间过久",
         "建议将提前通知期调整为30-90天，给予合理退出灵活性",
         "11.2 任一方如需终止续期服务，需提前180天向对方发出书面通知。",
         "11", 4, ["R008"]),
        ("auto_renewal_risk", RiskType.OTHER, RiskLevel.MEDIUM, 0.80,
         "自动续期2年+180天通知期，存在被动续签风险",
         "建议改为'双方书面同意后方可续期'，避免无异议自动续期",
         "11.1 本合同约定服务期满后，如双方均无书面异议，本合同自动续期2年。",
         "11", 4, ["R008", "R098"]),
        ("ip_ownership_balanced", RiskType.IP_TRANSFER_RISK, RiskLevel.LOW, 0.85,
         "知识产权归属甲方，条款设置对甲方有利",
         None,
         "7.1 本项目开发完成的软件源代码、文档及相关知识产权归甲方所有。",
         "7", 2, ["R099"]),
        ("milestone_definition", RiskType.OTHER, RiskLevel.INFO, 0.92,
         "4个里程碑定义清晰，验收量化标准合理",
         None,
         "系统功能实现率不低于95%。响应时间不超过3秒。",
         "4,5", 2, ["R099"]),
    ],
}


CONTRACT_3_HT2025003 = {
    "title": "货物采购合同",
    "contract_no": "HT2025003",
    "contract_type": ContractType.PURCHASE,
    "party_a": "广州智造电子设备有限公司（统一社会信用代码：91440100566666666）",
    "party_b": "佛山恒昌金属材料有限公司（统一社会信用代码：91440600577777777）",
    "total_amount": 1200000.0,
    "sign_date": datetime(2025, 4, 10),
    "effective_date": datetime(2025, 4, 15),
    "expiry_date": datetime(2025, 10, 14),
    "page_count": 3,
    "word_count": 3640,
    "clauses": [
        ("1", "合同当事人", ClauseCategory.PARTIES, "第1条 合同当事人\n甲方（需方）：广州智造电子设备有限公司，地址：广州市黄埔区科学城神舟路18号，法定代表人：孙志强。\n乙方（供方）：佛山恒昌金属材料有限公司，地址：佛山市顺德区北滘镇工业大道168号，法定代表人：周建国。", 1),
        ("2", "采购标的", ClauseCategory.OBJECT, "第2条 采购标的\n2.1 甲方向乙方采购高精密度冷轧钢板，规格型号、数量及单价详见下表：\n（1）SPCC冷轧板 0.8mm×1250×2500，数量500吨，单价2000元/吨，金额1,000,000元；\n（2）SECC电镀锌板 1.0mm×1000×2000，数量100吨，单价2000元/吨，金额200,000元。\n2.2 合同总金额人民币1,200,000元整（大写：壹佰贰拾万元整），含13%增值税。", 1),
        ("3", "质量标准", ClauseCategory.QUALITY, "第3条 质量标准\n3.1 货物质量须符合国家标准GB/T 708-2019《冷轧钢板和钢带的尺寸、外形、重量及允许偏差》。\n3.2 表面质量：不得有裂纹、结疤、折叠、氧化皮等影响使用的缺陷。\n3.3 尺寸公差：厚度±0.02mm，宽度±0.5mm，长度±1.0mm。", 1),
        ("4", "付款方式", ClauseCategory.PRICE_PAYMENT, "第4条 付款方式\n4.1 定金：甲方于合同签订后3日内支付合同金额的25%即人民币300,000元作为定金。\n4.2 余款：采用T/T 60天付款方式，甲方应于货物验收合格之日起60天内将剩余货款900,000元电汇至乙方指定账户。\n4.3 乙方应于每期收款前5个工作日向甲方开具对应金额的增值税专用发票。", 1),
        ("5", "交货安排", ClauseCategory.DELIVERY, "第5条 交货安排\n5.1 交货时间：定金到账后30日内完成第一批200吨交付，剩余400吨于定金到账后60日内分两批交付。\n5.2 交货地点：甲方广州黄埔区仓库，由乙方负责运输并承担运费。\n5.3 运输方式：公路汽运，货物在途风险由乙方承担。\n5.4 包装要求：钢带捆扎+防锈纸+木托包装，适合长途运输及仓储。", 2),
        ("6", "验收与异议", ClauseCategory.QUALITY, "第6条 验收与异议\n6.1 甲方应于货到后当日完成数量核对及外观初验。\n6.2 质量异议期为到货后7天内，甲方在此期间内如发现质量问题应以书面形式通知乙方。\n6.3 乙方接到异议通知后应在3个工作日内派人到甲方现场共同复检。\n6.4 复检不合格的，乙方应于7日内免费更换或作退货处理。", 2),
        ("7", "知识产权", ClauseCategory.IP, "第7条 知识产权\n7.1 乙方保证所供货物为合法生产销售，不侵犯任何第三方知识产权。\n7.2 如因乙方货物引发知识产权纠纷，乙方应负责处理并承担全部法律责任和经济损失。\n7.3 甲方在使用货物过程中产生的新技术、新工艺知识产权归甲方所有。", 2),
        ("8", "违约责任", ClauseCategory.LIABILITY, "第8条 违约责任\n8.1 乙方逾期交货的，每逾期一日按逾期交货部分货款的0.5‰向甲方支付违约金；逾期超过15日，甲方有权解除合同，乙方双倍返还定金。\n8.2 甲方逾期付款的，每逾期一日按应付未付金额的0.5‰向乙方支付违约金。\n8.3 货物质量不合格的，乙方应按不合格货物金额的20%向甲方支付违约金，同时甲方有权要求更换或退货。", 2),
        ("9", "合同的变更与解除", ClauseCategory.TERMINATION, "第9条 合同变更与解除\n9.1 经双方协商一致，可以书面形式变更或解除本合同。\n9.2 一方迟延履行主要债务，经催告后在合理期限内仍未履行的，守约方有权解除合同。\n9.3 合同解除后，不影响守约方要求赔偿损失的权利。", 3),
        ("10", "保密条款", ClauseCategory.CONFIDENTIALITY, "第10条 保密\n10.1 双方对因签订和履行本合同而知悉的对方商业信息、技术资料、价格体系等保密信息承担保密义务。\n10.2 保密期限为本合同生效之日起至合同终止后5年。\n10.3 未经对方书面同意，任何一方不得向第三方披露保密信息。", 3),
        ("11", "不可抗力", ClauseCategory.FORCE_MAJEURE, "第11条 不可抗力\n因不可抗力导致本合同不能履行或迟延履行的，受影响一方应在事件发生后48小时内书面通知对方，并在15日内提供相关证明。双方可协商延期履行或部分解除合同，受影响方不承担违约责任。", 3),
        ("12", "争议解决", ClauseCategory.DISPUTE, "第12条 争议解决\n因履行本合同发生的争议，双方应协商解决；协商不成的，任何一方均有权向甲方所在地有管辖权的人民法院提起诉讼。", 3),
        ("13", "适用法律", ClauseCategory.GOVERNING_LAW, "第13条 适用法律\n本合同的订立、效力、解释、履行及争议解决均适用中华人民共和国法律。", 3),
        ("14", "其他约定", ClauseCategory.MISCELLANEOUS, "第14条 附则\n14.1 本合同未尽事宜由双方另行签订补充协议，补充协议与本合同具有同等法律效力。\n14.2 本合同一式四份，甲乙双方各执两份，经双方签字盖章后生效。\n14.3 附件：乙方营业执照副本复印件、产品检测报告样本。", 3),
    ],
    "summary_text": "本合同为货物采购合同，甲方广州智造电子设备有限公司向乙方佛山恒昌金属材料有限公司采购冷轧钢板和电镀锌板，总金额1,200,000元。定金25%（30万元）符合法律规定。付款方式为T/T 60天，账期偏长。质量异议期仅7天偏短。知识产权归属条款完整。管辖法院为甲方所在地。合同整体条款较为规范。",
    "key_parties": [
        {"name": "广州智造电子设备有限公司", "role": "需方(甲方)"},
        {"name": "佛山恒昌金属材料有限公司", "role": "供方(乙方)"},
    ],
    "key_amounts": [
        {"item": "SPCC冷轧板500吨", "amount": 1000000, "currency": "CNY"},
        {"item": "SECC电镀锌板100吨", "amount": 200000, "currency": "CNY"},
        {"item": "合同总金额", "amount": 1200000, "currency": "CNY"},
        {"item": "定金(25%)", "amount": 300000, "currency": "CNY"},
        {"item": "T/T 60天尾款", "amount": 900000, "currency": "CNY"},
    ],
    "key_dates": [
        {"event": "签署日期", "date": "2025-04-10"},
        {"event": "生效日期", "date": "2025-04-15"},
        {"event": "第一批交货", "date": "2025-05-15"},
        {"event": "交完剩余货物", "date": "2025-06-14"},
        {"event": "合同到期", "date": "2025-10-14"},
    ],
    "key_obligations_a": [
        "按约定支付定金及货款",
        "及时接收货物并组织验收",
        "在异议期内书面提出质量问题",
    ],
    "key_obligations_b": [
        "按时分批交付符合质量标准的货物",
        "承担运输费用和在途风险",
        "接到质量异议后3日内到场复检",
    ],
    "risks": [
        ("long_payment_term", RiskType.PAYMENT_RISK, RiskLevel.MEDIUM, 0.76,
         "T/T 60天账期偏长，对乙方资金占用压力较大（对甲方有利）",
         "如处于买方市场可接受；建议可考虑分期支付或缩短至T/T 30天",
         "4.2 余款：采用T/T 60天付款方式，甲方应于货物验收合格之日起60天内支付",
         "4", 1, ["R018"]),
        ("short_claim_period", RiskType.DEADLINE_RISK, RiskLevel.MEDIUM, 0.82,
         "质量异议期仅7天，对于需要安装测试的金属材料时间过短",
         "建议质量异议期延长至到货后15-30天，隐蔽瑕疵单独约定",
         "6.2 质量异议期为到货后7天内，甲方在此期间内如发现质量问题应以书面形式通知乙方。",
         "6", 2, ["R009"]),
        ("deposit_compliant", RiskType.OTHER, RiskLevel.INFO, 0.95,
         "定金比例25%略高于法定20%上限，超出部分不具有定金罚则效力",
         "建议将定金比例调整为20%，多出部分可约定为预付款",
         "4.1 定金：甲方于合同签订后3日内支付合同金额的25%即人民币300,000元作为定金。",
         "4", 1, ["R099"]),
        ("ip_protection_complete", RiskType.IP_TRANSFER_RISK, RiskLevel.LOW, 0.90,
         "知识产权条款完整，包括不侵权保证、纠纷处理责任、改进成果归属",
         None,
         "7.1 乙方保证所供货物为合法生产销售，不侵犯任何第三方知识产权。",
         "7", 2, ["R099"]),
        ("jurisdiction_standard", RiskType.OTHER, RiskLevel.INFO, 0.95,
         "管辖法院约定为甲方所在地，属于采购合同常规约定",
         None,
         "向甲方所在地有管辖权的人民法院提起诉讼。",
         "12", 3, ["R099"]),
        ("penalty_double_return", RiskType.EXCESSIVE_PENALTY, RiskLevel.LOW, 0.85,
         "解除合同时双倍返还定金约定符合法律规定",
         None,
         "逾期超过15日，甲方有权解除合同，乙方双倍返还定金。",
         "8", 2, ["R099"]),
    ],
}


ALL_CONTRACTS = [CONTRACT_1_HT2025001, CONTRACT_2_HT2025002, CONTRACT_3_HT2025003]


def seed_contracts(db, admin_id, users):
    contracts = []
    for cdata in ALL_CONTRACTS:
        doc = ContractDocument(
            title=cdata["title"],
            contract_no=cdata["contract_no"],
            contract_type=cdata["contract_type"],
            status=ContractStatus.ANALYZED,
            file_name=f"{cdata['contract_no']}_{cdata['title']}.pdf",
            file_path=f"/data/uploads/{cdata['contract_no']}.pdf",
            file_size=random.randint(200_000, 800_000),
            file_hash=hashlib.md5(cdata["contract_no"].encode()).hexdigest(),
            mime_type="application/pdf",
            party_a=cdata["party_a"],
            party_b=cdata["party_b"],
            sign_date=cdata["sign_date"],
            effective_date=cdata["effective_date"],
            expiry_date=cdata["expiry_date"],
            total_amount=cdata["total_amount"],
            currency="CNY",
            page_count=cdata["page_count"],
            word_count=cdata["word_count"],
            clause_count=len(cdata["clauses"]),
            uploader_id=admin_id,
            created_at=cdata["sign_date"],
            analyzed_at=cdata["sign_date"] + timedelta(hours=3),
        )
        db.add(doc)
        contracts.append(doc)
    db.flush()
    return contracts


def seed_clauses(db, contracts):
    all_clauses = []
    for idx, contract in enumerate(contracts):
        cdata = ALL_CONTRACTS[idx]
        for i, (clause_num, clause_title, category, clause_text, page_num) in enumerate(cdata["clauses"]):
            char_len = len(clause_text)
            start = i * 280
            end = start + char_len
            if end > 4000:
                end = 4000
                start = max(0, 4000 - char_len)
            clause = ContractClause(
                document_id=contract.id,
                clause_index=i + 1,
                clause_title=clause_title,
                clause_number=clause_num,
                category=category,
                original_text=clause_text,
                cleaned_text=clause_text,
                page_start=page_num,
                page_end=page_num,
                char_start=start,
                char_end=end,
                position_hint=f"第{page_num}页",
                is_complete=True,
                quality_score=0.95,
                embedding_status="pending",
                created_at=contract.created_at,
            )
            db.add(clause)
            all_clauses.append((contract.id, clause_num, clause_text, page_num, start, end, clause))
    db.flush()
    return all_clauses


def seed_summaries(db, contracts, model_version):
    summaries = []
    for idx, contract in enumerate(contracts):
        cdata = ALL_CONTRACTS[idx]
        structured_summary = {
            "key_parties": cdata["key_parties"],
            "key_amounts": cdata["key_amounts"],
            "key_dates": cdata["key_dates"],
            "key_obligations_a": cdata["key_obligations_a"],
            "key_obligations_b": cdata["key_obligations_b"],
        }
        summary = ContractSummary(
            document_id=contract.id,
            summary_type="full",
            summary_text=cdata["summary_text"],
            key_points=structured_summary,
            key_parties=cdata["key_parties"],
            key_dates=cdata["key_dates"],
            key_amounts=cdata["key_amounts"],
            key_obligations={
                "party_a": cdata["key_obligations_a"],
                "party_b": cdata["key_obligations_b"],
            },
            model_version=f"{model_version.model_name}-{model_version.version}",
            prompt_version="v1.0",
            tokens_used=random.randint(400, 1200),
            latency_ms=random.uniform(1200, 3500),
            quality_score=random.uniform(0.87, 0.94),
            human_revised=False,
            created_at=contract.created_at + timedelta(hours=2),
        )
        db.add(summary)
        summaries.append(summary)
    db.flush()
    return summaries


def seed_model_metrics(db, model_version):
    metrics = []
    today = datetime.utcnow()
    random.seed(42)
    for d in range(30):
        dt = today - timedelta(days=29 - d)
        f1_val = 0.89 + random.gauss(0, 0.015)
        f1_val = max(0.85, min(0.93, f1_val))
        latency_val = 2.3 + random.gauss(0, 0.4)
        latency_val = max(1.2, min(3.5, latency_val))

        f1_metric = ModelMetric(
            model_id=model_version.id,
            metric_type=MetricType.F1,
            metric_value=f1_val,
            metric_ci_lower=f1_val - 0.02,
            metric_ci_upper=f1_val + 0.02,
            sample_size=random.randint(50, 200),
            window_start=dt,
            window_end=dt + timedelta(days=1),
            extra_metadata={"eval_type": "daily"},
            created_at=dt,
        )
        lat_metric = ModelMetric(
            model_id=model_version.id,
            metric_type=MetricType.LATENCY,
            metric_value=latency_val,
            metric_ci_lower=max(0.1, latency_val - 0.3),
            metric_ci_upper=latency_val + 0.3,
            sample_size=random.randint(50, 200),
            window_start=dt,
            window_end=dt + timedelta(days=1),
            extra_metadata={"eval_type": "daily"},
            created_at=dt,
        )
        db.add(f1_metric)
        db.add(lat_metric)
        metrics.extend([f1_metric, lat_metric])
    db.flush()
    return metrics


def seed_risks(db, contracts, all_clauses, model_version):
    all_risks = []
    for idx, contract in enumerate(contracts):
        cdata = ALL_CONTRACTS[idx]
        clause_map = {}
        for c in all_clauses:
            if c[0] == contract.id:
                clause_map[c[1]] = c

        for risk_data in cdata["risks"]:
            rule_id, risk_type, risk_level, confidence, title, suggestion, src_para, src_clause_ref, src_page, matched_rules = risk_data

            clause_obj = clause_map.get(src_clause_ref.split(",")[0] if "," in src_clause_ref else src_clause_ref)
            clause_id = clause_obj[6].id if clause_obj else None
            char_start = clause_obj[4] if clause_obj else random.randint(0, 3000)
            char_end = clause_obj[5] if clause_obj else char_start + 150

            matched_rule_ids_json = matched_rules

            risk_score = 0.0
            if risk_level == RiskLevel.HIGH:
                risk_score = random.uniform(0.75, 0.98)
            elif risk_level == RiskLevel.MEDIUM:
                risk_score = random.uniform(0.40, 0.74)
            elif risk_level == RiskLevel.LOW:
                risk_score = random.uniform(0.20, 0.39)
            else:
                risk_score = random.uniform(0.05, 0.19)

            risk = RiskAlert(
                document_id=contract.id,
                clause_id=clause_id,
                risk_type=risk_type,
                risk_level=risk_level,
                risk_score=risk_score,
                title=title,
                description=f"{title} [匹配规则: {', '.join(matched_rules)}]",
                suggestion=suggestion,
                rule_id=",".join(matched_rules),
                source_paragraph=src_para,
                source_clause_ref=src_clause_ref,
                source_char_start=char_start,
                source_char_end=char_end,
                source_page=src_page,
                model_version=f"{model_version.model_name}-{model_version.version}",
                detection_method="rule_based",
                confidence=confidence,
                status="pending",
                false_positive=False,
                created_at=contract.created_at + timedelta(hours=3, minutes=random.randint(1, 45)),
            )
            db.add(risk)
            all_risks.append(risk)
    db.flush()
    return all_risks


def seed_dataset_samples(db, dataset, contracts, all_clauses, users):
    sample_types = list(SampleType)[:6]
    statuses_approved = [SampleStatus.APPROVED] * 15
    statuses_pending = [SampleStatus.PENDING_REVIEW] * 5
    all_statuses = statuses_approved + statuses_pending
    random.shuffle(all_statuses)

    reviewer_ids = [u.id for u in users if u.role in [UserRole.REVIEWER, UserRole.ADMIN]]
    annotator_ids = [u.id for u in users if u.role in [UserRole.ANNOTATOR, UserRole.LEGAL_ASSISTANT]]

    samples = []
    clause_by_contract = {}
    for c in all_clauses:
        cid = c[0]
        if cid not in clause_by_contract:
            clause_by_contract[cid] = []
        clause_by_contract[cid].append(c)

    for i in range(20):
        stype = sample_types[i % len(sample_types)]
        status = all_statuses[i]

        contract = contracts[i % len(contracts)]
        cclauses = clause_by_contract.get(contract.id, all_clauses[:3])
        clause_entry = cclauses[i % len(cclauses)]

        assignee_id = annotator_ids[i % len(annotator_ids)]
        reviewer_id = reviewer_ids[i % len(reviewer_ids)]

        quality_score = round(random.uniform(0.7, 1.0), 3)

        ref_output = f"【人工标注】{stype.value}样本#{i+1}：{clause_entry[2][:60]}...。专家审核意见：此条款{'表述清晰，风险可控' if quality_score > 0.85 else '存在一定歧义，需进一步确认'}。标注质量评分：{quality_score:.2f}/1.00"

        approved_at = None
        reviewed_at = None
        if status == SampleStatus.APPROVED:
            reviewed_at = contract.created_at + timedelta(days=2 + i)
            approved_at = reviewed_at + timedelta(hours=2)
        elif status == SampleStatus.PENDING_REVIEW:
            reviewed_at = None
            approved_at = None

        sample = DatasetSample(
            dataset_id=dataset.id,
            sample_type=stype,
            status=status,
            source_contract_id=contract.id,
            source_clause_id=clause_entry[6].id,
            input_text=clause_entry[2],
            reference_output=ref_output,
            input_metadata={
                "contract_no": contract.contract_no,
                "clause_number": clause_entry[1],
                "page_num": clause_entry[3],
                "seed_source": True,
            },
            reference_metadata={
                "annotator_id": assignee_id,
                "reviewer_id": reviewer_id if reviewer_id else None,
                "labeling_tool": "manual",
            },
            reference_score=quality_score,
            difficulty_level=random.choice([1, 2, 3, 4, 5]),
            quality_score=quality_score,
            weight=1.0,
            assignee_id=assignee_id,
            reviewer_id=reviewer_id,
            review_comment="审核通过，标注质量达标" if status == SampleStatus.APPROVED else None,
            reviewed_at=reviewed_at,
            approved_at=approved_at,
            created_at=contract.created_at + timedelta(days=1 + i // 3),
        )
        db.add(sample)
        samples.append(sample)
    db.flush()
    return samples


def seed_error_samples(db, samples):
    error_configs = [
        (ErrorType.HALLUCINATION, ErrorSeverity.CRITICAL, 1),
        (ErrorType.FALSE_POSITIVE, ErrorSeverity.MAJOR, 2),
        (ErrorType.FALSE_NEGATIVE, ErrorSeverity.MAJOR, 2),
        (ErrorType.WRONG_CLASSIFICATION, ErrorSeverity.MINOR, 2),
        (ErrorType.INCORRECT_SUMMARY, ErrorSeverity.MINOR, 2),
        (ErrorType.MISSING_INFORMATION, ErrorSeverity.MAJOR, 1),
    ]
    statuses = ["open"] * 5 + ["triaged"] * 3 + ["resolved"] * 2

    error_samples = []
    idx = 0
    for etype, severity, count in error_configs:
        for _ in range(count):
            if idx >= len(samples):
                sample = samples[idx % len(samples)]
            else:
                sample = samples[idx]

            model_output_text = f"[模型输出-{etype.value}] {sample.input_text[:50]}... → 错误输出内容占位"
            expected_text = f"[期望输出-{etype.value}] {sample.reference_output[:80] if sample.reference_output else '正确输出'}"

            status = statuses[idx]
            triaged_flag = status in ["triaged", "resolved"]
            resolved_at = datetime.utcnow() - timedelta(days=idx + 1) if status == "resolved" else None

            task_result_id = None
            if idx % 3 == 0:
                tr = TaskResult(
                    task_id=0,
                    result_key="error_sample_result",
                    result_type=etype.value,
                    result_data={"error_sample": True},
                    result_text=model_output_text,
                    metrics={"has_error": True},
                    created_at=sample.created_at,
                )
                db.add(tr)
                db.flush()
                task_result_id = tr.id

            es = ErrorSample(
                sample_id=sample.id,
                source_task_result_id=task_result_id,
                error_type=etype,
                severity=severity,
                model_output=model_output_text,
                expected_output=expected_text,
                input_context=sample.input_text[:200],
                error_description=f"{etype.value} 类型错误 #{idx+1}：模型在{sample.sample_type.value}任务中出现{severity.value}级错误。",
                reproduction_steps=f"1. 加载样本#{sample.id}\n2. 使用默认模型推理\n3. 对比输出与参考标注\n4. 发现错误",
                model_version="contract-summary-v1.0.0",
                prompt_version="v1.0",
                run_id=f"run_{uuid.uuid4().hex[:12]}",
                status=status,
                triaged=triaged_flag,
                reproducible=True,
                false_alarm=False,
                fix_suggestion=f"修复{etype.value}相关逻辑" if status == "resolved" else f"建议核查{etype.value}相关处理流程",
                resolution_note=f"已修复 #{idx+1}" if status == "resolved" else None,
                resolved_at=resolved_at,
                tags=[etype.value, severity.value, "seed_data"],
                extra_metadata={"seed": True, "sample_idx": idx},
                created_at=sample.created_at + timedelta(days=idx + 1),
            )
            db.add(es)
            error_samples.append(es)
            idx += 1
    db.flush()
    return error_samples


def seed_feedbacks(db, users, risks):
    annotator = next(u for u in users if u.role == UserRole.ANNOTATOR)
    reviewer = next(u for u in users if u.role == UserRole.REVIEWER)
    legal = next(u for u in users if u.role == UserRole.LEGAL_ASSISTANT)

    r1 = risks[0] if len(risks) > 0 else None
    r2 = risks[3] if len(risks) > 3 else None
    r3 = risks[-1] if len(risks) > 0 else None

    f1 = Feedback(
        user_id=annotator.id,
        risk_id=r1.id if r1 else None,
        feedback_type=FeedbackType.UPVOTE,
        score=1.0,
        content="风险识别准确，确实存在过高的惩罚条款。",
        extra_metadata={"seed": True, "risk_level": "high"},
        resolved=False,
        created_at=r1.created_at + timedelta(days=1) if r1 else datetime.utcnow(),
    )
    f2 = Feedback(
        user_id=reviewer.id,
        risk_id=r2.id if r2 else None,
        feedback_type=FeedbackType.DOWNVOTE,
        score=0.0,
        content="此风险等级判定偏高，建议下调为LOW。",
        extra_metadata={"seed": True, "suggestion": "降级"},
        resolved=False,
        created_at=r2.created_at + timedelta(days=1) if r2 else datetime.utcnow(),
    )
    f3 = Feedback(
        user_id=legal.id,
        risk_id=r3.id if r3 else None,
        feedback_type=FeedbackType.CORRECTION,
        score=0.5,
        content="异议期建议标注为'对表面瑕疵合理'，对隐蔽质量问题仍有追索权。",
        corrected_text="质量异议期7天适合表面瑕疵检验，隐蔽瑕疵可在发现后合理期限内主张。",
        extra_metadata={"seed": True, "correction": True},
        resolved=False,
        created_at=r3.created_at + timedelta(days=2) if r3 else datetime.utcnow(),
    )
    for fb in [f1, f2, f3]:
        db.add(fb)
    db.flush()
    return [f1, f2, f3]


def seed_alert_events(db, users, model_version, error_samples):
    admin = next(u for u in users if u.role == UserRole.ADMIN)
    reviewer = next(u for u in users if u.role == UserRole.REVIEWER)

    today = datetime.utcnow()

    events_data = [
        (AlertType.TASK_FAILED, AlertSeverity.INFO, "active", False, None, None,
         "任务执行失败告警", "检测到PARSE_DOCUMENT类型任务失败率超过5%，失败任务数=3/52", None),
        (AlertType.HIGH_LATENCY, AlertSeverity.WARNING, "acknowledged", True, reviewer.id, today - timedelta(days=2),
         "接口延迟偏高告警", "SUMMARY接口P95延迟=4.2秒，超过阈值3秒，持续时间=1.5h", error_samples[0].id if error_samples else None),
        (AlertType.MODEL_DEGRADATION, AlertSeverity.WARNING, "active", False, None, None,
         "模型性能衰减告警", f"模型{model_version.model_name}@{model_version.version} F1近7天下降0.042，当前=0.865", None),
        (AlertType.REVIEW_NEEDED, AlertSeverity.INFO, "resolved", True, reviewer.id, today - timedelta(days=5),
         "审核任务堆积通知", "待审核DatasetSample超过15条，最长等待时间=72小时，请及时处理", None),
        (AlertType.NEW_ERROR_SAMPLE, AlertSeverity.WARNING, "active", False, None, None,
         "新增错误样本告警", f"近24小时新增{len(error_samples)}条ErrorSample，含1条严重错误(HALLUCINATION)",
         error_samples[0].id if error_samples else None),
    ]

    events = []
    for i, (atype, sev, status, ack, ack_by, ack_at, title, msg, err_id) in enumerate(events_data):
        ev = AlertEvent(
            alert_type=atype,
            severity=sev,
            title=title,
            message=msg,
            model_id=model_version.id,
            error_sample_id=err_id,
            triggered_by_id=admin.id,
            related_ids={"error_sample_ids": [e.id for e in error_samples[:3]]} if error_samples else None,
            extra_metadata={"seed": True, "index": i},
            metrics_snapshot={"f1": 0.87, "latency_p95": 3.8, "error_rate": 0.06},
            channels_notified=["console", "email"],
            status=status,
            acknowledged=ack,
            acknowledged_by_id=ack_by,
            acknowledged_at=ack_at,
            ack_note="已关注，将在下一迭代优化" if ack else None,
            resolved_at=today - timedelta(days=1) if status == "resolved" else None,
            resolved_by_id=admin.id if status == "resolved" else None,
            resolution_note="已通过增加审核轮次解决" if status == "resolved" else None,
            created_at=today - timedelta(days=len(events_data) - i),
        )
        db.add(ev)
        events.append(ev)
    db.flush()
    return events


def seed_audit_logs(db, users, contracts, samples):
    admin = next(u for u in users if u.role == UserRole.ADMIN)
    reviewer = next(u for u in users if u.role == UserRole.REVIEWER)
    annotator = next(u for u in users if u.role == UserRole.ANNOTATOR)
    legal = next(u for u in users if u.role == UserRole.LEGAL_ASSISTANT)

    actions_data = [
        (AuditAction.CREATE, "contract_documents", str(contracts[0].id), admin.id, None,
         {"title": contracts[0].title, "contract_no": contracts[0].contract_no},
         "上传并创建合同"),
        (AuditAction.UPDATE, "contract_documents", str(contracts[0].id), legal.id,
         {"status": "PARSING"}, {"status": "PARSED"}, "合同解析完成"),
        (AuditAction.CREATE, "risk_alerts", f"contract_{contracts[0].id}", legal.id, None,
         {"count": 6, "high": 1, "medium": 2}, "生成风险分析报告"),
        (AuditAction.APPROVE, "dataset_samples", str(samples[0].id), reviewer.id,
         {"status": "REVIEWING"}, {"status": "APPROVED"}, "金标样本审核通过"),
        (AuditAction.REVIEW, "dataset_samples", str(samples[1].id), reviewer.id,
         {"status": "PENDING_REVIEW"}, {"status": "REVIEWING"}, "开始审核样本"),
        (AuditAction.CREATE, "contract_documents", str(contracts[1].id), admin.id, None,
         {"title": contracts[1].title, "contract_no": contracts[1].contract_no},
         "创建软件开发服务合同"),
        (AuditAction.UPDATE, "model_versions", "1", admin.id,
         {"status": "TESTING"}, {"status": "PRODUCTION"}, "模型发布到生产环境"),
        (AuditAction.APPROVE, "dataset_samples", str(samples[2].id), reviewer.id,
         {"status": "REVIEWING"}, {"status": "APPROVED"}, "样本质量审核通过"),
        (AuditAction.ROLLBACK, "dataset_samples", str(samples[3].id), admin.id,
         {"version": "v2"}, {"version": "v1"}, "回滚样本到上一版本"),
        (AuditAction.REVIEW, "dataset_samples", str(samples[4].id), reviewer.id,
         {"status": "PENDING_REVIEW"}, {"status": "REVIEWING"}, "法务样本审核中"),
        (AuditAction.LABEL, "sample_labels", str(samples[0].id), annotator.id, None,
         {"label_type": "CATEGORY", "label_value": "liability"}, "标注条款类别"),
        (AuditAction.CREATE, "contract_documents", str(contracts[2].id), legal.id, None,
         {"title": contracts[2].title, "contract_no": contracts[2].contract_no},
         "创建货物采购合同"),
        (AuditAction.UPDATE, "datasets", "1", admin.id,
         {"is_public": False}, {"is_public": True}, "数据集公开为金标集"),
        (AuditAction.LABEL, "sample_labels", str(samples[1].id), annotator.id, None,
         {"label_type": "RISK_LEVEL", "label_value": "high"}, "人工标注风险等级"),
        (AuditAction.APPROVE, "dataset_samples", str(samples[5].id), reviewer.id,
         {"status": "REVIEWING"}, {"status": "APPROVED"}, "标注样本审核通过入库"),
    ]

    logs = []
    for i, (action, res_type, res_id, uid, old, new, note) in enumerate(actions_data):
        log = AuditLog(
            user_id=uid,
            action=action,
            resource_type=res_type,
            resource_id=res_id,
            old_value=old,
            new_value=new,
            changes=new,
            ip_address=f"192.168.1.{100 + i}",
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            session_id=f"sess_{uuid.uuid4().hex[:12]}",
            note=note,
            extra_metadata={"seed": True, "seq": i},
            created_at=datetime.utcnow() - timedelta(days=20, hours=i, minutes=i * 3),
        )
        db.add(log)
        logs.append(log)
    db.flush()
    return logs


def run_seed():
    db = SessionLocal()
    try:
        print("=" * 60)
        print("开始生成种子数据...")
        print("=" * 60)

        print("[1/11] 创建用户...")
        users = seed_users(db)
        admin = users[0]
        print(f"  ✔ 创建 {len(users)} 个用户: {', '.join(u.username + '(' + u.role.value + ')' for u in users)}")

        print("[2/11] 创建模型版本...")
        mv = seed_model_version(db)
        print(f"  ✔ 创建 {mv.model_name}@{mv.version} status={mv.status.value}")

        print("[3/11] 创建数据集...")
        dataset = seed_dataset(db, admin.id)
        print(f"  ✔ 创建数据集: {dataset.name} ({dataset.dataset_type.value})")

        print("[4/11] 创建合同文档...")
        contracts = seed_contracts(db, admin.id, users)
        clause_count_per_contract = [len(c["clauses"]) for c in ALL_CONTRACTS]
        print(f"  ✔ 创建 {len(contracts)} 份合同: {', '.join(c.contract_no for c in contracts)}, 条款数={clause_count_per_contract}")

        print("[5/11] 创建合同条款...")
        all_clauses = seed_clauses(db, contracts)
        print(f"  ✔ 创建 {len(all_clauses)} 条合同条款")

        print("[6/11] 创建合同摘要...")
        summaries = seed_summaries(db, contracts, mv)
        print(f"  ✔ 创建 {len(summaries)} 份结构化摘要")

        print("[7/11] 创建模型时序指标...")
        metrics = seed_model_metrics(db, mv)
        print(f"  ✔ 创建 {len(metrics)} 条F1/Latency每日指标(30天)")

        print("[8/11] 创建风险告警...")
        risks = seed_risks(db, contracts, all_clauses, mv)
        print(f"  ✔ 创建 {len(risks)} 条风险告警 (HIGH/MEDIUM/LOW/INFO)")

        print("[9/11] 创建数据集样本...")
        samples = seed_dataset_samples(db, dataset, contracts, all_clauses, users)
        print(f"  ✔ 创建 {len(samples)} 条数据集样本 (APPROVED/PENDING)")

        print("[10/11] 创建错误样本...")
        err_samples = seed_error_samples(db, samples)
        print(f"  ✔ 创建 {len(err_samples)} 条错误样本 (HALLUCINATION/FALSE_POS等)")

        print("[11/11] 创建反馈/告警事件/审计日志...")
        fbs = seed_feedbacks(db, users, risks)
        alert_evts = seed_alert_events(db, users, mv, err_samples)
        audit_logs = seed_audit_logs(db, users, contracts, samples)
        print(f"  ✔ 反馈={len(fbs)} 告警事件={len(alert_evts)} 审计日志={len(audit_logs)}")

        print()
        print("提交数据库事务...")
        db.commit()

        total_clauses = sum(len(c["clauses"]) for c in ALL_CONTRACTS)
        total_risks = sum(len(c["risks"]) for c in ALL_CONTRACTS)

        print()
        print("=" * 60)
        print(f"Seed完成: 用户={len(users)} 合同={len(contracts)} 条款={total_clauses} 风险={total_risks} 样本={len(samples)} 错误样本={len(err_samples)} 审核任务={len([s for s in samples if s.status.value == 'pending_review'])}")
        print("=" * 60)
        print("账号密码: admin/legal1/reviewer1/annotator1/viewer1 → test123456")
        print()

    except Exception as e:
        print(f"\n❌ Seed失败: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
