<?php

namespace App\Http\Controllers\Operate;

use App\Http\Controllers\Controller;
use App\Services\ReconciliationService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ReconciliationController extends Controller
{
    public function __construct(
        protected ReconciliationService $reconciliationService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Operate/Reconciliation/Index');
    }

    public function upload(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:xls,xlsx,csv|max:10240',
        ]);

        $statement = $this->reconciliationService->parseStatement($request->file('file'));
        $differences = $this->reconciliationService->compareWithSystem($statement->id);

        return redirect()->route('operate.reconciliation.show', $statement->id)
            ->with('success', "对账单上传成功，共发现 {$differences->count()} 条差异");
    }

    public function confirm(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'statement_id' => 'required|integer',
            'differences' => 'required|array',
            'differences.*.id' => 'required|integer',
            'differences.*.confirmed' => 'required|boolean',
            'differences.*.remark' => 'nullable|string',
        ]);

        $statement = $this->reconciliationService->confirmDifferences(
            $validated['statement_id'],
            $validated['differences']
        );

        return redirect()->route('operate.differences.index')
            ->with('success', '差异确认完成');
    }
}
