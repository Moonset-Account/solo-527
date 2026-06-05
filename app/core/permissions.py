from fastapi import Depends, HTTPException, status
from app.models import User
from app.core.security import get_current_user


class PermissionRequired:
    def __init__(self, permission_name: str):
        self.permission_name = permission_name

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if not current_user.has_permission(self.permission_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {self.permission_name}"
            )
        return current_user


class RoleRequired:
    def __init__(self, role_name: str):
        self.role_name = role_name

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        role_names = [role.name for role in current_user.roles]
        if self.role_name not in role_names:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role required: {self.role_name}"
            )
        return current_user


ROLE_PERMISSIONS = {
    "admin": [
        "manage_users",
        "manage_roles",
        "view_dashboard",
        "manage_vendors",
        "review_applications",
        "manage_booths",
        "run_lottery",
        "manage_deposits",
        "manage_checkins",
        "view_reports",
        "manage_violations",
        "backfill_sales",
    ],
    "organizer": [
        "view_dashboard",
        "manage_vendors",
        "review_applications",
        "manage_booths",
        "run_lottery",
        "manage_deposits",
        "manage_checkins",
        "manage_violations",
        "backfill_sales",
    ],
    "staff": [
        "view_dashboard",
        "manage_checkins",
        "view_vendors",
    ],
    "finance": [
        "view_dashboard",
        "manage_deposits",
        "view_reports",
        "backfill_sales",
    ]
}
