from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Avg, Count, Q, F
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from datetime import datetime, timedelta
from .models import LossAggregation, CaliberConfig
from operations.models import Wastage, Stocktake
from organization.models import Store
from materials.models import Material
from django_filters import rest_framework as filters

class DashboardViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_user_stores(self, request):
        user = request.user
        if hasattr(user, 'profile') and user.profile:
            profile = user.profile
            if profile.role and profile.role.name == 'store_manager' and profile.store:
                return Store.objects.filter(id=profile.store.id)
            elif profile.role and profile.role.name == 'region_operator' and profile.region:
                return Store.objects.filter(region=profile.region)
        return Store.objects.filter(is_active=True)

    def apply_trial_filter(self, queryset, exclude_trial, material_field='material'):
        if exclude_trial:
            return queryset.filter(**{f'{material_field}__is_trial': False})
        return queryset

    @action(detail=False, methods=['get'])
    def metrics(self, request):
        exclude_trial = request.query_params.get('exclude_trial', 'false').lower() == 'true'
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        stores = self.get_user_stores(request)
        store_ids = stores.values_list('id', flat=True)
        
        wastage_qs = Wastage.objects.filter(store_id__in=store_ids)
        stocktake_qs = Stocktake.objects.filter(store_id__in=store_ids)
        
        if start_date:
            wastage_qs = wastage_qs.filter(record_date__gte=start_date)
            stocktake_qs = stocktake_qs.filter(record_date__gte=start_date)
        if end_date:
            wastage_qs = wastage_qs.filter(record_date__lte=end_date)
            stocktake_qs = stocktake_qs.filter(record_date__lte=end_date)
        
        wastage_qs = self.apply_trial_filter(wastage_qs, exclude_trial)
        stocktake_qs = self.apply_trial_filter(stocktake_qs, exclude_trial)
        
        total_wastage_amount = wastage_qs.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_diff_amount = stocktake_qs.aggregate(Sum('diff_amount'))['diff_amount__sum'] or 0
        total_loss_amount = total_wastage_amount + abs(total_diff_amount)
        
        total_use = 100000
        loss_rate = (total_loss_amount / total_use * 100) if total_use > 0 else 0
        
        store_loss_rates = []
        for store in stores:
            store_wastage = wastage_qs.filter(store=store).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            store_diff = stocktake_qs.filter(store=store).aggregate(Sum('diff_amount'))['diff_amount__sum'] or 0
            store_loss = store_wastage + abs(store_diff)
            store_rate = (store_loss / 10000 * 100) if 10000 > 0 else 0
            store_loss_rates.append({'store_id': store.id, 'rate': store_rate})
        
        abnormal_threshold = 5.0
        abnormal_count = sum(1 for s in store_loss_rates if s['rate'] > abnormal_threshold)
        
        all_materials = Material.objects.all()
        trial_count = all_materials.filter(is_trial=True).count()
        trial_ratio = (trial_count / all_materials.count() * 100) if all_materials.count() > 0 else 0
        
        prev_start = (datetime.strptime(start_date, '%Y-%m-%d') - timedelta(days=30)).strftime('%Y-%m-%d') if start_date else None
        prev_end = (datetime.strptime(end_date, '%Y-%m-%d') - timedelta(days=30)).strftime('%Y-%m-%d') if end_date else None
        
        prev_wastage = Wastage.objects.filter(store_id__in=store_ids)
        prev_stocktake = Stocktake.objects.filter(store_id__in=store_ids)
        if prev_start:
            prev_wastage = prev_wastage.filter(record_date__gte=prev_start, record_date__lte=prev_end)
            prev_stocktake = prev_stocktake.filter(record_date__gte=prev_start, record_date__lte=prev_end)
        prev_wastage = self.apply_trial_filter(prev_wastage, exclude_trial)
        prev_stocktake = self.apply_trial_filter(prev_stocktake, exclude_trial)
        
        prev_loss = (prev_wastage.aggregate(Sum('total_amount'))['total_amount__sum'] or 0) + abs(prev_stocktake.aggregate(Sum('diff_amount'))['diff_amount__sum'] or 0)
        prev_rate = (prev_loss / 100000 * 100) if 100000 > 0 else 0
        
        return Response({
            'code': 200,
            'message': 'success',
            'data': {
                'totalLossRate': round(loss_rate, 2),
                'totalLossAmount': float(total_loss_amount),
                'abnormalStoreCount': abnormal_count,
                'trialMaterialRatio': round(trial_ratio, 1),
                'comparedToLastPeriod': {
                    'lossRate': round(loss_rate - prev_rate, 2),
                    'lossAmount': round(float(total_loss_amount - prev_loss), 2)
                }
            }
        })

    @action(detail=False, methods=['get'])
    def trend(self, request):
        exclude_trial = request.query_params.get('exclude_trial', 'false').lower() == 'true'
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        period = request.query_params.get('period', 'day')
        store_ids = request.query_params.getlist('store_ids')
        
        user_stores = self.get_user_stores(request)
        if store_ids:
            stores = user_stores.filter(id__in=store_ids)
        else:
            stores = user_stores
        
        store_id_list = stores.values_list('id', flat=True)
        
        wastage_qs = Wastage.objects.filter(store_id__in=store_id_list)
        if start_date:
            wastage_qs = wastage_qs.filter(record_date__gte=start_date)
        if end_date:
            wastage_qs = wastage_qs.filter(record_date__lte=end_date)
        
        wastage_qs = self.apply_trial_filter(wastage_qs, exclude_trial)
        
        if period == 'week':
            grouped = wastage_qs.annotate(date=TruncWeek('record_date'))
        elif period == 'month':
            grouped = wastage_qs.annotate(date=TruncMonth('record_date'))
        else:
            grouped = wastage_qs.annotate(date=TruncDate('record_date'))
        
        trend_data = grouped.values('date').annotate(
            total_loss=Sum('total_amount')
        ).order_by('date')
        
        result = []
        for item in trend_data:
            rate = (float(item['total_loss'] or 0) / 10000 * 100) if 10000 > 0 else 0
            result.append({
                'date': item['date'].strftime('%Y-%m-%d') if item['date'] else None,
                'lossRate': round(rate, 2),
                'lossAmount': float(item['total_loss'] or 0)
            })
        
        return Response({
            'code': 200,
            'message': 'success',
            'data': result
        })

    @action(detail=False, methods=['get'])
    def store_ranking(self, request):
        exclude_trial = request.query_params.get('exclude_trial', 'false').lower() == 'true'
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        stores = self.get_user_stores(request)
        
        ranking_data = []
        for store in stores:
            wastage_qs = Wastage.objects.filter(store=store)
            stocktake_qs = Stocktake.objects.filter(store=store)
            
            if start_date:
                wastage_qs = wastage_qs.filter(record_date__gte=start_date)
                stocktake_qs = stocktake_qs.filter(record_date__gte=start_date)
            if end_date:
                wastage_qs = wastage_qs.filter(record_date__lte=end_date)
                stocktake_qs = stocktake_qs.filter(record_date__lte=end_date)
            
            wastage_qs = self.apply_trial_filter(wastage_qs, exclude_trial)
            stocktake_qs = self.apply_trial_filter(stocktake_qs, exclude_trial)
            
            total_wastage = wastage_qs.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            total_diff = stocktake_qs.aggregate(Sum('diff_amount'))['diff_amount__sum'] or 0
            total_loss = float(total_wastage) + abs(float(total_diff))
            
            has_trial = Wastage.objects.filter(store=store, material__is_trial=True).exists()
            
            loss_rate = (total_loss / 50000 * 100) if 50000 > 0 else 0
            
            ranking_data.append({
                'id': store.id,
                'name': store.name,
                'lossRate': round(loss_rate, 2),
                'lossAmount': round(total_loss, 2),
                'hasTrialMaterial': has_trial,
                'isAbnormal': loss_rate > 5.0
            })
        
        ranking_data.sort(key=lambda x: x['lossRate'], reverse=True)
        for i, item in enumerate(ranking_data):
            item['rank'] = i + 1
        
        return Response({
            'code': 200,
            'message': 'success',
            'data': ranking_data[:10]
        })

    @action(detail=False, methods=['get'])
    def material_ranking(self, request):
        exclude_trial = request.query_params.get('exclude_trial', 'false').lower() == 'true'
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        store_ids = self.get_user_stores(request).values_list('id', flat=True)
        
        wastage_qs = Wastage.objects.filter(store_id__in=store_ids)
        if start_date:
            wastage_qs = wastage_qs.filter(record_date__gte=start_date)
        if end_date:
            wastage_qs = wastage_qs.filter(record_date__lte=end_date)
        
        wastage_qs = self.apply_trial_filter(wastage_qs, exclude_trial)
        
        material_data = wastage_qs.values('material__id', 'material__name', 'material__is_trial').annotate(
            total_loss=Sum('total_amount')
        ).order_by('-total_loss')[:10]
        
        result = []
        for i, item in enumerate(material_data):
            result.append({
                'rank': i + 1,
                'id': item['material__id'],
                'name': item['material__name'],
                'lossAmount': float(item['total_loss'] or 0),
                'isTrial': item['material__is_trial']
            })
        
        return Response({
            'code': 200,
            'message': 'success',
            'data': result
        })


class LossDetailViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_user_stores(self, request):
        user = request.user
        if hasattr(user, 'profile') and user.profile:
            profile = user.profile
            if profile.role and profile.role.name == 'store_manager' and profile.store:
                return Store.objects.filter(id=profile.store.id)
            elif profile.role and profile.role.name == 'region_operator' and profile.region:
                return Store.objects.filter(region=profile.region)
        return Store.objects.filter(is_active=True)

    @action(detail=False, methods=['get'], url_path='list')
    def loss_list(self, request):
        exclude_trial = request.query_params.get('exclude_trial', 'false').lower() == 'true'
        store_id = request.query_params.get('store_id')
        material_id = request.query_params.get('material_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        loss_type = request.query_params.get('loss_type', 'all')
        
        store_ids = self.get_user_stores(request).values_list('id', flat=True)
        
        wastage_list = []
        stocktake_list = []
        
        if loss_type in ['all', 'wastage']:
            wastage_qs = Wastage.objects.filter(store_id__in=store_ids)
            if store_id:
                wastage_qs = wastage_qs.filter(store_id=store_id)
            if material_id:
                wastage_qs = wastage_qs.filter(material_id=material_id)
            if start_date:
                wastage_qs = wastage_qs.filter(record_date__gte=start_date)
            if end_date:
                wastage_qs = wastage_qs.filter(record_date__lte=end_date)
            if exclude_trial:
                wastage_qs = wastage_qs.filter(material__is_trial=False)
            
            for w in wastage_qs:
                wastage_list.append({
                    'id': f'w_{w.id}',
                    'lossType': 'wastage',
                    'storeName': w.store.name,
                    'materialName': w.material.name,
                    'materialCode': w.material.code,
                    'categoryName': w.material.category.name if w.material.category else '',
                    'quantity': float(w.quantity),
                    'unit': w.material.unit,
                    'unitPrice': float(w.unit_price),
                    'totalAmount': float(w.total_amount),
                    'reason': w.get_reason_display(),
                    'shift': w.get_shift_display(),
                    'recordDate': w.record_date.strftime('%Y-%m-%d'),
                    'isTrial': w.material.is_trial
                })
        
        if loss_type in ['all', 'stocktake']:
            stocktake_qs = Stocktake.objects.filter(store_id__in=store_ids)
            if store_id:
                stocktake_qs = stocktake_qs.filter(store_id=store_id)
            if material_id:
                stocktake_qs = stocktake_qs.filter(material_id=material_id)
            if start_date:
                stocktake_qs = stocktake_qs.filter(record_date__gte=start_date)
            if end_date:
                stocktake_qs = stocktake_qs.filter(record_date__lte=end_date)
            if exclude_trial:
                stocktake_qs = stocktake_qs.filter(material__is_trial=False)
            
            for s in stocktake_qs:
                stocktake_list.append({
                    'id': f's_{s.id}',
                    'lossType': 'stocktake_diff',
                    'storeName': s.store.name,
                    'materialName': s.material.name,
                    'materialCode': s.material.code,
                    'categoryName': s.material.category.name if s.material.category else '',
                    'quantity': float(abs(s.diff_quantity)),
                    'unit': s.material.unit,
                    'unitPrice': float(s.material.unit_price),
                    'totalAmount': float(abs(s.diff_amount)),
                    'reason': '盘点差异',
                    'shift': s.get_shift_display(),
                    'recordDate': s.record_date.strftime('%Y-%m-%d'),
                    'isTrial': s.material.is_trial
                })
        
        all_items = wastage_list + stocktake_list
        all_items.sort(key=lambda x: x['recordDate'], reverse=True)
        
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        return Response({
            'code': 200,
            'message': 'success',
            'data': {
                'count': len(all_items),
                'results': all_items[start:end]
            }
        })
