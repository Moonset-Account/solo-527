from celery import shared_task
from django.conf import settings
import os
import pandas as pd
from datetime import datetime, timedelta
from reports.models import ImportTask, ReportTask
from operations.models import Wastage, Stocktake, Inventory, MaterialUse, Sale
from organization.models import Store
from materials.models import Material
from accounts.models import Staff, StaffShift
from analytics.models import LossAggregation
from django.db.models import Sum
import io
import openpyxl


@shared_task(bind=True)
def process_import_task(self, task_id):
    task = ImportTask.objects.get(task_id=task_id)
    task.status = 'processing'
    task.save()
    
    try:
        file_path = os.path.join(settings.MEDIA_ROOT, 'imports', task_id)
        
        if task.data_type in ['wastage', 'stocktake', 'inventory', 'material_use', 'sale', 'staff_shift']:
            df = pd.read_excel(file_path)
        else:
            df = pd.read_csv(file_path)
        
        total_rows = len(df)
        success_rows = 0
        failed_rows = 0
        
        for _, row in df.iterrows():
            try:
                if task.data_type == 'wastage':
                    store = Store.objects.get(code=str(row.iloc[0]).strip())
                    material = Material.objects.get(code=str(row.iloc[1]).strip())
                    Wastage.objects.create(
                        store=store,
                        material=material,
                        record_date=pd.to_datetime(row.iloc[2]).date(),
                        quantity=float(row.iloc[3]),
                        unit_price=float(row.iloc[4]),
                        reason=str(row.iloc[5]) if len(row) > 5 else 'other',
                        shift=str(row.iloc[6]) if len(row) > 6 else 'day'
                    )
                elif task.data_type == 'stocktake':
                    store = Store.objects.get(code=str(row.iloc[0]).strip())
                    material = Material.objects.get(code=str(row.iloc[1]).strip())
                    sys_qty = float(row.iloc[3])
                    actual_qty = float(row.iloc[4])
                    diff = actual_qty - sys_qty
                    unit_price = float(row.iloc[5]) if len(row) > 5 else float(material.unit_price)
                    Stocktake.objects.create(
                        store=store,
                        material=material,
                        record_date=pd.to_datetime(row.iloc[2]).date(),
                        system_quantity=sys_qty,
                        actual_quantity=actual_qty,
                        diff_quantity=diff,
                        diff_amount=diff * unit_price,
                        shift=str(row.iloc[6]) if len(row) > 6 else 'day'
                    )
                elif task.data_type == 'inventory':
                    store = Store.objects.get(code=str(row.iloc[0]).strip())
                    material = Material.objects.get(code=str(row.iloc[1]).strip())
                    Inventory.objects.create(
                        store=store,
                        material=material,
                        record_date=pd.to_datetime(row.iloc[2]).date(),
                        quantity=float(row.iloc[3]),
                        unit_price=float(row.iloc[4]),
                        batch_number=str(row.iloc[5]) if len(row) > 5 else ''
                    )
                elif task.data_type == 'material_use':
                    store = Store.objects.get(code=str(row.iloc[0]).strip())
                    material = Material.objects.get(code=str(row.iloc[1]).strip())
                    MaterialUse.objects.create(
                        store=store,
                        material=material,
                        record_date=pd.to_datetime(row.iloc[2]).date(),
                        quantity=float(row.iloc[3]),
                        shift=str(row.iloc[4]) if len(row) > 4 else 'day'
                    )
                elif task.data_type == 'sale':
                    store = Store.objects.get(code=str(row.iloc[0]).strip())
                    material = Material.objects.get(code=str(row.iloc[2]).strip())
                    Sale.objects.create(
                        store=store,
                        product_name=str(row.iloc[1]),
                        material=material,
                        sale_date=pd.to_datetime(row.iloc[3]).date(),
                        sale_quantity=float(row.iloc[4]),
                        material_used=float(row.iloc[5]),
                        sale_amount=float(row.iloc[6]) if len(row) > 6 else 0,
                        shift=str(row.iloc[7]) if len(row) > 7 else 'day'
                    )
                elif task.data_type == 'staff_shift':
                    store = Store.objects.get(code=str(row.iloc[0]).strip())
                    staff_name = str(row.iloc[1]).strip()
                    staff, _ = Staff.objects.get_or_create(
                        name=staff_name,
                        store=store,
                        defaults={'position': 'staff'}
                    )
                    StaffShift.objects.create(
                        staff=staff,
                        shift_type=str(row.iloc[2]) if len(row) > 2 else 'day',
                        shift_date=pd.to_datetime(row.iloc[3]).date(),
                        start_time=str(row.iloc[4]) if len(row) > 4 else '09:00',
                        end_time=str(row.iloc[5]) if len(row) > 5 else '18:00'
                    )
                
                success_rows += 1
            except Exception as e:
                failed_rows += 1
                continue
        
        task.status = 'completed'
        task.total_rows = total_rows
        task.success_rows = success_rows
        task.failed_rows = failed_rows
        task.completed_at = datetime.now()
        task.save()
        
        try:
            if task.data_type in ['wastage', 'stocktake', 'material_use']:
                aggregate_loss_data.delay()
        except:
            pass
        
        return {'status': 'completed', 'success': success_rows, 'failed': failed_rows}
    
    except Exception as e:
        task.status = 'failed'
        task.error_message = str(e)
        task.save()
        return {'status': 'failed', 'error': str(e)}


