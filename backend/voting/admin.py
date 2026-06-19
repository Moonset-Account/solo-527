from django.contrib import admin
from .models import Vote, VotingStatistics


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = [
        'topic', 'voter_name', 'vote', 'voted_at',
        'has_qualification_exception', 'exception_handled'
    ]
    list_filter = [
        'vote', 'has_qualification_exception', 'exception_handled',
        'voted_at', 'is_test_data'
    ]
    search_fields = ['topic__title', 'voter__first_name', 'voter__username']
    date_hierarchy = 'voted_at'
    fieldsets = (
        ('基本信息', {
            'fields': ('topic', 'voter', 'vote', 'voted_at', 'is_anonymous')
        }),
        ('技术信息', {
            'fields': ('ip_address', 'user_agent')
        }),
        ('异常信息', {
            'fields': ('has_qualification_exception', 'exception_handled', 'exception_remark')
        }),
        ('其他', {
            'fields': ('is_test_data',)
        })
    )

    def voter_name(self, obj):
        return obj.voter.get_full_name() or obj.voter.username

    voter_name.short_description = '投票人'


@admin.register(VotingStatistics)
class VotingStatisticsAdmin(admin.ModelAdmin):
    list_display = [
        'topic', 'total_eligible_voters', 'actual_voters',
        'turnout_rate', 'yes_rate', 'no_rate', 'exception_count'
    ]
    list_filter = ['last_updated']
    search_fields = ['topic__title']
    readonly_fields = [
        'total_eligible_voters', 'actual_voters', 'turnout_rate',
        'yes_votes', 'no_votes', 'abstain_votes',
        'yes_rate', 'no_rate', 'abstain_rate',
        'exception_count', 'last_updated'
    ]
