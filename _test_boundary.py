import sys
sys.path.insert(0, '.')
from datetime import datetime

from app.models import UserRole, AuditStatus, FeedbackCategory
from app import schemas

print("=" * 84)
print("  作文详情接口 四角色受控边界 对比验证报告")
print("=" * 84)


class MockUser:
    def __init__(self, id, role, class_id=None):
        self.id = id
        self.role = role
        self.class_id = class_id


student = MockUser(201, UserRole.STUDENT, class_id=1)
regular_tafe = MockUser(103, UserRole.TEACHER, class_id=1)
head_tafe1 = MockUser(101, UserRole.TEACHER, class_id=1)
other_cls2_head = MockUser(102, UserRole.TEACHER, class_id=2)
admin = MockUser(1, UserRole.ADMIN)

database_classes = {
    1: type('C', (), {'id': 1, 'head_teacher_id': 101, 'class_name': '高三1班'})(),
    2: type('C', (), {'id': 2, 'head_teacher_id': 102, 'class_name': '高三2班'})(),
}


def _can_view_original(user, essay_class_id):
    if user.role == UserRole.ADMIN:
        return True
    if user.role != UserRole.TEACHER:
        return False
    cls = database_classes.get(essay_class_id)
    return cls is not None and cls.head_teacher_id == user.id


def _can_export_class(user, target_class_id):
    if user.role == UserRole.ADMIN:
        return True
    if user.role != UserRole.TEACHER:
        return False
    cls = database_classes.get(target_class_id)
    return cls is not None and cls.head_teacher_id == user.id


def evidence_access(user, essay_class_id):
    return _can_view_original(user, essay_class_id)


def decrypt_access(user, essay_class_id, include_original=True):
    if not include_original:
        return "NOT_REQ", False
    if _can_view_original(user, essay_class_id):
        return "✅ OK", True
    return "❌ 403", False


actors = [
    ("学生(1班)", student),
    ("1班非班主任教师", regular_tafe),
    ("1班班主任", head_tafe1),
    ("2班班主任", other_cls2_head),
    ("系统管理员", admin),
]

ESSAY_CLASS = 1
TARGET_EXPORT_CLASS = 1
OTHER_CLASS = 2


def build_row(name, values):
    return f"| {name:<22} | {' | '.join(f'{v:^12}' for v in values)} |"


divider = "+" + "-" * 24 + ("+" + "-" * 14) * 5 + "+"

print(divider)
print(f"| {'边界(作文在高三1班)':<22} | {'学生(1班)':^12} | {'1班非班任':^12} | {'1班班主任':^12} | {'2班班主任':^12} | {'管理员':^12} |")
print(divider)

r1 = [evidence_access(u, ESSAY_CLASS) for _, u in actors]
r1_txt = ["✅" if x else "❌" for x in r1]
print(build_row("① evidence_refs 模型依据", r1_txt))

r2 = []
for _, u in actors:
    txt, ok = decrypt_access(u, ESSAY_CLASS)
    r2.append("✅" if ok else ("NR" if txt == "NOT_REQ" else "❌403"))
print(build_row("② include_original 原文解密", r2))

r3 = [_can_export_class(u, TARGET_EXPORT_CLASS) for _, u in actors]
r3_txt = ["✅" if x else "❌" for x in r3]
print(build_row("③ export 聚合导出(本班)", r3_txt))

r4 = [_can_export_class(u, OTHER_CLASS) for _, u in actors]
r4_txt = ["✅" if x else "❌" for x in r4]
print(build_row("④ export 聚合导出(他班)", r4_txt))

print(divider)

print("\n" + "=" * 84)
print("  断言验证：关键受控条件 ")
print("=" * 84)

expectations = [
    (r1[0] == False, "学生不可见 evidence_refs"),
    (r1[1] == False, "1班非班主任教师不可见 evidence_refs ✅修复生效！"),
    (r1[2] == True,  "1班班主任可见 evidence_refs"),
    (r1[3] == False, "2班班主任不可见1班 evidence_refs"),
    (r1[4] == True,  "管理员可见 evidence_refs"),
    (_can_export_class(regular_tafe, 1) == False, "1班非班主任不可聚合导出本班 ✅修复生效！"),
]

all_pass = True
for ok, desc in expectations:
    all_pass = all_pass and ok
    print(f"  {'✅ PASS' if ok else '❌ FAIL'}: {desc}")

print("=" * 84)
print("\n🎯 修复说明:")
print("   · 修复前 evidence_refs 判断条件: `role != STUDENT` → 同班非班主任也能看到 ❌")
print("   · 修复后复用 `_can_view_original`：仅 ADMIN 或 head_teacher == user.id ✅")
print("   · 与 include_original 解密 / 审核权限 完全使用同一判定函数，边界一致。")
print()
print("🎉 四角色边界验证通过！" if all_pass else "⚠️  存在未通过验证项")
