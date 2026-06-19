import io
import openpyxl
import pandas as pd
from django.http import HttpResponse
from django.utils import timezone


def export_to_excel(data, filename, sheet_name='Sheet1'):
    output = io.BytesIO()
    df = pd.DataFrame(data)
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name=sheet_name, index=False)
    output.seek(0)

    response = HttpResponse(
        output,
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}_{timezone.now().strftime("%Y%m%d%H%M%S")}.xlsx"'
    return response


def generate_excel_response(queryset, fields, filename):
    data = list(queryset.values(*fields))
    return export_to_excel(data, filename)
