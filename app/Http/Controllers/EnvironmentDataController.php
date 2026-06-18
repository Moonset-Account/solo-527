<?php

namespace App\Http\Controllers;

use App\Models\EnvironmentData;
use App\Models\Greenhouse;
use App\Models\EnvironmentAlert;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class EnvironmentDataController extends Controller
{
    public function index(Request $request)
    {
        $query = EnvironmentData::with(['greenhouse', 'sensor']);

        if ($greenhouseId = $request->input('greenhouse_id')) {
            $query->where('greenhouse_id', $greenhouseId);
        }

        if ($request->filled('is_anomaly')) {
            $query->where('is_anomaly', $request->boolean('is_anomaly'));
        }

        if ($anomalyType = $request->input('anomaly_type')) {
            $query->where('anomaly_type', $anomalyType);
        }

        if ($startDate = $request->input('start_date')) {
            $query->whereDate('recorded_at', '>=', $startDate);
        }

        if ($endDate = $request->input('end_date')) {
            $query->whereDate('recorded_at', '<=', $endDate);
        }

        if ($minTemp = $request->input('min_temperature')) {
            $query->where('temperature', '>=', $minTemp);
        }

        if ($maxTemp = $request->input('max_temperature')) {
            $query->where('temperature', '<=', $maxTemp);
        }

        $query->orderBy($request->input('sort_by', 'recorded_at'), $request->input('sort_direction', 'desc'));

        $environmentData = $query->paginate($request->input('per_page', 15))->withQueryString();

        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);

        return Inertia::render('EnvironmentData/Index', [
            'environmentData' => $environmentData,
            'greenhouses' => $greenhouses,
            'filters' => $request->only([
                'greenhouse_id', 'is_anomaly', 'anomaly_type',
                'start_date', 'end_date', 'min_temperature', 'max_temperature',
            ]),
        ]);
    }

    public function show(EnvironmentData $environmentData)
    {
        $environmentData->load(['greenhouse', 'sensor']);

        return Inertia::render('EnvironmentData/Show', [
            'environmentData' => $environmentData,
        ]);
    }

    public function dashboard(Request $request)
    {
        $greenhouseId = $request->input('greenhouse_id');
        $startDate = $request->input('start_date', Carbon::now()->subDays(7)->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $query = EnvironmentData::query();

        if ($greenhouseId) {
            $query->where('greenhouse_id', $greenhouseId);
        }

        $query->whereBetween('recorded_at', [
            Carbon::parse($startDate)->startOfDay(),
            Carbon::parse($endDate)->endOfDay(),
        ]);

        $stats = [
            'avg_temperature' => (clone $query)->avg('temperature'),
            'avg_humidity' => (clone $query)->avg('humidity'),
            'avg_soil_moisture' => (clone $query)->avg('soil_moisture'),
            'avg_light_intensity' => (clone $query)->avg('light_intensity'),
            'avg_co2_level' => (clone $query)->avg('co2_level'),
            'avg_ph_value' => (clone $query)->avg('ph_value'),
            'anomaly_count' => (clone $query)->where('is_anomaly', true)->count(),
            'total_records' => (clone $query)->count(),
        ];

        $trendData = (clone $query)
            ->selectRaw('DATE(recorded_at) as date,
                AVG(temperature) as avg_temperature,
                AVG(humidity) as avg_humidity,
                AVG(soil_moisture) as avg_soil_moisture')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);

        return Inertia::render('EnvironmentData/Dashboard', [
            'stats' => $stats,
            'trend_data' => $trendData,
            'greenhouses' => $greenhouses,
            'filters' => compact('greenhouseId', 'startDate', 'endDate'),
        ]);
    }

    public function alerts(Request $request)
    {
        $query = EnvironmentAlert::with(['greenhouse', 'sensor']);

        if ($greenhouseId = $request->input('greenhouse_id')) {
            $query->where('greenhouse_id', $greenhouseId);
        }

        if ($severity = $request->input('severity')) {
            $query->where('severity', $severity);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $query->orderBy($request->input('sort_by', 'created_at'), $request->input('sort_direction', 'desc'));

        $alerts = $query->paginate($request->input('per_page', 15))->withQueryString();

        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);

        return Inertia::render('EnvironmentData/Alerts', [
            'alerts' => $alerts,
            'greenhouses' => $greenhouses,
            'filters' => $request->only(['greenhouse_id', 'severity', 'status']),
        ]);
    }

    public function export(Request $request)
    {
        $query = EnvironmentData::with(['greenhouse', 'sensor']);

        if ($greenhouseId = $request->input('greenhouse_id')) {
            $query->where('greenhouse_id', $greenhouseId);
        }

        if ($request->filled('is_anomaly')) {
            $query->where('is_anomaly', $request->boolean('is_anomaly'));
        }

        if ($startDate = $request->input('start_date')) {
            $query->whereDate('recorded_at', '>=', $startDate);
        }

        if ($endDate = $request->input('end_date')) {
            $query->whereDate('recorded_at', '<=', $endDate);
        }

        $data = $query->orderBy('recorded_at', 'desc')->get();

        return Excel::download(new class($data) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings
        {
            protected $data;

            public function __construct($data)
            {
                $this->data = $data;
            }

            public function collection()
            {
                return $this->data->map(function ($item) {
                    return [
                        '大棚' => $item->greenhouse?->name ?? '-',
                        '传感器' => $item->sensor?->name ?? '-',
                        '温度(°C)' => $item->temperature,
                        '湿度(%)' => $item->humidity,
                        '土壤湿度(%)' => $item->soil_moisture,
                        '光照强度(lux)' => $item->light_intensity,
                        'CO2浓度(ppm)' => $item->co2_level,
                        'pH值' => $item->ph_value,
                        '是否异常' => $item->is_anomaly ? '是' : '否',
                        '异常类型' => $item->anomaly_type ?? '-',
                        '记录时间' => $item->recorded_at?->format('Y-m-d H:i:s'),
                    ];
                });
            }

            public function headings(): array
            {
                return [
                    '大棚',
                    '传感器',
                    '温度(°C)',
                    '湿度(%)',
                    '土壤湿度(%)',
                    '光照强度(lux)',
                    'CO2浓度(ppm)',
                    'pH值',
                    '是否异常',
                    '异常类型',
                    '记录时间',
                ];
            }
        }, '环境数据_' . Carbon::now()->format('YmdHis') . '.xlsx');
    }
}
