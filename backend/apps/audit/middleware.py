import json
import uuid

from django.utils.deprecation import MiddlewareMixin

from apps.audit.models import AuditLog
from apps.users.models import User


class AuditLogMiddleware(MiddlewareMixin):
    EXCLUDED_PATHS = [
        '/api/auth/',
        '/api/schema/',
        '/api/docs/',
        '/static/',
        '/media/',
        '/admin/',
    ]

    EXCLUDED_METHODS = ['GET', 'HEAD', 'OPTIONS']

    AUDIT_MODELS = {
        'room': 'Room',
        'property': 'Property',
        'inventory': 'Inventory',
        'order': 'Order',
        'tourroute': 'TourRoute',
        'cleaningtask': 'CleaningTask',
        'itineraryversion': 'ItineraryVersion',
        'reminderrule': 'ReminderRule',
        'reminder': 'Reminder',
        'user': 'User',
    }

    def process_request(self, request):
        if request.method in self.EXCLUDED_METHODS:
            return None

        for path in self.EXCLUDED_PATHS:
            if request.path.startswith(path):
                return None

        request._audit_old_values = self._get_old_values(request)
        return None

    def process_response(self, request, response):
        if not hasattr(request, '_audit_old_values'):
            return response

        if request.method in self.EXCLUDED_METHODS:
            return response

        for path in self.EXCLUDED_PATHS:
            if request.path.startswith(path):
                return response

        if response.status_code >= 200 and response.status_code < 300:
            self._create_audit_log(request, response)

        return response

    def _get_old_values(self, request):
        path_parts = [p for p in request.path.split('/') if p]
        if len(path_parts) < 3:
            return None

        model_name = path_parts[-2] if path_parts[-1].isdigit() or self._is_uuid(path_parts[-1]) else path_parts[-1]
        object_id = path_parts[-1] if (path_parts[-1].isdigit() or self._is_uuid(path_parts[-1])) else None

        if not object_id:
            return None

        model_class = self._get_model_class(model_name)
        if not model_class:
            return None

        try:
            if self._is_uuid(object_id):
                obj = model_class.objects.get(id=uuid.UUID(object_id))
            else:
                obj = model_class.objects.get(id=int(object_id))
            return self._model_to_dict(obj)
        except Exception:
            return None

    def _create_audit_log(self, request, response):
        try:
            user = request.user if request.user.is_authenticated else None
            ip_address = self._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')

            path_parts = [p for p in request.path.split('/') if p]
            if len(path_parts) < 2:
                return

            model_name = path_parts[-2] if (path_parts[-1].isdigit() or self._is_uuid(path_parts[-1])) else path_parts[-1]
            object_id_str = path_parts[-1] if (path_parts[-1].isdigit() or self._is_uuid(path_parts[-1])) else None

            action_map = {
                'POST': 'create',
                'PUT': 'update',
                'PATCH': 'update',
                'DELETE': 'delete',
            }
            action = action_map.get(request.method)
            if not action:
                return

            object_id = None
            object_uuid = None
            if object_id_str:
                if self._is_uuid(object_id_str):
                    object_uuid = uuid.UUID(object_id_str)
                else:
                    try:
                        object_id = int(object_id_str)
                    except ValueError:
                        pass

            new_values = {}
            if request.method in ['POST', 'PUT', 'PATCH']:
                try:
                    new_values = json.loads(request.body) if request.body else {}
                except Exception:
                    new_values = {}

            old_values = getattr(request, '_audit_old_values', {}) or {}

            object_name = self._extract_object_name(new_values, old_values)

            model_display_name = self.AUDIT_MODELS.get(model_name.lower(), model_name)

            AuditLog.objects.create(
                action=action,
                model_name=model_display_name,
                object_id=object_id,
                object_uuid=object_uuid,
                object_name=object_name,
                changed_by=user,
                ip_address=ip_address,
                user_agent=user_agent,
                old_values=old_values,
                new_values=new_values,
            )
        except Exception as e:
            pass

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')

    def _is_uuid(self, s):
        try:
            uuid.UUID(s)
            return True
        except Exception:
            return False

    def _get_model_class(self, model_name):
        from django.apps import apps
        model_name_lower = model_name.lower()
        for app_config in apps.get_app_configs():
            for model in app_config.get_models():
                if model.__name__.lower() == model_name_lower:
                    return model
        return None

    def _model_to_dict(self, obj):
        from django.forms.models import model_to_dict
        try:
            data = model_to_dict(obj)
            for key, value in data.items():
                if isinstance(value, uuid.UUID):
                    data[key] = str(value)
                elif hasattr(value, 'isoformat'):
                    data[key] = value.isoformat()
            return data
        except Exception:
            return {}

    def _extract_object_name(self, new_values, old_values):
        name_fields = ['name', 'title', 'order_no', 'guest_name']
        for field in name_fields:
            if new_values and field in new_values and new_values[field]:
                return str(new_values[field])
            if old_values and field in old_values and old_values[field]:
                return str(old_values[field])
        return ''
