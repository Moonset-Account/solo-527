<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\WriteOffService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class WriteOffController extends Controller
{
    public function __construct(
        protected WriteOffService $writeOffService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/WriteOff/Index');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'difference_id' => 'required|integer',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:500',
        ]);

        $writeOff = $this->writeOffService->createWriteOff(
            $validated['difference_id'],
            (float) $validated['amount'],
            $validated['reason']
        );

        return redirect()->route('admin.write-offs.index')
            ->with('success', "冲销申请已创建，金额：{$writeOff->amount} 元");
    }

    public function approve(Request $request, $id): RedirectResponse
    {
        $writeOff = $this->writeOffService->approveWriteOff($id);

        return redirect()->route('admin.write-offs.index')
            ->with('success', "冲销申请已通过，金额：{$writeOff->amount} 元");
    }

    public function reject(Request $request, $id): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $writeOff = $this->writeOffService->rejectWriteOff($id, $validated['reason']);

        return redirect()->route('admin.write-offs.index')
            ->with('success', '冲销申请已驳回');
    }
}
