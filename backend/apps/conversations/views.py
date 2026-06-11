from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Max, Q
from django_filters.rest_framework import DjangoFilterBackend
from .models import Conversation, Message
from .serializers import (
    ConversationListSerializer,
    ConversationDetailSerializer,
    ConversationCreateSerializer,
    MessageSerializer,
    MessageSendSerializer,
    MessageUpdateSerializer,
    AISuggestionSerializer,
)


class ConversationViewSet(viewsets.ModelViewSet):
    queryset = Conversation.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sales_operation', 'status', 'channel', 'priority']
    search_fields = ['title', 'customer_name', 'customer_phone']
    ordering_fields = ['created_at', 'updated_at', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.exclude(status='deleted')
        queryset = queryset.annotate(
            messages_count=Count('messages'),
            last_message_time=Max('messages__created_at')
        )
        keyword = self.request.query_params.get('keyword', None)
        if keyword:
            queryset = queryset.filter(
                Q(title__icontains=keyword) |
                Q(customer_name__icontains=keyword) |
                Q(customer_phone__icontains=keyword)
            )
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return ConversationListSerializer
        elif self.action == 'retrieve':
            return ConversationDetailSerializer
        elif self.action in ['create']:
            return ConversationCreateSerializer
        return ConversationDetailSerializer

    def perform_destroy(self, instance):
        instance.status = 'deleted'
        instance.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'message': '会话已删除', 'id': instance.id},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='send-message')
    def send_message(self, request, pk=None):
        conversation = self.get_object()
        serializer = MessageSendSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_message = Message.objects.create(
            conversation=conversation,
            role='user',
            content=serializer.validated_data['content'],
            review_status='approved'
        )

        try:
            from apps.ai_service.services.ai_generator import AIService
            from apps.prompts.models import Prompt

            prompt_content = ''
            prompt_version = ''
            try:
                prompt_obj = Prompt.objects.filter(
                    status='enabled',
                    target_sales_operations__contains=[conversation.sales_operation]
                ).first()
                if not prompt_obj:
                    prompt_obj = Prompt.objects.filter(status='enabled').first()
                if prompt_obj:
                    prompt_content = prompt_obj.content
                    prompt_version = prompt_obj.version
            except Exception:
                pass

            if not prompt_content:
                prompt_content = '你是一位专业的客服助手，请根据用户的问题提供友好、专业的回答。'

            conversation_history = []
            for msg in conversation.messages.filter(role__in=['user', 'assistant']).order_by('created_at')[:20]:
                conversation_history.append({'role': msg.role, 'content': msg.content})

            ai_result = AIService.generate_reply(
                conversation_history=conversation_history,
                prompt_content=prompt_content,
                variables={
                    'customer_name': conversation.customer_name,
                    'sales_operation': conversation.sales_operation,
                    'channel': conversation.channel,
                },
                model='gpt-4',
            )

            if ai_result.get('success'):
                ai_message = Message.objects.create(
                    conversation=conversation,
                    role='assistant',
                    content=ai_result['content'],
                    is_ai_suggestion=True,
                    suggested_reply=ai_result['content'],
                    ai_model=ai_result.get('model', 'gpt-4'),
                    prompt_version=prompt_version,
                    tokens_used=ai_result.get('tokens', {}).get('total', 0),
                    review_status='pending',
                    error_type='none',
                )
            else:
                error_type = ai_result.get('error_type', 'api_error')
                ai_message = Message.objects.create(
                    conversation=conversation,
                    role='assistant',
                    content='',
                    is_ai_suggestion=True,
                    suggested_reply='',
                    ai_model=ai_result.get('model', 'gpt-4'),
                    prompt_version=prompt_version,
                    error_type=error_type,
                    error_message=ai_result.get('error_message', '生成失败'),
                    review_status='pending',
                )
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f'AI generation failed: {e}', exc_info=True)
            ai_message = Message.objects.create(
                conversation=conversation,
                role='assistant',
                content='',
                is_ai_suggestion=True,
                suggested_reply='',
                error_type='api_error',
                error_message=str(e),
                review_status='pending',
            )

        return Response({
            'user_message': MessageSerializer(user_message).data,
            'ai_message': MessageSerializer(ai_message).data,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='ai-suggestion')
    def get_ai_suggestion(self, request, pk=None):
        conversation = self.get_object()
        last_user_message = conversation.messages.filter(
            role='user'
        ).order_by('-created_at').first()

        if not last_user_message:
            return Response(
                {'error': '没有找到用户消息'},
                status=status.HTTP_404_NOT_FOUND
            )

        ai_message = conversation.messages.filter(
            role='assistant',
            is_ai_suggestion=True
        ).order_by('-created_at').first()

        if ai_message and ai_message.suggested_reply:
            return Response({
                'message_id': ai_message.id,
                'suggested_reply': ai_message.suggested_reply,
                'ai_model': ai_message.ai_model,
                'prompt_version': ai_message.prompt_version,
                'status': 'completed',
                'created_at': ai_message.created_at
            })
        else:
            return Response({
                'status': 'pending',
                'message': 'AI建议生成中，请稍后再试'
            })

    @action(detail=True, methods=['post'], url_path='adopt-suggestion')
    def adopt_suggestion(self, request, pk=None):
        conversation = self.get_object()
        message_id = request.data.get('message_id')

        if not message_id:
            return Response(
                {'error': '请提供message_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            message = Message.objects.get(
                id=message_id,
                conversation=conversation,
                is_ai_suggestion=True
            )
        except Message.DoesNotExist:
            return Response(
                {'error': '未找到对应的AI建议消息'},
                status=status.HTTP_404_NOT_FOUND
            )

        if message.is_adopted:
            return Response(
                {'message': '该建议已经被采纳'},
                status=status.HTTP_200_OK
            )

        message.is_adopted = True
        message.save()

        adopted_count = conversation.messages.filter(
            is_ai_suggestion=True, is_adopted=True
        ).count()
        total_suggestions = conversation.messages.filter(
            is_ai_suggestion=True
        ).count()
        if total_suggestions > 0:
            conversation.ai_suggestion_adoption_rate = adopted_count / total_suggestions
            conversation.save()

        return Response({
            'message': '建议已采纳',
            'message_id': message.id
        })

    @action(detail=True, methods=['get'], url_path='messages')
    def list_messages(self, request, pk=None):
        conversation = self.get_object()
        messages = conversation.messages.all()
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = MessageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['conversation', 'role', 'is_ai_suggestion', 'is_adopted', 'review_status']
    search_fields = ['content']
    ordering_fields = ['created_at']
    ordering = ['created_at']
    http_method_names = ['get', 'put', 'patch', 'head', 'options']

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return MessageUpdateSerializer
        return MessageSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        conversation_id = self.kwargs.get('conversation_pk')
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)
        return queryset
