from django.contrib import admin
from .models import (
    Contract, ReviewWorkflow, ReviewStep, ContractReview,
    ReviewOpinion, StampNode, EvidenceChecklist, EvidenceMaterial,
    ProgressRecord, RejectionNotification,
)


class ReviewStepInline(admin.TabularInline):
    model = ReviewStep
    extra = 1
    ordering = ['order']


@admin.register(ReviewWorkflow)
class ReviewWorkflowAdmin(admin.ModelAdmin):
    list_display = ['name', 'contract_type', 'is_active', 'created_at']
    list_filter = ['is_active', 'contract_type']
    search_fields = ['name', 'description']
    inlines = [ReviewStepInline]


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ['contract_number', 'title', 'counterparty', 'status', 'uploader', 'created_at']
    list_filter = ['status', 'contract_type']
    search_fields = ['contract_number', 'title', 'counterparty']
    date_hierarchy = 'created_at'


class ReviewOpinionInline(admin.TabularInline):
    model = ReviewOpinion
    extra = 0
    readonly_fields = ['reviewer', 'step', 'opinion', 'result', 'reviewed_at']


class StampNodeInline(admin.TabularInline):
    model = StampNode
    extra = 0


class EvidenceChecklistInline(admin.TabularInline):
    model = EvidenceChecklist
    extra = 0
    show_change_link = True


class EvidenceMaterialInline(admin.TabularInline):
    model = EvidenceMaterial
    extra = 0


class ProgressRecordInline(admin.TabularInline):
    model = ProgressRecord
    extra = 0
    readonly_fields = ['stage', 'handler', 'action', 'remark', 'created_at']


@admin.register(ContractReview)
class ContractReviewAdmin(admin.ModelAdmin):
    list_display = ['contract', 'workflow', 'current_step', 'status', 'started_at', 'completed_at']
    list_filter = ['status', 'workflow']
    search_fields = ['contract__contract_number', 'contract__title']
    date_hierarchy = 'started_at'
    inlines = [
        ReviewOpinionInline, StampNodeInline, EvidenceChecklistInline,
        EvidenceMaterialInline, ProgressRecordInline,
    ]


@admin.register(RejectionNotification)
class RejectionNotificationAdmin(admin.ModelAdmin):
    list_display = ['contract_review', 'rejected_by', 'compliance_manager', 'is_read', 'synced_to_board', 'created_at']
    list_filter = ['is_read', 'synced_to_board']
    search_fields = ['reason']
