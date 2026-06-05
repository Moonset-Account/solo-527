from django.db import transaction
from common.audit import log_audit


class BaseService:
    model_class = None
    audit_model_name = ''

    def __init__(self, request=None):
        self.request = request
        self.user = request.user if request and hasattr(request, 'user') else None

    def _log(self, action, obj_id='', detail=''):
        log_audit(
            user=self.user,
            action=action,
            model_name=self.audit_model_name or self.model_class.__name__ if self.model_class else '',
            object_id=str(obj_id),
            detail=detail,
        )

    @transaction.atomic
    def create(self, **kwargs):
        obj = self.model_class.objects.create(**kwargs)
        self._log('create', obj.pk)
        return obj

    def list(self, **filters):
        return self.model_class.objects.filter(**filters)

    def get(self, pk):
        return self.model_class.objects.get(pk=pk)

    @transaction.atomic
    def update(self, pk, **kwargs):
        obj = self.get(pk)
        for key, value in kwargs.items():
            setattr(obj, key, value)
        obj.save()
        self._log('update', pk, detail=str(kwargs))
        return obj

    @transaction.atomic
    def delete(self, pk):
        obj = self.get(pk)
        obj.delete()
        self._log('delete', pk)
