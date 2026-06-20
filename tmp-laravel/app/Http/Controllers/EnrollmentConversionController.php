<?php

namespace App\Http\Controllers;

use App\Models\EnrollmentConversion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EnrollmentConversionController extends Controller
{
    public function index(Request $request)
    {
        $conversions = EnrollmentConversion::with(['trialBooking', 'student', 'artClass', 'operator'])
            ->when($request->search, function ($q, $v) {
                $q->whereHas('student', fn($q2) => $q2->where('name', 'like', "%{$v}%"))
                    ->orWhereHas('trialBooking', fn($q2) => $q2->where('student_name', 'like', "%{$v}%"));
            })
            ->when($request->art_class_id, fn($q, $v) => $q->where('art_class_id', $v))
            ->when($request->conversion_type, fn($q, $v) => $q->where('conversion_type', $v))
            ->when($request->start_date, fn($q, $v) => $q->whereDate('converted_at', '>=', $v))
            ->when($request->end_date, fn($q, $v) => $q->whereDate('converted_at', '<=', $v))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('EnrollmentConversions/Index', [
            'conversions' => $conversions,
            'filters' => $request->only(['search', 'art_class_id', 'conversion_type', 'start_date', 'end_date']),
        ]);
    }

    public function monthlyReport(Request $request)
    {
        $year = $request->input('year', now()->year);

        $monthlyData = EnrollmentConversion::with(['trialBooking', 'student', 'artClass', 'operator'])
            ->whereYear('converted_at', $year)
            ->get()
            ->groupBy(fn($item) => $item->converted_at->format('Y-m'))
            ->map(function ($items, $month) {
                $totalBookings = \App\Models\TrialBooking::whereYear('created_at', substr($month, 0, 4))
                    ->whereMonth('created_at', substr($month, 5, 2))
                    ->count();

                $convertedCount = $items->count();
                $conversionRate = $totalBookings > 0 ? round(($convertedCount / $totalBookings) * 100, 2) : 0;

                return [
                    'month' => $month,
                    'total_bookings' => $totalBookings,
                    'converted_count' => $convertedCount,
                    'conversion_rate' => $conversionRate,
                    'by_type' => $items->groupBy('conversion_type')->map->count(),
                ];
            })
            ->sortBy('month')
            ->values();

        return Inertia::render('EnrollmentConversions/MonthlyReport', [
            'monthlyData' => $monthlyData,
            'year' => (int) $year,
        ]);
    }
}
