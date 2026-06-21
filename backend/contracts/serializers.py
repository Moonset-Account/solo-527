from rest_framework import serializers
from .models import FrameworkContract, ContractPrice, PriceHistory, ContractRenewal


class ContractPriceWriteSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = ContractPrice
        fields = [
            'id', 'specification', 'unit_price', 'minimum_quantity',
            'discount_rate', 'effective_date', 'expiration_date', 'is_active'
        ]


class ContractPriceSerializer(serializers.ModelSerializer):
    specification_name = serializers.CharField(source='specification.name', read_only=True)
    specification_spec = serializers.CharField(source='specification.specification', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = ContractPrice
        fields = [
            'id', 'contract', 'specification', 'specification_name', 'specification_spec',
            'unit_price', 'minimum_quantity', 'discount_rate', 'effective_date',
            'expiration_date', 'is_active', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class FrameworkContractSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    project_manager_name = serializers.CharField(source='project_manager.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_terms_display = serializers.CharField(source='get_payment_terms_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    category_names = serializers.SerializerMethodField()
    prices = ContractPriceSerializer(many=True, read_only=True)
    price_lines = ContractPriceWriteSerializer(many=True, write_only=True, required=False)
    days_to_expiry = serializers.SerializerMethodField()
    contract_file_url = serializers.SerializerMethodField()
    active_renewal = serializers.SerializerMethodField()

    class Meta:
        model = FrameworkContract
        fields = [
            'id', 'contract_number', 'title', 'supplier', 'supplier_name',
            'project_manager', 'project_manager_name', 'start_date', 'end_date',
            'total_amount', 'minimum_order_amount', 'payment_terms', 'payment_terms_display',
            'status', 'status_display', 'categories', 'category_names', 'specifications',
            'terms_and_conditions', 'delivery_terms', 'quality_requirements',
            'penalty_clause', 'contract_file', 'contract_file_url', 'signed_date',
            'signing_location', 'prices', 'price_lines', 'days_to_expiry', 'active_renewal',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_category_names(self, obj):
        return list(obj.categories.values_list('name', flat=True))

    def get_days_to_expiry(self, obj):
        from datetime import date
        if obj.end_date:
            return (obj.end_date - date.today()).days
        return None

    def get_contract_file_url(self, obj):
        request = self.context.get('request')
        if obj.contract_file and request:
            return request.build_absolute_uri(obj.contract_file.url)
        return obj.contract_file.url if obj.contract_file else None

    def get_active_renewal(self, obj):
        renewal = obj.renewals.filter(decision='pending').first()
        if renewal:
            return {
                'id': renewal.id,
                'decision': renewal.decision,
                'renewal_recommendation': renewal.renewal_recommendation,
            }
        return None

    def create(self, validated_data):
        price_lines = validated_data.pop('price_lines', [])
        categories = validated_data.pop('categories', [])
        specifications = validated_data.pop('specifications', [])
        contract = FrameworkContract.objects.create(**validated_data)
        if categories:
            contract.categories.set(categories)
        if specifications:
            contract.specifications.set(specifications)
        self._save_price_lines(contract, price_lines)
        return contract

    def update(self, instance, validated_data):
        price_lines = validated_data.pop('price_lines', None)
        categories = validated_data.pop('categories', None)
        specifications = validated_data.pop('specifications', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if categories is not None:
            instance.categories.set(categories)
        if specifications is not None:
            instance.specifications.set(specifications)
        if price_lines is not None:
            self._save_price_lines(instance, price_lines)
        return instance

    def _save_price_lines(self, contract, price_lines):
        from datetime import date as date_type
        user = self.context['request'].user
        existing_ids = set()
        today = date_type.today()

        for line_data in price_lines:
            line_id = line_data.get('id')
            spec = line_data['specification']
            unit_price = line_data['unit_price']
            effective_date = line_data.get('effective_date') or contract.start_date or today

            if line_id:
                try:
                    cp = ContractPrice.objects.get(id=line_id, contract=contract)
                    old_spec_id = cp.specification_id
                    old_price = cp.unit_price

                    cp.specification = spec
                    cp.unit_price = unit_price
                    cp.minimum_quantity = line_data.get('minimum_quantity', cp.minimum_quantity)
                    cp.discount_rate = line_data.get('discount_rate', cp.discount_rate)
                    cp.effective_date = effective_date
                    cp.expiration_date = line_data.get('expiration_date', cp.expiration_date)
                    cp.is_active = line_data.get('is_active', cp.is_active)
                    cp.save()
                    existing_ids.add(cp.id)

                    spec_id = spec if isinstance(spec, int) else spec.id
                    if old_price != unit_price or old_spec_id != spec_id:
                        PriceHistory.objects.create(
                            specification=cp.specification,
                            contract=contract,
                            unit_price=unit_price,
                            price_date=today,
                            source='contract',
                            change_reason=f'价格调整: 原 {old_price} → {unit_price}',
                            recorded_by=user
                        )
                except ContractPrice.DoesNotExist:
                    continue
            else:
                existing = ContractPrice.objects.filter(
                    contract=contract,
                    specification=spec,
                    effective_date=effective_date
                ).first()
                if existing:
                    old_price = existing.unit_price
                    existing.unit_price = unit_price
                    existing.minimum_quantity = line_data.get('minimum_quantity', existing.minimum_quantity)
                    existing.discount_rate = line_data.get('discount_rate', existing.discount_rate)
                    existing.expiration_date = line_data.get('expiration_date', existing.expiration_date)
                    existing.is_active = line_data.get('is_active', True)
                    existing.save()
                    existing_ids.add(existing.id)
                    if old_price != unit_price:
                        PriceHistory.objects.create(
                            specification=existing.specification,
                            contract=contract,
                            unit_price=unit_price,
                            price_date=today,
                            source='contract',
                            change_reason=f'价格调整: 原 {old_price} → {unit_price}',
                            recorded_by=user
                        )
                else:
                    cp = ContractPrice.objects.create(
                        contract=contract,
                        specification=spec,
                        unit_price=unit_price,
                        minimum_quantity=line_data.get('minimum_quantity', 0),
                        discount_rate=line_data.get('discount_rate', 0),
                        effective_date=effective_date,
                        expiration_date=line_data.get('expiration_date'),
                        is_active=line_data.get('is_active', True),
                        created_by=user
                    )
                    existing_ids.add(cp.id)
                    PriceHistory.objects.create(
                        specification=cp.specification,
                        contract=contract,
                        unit_price=cp.unit_price,
                        price_date=cp.effective_date,
                        source='contract',
                        change_reason='合同定价',
                        recorded_by=user
                    )

        ContractPrice.objects.filter(contract=contract).exclude(id__in=existing_ids).delete()


class PriceHistorySerializer(serializers.ModelSerializer):
    specification_name = serializers.CharField(source='specification.name', read_only=True)
    specification_spec = serializers.CharField(source='specification.specification', read_only=True)
    contract_number = serializers.CharField(source='contract.contract_number', read_only=True, allow_null=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)

    class Meta:
        model = PriceHistory
        fields = [
            'id', 'specification', 'specification_name', 'specification_spec',
            'contract', 'contract_number', 'unit_price', 'price_date',
            'source', 'change_reason', 'recorded_by', 'recorded_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'recorded_by']


class ContractRenewalSerializer(serializers.ModelSerializer):
    original_contract_number = serializers.CharField(source='original_contract.contract_number', read_only=True)
    original_contract_title = serializers.CharField(source='original_contract.title', read_only=True)
    new_contract_number = serializers.CharField(source='new_contract.contract_number', read_only=True, allow_null=True)
    decision_display = serializers.CharField(source='get_decision_display', read_only=True)
    handled_by_name = serializers.CharField(source='handled_by.get_full_name', read_only=True, allow_null=True)
    original_contract_end_date = serializers.DateField(source='original_contract.end_date', read_only=True)

    class Meta:
        model = ContractRenewal
        fields = [
            'id', 'original_contract', 'original_contract_number', 'original_contract_title',
            'original_contract_end_date', 'new_contract', 'new_contract_number',
            'renewal_recommendation', 'decision', 'decision_display', 'decision_reason',
            'handled_by', 'handled_by_name', 'handled_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'handled_by']
