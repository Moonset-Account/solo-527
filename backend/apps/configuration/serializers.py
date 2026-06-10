from rest_framework import serializers

from apps.configuration.models import CleaningTask, ItineraryVersion, TourRoute, TourWaypoint


class TourWaypointSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourWaypoint
        fields = [
            'id', 'route', 'name', 'description', 'latitude', 'longitude',
            'duration_minutes', 'sort_order', 'image'
        ]
        read_only_fields = ['id']


class TourRouteSerializer(serializers.ModelSerializer):
    waypoints = TourWaypointSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.real_name', read_only=True)
    property_name = serializers.CharField(source='property.name', read_only=True)

    class Meta:
        model = TourRoute
        fields = [
            'id', 'property', 'property_name', 'name', 'description',
            'duration_minutes', 'version', 'is_published',
            'created_by', 'created_by_name', 'waypoints', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CleaningTaskSerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source='room.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.real_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.real_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = CleaningTask
        fields = [
            'id', 'name', 'room', 'room_name', 'assigned_to', 'assigned_to_name',
            'estimated_minutes', 'priority', 'priority_display',
            'checklist', 'start_time', 'end_time', 'deadline',
            'status', 'status_display', 'remarks',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ItineraryVersionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.real_name', read_only=True)
    published_by_name = serializers.CharField(source='published_by.real_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_latest = serializers.BooleanField(read_only=True)

    class Meta:
        model = ItineraryVersion
        fields = [
            'id', 'version', 'name', 'description', 'content',
            'status', 'status_display', 'created_by', 'created_by_name',
            'published_at', 'published_by', 'published_by_name',
            'is_latest', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_latest']


class VersionCompareSerializer(serializers.Serializer):
    version1_id = serializers.IntegerField()
    version2_id = serializers.IntegerField()


class VersionDiffSerializer(serializers.Serializer):
    field = serializers.CharField()
    old_value = serializers.JSONField()
    new_value = serializers.JSONField()
    changed = serializers.BooleanField()
