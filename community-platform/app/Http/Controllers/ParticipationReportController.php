<?php

namespace App\Http\Controllers;

use App\Http\Requests\ParticipationReportRequest;
use App\Models\ParticipationStat;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ParticipationReportController extends Controller
{
    public function index(ParticipationReportRequest $request)
    {
        $startDate = $request->validated('start_date', now()->subMonth()->toDateString());
        $endDate = $request->validated('end_date', now()->toDateString());

        $stats = ParticipationStat::whereBetween('stat_date', [$startDate, $endDate])
            ->selectRaw('user_id,
                SUM(event_count) as event_count,
                SUM(issue_count) as issue_count,
                SUM(vote_count) as vote_count,
                SUM(assistance_count) as assistance_count,
                SUM(todo_count) as todo_count')
            ->with('user')
            ->groupBy('user_id')
            ->get()
            ->map(fn($stat) => [
                'user_id' => $stat->user_id,
                'user_name' => $stat->user?->name ?? '-',
                'event_count' => (int) $stat->event_count,
                'issue_count' => (int) $stat->issue_count,
                'vote_count' => (int) $stat->vote_count,
                'assistance_count' => (int) $stat->assistance_count,
                'todo_count' => (int) $stat->todo_count,
            ]);

        return Inertia::render('Report/Index', [
            'stats' => $stats,
            'filters' => ['start_date' => $startDate, 'end_date' => $endDate],
        ]);
    }

    public function export(ParticipationReportRequest $request): StreamedResponse
    {
        $validated = $request->validated();

        $stats = ParticipationStat::whereBetween('stat_date', [$validated['start_date'], $validated['end_date']])
            ->selectRaw('user_id,
                SUM(event_count) as event_count,
                SUM(issue_count) as issue_count,
                SUM(vote_count) as vote_count,
                SUM(assistance_count) as assistance_count,
                SUM(todo_count) as todo_count')
            ->with('user')
            ->groupBy('user_id')
            ->get();

        return new StreamedResponse(function () use ($stats) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['用户', '事件数', '议题数', '投票数', '求助数', '待办数']);

            foreach ($stats as $stat) {
                fputcsv($handle, [
                    $stat->user->name,
                    $stat->event_count,
                    $stat->issue_count,
                    $stat->vote_count,
                    $stat->assistance_count,
                    $stat->todo_count,
                ]);
            }

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="participation_report.csv"',
        ]);
    }
}
