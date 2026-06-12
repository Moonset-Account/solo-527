<?php

namespace App\Http\Controllers;

use App\Models\ReviewRhythm;
use App\Models\IndicatorValue;
use App\Models\ConsistencyCheck;
use App\Services\AuditService;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReviewRhythmController extends Controller
{
    public function index()
    {
        if (!request()->user()->hasPermission('review_rhythm.view')) {
            abort(403);
        }

        $rhythms = ReviewRhythm::with('indicator')
            ->orderBy('next_review_date', 'asc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('ReviewRhythms/Index', [
            'rhythms' => $rhythms,
        ]);
    }

    public function store()
    {
        if (!request()->user()->hasPermission('review_rhythm.create')) {
            abort(403);
        }

        $validated = request()->validate([
            'indicator_id' => ['required', 'integer', 'exists:indicators,id'],
            'rhythm_type' => ['required', 'string', 'in:daily,weekly,monthly,quarterly'],
            'next_review_date' => ['required', 'date'],
            'responsible_user_id' => ['required', 'integer', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($validated) {
            $rhythm = ReviewRhythm::create([
                'indicator_id' => $validated['indicator_id'],
                'rhythm_type' => $validated['rhythm_type'],
                'next_review_date' => $validated['next_review_date'],
                'responsible_user_id' => $validated['responsible_user_id'],
                'notes' => $validated['notes'] ?? null,
                'is_active' => true,
            ]);

            app(AuditService::class)->log(
                'create',
                'review_rhythm',
                $rhythm->id,
                null,
                $rhythm->toArray(),
            );
        });

        return redirect()->back()->with('message', '复核节奏创建成功');
    }

    public function update(ReviewRhythm $reviewRhythm)
    {
        if (!request()->user()->hasPermission('review_rhythm.update')) {
            abort(403);
        }

        $validated = request()->validate([
            'indicator_id' => ['required', 'integer', 'exists:indicators,id'],
            'rhythm_type' => ['required', 'string', 'in:daily,weekly,monthly,quarterly'],
            'next_review_date' => ['required', 'date'],
            'responsible_user_id' => ['required', 'integer', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $oldValues = $reviewRhythm->toArray();

        DB::transaction(function () use ($reviewRhythm, $validated, $oldValues) {
            $reviewRhythm->update($validated);

            app(AuditService::class)->log(
                'update',
                'review_rhythm',
                $reviewRhythm->id,
                $oldValues,
                $reviewRhythm->fresh()->toArray(),
            );
        });

        return redirect()->back()->with('message', '复核节奏更新成功');
    }

    public function generateReport()
    {
        if (!request()->user()->hasPermission('review_rhythm.report')) {
            abort(403);
        }

        $validated = request()->validate([
            'month' => ['required', 'date_format:Y-m'],
        ]);

        $monthStart = $validated['month'] . '-01';
        $monthEnd = date('Y-m-t', strtotime($monthStart));

        $rhythms = ReviewRhythm::with('indicator')
            ->whereBetween('next_review_date', [$monthStart, $monthEnd])
            ->where('is_active', true)
            ->get();

        $reportData = $rhythms->map(function ($rhythm) use ($monthStart, $monthEnd) {
            $indicatorValues = IndicatorValue::where('indicator_id', $rhythm->indicator_id)
                ->whereBetween('time_period', [$monthStart, $monthEnd])
                ->get();

            $consistencyChecks = ConsistencyCheck::where('indicator_id', $rhythm->indicator_id)
                ->whereBetween('checked_at', [$monthStart, $monthEnd . ' 23:59:59'])
                ->get();

            return [
                'rhythm' => $rhythm,
                'indicator_values' => $indicatorValues,
                'consistency_checks' => $consistencyChecks,
            ];
        });

        return Inertia::render('ReviewRhythms/Report', [
            'reportData' => $reportData,
            'month' => $validated['month'],
        ]);
    }

    public function deactivate(ReviewRhythm $reviewRhythm)
    {
        if (!request()->user()->hasPermission('review_rhythm.deactivate')) {
            abort(403);
        }

        $oldValues = $reviewRhythm->toArray();

        DB::transaction(function () use ($reviewRhythm, $oldValues) {
            $reviewRhythm->update(['is_active' => false]);

            app(AuditService::class)->log(
                'deactivate',
                'review_rhythm',
                $reviewRhythm->id,
                $oldValues,
                $reviewRhythm->fresh()->toArray(),
            );
        });

        return redirect()->back()->with('message', '复盘节奏已停用');
    }

    public function activate(ReviewRhythm $reviewRhythm)
    {
        if (!request()->user()->hasPermission('review_rhythm.deactivate')) {
            abort(403);
        }

        $oldValues = $reviewRhythm->toArray();

        DB::transaction(function () use ($reviewRhythm, $oldValues) {
            $reviewRhythm->update(['is_active' => true]);

            app(AuditService::class)->log(
                'activate',
                'review_rhythm',
                $reviewRhythm->id,
                $oldValues,
                $reviewRhythm->fresh()->toArray(),
            );
        });

        return redirect()->back()->with('message', '复盘节奏已启用');
    }
}
