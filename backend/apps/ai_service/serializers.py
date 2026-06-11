from rest_framework import serializers
from .models import AIModel, APIConfig, AILog


class AIModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIModel
        fields = ['id', 'name', 'provider', 'model_id', 'description', 'max_tokens',
                  'input_price', 'output_price', 'is_active', 'supports_streaming',
                  'capabilities', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class APIConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = APIConfig
        fields = ['id', 'provider', 'api_key', 'base_url', 'is_default',
                  'rate_limit_per_minute', 'rate_limit_per_day', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'api_key': {'write_only': True}
        }


class AILogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    model_name = serializers.CharField(source='model.name', read_only=True)

    class Meta:
        model = AILog
        fields = ['id', 'user', 'user_name', 'model', 'model_name', 'prompt', 'response',
                  'prompt_tokens', 'completion_tokens', 'total_tokens', 'cost',
                  'latency', 'status', 'error_message', 'request_id', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatCompletionSerializer(serializers.Serializer):
    model = serializers.CharField(required=True)
    messages = serializers.ListField(child=serializers.DictField(), required=True)
    temperature = serializers.FloatField(default=0.7, required=False)
    max_tokens = serializers.IntegerField(default=2048, required=False)
    stream = serializers.BooleanField(default=False, required=False)
