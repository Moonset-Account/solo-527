<?php

namespace App\Http\Controllers;

use App\Models\WorkOrder;
use App\Models\WorkStation;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $today = now()->startOfDay();

        $todayOrderCount = WorkOrder::whereDate('created_at', $today)->count();
        $inProgressCount = WorkOrder::where('status', 'in_progress')->count();
        $completedCount = WorkOrder::where('status', 'completed')
            ->whereDate('completed_at', $today)
            ->count();
        $noShowCount = WorkOrder::where('status', 'no_show')
            ->whereDate('updated_at', $today)
            ->count();

        $recentOrders = WorkOrder::with(['vehicle', 'technician', 'serviceItem'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $stationStatus = WorkStation::with(['workOrders' => function ($query) {
            $query->where('status', 'in_progress');
        }])->get()->map(function ($station) {
            return [
                'id' => $station->id,
                'name' => $station->name,
                'station_type' => $station->station_type,
                'is_active' => $station->is_active,
                'current_order' => $station->workOrders->first(),
            ];
        });

        return Inertia::render('Dashboard', [
            'today_order_count' => $todayOrderCount,
            'in_progress_count' => $inProgressCount,
            'completed_count' => $completedCount,
            'no_show_count' => $noShowCount,
            'recent_orders' => $recentOrders,
            'station_status' => $stationStatus,
        ]);
    }
}
