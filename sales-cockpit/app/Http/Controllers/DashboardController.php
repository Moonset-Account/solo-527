<?php

namespace App\Http\Controllers;

use App\Models\Indicator;
use App\Models\IndicatorValue;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $indicators = Indicator::select('id', 'name', 'code', 'category', 'unit')
            ->where('status', 'active')
            ->get();

        $startDate = now()->subDays(30)->toDateString();
        $endDate = now()->toDateString();

        $indicatorIds = $indicators->pluck('id')->toArray();

        $values = IndicatorValue::whereIn('indicator_id', $indicatorIds)
            ->whereBetween('time_period', [$startDate, $endDate])
            ->select('id', 'indicator_id', 'dimension_value', 'time_period', 'value', 'source')
            ->orderBy('time_period', 'desc')
            ->paginate(30);

        return Inertia::render('Dashboard/Index', [
            'indicators' => $indicators,
            'defaultTimeRange' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'values' => $values,
        ]);
    }

    public function showData()
    {
        $validated = request()->validate([
            'indicator_ids' => ['required', 'array'],
            'indicator_ids.*' => ['integer', 'exists:indicators,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $values = IndicatorValue::whereIn('indicator_id', $validated['indicator_ids'])
            ->whereBetween('time_period', [$validated['start_date'], $validated['end_date']])
            ->select('id', 'indicator_id', 'dimension_value', 'time_period', 'value', 'source')
            ->orderBy('time_period', 'desc')
            ->paginate(30);

        return response()->json($values);
    }
}
