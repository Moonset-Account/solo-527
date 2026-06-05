from rest_framework import serializers
from .models import Book, Supplier, Category, BookImage


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'parent', 'sort_order', 'description', 'children', 'is_active']
    
    def get_children(self, obj):
        if obj.children.exists():
            return CategorySerializer(obj.children.filter(is_active=True), many=True).data
        return []


class CategorySimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_person', 'phone', 'email', 'address', 'remark', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class SupplierSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name']


class BookImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookImage
        fields = ['id', 'image', 'sort_order', 'is_primary']


class BookSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    available_quantity = serializers.IntegerField(read_only=True)
    category = CategorySimpleSerializer(read_only=True)
    supplier = SupplierSimpleSerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, allow_null=True, required=False)
    supplier_id = serializers.IntegerField(write_only=True, allow_null=True, required=False)
    images = BookImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Book
        fields = [
            'id', 'isbn', 'title', 'author', 'translator', 'publisher', 'publish_date',
            'category', 'category_id', 'supplier', 'supplier_id', 'price', 'cost_price',
            'pages', 'binding', 'language', 'summary', 'cover_image', 'stock_quantity',
            'reserved_quantity', 'available_quantity', 'low_stock_threshold', 'location',
            'status', 'status_display', 'allow_reservation', 'is_active', 'created_at', 'images'
        ]
        read_only_fields = ['reserved_quantity', 'available_quantity', 'status', 'created_at']


class BookListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    available_quantity = serializers.IntegerField(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Book
        fields = [
            'id', 'isbn', 'title', 'author', 'publisher', 'price', 'cover_image',
            'stock_quantity', 'available_quantity', 'status', 'status_display',
            'category_name', 'location', 'allow_reservation'
        ]


class StockAdjustSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(required=True)
    remark = serializers.CharField(required=False, allow_blank=True)
    type = serializers.ChoiceField(choices=[('add', '增加'), ('subtract', '减少'), ('set', '设置')], required=True)
