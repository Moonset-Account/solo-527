<?php

namespace App\Services;

use App\Models\AssistanceRequest;
use App\Models\ParticipationStat;
use App\Models\Todo;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ParticipationStatService
{
    public function incrementStat(User $user, string $field, int $amount = 1): void
    {
        $stat = ParticipationStat::firstOrCreate(
            [
                'user_id' => $user->id,
                'stat_date' => now()->toDateString(),
            ],
            [
                'event_count' => 0,
                'issue_count' => 0,
                'vote_count' => 0,
                'assistance_count' => 0,
                'todo_count' => 0,
            ]
        );

        $stat->increment($field, $amount);
    }

    public function syncOverdueToStats(): void
    {
        DB::transaction(function () {
            $overdueRequests = AssistanceRequest::where('deadline', '<', now())
                ->whereNotIn('status', ['completed', 'closed'])
                ->get();

            foreach ($overdueRequests as $request) {
                $todoExists = Todo::where('reference_id', $request->id)
                    ->where('type', 'assistance_overdue')
                    ->exists();

                if (!$todoExists) {
                    Todo::create([
                        'title' => '逾期求助处理: ' . $request->title,
                        'description' => $request->description,
                        'type' => 'assistance_overdue',
                        'reference_id' => $request->id,
                        'user_id' => $request->handler_id ?? $request->resident_id,
                        'status' => 'pending',
                    ]);

                    $this->incrementStat(
                        $request->handler_id
                            ? User::find($request->handler_id)
                            : $request->resident,
                        'todo_count'
                    );
                }
            }
        });
    }
}
