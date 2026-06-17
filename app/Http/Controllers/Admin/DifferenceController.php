<?php

namespace App\Http\Controllers\Admin;

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
        return Inertia::render('Admin/Difference/Index');
    }

    public function assign(Request $request, $id): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $difference = $this->differenceService->assignResponsible($id, $validated['user_id']);

        return redirect()->route('admin.differences.index')
            ->with('success', "已将差异分配给 {$difference->responsibleUser->name}");
    }

    public function batchAssign(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'difference_ids' => 'required|array',
            'difference_ids.*' => 'required|integer',
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $count = 0;
        foreach ($validated['difference_ids'] as $differenceId) {
            try {
                $this->differenceService->assignResponsible($differenceId, $validated['user_id']);
                $count++;
            } catch (\Exception $e) {
                continue;
            }
        }

        return redirect()->route('admin.differences.index')
            ->with('success', "批量分配成功，共分配 {$count} 条差异");
    }
}
