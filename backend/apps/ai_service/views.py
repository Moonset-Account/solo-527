from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Sum, Avg, Count, Q
from django.db.models.functions import TruncDate
from datetime import timedelta

from .models import AIModel, APIConfig, AILog
from .serializers import (
    AIModelSerializer,
    APIConfigSerializer,
    AILogSerializer,
    ChatCompletionSerializer,
)
from .services.ai_generator import AIService
from .services.risk_detector import RiskDetector


class AIModelViewSet(viewsets.ModelViewSet):
    queryset = AIModel.objects.all()
    serializer_class = AIModelSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['provider', 'is_active', 'supports_streaming']
    search_fields = ['name', 'model_id', 'description']

    @action(detail=False, methods=['get'], url_path='available')
    def available_models(self, request):
        models = AIService.get_available_models()
        db_models = AIModel.objects.filter(is_active=True)
        db_model_dict = {m.model_id: m for m in db_models}

        result = []
        for m in models:
            db_model = db_model_dict.get(m['id'])
            item = {
                'id': m['id'],
                'provider': m['provider'],
                'is_simulated': True,
                'error_rate': m['error_rate'],
            }
            if db_model:
                item['name'] = db_model.name
                item['description'] = db_model.description
                item['max_tokens'] = db_model.max_tokens
                item['input_price'] = str(db_model.input_price)
                item['output_price'] = str(db_model.output_price)
                item['supports_streaming'] = db_model.supports_streaming
            result.append(item)

        return Response(result)


class APIConfigViewSet(viewsets.ModelViewSet):
    queryset = APIConfig.objects.all()
    serializer_class = APIConfigSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['provider', 'is_default']


class AILogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AILog.objects.all()
    serializer_class = AILogSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user', 'model', 'status']
    search_fields = ['prompt', 'response', 'error_message']
    ordering_fields = ['created_at', 'total_tokens', 'cost', 'latency']

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        days = int(request.query_params.get('days', 7))
        start_date = timezone.now() - timedelta(days=days)

        logs = AILog.objects.filter(created_at__gte=start_date)
        total_calls = logs.count()
        success_calls = logs.filter(status='success').count()
        failed_calls = logs.filter(status='failed').count()
        total_tokens = logs.aggregate(total=Sum('total_tokens'))['total'] or 0
        total_cost = logs.aggregate(total=Sum('cost'))['total'] or 0
        avg_latency = logs.filter(status='success').aggregate(avg=Avg('latency'))['avg'] or 0

        return Response({
            'period_days': days,
            'total_calls': total_calls,
            'success_calls': success_calls,
            'failed_calls': failed_calls,
            'success_rate': (success_calls / total_calls) if total_calls > 0 else 0,
            'total_tokens': total_tokens,
            'total_cost': str(total_cost),
            'avg_latency': round(avg_latency, 3),
        })

    @action(detail=False, methods=['get'], url_path='stats/by-date')
    def stats_by_date(self, request):
        days = int(request.query_params.get('days', 7))
        start_date = timezone.now() - timedelta(days=days)

        stats = AILog.objects.filter(created_at__gte=start_date) \
            .annotate(date=TruncDate('created_at')) \
            .values('date') \
            .annotate(
                count=Count('id'),
                success=Count('id', filter=Q(status='success')),
                failed=Count('id', filter=Q(status='failed')),
            ) \
            .order_by('date')

        return Response(list(stats))

    @action(detail=False, methods=['get'], url_path='stats/by-model')
    def stats_by_model(self, request):
        days = int(request.query_params.get('days', 7))
        start_date = timezone.now() - timedelta(days=days)

        stats = AILog.objects.filter(created_at__gte=start_date) \
            .values('model__name', 'model__model_id') \
            .annotate(
                count=Count('id'),
                total_tokens=Sum('total_tokens'),
                total_cost=Sum('cost'),
                avg_latency=Avg('latency'),
            ) \
            .order_by('-count')

        return Response(list(stats))


class ChatViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'], url_path='completions')
    def completions(self, request):
        serializer = ChatCompletionSerializer(data=request.data)
        if serializer.is_valid():
            model = serializer.validated_data.get('model', 'gpt-4')
            messages = serializer.validated_data.get('messages', [])
            prompt_content = ''
            if messages:
                prompt_content = messages[-1].get('content', '')

            result = AIService.generate_reply(
                conversation_history=messages,
                prompt_content=prompt_content,
                variables={},
                model=model,
            )

            if result.get('success'):
                return Response({
                    'id': 'chatcmpl-sim-' + str(timezone.now().timestamp()),
                    'object': 'chat.completion',
                    'created': int(timezone.now().timestamp()),
                    'model': result['model'],
                    'choices': [
                        {
                            'index': 0,
                            'message': {
                                'role': 'assistant',
                                'content': result['content'],
                            },
                            'finish_reason': 'stop',
                        }
                    ],
                    'usage': result['tokens'],
                })
            else:
                return Response(
                    {'error': {'type': result.get('error_type'), 'message': result.get('error_message')}},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HealthCheckView(APIView):
    def get(self, request):
        ai_health = AIService.health_check()

        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            db_status = 'healthy'
        except Exception as e:
            db_status = f'unhealthy: {str(e)}'

        try:
            detector = RiskDetector()
            rules = detector.load_rules()
            risk_status = 'healthy'
            rules_count = len(rules)
        except Exception as e:
            risk_status = f'unhealthy: {str(e)}'
            rules_count = 0

        return Response({
            'status': 'healthy' if db_status == 'healthy' and risk_status == 'healthy' else 'degraded',
            'timestamp': timezone.now().isoformat(),
            'services': {
                'ai_service': {
                    'status': 'healthy',
                    **ai_health,
                },
                'database': {
                    'status': db_status,
                },
                'risk_detector': {
                    'status': risk_status,
                    'rules_count': rules_count,
                },
            },
        })


class RiskDetectView(APIView):
    def post(self, request):
        text = request.data.get('text', '')
        if not text:
            return Response(
                {'error': 'text is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        detector = RiskDetector()
        risks = detector.detect(text)
        highest_level = detector.get_highest_risk_level(risks)

        return Response({
            'text': text,
            'risk_count': len(risks),
            'highest_level': highest_level,
            'risks': risks,
        })
