from rest_framework import serializers
from .models import Book

class BookSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Book
        fields = '__all__'
        read_only_fields = ['create_time', 'update_time']
