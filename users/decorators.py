from functools import wraps
from django.shortcuts import redirect
from django.contrib import messages
from django.http import HttpResponseForbidden


def role_required(*allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect(f'/accounts/login/?next={request.path}')

            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)

            if not request.user.role:
                messages.error(request, '您没有对应的角色权限')
                return HttpResponseForbidden('您没有权限访问此页面')

            user_role_name = request.user.role.name
            if user_role_name in allowed_roles:
                return view_func(request, *args, **kwargs)

            messages.error(request, '您没有权限执行此操作')
            return HttpResponseForbidden('您没有权限访问此页面')
        return _wrapped_view
    return decorator


def curator_required(view_func):
    return role_required('curator', 'admin')(view_func)


def warehouse_keeper_required(view_func):
    return role_required('warehouse_keeper', 'admin')(view_func)


def construction_lead_required(view_func):
    return role_required('construction_lead', 'admin')(view_func)


def admin_required(view_func):
    return role_required('admin')(view_func)


def can_create_borrow_order(view_func):
    return role_required('curator', 'admin')(view_func)


def can_manage_inventory(view_func):
    return role_required('warehouse_keeper', 'admin')(view_func)


def can_pickup_or_return(view_func):
    return role_required('construction_lead', 'warehouse_keeper', 'admin')(view_func)


def can_approve(view_func):
    return role_required('admin')(view_func)
