from django.db.models import Count, Q, F
from django.utils import timezone
from datetime import timedelta
from .models import KnowledgeItem, KnowledgeQuery


class KnowledgeItemService:
    @staticmethod
    def get_hot_items(limit=10):
        return KnowledgeItem.objects.filter(
            status=KnowledgeItem.Status.PUBLISHED
        ).order_by(
            '-hit_count', '-view_count'
        )[:limit]

    @staticmethod
    def search_items(query, category=None, is_tutorial=None, user=None):
        queryset = KnowledgeItem.objects.filter(
            status=KnowledgeItem.Status.PUBLISHED
        )

        if category:
            queryset = queryset.filter(category=category)
        if is_tutorial is not None:
            queryset = queryset.filter(is_tutorial=is_tutorial)

        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) |
                Q(content__icontains=query) |
                Q(keywords__icontains=query) |
                Q(tags__contains=[query])
            )

        if user and query:
            KnowledgeQueryService.create_query(query, user, 'api_search')

        for item in queryset[:20]:
            item.hit_count = F('hit_count') + 1
            item.save(update_fields=['hit_count'])

        return queryset

    @staticmethod
    def increment_view(item):
        item.view_count += 1
        item.save(update_fields=['view_count'])
        return item

    @staticmethod
    def mark_helpful(item):
        item.helpful_count += 1
        item.save(update_fields=['helpful_count'])
        return item

    @staticmethod
    def mark_not_helpful(item):
        item.not_helpful_count += 1
        item.save(update_fields=['not_helpful_count'])
        return item

    @staticmethod
    def set_reminder(item_id, has_reminder, user):
        query = KnowledgeQuery.objects.filter(
            matched_item_id=item_id,
            user=user
        ).order_by('-created_at').first()

        if query:
            query.has_reminder = has_reminder
            query.save(update_fields=['has_reminder'])
        return query

    @staticmethod
    def get_related_items(item, limit=5):
        return item.related_items.filter(
            status=KnowledgeItem.Status.PUBLISHED
        )[:limit]


class KnowledgeQueryService:
    @staticmethod
    def create_query(query_text, user, source='web', matched_item=None, match_score=None):
        return KnowledgeQuery.objects.create(
            query_text=query_text,
            user=user,
            matched_item=matched_item,
            match_score=match_score,
            source=source,
            created_by=user,
            updated_by=user,
        )

    @staticmethod
    def get_user_queries(user, has_reminder=None):
        queryset = KnowledgeQuery.objects.filter(user=user)
        if has_reminder is not None:
            queryset = queryset.filter(has_reminder=has_reminder)
        return queryset.order_by('-created_at')

    @staticmethod
    def get_popular_queries(days=7, limit=10):
        date_from = timezone.now() - timedelta(days=days)
        return KnowledgeQuery.objects.filter(
            created_at__gte=date_from
        ).values('query_text').annotate(
            count=Count('id')
        ).order_by('-count')[:limit]

    @staticmethod
    def get_query_stats(days=30):
        date_from = timezone.now() - timedelta(days=days)
        total = KnowledgeQuery.objects.filter(created_at__gte=date_from).count()
        with_match = KnowledgeQuery.objects.filter(
            created_at__gte=date_from,
            matched_item__isnull=False
        ).count()
        helpful = KnowledgeQuery.objects.filter(
            created_at__gte=date_from,
            is_helpful=True
        ).count()

        return {
            'total_queries': total,
            'matched_queries': with_match,
            'helpful_queries': helpful,
            'match_rate': (with_match / total * 100) if total > 0 else 0,
            'helpful_rate': (helpful / with_match * 100) if with_match > 0 else 0,
        }
