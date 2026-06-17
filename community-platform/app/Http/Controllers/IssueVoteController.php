<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use App\Models\IssueVote;
use App\Services\ParticipationStatService;

class IssueVoteController extends Controller
{
    public function store(Issue $issue, ParticipationStatService $statService)
    {
        $exists = IssueVote::where('issue_id', $issue->id)
            ->where('user_id', auth()->id())
            ->exists();

        if ($exists) {
            return redirect()->back()->with('error', '您已经投过票了');
        }

        IssueVote::create([
            'issue_id' => $issue->id,
            'user_id' => auth()->id(),
        ]);

        $statService->incrementStat(auth()->user(), 'vote_count');

        return redirect()->back()->with('success', '投票成功');
    }
}
