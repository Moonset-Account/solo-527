from rest_framework import serializers

from apps.properties.models import Property, PropertyImage, Room, RoomAmenity, RoomImage


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'caption', 'sort_order']


class RoomAmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomAmenity
        fields = ['id', 'name', 'icon']


class RoomImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomImage
        fields = ['id', 'image', 'caption', 'sort_order']


class RoomSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source='property.name', read_only=True)
    amenities = RoomAmenitySerializer(many=True, read_only=True)
    images = RoomImageSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = [
            'id', 'property', 'property_name', 'name', 'description',
            'max_guests', 'base_price', 'area', 'bed_type', 'cover_image',
            'is_active', 'sort_order', 'amenities', 'images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PropertySerializer(serializers.ModelSerializer):
    rooms = RoomSerializer(many=True, read_only=True)
    images = PropertyImageSerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source='owner.real_name', read_only=True)

    class Meta:
        model = Property
        fields = [
            'id', 'name', 'address', 'description', 'phone', 'cover_image',
            'owner', 'owner_name', 'is_active', 'rooms', 'images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
