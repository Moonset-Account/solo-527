from typing import TypeVar, Generic, List, Optional, Dict, Any
from django.db import models
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User

T = TypeVar('T', bound=models.Model)


class BaseService(Generic[T]):
    model: type[T] = None

    def __init__(self, user: Optional[User] = None):
        self.user = user

    def get_queryset(self):
        return self.model.objects.all()

    def get_by_id(self, pk: Any) -> Optional[T]:
        try:
            return self.get_queryset().get(pk=pk)
        except self.model.DoesNotExist:
            return None

    def list_all(self) -> List[T]:
        return list(self.get_queryset())

    def get_all(self) -> List[T]:
        return self.list_all()

    def filter(self, **kwargs) -> List[T]:
        return list(self.get_queryset().filter(**kwargs))

    def get_first(self, **kwargs) -> Optional[T]:
        return self.get_queryset().filter(**kwargs).first()

    def create(self, data: Dict[str, Any], **kwargs) -> T:
        if hasattr(self, 'validator'):
            self.validator.validate_create(data, user=self.user, **kwargs)
        instance = self.model(**data)
        if hasattr(instance, 'created_by') and self.user:
            instance.created_by = self.user
        if hasattr(instance, 'updated_by') and self.user:
            instance.updated_by = self.user
        instance.full_clean()
        instance.save()
        return instance

    def update(self, instance: T, data: Dict[str, Any], **kwargs) -> T:
        if hasattr(self, 'validator'):
            self.validator.validate_update(instance, data, user=self.user, **kwargs)
        for key, value in data.items():
            setattr(instance, key, value)
        if hasattr(instance, 'updated_by') and self.user:
            instance.updated_by = self.user
        instance.full_clean()
        instance.save()
        return instance

    def delete(self, instance: T, **kwargs) -> None:
        if hasattr(self, 'validator'):
            self.validator.validate_delete(instance, user=self.user, **kwargs)
        instance.delete()
