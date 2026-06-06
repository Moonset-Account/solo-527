from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Avg, Count, Q, F
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.db import DatabaseError
from datetime import datetime, timedelta
from .models import LossAggregation, CaliberConfig
from operations.models import Wastage, Stocktake, Inventory, MaterialUse, Sale
from organization.models import Store
from materials.models import Material, MaterialCategory
from reports.models import ImportTask, ReportTask
from django.contrib.auth.models import User
import uuid
import json
from django.http import HttpResponse
import pandas as pd
import io
from django.conf import settings
import os

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
        try:
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
            total_loss_amount = float(total_wastage_amount) + abs(float(total_diff_amount))
            
            total_use_qs = MaterialUse.objects.filter(store_id__in=store_ids)
            if start_date:
                total_use_qs = total_use_qs.filter(record_date__gte=start_date)
            if end_date:
                total_use_qs = total_use_qs.filter(record_date__lte=end_date)
            
            total_use_amount = float(total_use_qs.aggregate(Sum('quantity'))['quantity__sum'] or 1000) * 10
            if total_use_amount == 0:
                total_use_amount = 100000
            loss_rate = (total_loss_amount / total_use_amount * 100) if total_use_amount > 0 else 0
            
            store_loss_rates = []
            for store in stores:
                store_wastage = wastage_qs.filter(store=store).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
                store_diff = stocktake_qs.filter(store=store).aggregate(Sum('diff_amount'))['diff_amount__sum'] or 0
                store_loss = float(store_wastage) + abs(float(store_diff))
                store_use = float(MaterialUse.objects.filter(store=store).aggregate(Sum('quantity'))['quantity__sum'] or 100) * 10
                if store_use == 0:
                    store_use = 10000
                store_rate = (store_loss / store_use * 100) if store_use > 0 else 0
                store_loss_rates.append({'store_id': store.id, 'rate': store_rate})
            
            abnormal_threshold = float(CaliberConfig.objects.filter(key='abnormal_threshold').first().value if CaliberConfig.objects.filter(key='abnormal_threshold').exists() else 5.0)
            abnormal_count = sum(1 for s in store_loss_rates if s['rate'] > abnormal_threshold)
            
            all_materials = Material.objects.all()
            trial_count = all_materials.filter(is_trial=True).count()
            trial_ratio = (trial_count / all_materials.count() * 100) if all_materials.count() > 0 else 0
            
            try:
                prev_start = (datetime.strptime(start_date, '%Y-%m-%d') - timedelta(days=30)).strftime('%Y-%m-%d') if start_date else None
                prev_end = (datetime.strptime(end_date, '%Y-%m-%d') - timedelta(days=30)).strftime('%Y-%m-%d') if end_date else None
            except:
                prev_start = None
                prev_end = None
            
            prev_wastage = Wastage.objects.filter(store_id__in=store_ids)
            prev_stocktake = Stocktake.objects.filter(store_id__in=store_ids)
            if prev_start and prev_end:
                prev_wastage = prev_wastage.filter(record_date__gte=prev_start, record_date__lte=prev_end)
                prev_stocktake = prev_stocktake.filter(record_date__gte=prev_start, record_date__lte=prev_end)
            prev_wastage = self.apply_trial_filter(prev_wastage, exclude_trial)
            prev_stocktake = self.apply_trial_filter(prev_stocktake, exclude_trial)
            
            prev_loss = float(prev_wastage.aggregate(Sum('total_amount'))['total_amount__sum'] or 0) + abs(float(prev_stocktake.aggregate(Sum('diff_amount'))['diff_amount__sum'] or 0))
            prev_rate = (prev_loss / 100000 * 100) if 100000 > 0 else 0
            
            return Response({
                'code': 200,
                'message': 'success',
                'data': {
                    'totalLossRate': round(loss_rate, 2),
                    'totalLossAmount': round(total_loss_amount, 2),
                    'abnormalStoreCount': abnormal_count,
                    'trialMaterialRatio': round(trial_ratio, 1),
                    'comparedToLastPeriod': {
                        'lossRate': round(loss_rate - prev_rate, 2),
                        'lossAmount': round(total_loss_amount - prev_loss, 2)
                    }
                }
            })
        except DatabaseError as e:
            return Response({
                'code': 500,
                'message': f'数据库错误: {str(e)}',
                'data': None
            }, status=500)
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'系统错误: {str(e)}',
                'data': None
            }, status=500)

    @action(detail=False, methods=['get'])
    def trend(self, request):
        try:
            exclude_trial = request.query_params.get('exclude_trial', 'false').lower() == 'true'
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            period = request.query_params.get('period', 'day')
            store_ids_param = request.query_params.getlist('store_ids')
            
            user_stores = self.get_user_stores(request)
            if store_ids_param:
                stores = user_stores.filter(id__in=store_ids_param)
            else:
                stores = user_stores
            
            store_id_list = stores.values_list('id', flat=True)
            
            wastage_qs = Wastage.objects.filter(store_id__in=store_id_list)
            if start_date:
                wastage_qs = wastage_qs.filter(record_date__gte=start_date)
            if end_date:
                wastage_qs = wastage_qs.filter(record_date__lte=end_date)
            
            wastage_qs = self.apply_trial_filter(wastage_qs, exclude_trial)
            
            daily_data = {}
            for w in wastage_qs:
                record_date = w.record_date
                if period == 'week':
                    record_date = record_date - timedelta(days=record_date.weekday())
                elif period == 'month':
                    record_date = record_date.replace(day=1)
                
                date_key = record_date.strftime('%Y-%m-%d')
                if date_key not in daily_data:
                    daily_data[date_key] = {'date': record_date, 'total_loss': 0}
                daily_data[date_key]['total_loss'] += float(w.total_amount)
            
            result = []
            for date_key in sorted(daily_data.keys()):
                item = daily_data[date_key]
                loss_val = float(item['total_loss'])
                rate = (loss_val / 10000 * 100) if 10000 > 0 else 0
                result.append({
                    'date': item['date'].strftime('%Y-%m-%d'),
                    'lossRate': round(rate, 2),
                    'lossAmount': round(loss_val, 2)
                })
            
            return Response({
                'code': 200,
                'message': 'success',
                'data': result
            })
        except DatabaseError as e:
            return Response({
                'code': 500,
                'message': f'数据库错误: {str(e)}',
                'data': []
            }, status=500)
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'系统错误: {str(e)}',
                'data': []
            }, status=500)

    @action(detail=False, methods=['get'])
    def store_ranking(self, request):
        try:
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
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'系统错误: {str(e)}',
                'data': []
            }, status=500)

    @action(detail=False, methods=['get'])
    def material_ranking(self, request):
        try:
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
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'系统错误: {str(e)}',
                'data': []
            }, status=500)

    @action(detail=False, methods=['get'])
    def stores(self, request):
        try:
            stores = self.get_user_stores(request)
            data = [{'id': s.id, 'name': s.name, 'code': s.code} for s in stores]
            return Response({
                'code': 200,
                'message': 'success',
                'data': data
            })
        except Exception as e:
            return Response({
                'code': 500,
                'message': str(e),
                'data': []
            }, status=500)

    @action(detail=False, methods=['get'])
    def materials(self, request):
        try:
            category_id = request.query_params.get('category_id')
            materials = Material.objects.all()
            if category_id:
                materials = materials.filter(category_id=category_id)
            data = [{'id': m.id, 'name': m.name, 'code': m.code, 'is_trial': m.is_trial} for m in materials]
            return Response({
                'code': 200,
                'message': 'success',
                'data': data
            })
        except Exception as e:
            return Response({
                'code': 500,
                'message': str(e),
                'data': []
            }, status=500)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        try:
            categories = MaterialCategory.objects.all()
            data = [{'id': c.id, 'name': c.name} for c in categories]
            return Response({
                'code': 200,
                'message': 'success',
                'data': data
            })
        except Exception as e:
            return Response({
                'code': 500,
                'message': str(e),
                'data': []
            }, status=500)


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
        try:
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
                
                for w in wastage_qs.select_related('store', 'material', 'material__category'):
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
                
                for s in stocktake_qs.select_related('store', 'material', 'material__category'):
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
            end_idx = start + page_size
            
            return Response({
                'code': 200,
                'message': 'success',
                'data': {
                    'count': len(all_items),
                    'results': all_items[start:end_idx]
                }
            })
        except Exception as e:
            return Response({
                'code': 500,
                'message': str(e),
                'data': {'count': 0, 'results': []}
            }, status=500)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_data(request):
    try:
        if 'file' not in request.FILES:
            return Response({'code': 400, 'message': '请选择上传文件'}, status=400)
        
        uploaded_file = request.FILES['file']
        data_type = request.POST.get('data_type', 'wastage')
        
        task_id = str(uuid.uuid4())
        task = ImportTask.objects.create(
            task_id=task_id,
            user=request.user,
            file_name=uploaded_file.name,
            data_type=data_type,
            status='processing'
        )
        
        file_path = os.path.join(settings.MEDIA_ROOT, 'imports', task_id)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)
        
        success_count = 0
        failed_count = 0
        error_messages = []
        
        try:
            if uploaded_file.name.endswith('.xlsx'):
                df = pd.read_excel(file_path)
            else:
                df = pd.read_csv(file_path)
            
            store_map = {s.code: s for s in Store.objects.all()}
            material_map = {m.code: m for m in Material.objects.all()}
            
            for idx, row in df.iterrows():
                try:
                    store_code = str(row.get('门店编码', row.get('store_code', ''))).strip()
                    material_code = str(row.get('原料编码', row.get('material_code', ''))).strip()
                    
                    if store_code not in store_map:
                        failed_count += 1
                        error_messages.append(f'行{idx+2}: 门店编码 {store_code} 不存在')
                        continue
                    if material_code not in material_map:
                        failed_count += 1
                        error_messages.append(f'行{idx+2}: 原料编码 {material_code} 不存在')
                        continue
                    
                    store = store_map[store_code]
                    material = material_map[material_code]
                    
                    record_date = row.get('日期', row.get('record_date', datetime.now().date()))
                    if isinstance(record_date, str):
                        record_date = datetime.strptime(record_date, '%Y-%m-%d').date()
                    
                    quantity = float(row.get('数量', row.get('quantity', 0)))
                    unit_price = float(row.get('单价', row.get('unit_price', material.unit_price)))
                    reason = str(row.get('原因', row.get('reason', 'other'))).strip()
                    shift = str(row.get('班次', row.get('shift', 'all'))).strip()
                    
                    if data_type == 'wastage':
                        Wastage.objects.create(
                            store=store,
                            material=material,
                            quantity=quantity,
                            unit_price=unit_price,
                            total_amount=quantity * unit_price,
                            reason=reason if reason in dict(Wastage.WASTAGE_REASON) else 'other',
                            shift=shift if shift in dict(Wastage.SHIFT_CHOICES) else 'all',
                            record_date=record_date
                        )
                    elif data_type == 'stocktake':
                        sys_qty = float(row.get('系统库存', row.get('system_quantity', 0)))
                        act_qty = float(row.get('实际库存', row.get('actual_quantity', 0)))
                        Stocktake.objects.create(
                            store=store,
                            material=material,
                            system_quantity=sys_qty,
                            actual_quantity=act_qty,
                            diff_quantity=sys_qty - act_qty,
                            diff_amount=(sys_qty - act_qty) * unit_price,
                            shift=shift if shift in dict(Stocktake.SHIFT_CHOICES) else 'all',
                            record_date=record_date
                        )
                    elif data_type == 'inventory':
                        Inventory.objects.create(
                            store=store,
                            material=material,
                            quantity=quantity,
                            unit_price=unit_price,
                            total_amount=quantity * unit_price,
                            record_date=record_date,
                            batch_no=str(row.get('批次号', row.get('batch_no', '')))
                        )
                    elif data_type == 'material_use':
                        MaterialUse.objects.create(
                            store=store,
                            material=material,
                            quantity=quantity,
                            shift=shift if shift in dict(MaterialUse.SHIFT_CHOICES) else 'all',
                            record_date=record_date
                        )
                    
                    success_count += 1
                except Exception as row_e:
                    failed_count += 1
                    error_messages.append(f'行{idx+2}: {str(row_e)}')
            
            task.status = 'completed'
            task.total_rows = len(df)
            task.success_rows = success_count
            task.failed_rows = failed_count
            task.error_log = '\n'.join(error_messages[:100])
            task.save()
            
            return Response({
                'code': 200,
                'message': '导入完成',
                'data': {
                    'task_id': task_id,
                    'total': len(df),
                    'success': success_count,
                    'failed': failed_count,
                    'errors': error_messages[:10]
                }
            })
            
        except Exception as e:
            task.status = 'failed'
            task.error_log = str(e)
            task.save()
            return Response({'code': 500, 'message': f'导入失败: {str(e)}'}, status=500)
    
    except Exception as e:
        return Response({'code': 500, 'message': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def import_tasks(request):
    tasks = ImportTask.objects.filter(user=request.user).order_by('-created_at')[:20]
    data = [{
        'id': t.id,
        'task_id': t.task_id,
        'file_name': t.file_name,
        'data_type': t.get_data_type_display(),
        'status': t.status,
        'status_text': t.get_status_display(),
        'total_rows': t.total_rows,
        'success_rows': t.success_rows,
        'failed_rows': t.failed_rows,
        'created_at': t.created_at.strftime('%Y-%m-%d %H:%M')
    } for t in tasks]
    return Response({'code': 200, 'message': 'success', 'data': data})


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def caliber_config(request):
    if request.method == 'GET':
        configs = CaliberConfig.objects.all()
        data = {c.key: {'value': c.value, 'description': c.description} for c in configs}
        if 'abnormal_threshold' not in data:
            data['abnormal_threshold'] = {'value': '5.0', 'description': '异常门店损耗率阈值(%)'}
        if 'loss_rate_formula' not in data:
            data['loss_rate_formula'] = {'value': '(报损金额+|盘点差异|)/总领用金额*100%', 'description': '损耗率计算公式'}
        return Response({'code': 200, 'message': 'success', 'data': data})
    
    elif request.method == 'POST':
        try:
            config_data = request.data
            for key, config in config_data.items():
                value = config.get('value', '')
                description = config.get('description', '')
                CaliberConfig.objects.update_or_create(
                    key=key,
                    defaults={'value': str(value), 'description': description}
                )
            return Response({'code': 200, 'message': '配置保存成功'})
        except Exception as e:
            return Response({'code': 500, 'message': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_report(request):
    try:
        report_type = request.data.get('report_type', 'loss_summary')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        exclude_trial = request.data.get('exclude_trial', False)
        store_ids = request.data.get('store_ids', [])
        
        task_id = str(uuid.uuid4())
        task = ReportTask.objects.create(
            task_id=task_id,
            user=request.user,
            report_type=report_type,
            filters=request.data,
            exclude_trial=exclude_trial,
            status='completed'
        )
        
        user_stores = Store.objects.filter(is_active=True)
        if store_ids:
            user_stores = user_stores.filter(id__in=store_ids)
        store_id_list = user_stores.values_list('id', flat=True)
        
        output = io.BytesIO()
        writer = pd.ExcelWriter(output, engine='openpyxl')
        
        if report_type == 'loss_summary':
            wastage_qs = Wastage.objects.filter(store_id__in=store_id_list)
            if start_date:
                wastage_qs = wastage_qs.filter(record_date__gte=start_date)
            if end_date:
                wastage_qs = wastage_qs.filter(record_date__lte=end_date)
            if exclude_trial:
                wastage_qs = wastage_qs.filter(material__is_trial=False)
            
            data = []
            for store in user_stores:
                store_wastage = wastage_qs.filter(store=store)
                total_amount = float(store_wastage.aggregate(Sum('total_amount'))['total_amount__sum'] or 0)
                data.append({
                    '门店编码': store.code,
                    '门店名称': store.name,
                    '报损次数': store_wastage.count(),
                    '总损耗金额': total_amount,
                    '备注': '已排除试营原料' if exclude_trial else '包含试营原料'
                })
            
            df = pd.DataFrame(data)
            df.to_excel(writer, sheet_name='损耗汇总', index=False)
            
            info_df = pd.DataFrame([
                ['报表名称', '损耗汇总报表'],
                ['生成时间', datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
                ['统计范围', f'{start_date or "开始"} 至 {end_date or "至今"}'],
                ['试营原料', '已排除' if exclude_trial else '已包含'],
                ['生成人', request.user.username]
            ])
            info_df.to_excel(writer, sheet_name='报表说明', index=False, header=False)
        
        elif report_type == 'loss_detail':
            wastage_qs = Wastage.objects.filter(store_id__in=store_id_list)
            if start_date:
                wastage_qs = wastage_qs.filter(record_date__gte=start_date)
            if end_date:
                wastage_qs = wastage_qs.filter(record_date__lte=end_date)
            if exclude_trial:
                wastage_qs = wastage_qs.filter(material__is_trial=False)
            
            data = []
            for w in wastage_qs.select_related('store', 'material'):
                data.append({
                    '日期': w.record_date.strftime('%Y-%m-%d'),
                    '门店': w.store.name,
                    '原料': w.material.name,
                    '数量': float(w.quantity),
                    '单位': w.material.unit,
                    '单价': float(w.unit_price),
                    '损耗金额': float(w.total_amount),
                    '原因': w.get_reason_display(),
                    '班次': w.get_shift_display(),
                    '是否试营': '是' if w.material.is_trial else '否'
                })
            
            df = pd.DataFrame(data)
            df.to_excel(writer, sheet_name='损耗明细', index=False)
        
        elif report_type == 'store_ranking':
            wastage_qs = Wastage.objects.filter(store_id__in=store_id_list)
            if start_date:
                wastage_qs = wastage_qs.filter(record_date__gte=start_date)
            if end_date:
                wastage_qs = wastage_qs.filter(record_date__lte=end_date)
            if exclude_trial:
                wastage_qs = wastage_qs.filter(material__is_trial=False)
            
            ranking_data = []
            for store in user_stores:
                store_wastage = wastage_qs.filter(store=store)
                total_amount = float(store_wastage.aggregate(Sum('total_amount'))['total_amount__sum'] or 0)
                ranking_data.append({
                    '门店编码': store.code,
                    '门店名称': store.name,
                    '总损耗金额': total_amount,
                    '损耗率(%)': round(total_amount / 50000 * 100, 2)
                })
            
            ranking_data.sort(key=lambda x: x['总损耗金额'], reverse=True)
            for i, item in enumerate(ranking_data):
                item['排名'] = i + 1
            
            df = pd.DataFrame(ranking_data)
            df = df[['排名', '门店编码', '门店名称', '总损耗金额', '损耗率(%)']]
            df.to_excel(writer, sheet_name='门店排行', index=False)
        
        elif report_type == 'material_analysis':
            wastage_qs = Wastage.objects.filter(store_id__in=store_id_list)
            if start_date:
                wastage_qs = wastage_qs.filter(record_date__gte=start_date)
            if end_date:
                wastage_qs = wastage_qs.filter(record_date__lte=end_date)
            if exclude_trial:
                wastage_qs = wastage_qs.filter(material__is_trial=False)
            
            material_data = wastage_qs.values('material__code', 'material__name', 'material__is_trial').annotate(
                total_qty=Sum('quantity'),
                total_amount=Sum('total_amount')
            ).order_by('-total_amount')
            
            data = []
            for item in material_data:
                data.append({
                    '原料编码': item['material__code'],
                    '原料名称': item['material__name'],
                    '损耗总量': float(item['total_qty'] or 0),
                    '损耗总金额': float(item['total_amount'] or 0),
                    '是否试营': '是' if item['material__is_trial'] else '否'
                })
            
            df = pd.DataFrame(data)
            df.to_excel(writer, sheet_name='原料分析', index=False)
        
        writer.close()
        
        file_name = f'{report_type}_{datetime.now().strftime("%Y%m%d%H%M%S")}.xlsx'
        file_dir = os.path.join(settings.MEDIA_ROOT, 'reports')
        os.makedirs(file_dir, exist_ok=True)
        file_path = os.path.join(file_dir, file_name)
        
        with open(file_path, 'wb') as f:
            f.write(output.getvalue())
        
        task.file_path = f'reports/{file_name}'
        task.save()
        
        return Response({
            'code': 200,
            'message': '报表生成成功',
            'data': {
                'task_id': task_id,
                'file_name': file_name,
                'download_url': f'/media/reports/{file_name}'
            }
        })
    
    except Exception as e:
        return Response({'code': 500, 'message': f'生成失败: {str(e)}'}, status=500)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def report_tasks(request):
    tasks = ReportTask.objects.filter(user=request.user).order_by('-created_at')[:20]
    data = [{
        'id': t.id,
        'task_id': t.task_id,
        'report_type': t.get_report_type_display(),
        'status': t.status,
        'status_text': t.get_status_display(),
        'exclude_trial': t.exclude_trial,
        'file_name': os.path.basename(t.file_path) if t.file_path else '',
        'download_url': f'/media/{t.file_path}' if t.file_path else '',
        'created_at': t.created_at.strftime('%Y-%m-%d %H:%M')
    } for t in tasks]
    return Response({'code': 200, 'message': 'success', 'data': data})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_loss_details(request):
    try:
        exclude_trial = request.GET.get('exclude_trial', 'false').lower() == 'true'
        store_id = request.GET.get('store_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        user_stores = Store.objects.filter(is_active=True)
        if hasattr(request.user, 'profile') and request.user.profile:
            profile = request.user.profile
            if profile.role and profile.role.name == 'store_manager' and profile.store:
                user_stores = Store.objects.filter(id=profile.store.id)
        
        store_id_list = user_stores.values_list('id', flat=True)
        if store_id:
            store_id_list = [int(store_id)]
        
        wastage_qs = Wastage.objects.filter(store_id__in=store_id_list)
        if start_date:
            wastage_qs = wastage_qs.filter(record_date__gte=start_date)
        if end_date:
            wastage_qs = wastage_qs.filter(record_date__lte=end_date)
        if exclude_trial:
            wastage_qs = wastage_qs.filter(material__is_trial=False)
        
        data = []
        for w in wastage_qs.select_related('store', 'material'):
            data.append({
                '日期': w.record_date.strftime('%Y-%m-%d'),
                '门店': w.store.name,
                '原料编码': w.material.code,
                '原料名称': w.material.name,
                '数量': float(w.quantity),
                '单位': w.material.unit,
                '单价': float(w.unit_price),
                '损耗金额': float(w.total_amount),
                '原因': w.get_reason_display(),
                '班次': w.get_shift_display(),
                '是否试营原料': '是' if w.material.is_trial else '否'
            })
        
        output = io.BytesIO()
        df = pd.DataFrame(data)
        df.to_excel(output, sheet_name='损耗明细', index=False)
        
        file_name = f'损耗明细_{datetime.now().strftime("%Y%m%d%H%M%S")}.xlsx'
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        return response
    
    except Exception as e:
        return Response({'code': 500, 'message': str(e)}, status=500)
