from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from .models import AuditLog, OperationType


def log_audit(user, operation, module, description='', old_data=None, new_data=None,
              content_object=None, ip_address=None, user_agent=''):
    content_type = None
    object_id = None
    if content_object is not None:
        content_type = ContentType.objects.get_for_model(content_object)
        object_id = content_object.pk

    return AuditLog.objects.create(
        user=user if user and user.is_authenticated else None,
        username=user.username if user and user.is_authenticated else '',
        operation=operation,
        module=module,
        description=description,
        content_type=content_type,
        object_id=object_id,
        old_data=old_data,
        new_data=new_data,
        ip_address=ip_address,
        user_agent=user_agent[:500]
    )
