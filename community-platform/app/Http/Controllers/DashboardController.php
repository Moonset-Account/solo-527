<?php

namespace App\Http\Controllers;

use App\Models\AssistanceRequest;
use App\Models\ExceptionLog;
use App\Models\GridEvent;
use App\Models\Issue;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard', [
            'summary' => [
                'totalEvents' => GridEvent::count(),
                'pendingIssues' => Issue::where('status', 'voting')->count(),
                'overdueAssistance' => AssistanceRequest::where('deadline', '<', now())
                    ->whereNotIn('status', ['completed', 'closed'])
                    ->count(),
                'unresolvedExceptions' => ExceptionLog::where('status', 'pending')->count(),
            ],
        ]);
    }
}
