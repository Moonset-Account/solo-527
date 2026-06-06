from rest_framework import serializers
from .models import Member

class MemberSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Member
        fields = '__all__'
        read_only_fields = ['create_time']
