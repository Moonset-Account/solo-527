<?php

namespace App\Http\Controllers;

use App\Models\ChurnReason;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ChurnReasonController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'is_active' => 'nullable|boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $query = ChurnReason::query();

        if (isset($validated['is_active'])) {
            $query->where('is_active', (bool) $validated['is_active']);
        }

        $reasons = $query
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $lostQuery = Lead::onlyTrashed()
            ->orWhere(function ($q) {
                $q->whereNull('deleted_at')->where('status', 'lost');
            });
        if (!empty($validated['start_date'])) {
            $lostQuery->whereDate('created_at', '>=', $validated['start_date']);
        }
        if (!empty($validated['end_date'])) {
            $lostQuery->whereDate('created_at', '<=', $validated['end_date']);
        }
        $totalLost = (clone $lostQuery)->count();

        $reasonStats = Lead::query()
            ->where('status', 'lost')
            ->when(!empty($validated['start_date']), function ($q) use ($validated) {
                $q->whereDate('created_at', '>=', $validated['start_date']);
            })
            ->when(!empty($validated['end_date']), function ($q) use ($validated) {
                $q->whereDate('created_at', '<=', $validated['end_date']);
            })
            ->select(
                'churn_reason_id',
                DB::raw('COUNT(*) as count')
            )
            ->whereNotNull('churn_reason_id')
            ->groupBy('churn_reason_id')
            ->pluck('count', 'churn_reason_id')
            ->toArray();

        $reasonList = $reasons->map(function ($r) use ($reasonStats, $totalLost) {
            $count = $reasonStats[$r->id] ?? 0;
            return [
                'id' => $r->id,
                'name' => $r->name,
                'category' => $r->category,
                'description' => $r->description,
                'is_active' => (bool) $r->is_active,
                'sort_order' => (int) $r->sort_order,
                'count' => $count,
                'percentage' => $totalLost > 0 ? round($count / $totalLost * 100, 1) : 0,
            ];
        })->toArray();

        $categoryStats = collect($reasonList)->groupBy('category')->map(function ($group, $category) use ($totalLost) {
            $count = $group->sum('count');
            return [
                'category' => $category,
                'count' => $count,
                'percentage' => $totalLost > 0 ? round($count / $totalLost * 100, 1) : 0,
            ];
        })->values()->toArray();

        return Inertia::render('References/ChurnReasons', [
            'filters' => [
                'is_active' => $validated['is_active'] ?? null,
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
            ],
            'reasons' => $reasonList,
            'categoryStats' => $categoryStats,
            'totalLost' => $totalLost,
        ]);
    }
}
