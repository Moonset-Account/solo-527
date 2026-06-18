<?php

namespace App\Http\Controllers;

use App\Models\EnvironmentAlert;
use App\Models\EnvironmentData;
use App\Models\Greenhouse;
use App\Models\Order;
use App\Models\SortingTask;
use App\Models\SubsidyVoucher;
use App\Models\MachineryAppointment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $greenhouseCount = Greenhouse::count();
        $todayOrders = Order::whereDate('created_at', Carbon::today())->count();
        $activeAlerts = EnvironmentAlert::where('status', 'active')->count();
        $sortingProgress = $this->getSortingProgress();

        $environmentTrend = $this->getEnvironmentTrend();
        $latestAlerts = EnvironmentAlert::with('greenhouse')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $pendingSubsidyVouchers = SubsidyVoucher::where('status', 'pending')->count();
        $pendingMachineryAppointments = MachineryAppointment::where('status', 'pending')->count();

        $priorityItems = [
            [
                'type' => 'environment_data',
                'title' => '环境数据异常',
                'count' => EnvironmentData::where('is_anomaly', true)
                    ->whereDate('recorded_at', Carbon::today())
                    ->count(),
                'url' => route('environment-data.index'),
            ],
            [
                'type' => 'subsidy_voucher',
                'title' => '待审批补贴凭证',
                'count' => $pendingSubsidyVouchers,
                'url' => route('subsidy-vouchers.index', ['status' => 'pending']),
            ],
            [
                'type' => 'machinery_appointment',
                'title' => '待审批农机预约',
                'count' => $pendingMachineryAppointments,
                'url' => route('machinery-appointments.index', ['status' => 'pending']),
            ],
        ];

        return Inertia::render('Dashboard/Index', [
            'stats' => [
                'greenhouse_count' => $greenhouseCount,
                'today_orders' => $todayOrders,
                'active_alerts' => $activeAlerts,
                'sorting_progress' => $sortingProgress,
                'pending_subsidy_vouchers' => $pendingSubsidyVouchers,
                'pending_machinery_appointments' => $pendingMachineryAppointments,
            ],
            'environment_trend' => $environmentTrend,
            'latest_alerts' => $latestAlerts,
            'priority_items' => $priorityItems,
        ]);
    }

    protected function getSortingProgress(): array
    {
        $total = SortingTask::count();
        $completed = SortingTask::where('status', 'completed')->count();
        $inProgress = SortingTask::where('status', 'in_progress')->count();
        $pending = SortingTask::where('status', 'pending')->count();

        $percentage = $total > 0 ? round(($completed / $total) * 100, 2) : 0;

        return [
            'total' => $total,
            'completed' => $completed,
            'in_progress' => $inProgress,
            'pending' => $pending,
            'percentage' => $percentage,
        ];
    }

    protected function getEnvironmentTrend(): array
    {
        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        $data = EnvironmentData::whereBetween('recorded_at', [$startDate, $endDate])
            ->selectRaw('DATE(recorded_at) as date, AVG(temperature) as avg_temperature, AVG(humidity) as avg_humidity, AVG(soil_moisture) as avg_soil_moisture')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $trend = [];
        for ($i = 0; $i < 7; $i++) {
            $date = Carbon::now()->subDays(6 - $i)->format('Y-m-d');
            $dayData = $data->firstWhere('date', $date);

            $trend[] = [
                'date' => $date,
                'avg_temperature' => $dayData ? round($dayData->avg_temperature, 2) : null,
                'avg_humidity' => $dayData ? round($dayData->avg_humidity, 2) : null,
                'avg_soil_moisture' => $dayData ? round($dayData->avg_soil_moisture, 2) : null,
            ];
        }

        return $trend;
    }
}
