from rest_framework import serializers
from .models import RepairRecord

class RepairRecordSerializer(serializers.ModelSerializer):
    damage_level_display = serializers.CharField(source='get_damage_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_isbn = serializers.CharField(source='book.isbn', read_only=True)
    reporter_name = serializers.CharField(source='reporter.family_name', read_only=True)
    
    class Meta:
        model = RepairRecord
        fields = '__all__'
        read_only_fields = ['create_time', 'update_time', 'status']
