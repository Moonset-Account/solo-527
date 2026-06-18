<?php

namespace App\Exports;

use App\Models\EnvironmentData;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class EnvironmentDataExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    protected $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function query(): Builder
    {
        $query = EnvironmentData::query()->with('greenhouse');

        if (!empty($this->filters['greenhouse_id'])) {
            $query->where('greenhouse_id', $this->filters['greenhouse_id']);
        }

        if (!empty($this->filters['start_date'])) {
            $query->whereDate('recorded_at', '>=', $this->filters['start_date']);
        }

        if (!empty($this->filters['end_date'])) {
            $query->whereDate('recorded_at', '<=', $this->filters['end_date']);
        }

        if (isset($this->filters['is_anomaly'])) {
            $query->where('is_anomaly', $this->filters['is_anomaly']);
        }

        return $query->orderBy('recorded_at', 'desc');
    }

    public function headings(): array
    {
        return [
            '编号',
            '大棚',
            '温度(°C)',
            '湿度(%)',
            '土壤水分(%)',
            '光照(lux)',
            'CO2(ppm)',
            'PH值',
            '是否异常',
            '记录时间',
        ];
    }

    /**
     * @param EnvironmentData $row
     */
    public function map($row): array
    {
        return [
            $row->id,
            $row->greenhouse?->name ?? '-',
            $row->temperature,
            $row->humidity,
            $row->soil_moisture,
            $row->light_intensity,
            $row->co2_level,
            $row->ph_value,
            $row->is_anomaly ? '是' : '否',
            $row->recorded_at?->format('Y-m-d H:i:s'),
        ];
    }
}
