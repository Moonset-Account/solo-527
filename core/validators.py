from typing import Dict, Any, Optional
from django.core.exceptions import ValidationError
from .models import User
from .permissions import has_permission


class BaseValidator:
    required_permission_create: Optional[str] = None
    required_permission_update: Optional[str] = None
    required_permission_delete: Optional[str] = None

    def _check_permission(self, user: Optional[User], permission_codename: Optional[str]) -> None:
        if permission_codename and not has_permission(user, permission_codename):
            raise ValidationError(f'没有权限执行此操作，需要权限: {permission_codename}')

    def validate_create(self, data: Dict[str, Any], user: Optional[User] = None, **kwargs) -> None:
        self._check_permission(user, self.required_permission_create)
        self._validate_common(data, user, **kwargs)

    def validate_update(self, instance, data: Dict[str, Any], user: Optional[User] = None, **kwargs) -> None:
        self._check_permission(user, self.required_permission_update)
        self._validate_common(data, user, instance=instance, **kwargs)

    def validate_delete(self, instance, user: Optional[User] = None, **kwargs) -> None:
        self._check_permission(user, self.required_permission_delete)

    def _validate_common(self, data: Dict[str, Any], user: Optional[User] = None, **kwargs) -> None:
        pass
