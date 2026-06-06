from rest_framework import viewsets, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Avg, Count, Q, F
from django.db import DatabaseError
from datetime import datetime, timedelta
from .models import LossAggregation, CaliberConfig
from operations.models import Wastage, Stocktake, Inventory, MaterialUse, Sale
from organization.models import Store, Region
from materials.models import Material, MaterialCategory
from reports.models import ImportTask, ReportTask
from accounts.models import Staff, StaffShift
from django.contrib.auth.models import User
import uuid
import json
from django.http import HttpResponse, FileResponse
import pandas as pd
import io
from django.conf import settings
import os
from analytics.tasks import (
    process_import_task as async_process_import,
    generate_report_task as async_generate_report,
    aggregate_loss_data as async_aggregate_loss
)


def get_user_permission_stores(request):
    user = request.user
    if not hasattr(user, 'profile') or not user.profile:
        return Store.objects.filter(is_active=True)
    
    profile = user.profile
    role_name = profile.role.name if profile.role else None
    
    if role_name == 'store_manager' and profile.store:
        return Store.objects.filter(id=profile.store.id)
    elif role_name == 'region_operator' and profile.region:
        return Store.objects.filter(region=profile.region)
    return Store.objects.filter(is_active=True)


def get_abnormal_threshold():
    try:
        cfg = CaliberConfig.objects.filter(key='abnormal_threshold').first()
        return float(cfg.value) if cfg else settings.DEFAULT_ABNORMAL_THRESHOLD
    except:
        return settings.DEFAULT_ABNORMAL_THRESHOLD


class DashboardViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_user_stores(self, request):
        return get_user_permission_stores(request)

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
            
            use_agg = LossAggregation.objects.filter(
                store_id__in=store_ids,
                period_type='day',
                includes_trial=not exclude_trial
            )
            if start_date:
                use_agg = use_agg.filter(period_date__gte=start_date)
            if end_date:
                use_agg = use_agg.filter(period_date__lte=end_date)
            
            agg_sum = use_agg.aggregate(
                total_loss=Sum('loss_amount'),
                total_use=Sum('total_use')
            )
            total_loss_amount = float(agg_sum['total_loss'] or 0)
            total_use_amount = float(agg_sum['total_use'] or 1)
            loss_rate = (total_loss_amount / total_use_amount * 100) if total_use_amount > 0 else 0
            
            abnormal_threshold = get_abnormal_threshold()
            store_loss_rates = []
            for store in stores:
                store_agg = use_agg.filter(store=store)
                store_loss = float(store_agg.aggregate(Sum('loss_amount'))['loss_amount__sum'] or 0)
                store_use = float(store_agg.aggregate(Sum('total_use'))['total_use__sum'] or 1)
                store_rate = (store_loss / store_use * 100) if store_use > 0 else 0
                store_loss_rates.append({'store_id': store.id, 'rate': store_rate})
            
            abnormal_count = sum(1 for s in store_loss_rates if s['rate'] > abnormal_threshold)
            
            all_materials = Material.objects.all()
            trial_count = all_materials.filter(is_trial=True).count()
            trial_ratio = (trial_count / all_materials.count() * 100) if all_materials.count() > 0 else 0
            
            try:
                if start_date and end_date:
                    s = datetime.strptime(start_date, '%Y-%m-%d')
                    e = datetime.strptime(end_date, '%Y-%m-%d')
                    days = (e - s).days
                    prev_s = (s - timedelta(days=days)).strftime('%Y-%m-%d')
                    prev_e = (e - timedelta(days=days)).strftime('%Y-%m-%d')
                else:
                    prev_s = prev_e = None
            except:
                prev_s = prev_e = None
            
            prev_agg = LossAggregation.objects.filter(
                store_id__in=store_ids,
                period_type='day',
                includes_trial=not exclude_trial
            )
            if prev_s and prev_e:
                prev_agg = prev_agg.filter(period_date__gte=prev_s, period_date__lte=prev_e)
            
            prev_loss = float(prev_agg.aggregate(Sum('loss_amount'))['loss_amount__sum'] or 0)
            prev_use = float(prev_agg.aggregate(Sum('total_use'))['total_use__sum'] or 1)
            prev_rate = (prev_loss / prev_use * 100) if prev_use > 0 else 0
            
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
            
            agg_qs = LossAggregation.objects.filter(
                store_id__in=store_id_list,
                includes_trial=not exclude_trial
            )
            if start_date:
                agg_qs = agg_qs.filter(period_date__gte=start_date)
            if end_date:
                agg_qs = agg_qs.filter(period_date__lte=end_date)
            
            if period == 'week':
                agg_qs = agg_qs.filter(period_type='week')
            elif period == 'month':
                agg_qs = agg_qs.filter(period_type='month')
            else:
                agg_qs = agg_qs.filter(period_type='day')
            
            daily_data = {}
            for agg in agg_qs:
                period_date = agg.period_date
                date_key = period_date.strftime('%Y-%m-%d')
                if date_key not in daily_data:
                    daily_data[date_key] = {'date': period_date, 'loss_rate': 0, 'loss_amount': 0, 'use': 0}
                daily_data[date_key]['loss_amount'] += float(agg.loss_amount)
                daily_data[date_key]['use'] += float(agg.total_use)
            
            result = []
            for date_key in sorted(daily_data.keys()):
                item = daily_data[date_key]
                use_val = item['use'] or 1
                rate = (item['loss_amount'] / use_val * 100) if use_val > 0 else 0
                result.append({
                    'date': item['date'].strftime('%Y-%m-%d'),
                    'lossRate': round(rate, 2),
                    'lossAmount': round(item['loss_amount'], 2)
                })
            
            if not result:
                wastage_qs = Wastage.objects.filter(store_id__in=store_id_list)
                if start_date:
                    wastage_qs = wastage_qs.filter(record_date__gte=start_date)
                if end_date:
                    wastage_qs = wastage_qs.filter(record_date__lte=end_date)
                wastage_qs = self.apply_trial_filter(wastage_qs, exclude_trial)
                
                daily_fallback = {}
                for w in wastage_qs:
                    rd = w.record_date
                    if period == 'week':
                        rd = rd - timedelta(days=rd.weekday())
                    elif period == 'month':
                        rd = rd.replace(day=1)
                    dk = rd.strftime('%Y-%m-%d')
                    if dk not in daily_fallback:
                        daily_fallback[dk] = {'date': rd, 'loss': 0}
                    daily_fallback[dk]['loss'] += float(w.total_amount)
                
                for dk in sorted(daily_fallback.keys()):
                    item = daily_fallback[dk]
                    result.append({
                        'date': item['date'].strftime('%Y-%m-%d'),
                        'lossRate': round(item['loss'] / 10000 * 100, 2),
                        'lossAmount': round(item['loss'], 2)
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
    def store_ranking(self, request):
        try:
            exclude_trial = request.query_params.get('exclude_trial', 'false').lower() == 'true'
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            stores = self.get_user_stores(request)
            abnormal_threshold = get_abnormal_threshold()
            
            ranking_data = []
            for store in stores:
                agg_qs = LossAggregation.objects.filter(
                    store=store,
                    period_type='day',
                    includes_trial=not exclude_trial
                )
                if start_date:
                    agg_qs = agg_qs.filter(period_date__gte=start_date)
                if end_date:
                    agg_qs = agg_qs.filter(period_date__lte=end_date)
                
                total_loss = float(agg_qs.aggregate(Sum('loss_amount'))['loss_amount__sum'] or 0)
                total_use = float(agg_qs.aggregate(Sum('total_use'))['total_use__sum'] or 50000)
                loss_rate = (total_loss / total_use * 100) if total_use > 0 else 0
                
                has_trial = Wastage.objects.filter(store=store, material__is_trial=True).exists()
                
                ranking_data.append({
                    'id': store.id,
                    'name': store.name,
                    'lossRate': round(loss_rate, 2),
                    'lossAmount': round(total_loss, 2),
                    'hasTrialMaterial': has_trial,
                    'isAbnormal': loss_rate > abnormal_threshold
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
            exclude_trial = request.query_params.get('exclude_trial', 'true').lower() == 'true'
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            store_ids = self.get_user_stores(request).values_list('id', flat=True)
            
            wastage_qs = Wastage.objects.filter(store_id__in=store_ids)
            if start_date:
                wastage_qs = wastage_qs.filter(record_date__gte=start_date)
            if end_date:
                wastage_qs = wastage_qs.filter(record_date__lte=end_date)
            
            if exclude_trial:
                wastage_qs = wastage_qs.filter(material__is_trial=False)
            
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
            return Response({'code': 200, 'message': 'success', 'data': data})
        except Exception as e:
            return Response({'code': 500, 'message': str(e), 'data': []}, status=500)

    @action(detail=False, methods=['get'])
    def materials(self, request):
        try:
            category_id = request.query_params.get('category_id')
            materials = Material.objects.all()
            if category_id:
                materials = materials.filter(category_id=category_id)
            data = [{'id': m.id, 'name': m.name, 'code': m.code, 'is_trial': m.is_trial} for m in materials]
            return Response({'code': 200, 'message': 'success', 'data': data})
        except Exception as e:
            return Response({'code': 500, 'message': str(e), 'data': []}, status=500)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        try:
            categories = MaterialCategory.objects.all()
            data = [{'id': c.id, 'name': c.name} for c in categories]
            return Response({'code': 200, 'message': 'success', 'data': data})
        except Exception as e:
            return Response({'code': 500, 'message': str(e), 'data': []}, status=500)


class LossDetailViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_user_stores(self, request):
        return get_user_permission_stores(request)

    @action(detail=False, methods=['get'], url_path='list')
    def loss_list(self, request):
        try:
            exclude_trial = request.query_params.get('exclude_trial', 'false').lower() == 'true'
            store_id = request.query_params.get('store_id')
            material_id = request.query_params.get('material_id')
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            loss_type = request.query_params.get('loss_type', 'all')
            
            allowed_store_ids = self.get_user_stores(request).values_list('id', flat=True)
            
            wastage_list = []
            stocktake_list = []
            
            if loss_type in ['all', 'wastage']:
                wastage_qs = Wastage.objects.filter(store_id__in=allowed_store_ids)
                if store_id and int(store_id) in allowed_store_ids:
                    wastage_qs = wastage_qs.filter(store_id=store_id)
                if material_id:
                    wastage_qs = wastage_qs.filter(material_id=material_id)
                if start_date:
                    wastage_qs = wastage_qs.filter(record_date__gte=start_date)
                if end_date:
                    wastage_qs = wastage_qs.filter(record_date__lte=end_date)
                if exclude_trial:
                    wastage_qs = wastage_qs.filter(material__is_trial=False)
                
                for w in wastage_qs.select_related('store', 'material', 'material__category').order_by('-record_date')[:500]:
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
                stocktake_qs = Stocktake.objects.filter(store_id__in=allowed_store_ids)
                if store_id and int(store_id) in allowed_store_ids:
                    stocktake_qs = stocktake_qs.filter(store_id=store_id)
                if material_id:
                    stocktake_qs = stocktake_qs.filter(material_id=material_id)
                if start_date:
                    stocktake_qs = stocktake_qs.filter(record_date__gte=start_date)
                if end_date:
                    stocktake_qs = stocktake_qs.filter(record_date__lte=end_date)
                if exclude_trial:
                    stocktake_qs = stocktake_qs.filter(material__is_trial=False)
                
                for s in stocktake_qs.select_related('store', 'material', 'material__category').order_by('-record_date')[:500]:
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
        if not request.user.has_perm('reports.add_importtask'):
            if hasattr(request.user, 'profile') and request.user.profile:
                if request.user.profile.role.name != 'admin':
                    return Response({'code': 403, 'message': '无权限执行此操作'}, status=403)
        
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
            status='pending'
        )
        
        file_path = os.path.join(settings.MEDIA_ROOT, 'imports', task_id)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)
        
        task.status = 'processing'
        task.save()
        
        async_process_import.delay(task_id)
        
        return Response({
            'code': 200,
            'message': '导入任务已提交，后台处理中',
            'data': {
                'task_id': task_id,
                'status': 'processing',
                'file_name': uploaded_file.name
            }
        })
    
    except Exception as e:
        return Response({'code': 500, 'message': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def import_tasks(request):
    tasks = ImportTask.objects.filter(user=request.user).order_by('-created_at')[:50]
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


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def import_template(request):
    data_type = request.GET.get('type', 'wastage')
    
    templates = {
        'wastage': ['门店编码', '原料编码', '日期', '数量', '单价', '原因', '班次'],
        'stocktake': ['门店编码', '原料编码', '日期', '系统库存', '实际库存', '单价', '班次'],
        'inventory': ['门店编码', '原料编码', '日期', '数量', '单价', '批次号'],
        'material_use': ['门店编码', '原料编码', '日期', '数量', '班次'],
        'sale': ['门店编码', '产品名称', '原料编码', '销售日期', '销售数量', '原料消耗', '销售金额', '班次'],
        'staff_shift': ['门店编码', '员工姓名', '班次类型', '班次日期', '开始时间', '结束时间']
    }
    
    headers = templates.get(data_type, templates['wastage'])
    output = io.BytesIO()
    df = pd.DataFrame(columns=headers)
    sample_row = {h: '示例' + h for h in headers}
    df = pd.concat([df, pd.DataFrame([sample_row])], ignore_index=True)
    df.to_excel(output, sheet_name='导入模板', index=False)
    
    file_name = f'import_template_{data_type}.xlsx'
    response = HttpResponse(
        output.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="{file_name}"'
    return response


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def caliber_config(request):
    if request.method == 'GET':
        configs = CaliberConfig.objects.all()
        data = {c.key: {'value': c.value, 'description': c.description} for c in configs}
        if 'abnormal_threshold' not in data:
            data['abnormal_threshold'] = {'value': str(settings.DEFAULT_ABNORMAL_THRESHOLD), 'description': '异常门店损耗率阈值(%)'}
        if 'loss_rate_formula' not in data:
            data['loss_rate_formula'] = {'value': '(报损金额+|盘点差异|)/总领用金额*100%', 'description': '损耗率计算公式'}
        return Response({'code': 200, 'message': 'success', 'data': data})
    
    elif request.method == 'POST':
        try:
            if hasattr(request.user, 'profile') and request.user.profile:
                if request.user.profile.role and request.user.profile.role.name != 'admin':
                    return Response({'code': 403, 'message': '无权限修改配置'}, status=403)
            
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
        
        task_id = str(uuid.uuid4())
        task = ReportTask.objects.create(
            task_id=task_id,
            user=request.user,
            report_type=report_type,
            filters=request.data,
            exclude_trial=exclude_trial,
            status='processing'
        )
        
        async_generate_report.delay(task_id)
        
        return Response({
            'code': 200,
            'message': '报表任务已提交，后台生成中',
            'data': {
                'task_id': task_id,
                'status': 'processing'
            }
        })
    
    except Exception as e:
        return Response({'code': 500, 'message': f'提交失败: {str(e)}'}, status=500)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def report_tasks(request):
    tasks = ReportTask.objects.filter(user=request.user).order_by('-created_at')[:50]
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
        
        allowed_stores = get_user_permission_stores(request)
        store_id_list = allowed_stores.values_list('id', flat=True)
        
        if store_id and int(store_id) not in store_id_list:
            return Response({'code': 403, 'message': '无权访问该门店数据'}, status=403)
        
        wastage_qs = Wastage.objects.filter(store_id__in=store_id_list)
        if store_id:
            wastage_qs = wastage_qs.filter(store_id=store_id)
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


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def trigger_aggregation(request):
    try:
        if hasattr(request.user, 'profile') and request.user.profile:
            if request.user.profile.role and request.user.profile.role.name != 'admin':
                return Response({'code': 403, 'message': '无权限'}, status=403)
        
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        async_aggregate_loss.delay(start_date=start_date, end_date=end_date)
        
        return Response({
            'code': 200,
            'message': '聚合任务已提交'
        })
    except Exception as e:
        return Response({'code': 500, 'message': str(e)}, status=500)
