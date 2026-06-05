import csv
from django.http import HttpResponse
from datetime import datetime


def export_as_csv(queryset, fields, field_labels=None, filename=None):
    if filename is None:
        filename = f'export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    writer = csv.writer(response)
    headers = [field_labels.get(f, f) for f in fields] if field_labels else list(fields)
    writer.writerow(headers)
    for obj in queryset:
        row = []
        for field in fields:
            val = getattr(obj, field, '')
            if callable(val):
                val = val()
            if hasattr(val, 'all'):
                val = ', '.join(str(v) for v in val.all())
            row.append(str(val) if val is not None else '')
        writer.writerow(row)
    return response


def validate_and_export(queryset, fields, required_fields=None, **kwargs):
    if required_fields:
        for obj in queryset:
            for f in required_fields:
                val = getattr(obj, f, None)
                if val is None or val == '':
                    raise ValueError(f'对象 {obj.pk} 缺少必填字段: {f}')
    return export_as_csv(queryset, fields, **kwargs)
