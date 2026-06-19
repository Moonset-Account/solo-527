from rest_framework import serializers
from .models import Vote, VotingStatistics
from common.serializers import ProductionDataSerializerMixin
from users.serializers import UserSerializer
from topics.serializers import TopicSerializer


class VoteSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    topic = TopicSerializer(read_only=True)
    topic_id = serializers.IntegerField(write_only=True, required=True)
    voter = UserSerializer(read_only=True)
    vote_display = serializers.CharField(source='get_vote_display', read_only=True)
    voter_name = serializers.SerializerMethodField()

    class Meta:
        model = Vote
        fields = '__all__'
        read_only_fields = [
            'created_by', 'updated_by', 'voter', 'voted_at',
            'has_qualification_exception', 'exception_handled'
        ]

    def get_voter_name(self, obj):
        if obj.is_anonymous:
            return '匿名投票人'
        return obj.voter.get_full_name() or obj.voter.username

    def validate(self, attrs):
        from topics.models import Topic
        topic_id = attrs.get('topic_id')
        try:
            topic = Topic.objects.get(id=topic_id)
        except Topic.DoesNotExist:
            raise serializers.ValidationError('议题不存在')

        if not topic.is_voting_active:
            raise serializers.ValidationError('该议题当前不处于投票阶段')

        if Vote.objects.filter(topic=topic, voter=self.context['request'].user).exists():
            raise serializers.ValidationError('您已经投过票了')

        return attrs


class VotingStatisticsSerializer(serializers.ModelSerializer):
    topic = TopicSerializer(read_only=True)

    class Meta:
        model = VotingStatistics
        fields = '__all__'


class VoteCreateSerializer(serializers.Serializer):
    topic_id = serializers.IntegerField(required=True)
    vote = serializers.ChoiceField(choices=Vote.VOTE_CHOICES, required=True)
    is_anonymous = serializers.BooleanField(required=False, default=False)