@shared_task(bind=True)
def aggregate_loss_data(self, start_date=None, end_date=None):
    try:
        if not start_date:
            start_date = (datetime.now() - timedelta(days=settings.LOSS_AGGREGATION_DAYS)).date()
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        
        if not end_date:
            end_date = datetime.now().date()
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        stores = Store.objects.filter(is_active=True)
        materials_trial = [True, False]
        
        current = start_date
        while current <= end_date:
            for store in stores:
                for includes_trial in materials_trial:
                    wastage_qs = Wastage.objects.filter(
                        store=store,
                        record_date=current
                    )
                    if not includes_trial:
                        wastage_qs = wastage_qs.filter(material__is_trial=False)
                    
                    stocktake_qs = Stocktake.objects.filter(
                        store=store,
                        record_date=current
                    )
                    if not includes_trial:
                        stocktake_qs = stocktake_qs.filter(material__is_trial=False)
                    
                    use_qs = MaterialUse.objects.filter(
                        store=store,
                        record_date=current
                    )
                    if not includes_trial:
                        use_qs = use_qs.filter(material__is_trial=False)
                    
                    use_total = 0
                    for mu in use_qs.select_related('material'):
                        use_total += float(mu.quantity) * float(mu.material.unit_price)
                    
                    loss_amount = float(wastage_qs.aggregate(Sum('total_amount'))['total_amount__sum'] or 0)
                    diff_amount = float(stocktake_qs.aggregate(Sum('diff_amount'))['diff_amount__sum'] or 0)
                    total_loss = loss_amount + abs(diff_amount)
                    total_use = use_total or 5000
                    
                    LossAggregation.objects.update_or_create(
                        store=store,
                        period_date=current,
                        period_type='day',
                        includes_trial=includes_trial,
                        defaults={
                            'loss_amount': total_loss,
                            'total_use': total_use,
                            'loss_rate': (total_loss / total_use * 100) if total_use > 0 else 0
                        }
                    )
            
            if current.weekday() == 0:
                week_start = current
                week_end = current + timedelta(days=6)
                for store in stores:
                    for includes_trial in materials_trial:
                        day_aggs = LossAggregation.objects.filter(
                            store=store,
                            period_date__gte=week_start,
                            period_date__lte=week_end,
                            period_type='day',
                            includes_trial=includes_trial
                        )
                        loss_sum = 0
                        use_sum = 0
                        for agg in day_aggs:
                            loss_sum += float(agg.loss_amount)
                            use_sum += float(agg.total_use)
                        LossAggregation.objects.update_or_create(
                            store=store,
                            period_date=week_start,
                            period_type='week',
                            includes_trial=includes_trial,
                            defaults={
                                'loss_amount': loss_sum,
                                'total_use': use_sum,
                                'loss_rate': (loss_sum / use_sum * 100) if use_sum > 0 else 0
                            }
                        )
            
            if current.day == 1:
                month_start = current
                for store in stores:
                    for includes_trial in materials_trial:
                        day_aggs = LossAggregation.objects.filter(
                            store=store,
                            period_date__year=month_start.year,
                            period_date__month=month_start.month,
                            period_type='day',
                            includes_trial=includes_trial
                        )
                        loss_sum = 0
                        use_sum = 0
                        for agg in day_aggs:
                            loss_sum += float(agg.loss_amount)
                            use_sum += float(agg.total_use)
                        LossAggregation.objects.update_or_create(
                            store=store,
                            period_date=month_start,
                            period_type='month',
                            includes_trial=includes_trial,
                            defaults={
                                'loss_amount': loss_sum,
                                'total_use': use_sum,
                                'loss_rate': (loss_sum / use_sum * 100) if use_sum > 0 else 0
                            }
                        )
            
            current += timedelta(days=1)
        
        return {'status': 'completed', 'date_range': f'{start_date} to {end_date}'}
    
    except Exception as e:
        return {'status': 'failed', 'error': str(e)}


