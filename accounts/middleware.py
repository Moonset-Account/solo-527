from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponseForbidden
from django.shortcuts import redirect

class RolePermissionMiddleware(MiddlewareMixin):
    def process_view(self, request, view_func, view_args, view_kwargs):
        if not request.user.is_authenticated:
            return None
        
        if hasattr(request.user, 'profile') and request.user.profile:
            profile = request.user.profile
            role_name = profile.role.name if profile.role else None
            
            request.user_role = role_name
            request.user_store = profile.store
            request.user_region = profile.region
            
        return None
