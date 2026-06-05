from django.contrib import admin
from .models import ClassGroup, Child, ParentChildRelation, AuthorizedPickupPerson


@admin.register(ClassGroup)
class ClassGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'grade', 'teacher', 'created_at']
    search_fields = ['name']


@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ['name', 'gender', 'birth_date', 'class_group', 'is_active']
    list_filter = ['class_group', 'is_active', 'gender']
    search_fields = ['name']


@admin.register(ParentChildRelation)
class ParentChildRelationAdmin(admin.ModelAdmin):
    list_display = ['parent', 'child', 'relation', 'is_primary']
    list_filter = ['relation']


@admin.register(AuthorizedPickupPerson)
class AuthorizedPickupPersonAdmin(admin.ModelAdmin):
    list_display = ['child', 'name', 'relation', 'phone', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'phone']
