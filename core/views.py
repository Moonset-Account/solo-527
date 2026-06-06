from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('/dashboard/')
        else:
            return render(request, 'login.html', {'error': '用户名或密码错误'})
    return render(request, 'login.html')

@login_required
def dashboard(request):
    user = request.user
    context = {
        'user': user,
        'user_role': '',
        'store_name': ''
    }
    if hasattr(user, 'profile') and user.profile:
        context['user_role'] = user.profile.role.get_name_display() if user.profile.role else ''
        context['store_name'] = user.profile.store.name if user.profile.store else ''
        context['region_name'] = user.profile.region.name if user.profile.region else ''
    return render(request, 'dashboard.html', context)

@login_required
def details(request):
    user = request.user
    context = {
        'user': user,
        'user_role': '',
        'store_name': ''
    }
    if hasattr(user, 'profile') and user.profile:
        context['user_role'] = user.profile.role.get_name_display() if user.profile.role else ''
        context['store_name'] = user.profile.store.name if user.profile.store else ''
    return render(request, 'details.html', context)

@login_required
def data_management(request):
    user = request.user
    context = {
        'user': user,
        'user_role': '',
    }
    if hasattr(user, 'profile') and user.profile:
        context['user_role'] = user.profile.role.get_name_display() if user.profile.role else ''
    return render(request, 'data_management.html', context)

@login_required
def reports(request):
    user = request.user
    context = {
        'user': user,
        'user_role': '',
    }
    if hasattr(user, 'profile') and user.profile:
        context['user_role'] = user.profile.role.get_name_display() if user.profile.role else ''
    return render(request, 'reports.html', context)
