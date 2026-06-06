from celery import shared_task
from django.conf import settings
import os
import pandas as pd
import openpyxl
from datetime import datetime, timedelta
from reports.models import ImportTask, ReportTask
from operations.models import Wastage, Stocktake, Inventory, MaterialUse, Sale
from organization.models import Store
from materials.models import Material
from accounts.models import Staff, StaffShift
from analytics.models import LossAggregation
from django.db.models import Sum, Count, Avg
from django.contrib.auth.models import User
from accounts.models import UserProfile


SHIFT_MAP = {
    '早班': 'morning',
    '中班': 'afternoon',
    '晚班': 'evening',
    '全天': 'all',
    'morning': 'morning',
    'afternoon': 'afternoon',
    'evening': 'evening',
    'all': 'all',
}

REASON_MAP = {
    '过期': 'expired',
    '损坏': 'damaged',
    '变质': 'spoilage',
    '操作失误': 'operation',
    '其他': 'other',
    'expired': 'expired',
    'damaged': 'damaged',
    'spoilage': 'spoilage',
    'operation': 'operation',
    'other': 'other',
}


def safe_float(val, default=0.0):
    try:
        if pd.isna(val) or val is None or str(val).strip() == '':
            return default
        return float(val)
    except:
        return default


def safe_str(val, default=''):
    try:
        if pd.isna(val) or val is None:
            return default
        return str(val).strip()
    except:
        return default


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
        
        df = df.dropna(how='all')
        total_rows = len(df)
        success_rows = 0
        failed_rows = 0
        error_details = []
        
        for idx, row in df.iterrows():
            try:
                if task.data_type == 'wastage':
                    store_code = safe_str(row.iloc[0])
                    material_code = safe_str(row.iloc[1])
                    if not store_code or not material_code:
                        failed_rows += 1
                        error_details.append(f'第{idx+2}行: 门店编码或原料编码为空')
                        continue
                    
                    store = Store.objects.get(code=store_code)
                    material = Material.objects.get(code=material_code)
                    qty = safe_float(row.iloc[3])
                    price = safe_float(row.iloc[4])
                    total = qty * price
                    
                    reason_raw = safe_str(row.iloc[5]) if len(row) > 5 else 'other'
                    reason = REASON_MAP.get(reason_raw, 'other')
                    
                    shift_raw = safe_str(row.iloc[6]) if len(row) > 6 else 'all'
                    shift = SHIFT_MAP.get(shift_raw, 'all')
                    
                    record_date = pd.to_datetime(row.iloc[2]).date() if len(row) > 2 else datetime.now().date()
                    
                    Wastage.objects.create(
                        store=store,
                        material=material,
                        record_date=record_date,
                        quantity=qty,
                        unit_price=price,
                        total_amount=total,
                        reason=reason,
                        shift=shift
                    )
                    success_rows += 1
                
                elif task.data_type == 'stocktake':
                    store_code = safe_str(row.iloc[0])
                    material_code = safe_str(row.iloc[1])
                    if not store_code or not material_code:
                        failed_rows += 1
                        continue
                    
                    store = Store.objects.get(code=store_code)
                    material = Material.objects.get(code=material_code)
                    sys_qty = safe_float(row.iloc[3])
                    actual_qty = safe_float(row.iloc[4])
                    diff = actual_qty - sys_qty
                    unit_price = safe_float(row.iloc[5]) if len(row) > 5 else float(material.unit_price)
                    diff_amount = diff * unit_price
                    
                    shift_raw = safe_str(row.iloc[6]) if len(row) > 6 else 'all'
                    shift = SHIFT_MAP.get(shift_raw, 'all')
                    record_date = pd.to_datetime(row.iloc[2]).date() if len(row) > 2 else datetime.now().date()
                    
                    Stocktake.objects.create(
                        store=store,
                        material=material,
                        record_date=record_date,
                        system_quantity=sys_qty,
                        actual_quantity=actual_qty,
                        diff_quantity=diff,
                        diff_amount=diff_amount,
                        shift=shift
                    )
                    success_rows += 1
                
                elif task.data_type == 'inventory':
                    store_code = safe_str(row.iloc[0])
                    material_code = safe_str(row.iloc[1])
                    if not store_code or not material_code:
                        failed_rows += 1
                        continue
                    
                    store = Store.objects.get(code=store_code)
                    material = Material.objects.get(code=material_code)
                    qty = safe_float(row.iloc[3])
                    price = safe_float(row.iloc[4])
                    total = qty * price
                    batch_no = safe_str(row.iloc[5]) if len(row) > 5 else ''
                    record_date = pd.to_datetime(row.iloc[2]).date() if len(row) > 2 else datetime.now().date()
                    
                    Inventory.objects.create(
                        store=store,
                        material=material,
                        record_date=record_date,
                        quantity=qty,
                        unit_price=price,
                        total_amount=total,
                        batch_no=batch_no
                    )
                    success_rows += 1
                
                elif task.data_type == 'material_use':
                    store_code = safe_str(row.iloc[0])
                    material_code = safe_str(row.iloc[1])
                    if not store_code or not material_code:
                        failed_rows += 1
                        continue
                    
                    store = Store.objects.get(code=store_code)
                    material = Material.objects.get(code=material_code)
                    qty = safe_float(row.iloc[3])
                    
                    shift_raw = safe_str(row.iloc[4]) if len(row) > 4 else 'all'
                    shift = SHIFT_MAP.get(shift_raw, 'all')
                    record_date = pd.to_datetime(row.iloc[2]).date() if len(row) > 2 else datetime.now().date()
                    
                    MaterialUse.objects.create(
                        store=store,
                        material=material,
                        record_date=record_date,
                        quantity=qty,
                        shift=shift
                    )
                    success_rows += 1
                
                elif task.data_type == 'sale':
                    store_code = safe_str(row.iloc[0])
                    product_name = safe_str(row.iloc[1])
                    material_code = safe_str(row.iloc[2])
                    if not store_code:
                        failed_rows += 1
                        continue
                    
                    store = Store.objects.get(code=store_code)
                    material = None
                    if material_code:
                        try:
                            material = Material.objects.get(code=material_code)
                        except:
                            pass
                    
                    sale_qty = safe_float(row.iloc[4])
                    mat_consume = safe_float(row.iloc[5])
                    sale_amount = safe_float(row.iloc[6]) if len(row) > 6 else 0
                    
                    shift_raw = safe_str(row.iloc[7]) if len(row) > 7 else 'all'
                    shift = SHIFT_MAP.get(shift_raw, 'all')
                    sale_date = pd.to_datetime(row.iloc[3]).date() if len(row) > 3 else datetime.now().date()
                    
                    Sale.objects.create(
                        store=store,
                        product_name=product_name,
                        material=material,
                        sale_date=sale_date,
                        quantity=sale_qty,
                        material_consume=mat_consume,
                        sale_amount=sale_amount,
                        shift=shift
                    )
                    success_rows += 1
                
                elif task.data_type == 'staff_shift':
                    store_code = safe_str(row.iloc[0])
                    staff_name = safe_str(row.iloc[1])
                    if not store_code or not staff_name:
                        failed_rows += 1
                        continue
                    
                    store = Store.objects.get(code=store_code)
                    staff, _ = Staff.objects.get_or_create(
                        name=staff_name,
                        store=store,
                        defaults={'position': 'staff'}
                    )
                    
                    shift_type_raw = safe_str(row.iloc[2]) if len(row) > 2 else 'all'
                    shift_type = SHIFT_MAP.get(shift_type_raw, 'all')
                    shift_date = pd.to_datetime(row.iloc[3]).date() if len(row) > 3 else datetime.now().date()
                    start_time = safe_str(row.iloc[4], None) if len(row) > 4 else None
                    end_time = safe_str(row.iloc[5], None) if len(row) > 5 else None
                    
                    StaffShift.objects.create(
                        staff=staff,
                        store=store,
                        shift_type=shift_type,
                        shift_date=shift_date,
                        start_time=start_time,
                        end_time=end_time
                    )
                    success_rows += 1
            
            except Exception as e:
                failed_rows += 1
                error_details.append(f'第{idx+2}行: {str(e)}')
                continue
        
        task.status = 'completed'
        task.total_rows = total_rows
        task.success_rows = success_rows
        task.failed_rows = failed_rows
        task.error_log = '\n'.join(error_details[:10]) if error_details else ''
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
        task.error_log = str(e)
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
                    wastage_qs = Wastage.objects.filter(store=store, record_date=current)
                    if not includes_trial:
                        wastage_qs = wastage_qs.filter(material__is_trial=False)
                    
                    stocktake_qs = Stocktake.objects.filter(store=store, record_date=current)
                    if not includes_trial:
                        stocktake_qs = stocktake_qs.filter(material__is_trial=False)
                    
                    use_qs = MaterialUse.objects.filter(store=store, record_date=current)
                    if not includes_trial:
                        use_qs = use_qs.filter(material__is_trial=False)
                    
                    use_total = 0.0
                    for mu in use_qs.select_related('material'):
                        use_total += float(mu.quantity) * float(mu.material.unit_price)
                    
                    loss_amount = float(wastage_qs.aggregate(Sum('total_amount'))['total_amount__sum'] or 0)
                    diff_amount = float(stocktake_qs.aggregate(Sum('diff_amount'))['diff_amount__sum'] or 0)
                    total_loss = loss_amount + abs(diff_amount)
                    total_use = use_total or 5000.0
                    loss_rate = (total_loss / total_use * 100) if total_use > 0 else 0
                    
                    existing = LossAggregation.objects.filter(
                        store=store,
                        period_date=current,
                        period_type='day',
                        shift='all',
                        includes_trial=includes_trial,
                        material=None
                    ).first()
                    
                    if existing:
                        existing.loss_amount = round(total_loss, 2)
                        existing.total_use = round(total_use, 2)
                        existing.loss_rate = round(loss_rate, 4)
                        existing.save()
                    else:
                        LossAggregation.objects.create(
                            store=store,
                            period_date=current,
                            period_type='day',
                            shift='all',
                            includes_trial=includes_trial,
                            material=None,
                            loss_amount=round(total_loss, 2),
                            total_use=round(total_use, 2),
                            loss_rate=round(loss_rate, 4)
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
        user = task.user
        profile = UserProfile.objects.filter(user=user).first()
        exclude_trial = task.exclude_trial
        
        if profile and profile.role:
            role_name = profile.role.name
        else:
            role_name = 'admin'
        
        allowed_stores = None
        store_filter_desc = '全部门店'
        if role_name == 'store_manager' and profile.store:
            allowed_stores = [profile.store.id]
            store_filter_desc = profile.store.name
        elif role_name == 'region_operator' and profile.region:
            allowed_stores = list(Store.objects.filter(region=profile.region).values_list('id', flat=True))
            store_filter_desc = f'{profile.region.name} 区域门店'
        
        filters = task.filters or {}
        start_date = filters.get('start_date', '全部')
        end_date = filters.get('end_date', '全部')
        report_type = task.report_type
        
        wb = openpyxl.Workbook()
        
        info_sheet = wb.active
        info_sheet.title = '报表说明'
        info_sheet['A1'] = '连锁茶饮原料损耗看板 - 报表'
        info_sheet['A1'].font = openpyxl.styles.Font(size=14, bold=True)
        info_sheet['A3'] = f'报表类型: {task.get_report_type_display()}'
        info_sheet['A4'] = f'生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}'
        info_sheet['A5'] = f'操作人: {user.username}'
        info_sheet['A6'] = f'数据范围: {store_filter_desc}'
        info_sheet['A7'] = f'日期范围: {start_date} ~ {end_date}'
        info_sheet['A8'] = f'是否排除试营原料: {"是" if exclude_trial else "否"}'
        info_sheet['A9'] = f'备注: 排除试营原料后的数据不包含新品试营期间的原料损耗'
        
        ws = None
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
                    includes_trial=not exclude_trial,
                    shift='all',
                    material=None
                )
                if start_date and start_date != '全部':
                    agg_qs = agg_qs.filter(period_date__gte=start_date)
                if end_date and end_date != '全部':
                    agg_qs = agg_qs.filter(period_date__lte=end_date)
                
                total_loss = float(agg_qs.aggregate(Sum('loss_amount'))['loss_amount__sum'] or 0)
                total_use = float(agg_qs.aggregate(Sum('total_use'))['total_use__sum'] or 1)
                loss_rate = (total_loss / total_use * 100) if total_use > 0 else 0
                is_abnormal = '异常' if loss_rate > settings.DEFAULT_ABNORMAL_THRESHOLD else '正常'
                
                ws.append([store.name, round(total_loss, 2), round(total_use, 2), round(loss_rate, 2), is_abnormal])
        
        elif report_type == 'loss_detail':
            ws = wb.create_sheet('损耗明细')
            ws.append(['日期', '门店', '原料编码', '原料名称', '分类', '数量', '单价', '金额(元)', '原因', '班次', '是否试营'])
            
            wastage_qs = Wastage.objects.all()
            if allowed_stores:
                wastage_qs = wastage_qs.filter(store_id__in=allowed_stores)
            if start_date and start_date != '全部':
                wastage_qs = wastage_qs.filter(record_date__gte=start_date)
            if end_date and end_date != '全部':
                wastage_qs = wastage_qs.filter(record_date__lte=end_date)
            if exclude_trial:
                wastage_qs = wastage_qs.filter(material__is_trial=False)
            
            for w in wastage_qs.select_related('store', 'material', 'material__category').order_by('-record_date')[:5000]:
                ws.append([
                    w.record_date.strftime('%Y-%m-%d'),
                    w.store.name,
                    w.material.code,
                    w.material.name,
                    w.material.category.name if w.material.category else '',
                    float(w.quantity),
                    float(w.unit_price),
                    float(w.total_amount),
                    w.get_reason_display(),
                    w.get_shift_display(),
                    '是' if w.material.is_trial else '否'
                ])
        
        elif report_type == 'store_ranking':
            ws = wb.create_sheet('门店排行')
            ws.append(['排名', '门店编码', '门店名称', '区域', '损耗金额(元)', '损耗率(%)', '异常状态', '门店等级'])
            
            store_query = Store.objects.all()
            if allowed_stores:
                store_query = store_query.filter(id__in=allowed_stores)
            
            store_data = []
            for store in store_query:
                agg_qs = LossAggregation.objects.filter(
                    store=store,
                    period_type='day',
                    includes_trial=not exclude_trial,
                    shift='all',
                    material=None
                )
                if start_date and start_date != '全部':
                    agg_qs = agg_qs.filter(period_date__gte=start_date)
                if end_date and end_date != '全部':
                    agg_qs = agg_qs.filter(period_date__lte=end_date)
                
                total_loss = float(agg_qs.aggregate(Sum('loss_amount'))['loss_amount__sum'] or 0)
                total_use = float(agg_qs.aggregate(Sum('total_use'))['total_use__sum'] or 1)
                loss_rate = (total_loss / total_use * 100) if total_use > 0 else 0
                is_abnormal = '异常' if loss_rate > settings.DEFAULT_ABNORMAL_THRESHOLD else '正常'
                
                if loss_rate > 10:
                    grade = 'D - 严重'
                elif loss_rate > 7:
                    grade = 'C - 较差'
                elif loss_rate > 5:
                    grade = 'B - 一般'
                else:
                    grade = 'A - 优秀'
                
                store_data.append({
                    'code': store.code,
                    'name': store.name,
                    'region': store.region.name if store.region else '',
                    'loss': total_loss,
                    'rate': loss_rate,
                    'abnormal': is_abnormal,
                    'grade': grade
                })
            
            store_data.sort(key=lambda x: x['rate'], reverse=True)
            for i, s in enumerate(store_data):
                ws.append([i + 1, s['code'], s['name'], s['region'], 
                          round(s['loss'], 2), round(s['rate'], 2), s['abnormal'], s['grade']])
        
        elif report_type == 'material_analysis':
            ws = wb.create_sheet('原料分析')
            ws.append(['排名', '原料编码', '原料名称', '分类', '损耗金额(元)', '损耗占比(%)', '损耗次数', '平均单价(元)', '是否试营原料'])
            
            wastage_qs = Wastage.objects.all()
            if allowed_stores:
                wastage_qs = wastage_qs.filter(store_id__in=allowed_stores)
            if start_date and start_date != '全部':
                wastage_qs = wastage_qs.filter(record_date__gte=start_date)
            if end_date and end_date != '全部':
                wastage_qs = wastage_qs.filter(record_date__lte=end_date)
            if exclude_trial:
                wastage_qs = wastage_qs.filter(material__is_trial=False)
            
            material_data = wastage_qs.values(
                'material__code', 'material__name', 'material__category__name', 'material__is_trial'
            ).annotate(
                total_loss=Sum('total_amount'),
                loss_count=Count('id'),
                avg_price=Avg('unit_price')
            ).order_by('-total_loss')[:50]
            
            total_all = float(wastage_qs.aggregate(Sum('total_amount'))['total_amount__sum'] or 1)
            
            for i, item in enumerate(material_data):
                loss_val = float(item['total_loss'] or 0)
                ratio = (loss_val / total_all * 100) if total_all > 0 else 0
                ws.append([
                    i + 1,
                    item['material__code'],
                    item['material__name'],
                    item['material__category__name'] or '',
                    round(loss_val, 2),
                    round(ratio, 2),
                    item['loss_count'],
                    round(float(item['avg_price'] or 0), 2),
                    '是' if item['material__is_trial'] else '否'
                ])
        
        else:
            ws = wb.create_sheet('报表内容')
            ws.append(['报表类型', report_type])
            ws.append(['状态', '待完善'])
        
        for sheet in wb.worksheets:
            for col in sheet.columns:
                max_length = 0
                column = col[0].column_letter
                for cell in col:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 30)
                sheet.column_dimensions[column].width = adjusted_width
        
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
        task.error_log = str(e)
        task.save()
        return {'status': 'failed', 'error': str(e)}
