from rest_framework import serializers
from organization.models import Region, Store

class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ['id', 'code', 'name']

class StoreSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)
    
    class Meta:
        model = Store
        fields = ['id', 'code', 'name', 'region', 'region_name', 'address']