@shared_task(bind=True)
def generate_report_task(self, task_id):
    task = ReportTask.objects.get(task_id=task_id)
    task.status = 'processing'
    task.save()
    
    try:
        from django.contrib.auth.models import User
        from accounts.models import UserProfile
        
        user = task.user
        profile = UserProfile.objects.filter(user=user).first()
        exclude_trial = task.exclude_trial
        
        if profile and profile.role:
            role_name = profile.role.name
        else:
            role_name = 'admin'
        
        allowed_stores = None
        if role_name == 'store_manager' and profile.store:
            allowed_stores = [profile.store.id]
        elif role_name == 'region_operator' and profile.region:
            allowed_stores = list(Store.objects.filter(region=profile.region).values_list('id', flat=True))
        
        filters = task.filters or {}
        start_date = filters.get('start_date')
        end_date = filters.get('end_date')
        report_type = task.report_type
        
        wb = openpyxl.Workbook()
        
        info_sheet = wb.active
        info_sheet.title = '报表信息'
        info_sheet['A1'] = '连锁茶饮原料损耗看板'
        info_sheet['A2'] = f'报表类型: {task.get_report_type_display()}'
        info_sheet['A3'] = f'生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}'
        info_sheet['A4'] = f'操作人: {user.username}'
        info_sheet['A5'] = f'是否排除试营原料: {"是" if exclude_trial else "否"}'
        info_sheet['A6'] = f'数据范围: {start_date or "全部"} ~ {end_date or "全部"}'
        
        wb.remove(info_sheet)
        
        if report_type == 'loss_summary':
            ws = wb.create_sheet('损耗汇总')
            ws.append(['门店', '损耗金额(元)', '总领用(元)', '损耗率(%)', '异常状态'])
            
            store_query = Store.objects.all()
            if allowed_stores:
                store_query = store_query.filter(id__in=allowed_stores)
            
            for store in store_query:
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
                total_use = float(agg_qs.aggregate(Sum('total_use'))['total_use__sum'] or 1)
                loss_rate = (total_loss / total_use * 100) if total_use > 0 else 0
                is_abnormal = '异常' if loss_rate > settings.DEFAULT_ABNORMAL_THRESHOLD else '正常'
                
                ws.append([store.name, round(total_loss, 2), round(total_use, 2), round(loss_rate, 2), is_abnormal])
        
        elif report_type == 'store_comparison':
            ws = wb.create_sheet('门店对比')
            ws.append(['门店', '损耗金额(元)', '损耗率(%)', '环比变化(%)', '异常状态'])
            
            store_query = Store.objects.all()
            if allowed_stores:
                store_query = store_query.filter(id__in=allowed_stores)
            
            for store in store_query:
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
                total_use = float(agg_qs.aggregate(Sum('total_use'))['total_use__sum'] or 1)
                loss_rate = (total_loss / total_use * 100) if total_use > 0 else 0
                is_abnormal = '异常' if loss_rate > settings.DEFAULT_ABNORMAL_THRESHOLD else '正常'
                
                ws.append([store.name, round(total_loss, 2), round(loss_rate, 2), 0, is_abnormal])
        
        elif report_type == 'material_ranking':
            ws = wb.create_sheet('原料排行')
            ws.append(['排名', '原料编码', '原料名称', '损耗金额(元)', '是否试营原料'])
            
            wastage_qs = Wastage.objects.all()
            if allowed_stores:
                wastage_qs = wastage_qs.filter(store_id__in=allowed_stores)
            if start_date:
                wastage_qs = wastage_qs.filter(record_date__gte=start_date)
            if end_date:
                wastage_qs = wastage_qs.filter(record_date__lte=end_date)
            if exclude_trial:
                wastage_qs = wastage_qs.filter(material__is_trial=False)
            
            material_data = wastage_qs.values('material__code', 'material__name', 'material__is_trial').annotate(
                total_loss=Sum('total_amount')
            ).order_by('-total_loss')[:50]
            
            for i, item in enumerate(material_data):
                ws.append([
                    i + 1,
                    item['material__code'],
                    item['material__name'],
                    round(float(item['total_loss'] or 0), 2),
                    '是' if item['material__is_trial'] else '否'
                ])
        
        elif report_type == 'abnormal_details':
            ws = wb.create_sheet('异常明细')
            ws.append(['日期', '门店', '原料', '数量', '金额', '原因', '班次'])
            
            wastage_qs = Wastage.objects.all()
            if allowed_stores:
                wastage_qs = wastage_qs.filter(store_id__in=allowed_stores)
            if start_date:
                wastage_qs = wastage_qs.filter(record_date__gte=start_date)
            if end_date:
                wastage_qs = wastage_qs.filter(record_date__lte=end_date)
            if exclude_trial:
                wastage_qs = wastage_qs.filter(material__is_trial=False)
            
            for w in wastage_qs.select_related('store', 'material')[:1000]:
                ws.append([
                    w.record_date.strftime('%Y-%m-%d'),
                    w.store.name,
                    w.material.name,
                    float(w.quantity),
                    float(w.total_amount),
                    w.get_reason_display(),
                    w.get_shift_display()
                ])
        
        os.makedirs(os.path.join(settings.MEDIA_ROOT, 'reports'), exist_ok=True)
        file_name = f'{report_type}_{datetime.now().strftime("%Y%m%d%H%M%S")}.xlsx'
        file_path = os.path.join('reports', file_name)
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        wb.save(full_path)
        
        task.status = 'completed'
        task.file_path = file_path
        task.completed_at = datetime.now()
        task.save()
        
        return {'status': 'completed', 'file_path': file_path}
    
    except Exception as e:
        task.status = 'failed'
        task.error_message = str(e)
        task.save()
        return {'status': 'failed', 'error': str(e)}
