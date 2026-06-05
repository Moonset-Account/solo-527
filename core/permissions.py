from dataclasses import dataclass
from typing import Set, Dict
from .models import User


@dataclass
class Permission:
    codename: str
    name: str
    description: str


PERMISSIONS: Dict[str, Permission] = {
    'equipment.view': Permission('equipment.view', '查看设备', '可以查看所有设备信息'),
    'equipment.manage': Permission('equipment.manage', '管理设备', '可以创建、编辑、删除设备'),
    'equipment.book': Permission('equipment.book', '预约设备', '可以预约已获得培训资格的设备'),
    'training.view': Permission('training.view', '查看培训', '可以查看培训信息和资格'),
    'training.apply': Permission('training.apply', '申请培训', '可以申请设备培训'),
    'training.manage': Permission('training.manage', '管理培训', '可以创建培训、审核资格'),
    'training.certify': Permission('training.certify', '颁发证书', '可以颁发培训合格证书'),
    'bookings.view': Permission('bookings.view', '查看预约', '可以查看所有预约'),
    'bookings.manage': Permission('bookings.manage', '管理预约', '可以审批、取消预约'),
    'consumables.view': Permission('consumables.view', '查看耗材', '可以查看耗材库存'),
    'consumables.use': Permission('consumables.use', '使用耗材', '可以申领和使用耗材'),
    'consumables.manage': Permission('consumables.manage', '管理耗材', '可以管理耗材库存和计费'),
    'maintenance.view': Permission('maintenance.view', '查看故障', '可以查看故障单'),
    'maintenance.report': Permission('maintenance.report', '上报故障', '可以上报设备故障'),
    'maintenance.manage': Permission('maintenance.manage', '管理故障', '可以处理和关闭故障单'),
    'safety.view': Permission('safety.view', '查看安全记录', '可以查看安全记录'),
    'safety.report': Permission('safety.report', '上报安全事件', '可以上报安全事件'),
    'safety.manage': Permission('safety.manage', '管理安全记录', '可以审核和归档安全记录'),
    'notifications.view': Permission('notifications.view', '查看通知', '可以查看系统通知'),
    'notifications.manage': Permission('notifications.manage', '管理通知', '可以发送系统通知'),
    'audit.view': Permission('audit.view', '查看审计日志', '可以查看系统审计日志'),
    'users.manage': Permission('users.manage', '管理用户', '可以管理用户账号和角色'),
}


ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    User.Role.MEMBER: {
        'equipment.view',
        'equipment.book',
        'training.view',
        'training.apply',
        'bookings.view',
        'consumables.view',
        'consumables.use',
        'maintenance.view',
        'maintenance.report',
        'safety.view',
        'safety.report',
        'notifications.view',
    },
    User.Role.TRAINER: {
        'equipment.view',
        'equipment.book',
        'training.view',
        'training.apply',
        'training.certify',
        'bookings.view',
        'consumables.view',
        'consumables.use',
        'maintenance.view',
        'maintenance.report',
        'safety.view',
        'safety.report',
        'notifications.view',
    },
    User.Role.TECHNICIAN: {
        'equipment.view',
        'equipment.manage',
        'equipment.book',
        'training.view',
        'training.apply',
        'bookings.view',
        'bookings.manage',
        'consumables.view',
        'consumables.use',
        'consumables.manage',
        'maintenance.view',
        'maintenance.report',
        'maintenance.manage',
        'safety.view',
        'safety.report',
        'notifications.view',
    },
    User.Role.ADMIN: {
        perm.codename for perm in PERMISSIONS.values()
    },
}


def has_permission(user: User, permission_codename: str) -> bool:
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    user_permissions = ROLE_PERMISSIONS.get(user.role, set())
    return permission_codename in user_permissions


def get_user_permissions(user: User) -> Set[str]:
    if not user or not user.is_authenticated:
        return set()
    if user.is_superuser:
        return set(perm.codename for perm in PERMISSIONS.values())
    return ROLE_PERMISSIONS.get(user.role, set())
