from django.contrib import admin
from .models import User, Family, Child


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'phone', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'email', 'phone']


@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    list_display = ['name', 'primary_contact', 'address', 'created_at']
    search_fields = ['name']


@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ['name', 'gender', 'birth_date', 'age', 'family', 'created_at']
    list_filter = ['gender']
    search_fields = ['name']
