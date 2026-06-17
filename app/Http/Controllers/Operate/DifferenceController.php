<?php

namespace App\Http\Controllers\Operate;

use App\Http\Controllers\Controller;
use App\Services\DifferenceService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DifferenceController extends Controller
{
    public function __construct(
        protected DifferenceService $differenceService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Operate/Difference/Index');
    }

    public function confirm(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'difference_id' => 'required|integer',
            'action' => 'required|in:accept,adjust,write_off,ignore',
            'remark' => 'nullable|string',
        ]);

        $difference = $this->differenceService->processDifference(
            $validated['difference_id'],
            $validated['action'],
            $validated['remark'] ?? null
        );

        return redirect()->route('operate.differences.index')
            ->with('success', '差异处理成功');
    }
}
