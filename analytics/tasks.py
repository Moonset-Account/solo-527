from celery import shared_task
from django.db.models import Sum
from datetime import datetime, timedelta
from operations.models import Wastage, Stocktake, MaterialUse
from organization.models import Store
from materials.models import Material
from analytics.models import LossAggregation
from reports.models import ImportTask, ReportTask
import pandas as pd
import os
from django.conf import settings
from django.contrib.auth.models import User
import io

@shared_task(bind=True)
def process_import_task(self, task_id):
    try:
        task = ImportTask.objects.get(task_id=task_id)
        task.status = 'processing'
        task.save()
        
        file_path = os.path.join(settings.MEDIA_ROOT, 'imports', task_id)
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f'文件不存在: {file_path}')
        
        if task.file_name.endswith('.xlsx'):
            df = pd.read_excel(file_path)
        else:
            df = pd.read_csv(file_path)
        
        store_map = {s.code: s for s in Store.objects.all()}
        material_map = {m.code: m for m in Material.objects.all()}
        
        success_count = 0
        failed_count = 0
        errors = []
        
        for idx, row in df.iterrows():
            try:
                store_code = str(row.get('门店编码', row.get('store_code', ''))).strip()
                material_code = str(row.get('原料编码', row.get('material_code', ''))).strip()
                
                if store_code not in store_map or material_code not in material_map:
                    failed_count += 1
                    errors.append(f'行{idx+2}: 门店或原料编码不存在')
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
                
                if task.data_type == 'wastage':
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
                elif task.data_type == 'stocktake':
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
                
                success_count += 1
                self.update_state(state='PROGRESS', meta={
                    'current': idx + 1,
                    'total': len(df),
                    'success': success_count,
                    'failed': failed_count
                })
                
            except Exception as e:
                failed_count += 1
                errors.append(f'行{idx+2}: {str(e)}')
        
        task.status = 'completed'
        task.total_rows = len(df)
        task.success_rows = success_count
        task.failed_rows = failed_count
        task.error_log = '\n'.join(errors[:100])
        task.save()
        
        aggregate_loss_data.delay()
        
        return {'task_id': task_id, 'success': success_count, 'failed': failed_count}
        
    except Exception as e:
        if 'task' in locals():
            task.status = 'failed'
            task.error_log = str(e)
            task.save()
        raise


@shared_task
def aggregate_loss_data(period_type='day', start_date=None, end_date=None):
    try:
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).date()
        if not end_date:
            end_date = datetime.now().date()
        
        stores = Store.objects.filter(is_active=True)
        materials = Material.objects.all()
        
        current_date = start_date
        while current_date <= end_date:
            for store in stores:
                for material in materials:
                    for includes_trial in [True, False]:
                        wastage_qs = Wastage.objects.filter(
                            store=store,
                            material=material,
                            record_date=current_date
                        )
                        if not includes_trial:
                            wastage_qs = wastage_qs.filter(material__is_trial=False)
                        
                        stocktake_qs = Stocktake.objects.filter(
                            store=store,
                            material=material,
                            record_date=current_date
                        )
                        if not includes_trial:
                            stocktake_qs = stocktake_qs.filter(material__is_trial=False)
                        
                        use_qs = MaterialUse.objects.filter(
                            store=store,
                            material=material,
                            record_date=current_date
                        )
                        
                        total_wastage = float(wastage_qs.aggregate(Sum('total_amount'))['total_amount__sum'] or 0)
                        total_diff = abs(float(stocktake_qs.aggregate(Sum('diff_amount'))['diff_amount__sum'] or 0))
                        total_use = float(use_qs.aggregate(Sum('quantity'))['quantity__sum'] or 0) * 10
                        
                        total_loss = total_wastage + total_diff
                        loss_rate = (total_loss / total_use * 100) if total_use > 0 else 0
                        
                        LossAggregation.objects.update_or_create(
                            store=store,
                            material=material,
                            period_type=period_type,
                            period_date=current_date,
                            shift='all',
                            includes_trial=includes_trial,
                            defaults={
                                'total_use': total_use,
                                'total_wastage': total_wastage,
                                'total_stocktake_diff': total_diff,
                                'loss_rate': round(loss_rate, 4),
                                'loss_amount': round(total_loss, 2)
                            }
                        )
            
            current_date += timedelta(days=1)
        
        return f'Aggregated data from {start_date} to {end_date}'
    
    except Exception as e:
        return f'Error: {str(e)}'


@shared_task
def generate_report_task(task_id):
    try:
        task = ReportTask.objects.get(task_id=task_id)
        task.status = 'processing'
        task.save()
        
        filters = task.filters or {}
        report_type = filters.get('report_type', 'loss_summary')
        start_date = filters.get('start_date')
        end_date = filters.get('end_date')
        exclude_trial = filters.get('exclude_trial', False)
        
        user_stores = Store.objects.filter(is_active=True)
        store_id_list = user_stores.values_list('id', flat=True)
        
        output = io.BytesIO()
        writer = pd.ExcelWriter(output, engine='openpyxl')
        
        wastage_qs = Wastage.objects.filter(store_id__in=store_id_list)
        if start_date:
            wastage_qs = wastage_qs.filter(record_date__gte=start_date)
        if end_date:
            wastage_qs = wastage_qs.filter(record_date__lte=end_date)
        if exclude_trial:
            wastage_qs = wastage_qs.filter(material__is_trial=False)
        
        if report_type == 'loss_summary':
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
        
        elif report_type == 'loss_detail':
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
        
        info_df = pd.DataFrame([
            ['报表名称', task.get_report_type_display()],
            ['生成时间', datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
            ['统计范围', f'{start_date or "开始"} 至 {end_date or "至今"}'],
            ['试营原料', '已排除' if exclude_trial else '已包含'],
            ['生成人', task.user.username]
        ])
        info_df.to_excel(writer, sheet_name='报表说明', index=False, header=False)
        
        writer.close()
        
        file_name = f'{report_type}_{datetime.now().strftime("%Y%m%d%H%M%S")}.xlsx'
        file_dir = os.path.join(settings.MEDIA_ROOT, 'reports')
        os.makedirs(file_dir, exist_ok=True)
        file_path = os.path.join(file_dir, file_name)
        
        with open(file_path, 'wb') as f:
            f.write(output.getvalue())
        
        task.file_path = f'reports/{file_name}'
        task.status = 'completed'
        task.save()
        
        return {'task_id': task_id, 'file_name': file_name}
        
    except Exception as e:
        if 'task' in locals():
            task.status = 'failed'
            task.save()
        raise
