<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\RegistrationQualityScore;
use App\Models\Registration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class QualityController extends Controller
{
    public function index(Request $request)
    {
        $eventId = $request->input('event_id');
        $events = Event::orderBy('start_time', 'desc')->get(['id', 'name']);

        if (!$eventId) {
            $eventId = $events->first()?->id;
        }

        $selectedEvent = $eventId ? Event::find($eventId) : null;

        $baseQuery = RegistrationQualityScore::with(['registration.company', 'registration.position', 'registration.name'])
            ->when($eventId, fn($q, $eid) => $q->where('event_id', $eid));

        if ($level = $request->input('quality_level')) {
            $baseQuery->where('quality_level', $level);
        }

        if ($minScore = $request->input('min_score')) {
            $baseQuery->where('total_score', '>=', (int) $minScore);
        }

        if ($isKey = $request->input('is_key_customer')) {
            $baseQuery->where('is_key_customer', $isKey === '1' || $isKey === 'true');
        }

        if ($isVip = $request->input('is_vip')) {
            $baseQuery->where('is_vip', $isVip === '1' || $isVip === 'true');
        }

        $perPage = $request->input('per_page', 30);
        $scores = (clone $baseQuery)
            ->orderBy('total_score', 'desc')
            ->orderBy('quality_level')
            ->paginate($perPage)
            ->through(function ($score) {
                return [
                    'id' => $score->id,
                    'registration_id' => $score->registration_id,
                    'registration_no' => $score->registration?->registration_no,
                    'name' => $score->registration?->name,
                    'company' => $score->registration?->company,
                    'position' => $score->registration?->position,
                    'source_channel' => $score->registration?->source_channel,
                    'conversion_stage' => $score->registration?->conversion_stage_text,
                    'attendance_status' => $score->registration?->attendance_status_text,
                    'total_score' => $score->total_score,
                    'quality_level' => $score->level_label,
                    'quality_color' => $score->level_color,
                    'information_completeness' => $score->information_completeness,
                    'position_level_score' => $score->position_level_score,
                    'company_quality_score' => $score->company_quality_score,
                    'industry_match_score' => $score->industry_match_score,
                    'history_score' => $score->history_score,
                    'is_key_customer' => $score->is_key_customer,
                    'is_vip' => $score->is_vip,
                    'score_remark' => $score->score_remark,
                ];
            });

        $distribution = RegistrationQualityScore::when($eventId, fn($q, $eid) => $q->where('event_id', $eid))
            ->select('quality_level', DB::raw('count(*) as count'), DB::raw('avg(total_score) as avg_score'))
            ->groupBy('quality_level')
            ->get()
            ->keyBy('quality_level')
            ->map(fn($row) => [
                'count' => (int) $row->count,
                'avg_score' => round($row->avg_score, 2),
                'config' => RegistrationQualityScore::QUALITY_LEVELS[$row->quality_level] ?? null,
            ]);

        foreach (RegistrationQualityScore::QUALITY_LEVELS as $level => $config) {
            if (!isset($distribution[$level])) {
                $distribution[$level] = ['count' => 0, 'avg_score' => 0, 'config' => $config];
            }
        }

        $industryStats = Registration::when($eventId, fn($q, $eid) => $q->where('event_id', $eid))
            ->whereNotNull('industry')
            ->join('registration_quality_scores', 'registrations.id', '=', 'registration_quality_scores.registration_id')
            ->select(
                'registrations.industry',
                DB::raw('count(*) as count'),
                DB::raw('avg(registration_quality_scores.total_score) as avg_score'),
                DB::raw("SUM(CASE WHEN registration_quality_scores.quality_level IN ('S', 'A') THEN 1 ELSE 0 END) as high_quality_count")
            )
            ->groupBy('registrations.industry')
            ->orderBy('count', 'desc')
            ->limit(15)
            ->get()
            ->map(fn($row) => [
                'industry' => $row->industry,
                'count' => (int) $row->count,
                'avg_score' => round($row->avg_score, 2),
                'high_quality_count' => (int) $row->high_quality_count,
                'high_quality_rate' => $row->count > 0 ? round($row->high_quality_count / $row->count, 4) : 0,
            ]);

        $sourceStats = Registration::when($eventId, fn($q, $eid) => $q->where('event_id', $eid))
            ->join('registration_quality_scores', 'registrations.id', '=', 'registration_quality_scores.registration_id')
            ->select(
                DB::raw('COALESCE(registrations.source_channel, "未指定") as source_channel'),
                DB::raw('count(*) as count'),
                DB::raw('avg(registration_quality_scores.total_score) as avg_score'),
                DB::raw("SUM(CASE WHEN registrations.conversion_stage = 'paid' THEN 1 ELSE 0 END) as paid_count")
            )
            ->groupBy('source_channel')
            ->orderBy('count', 'desc')
            ->limit(15)
            ->get()
            ->map(fn($row) => [
                'source_channel' => $row->source_channel,
                'count' => (int) $row->count,
                'avg_score' => round($row->avg_score, 2),
                'paid_count' => (int) $row->paid_count,
                'conversion_rate' => $row->count > 0 ? round($row->paid_count / $row->count, 4) : 0,
            ]);

        $positionStats = Registration::when($eventId, fn($q, $eid) => $q->where('event_id', $eid))
            ->join('registration_quality_scores', 'registrations.id', '=', 'registration_quality_scores.registration_id')
            ->select(
                'registration_quality_scores.position_level_score',
                DB::raw('count(*) as count'),
                DB::raw('avg(registration_quality_scores.total_score) as avg_score'),
            )
            ->groupBy('registration_quality_scores.position_level_score')
            ->orderBy('registration_quality_scores.position_level_score', 'desc')
            ->get()
            ->map(fn($row) => [
                'score_range' => $this->mapPositionScoreToRange($row->position_level_score),
                'score' => $row->position_level_score,
                'count' => (int) $row->count,
                'avg_score' => round($row->avg_score, 2),
            ]);

        $scoreRangeStats = $this->calculateScoreRangeStats($eventId);

        $totals = [
            'total' => (clone $baseQuery)->count(),
            'key_customers' => (clone $baseQuery)->where('is_key_customer', true)->count(),
            'vips' => (clone $baseQuery)->where('is_vip', true)->count(),
            'avg_score' => round((clone $baseQuery)->average('total_score') ?? 0, 2),
            's_count' => (clone $baseQuery)->where('quality_level', 'S')->count(),
            'a_count' => (clone $baseQuery)->where('quality_level', 'A')->count(),
            'b_count' => (clone $baseQuery)->where('quality_level', 'B')->count(),
        ];

        return Inertia::render('Admin/Quality/Index', [
            'events' => $events,
            'selectedEvent' => $selectedEvent ? [
                'id' => $selectedEvent->id,
                'name' => $selectedEvent->name,
            ] : null,
            'filters' => $request->only(['event_id', 'quality_level', 'min_score', 'is_key_customer', 'is_vip']),
            'scores' => $scores,
            'distribution' => $distribution,
            'industry_stats' => $industryStats,
            'source_stats' => $sourceStats,
            'position_stats' => $positionStats,
            'score_range_stats' => $scoreRangeStats,
            'totals' => $totals,
            'quality_levels' => RegistrationQualityScore::QUALITY_LEVELS,
        ]);
    }

    protected function mapPositionScoreToRange(int $score): string
    {
        return match (true) {
            $score >= 85 => '决策层 (S+)',
            $score >= 70 => '高管层 (S)',
            $score >= 55 => '中层管理 (A)',
            $score >= 40 => '执行层 (B)',
            default => '其他 (C)',
        };
    }

    protected function calculateScoreRangeStats(?int $eventId): array
    {
        $ranges = [
            ['min' => 90, 'max' => 100, 'label' => '90-100 (顶尖)'],
            ['min' => 80, 'max' => 89, 'label' => '80-89 (优秀)'],
            ['min' => 70, 'max' => 79, 'label' => '70-79 (良好)'],
            ['min' => 60, 'max' => 69, 'label' => '60-69 (一般)'],
            ['min' => 0, 'max' => 59, 'label' => '0-59 (待提升)'],
        ];

        $query = RegistrationQualityScore::query();
        if ($eventId) $query->where('event_id', $eventId);

        $result = [];
        foreach ($ranges as $range) {
            $count = (clone $query)
                ->whereBetween('total_score', [$range['min'], $range['max']])
                ->count();
            $result[] = [
                'range' => $range['label'],
                'count' => $count,
            ];
        }

        return $result;
    }
}
