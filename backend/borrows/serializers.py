from rest_framework import serializers
from .models import Borrow

class BorrowSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_isbn = serializers.CharField(source='book.isbn', read_only=True)
    member_name = serializers.CharField(source='member.family_name', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Borrow
        fields = '__all__'
        read_only_fields = ['borrow_date', 'create_time', 'update_time', 'renew_count']
    
    def get_is_overdue(self, obj):
        return obj.is_overdue()
