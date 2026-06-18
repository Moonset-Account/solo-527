<?php

namespace App\Http\Controllers;

use App\Models\AccountApplication;
use App\Models\Notification;
use App\Models\SavedQuery;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountApplicationController extends Controller
{
    public function index(Request $request)
    {
        $query = AccountApplication::with(['applicant', 'approver'])->latest();

        if ($keyword = $request->input('keyword')) {
            $query->search($keyword);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($type = $request->input('application_type')) {
            $query->byType($type);
        }

        if (! auth()->user()->isAdmin()) {
            $query->byApplicant(auth()->id());
        }

        $applications = $query->paginate(20)->withQueryString();

        $savedQueries = SavedQuery::accessible($request->user())
            ->byModel(AccountApplication::class)
            ->ordered()
            ->get();

        return Inertia::render('AccountApplications/Index', [
            'applications' => $applications,
            'filters' => $request->all(),
            'savedQueries' => $savedQueries,
            'isAdmin' => auth()->user()->isAdmin(),
        ]);
    }

    public function create()
    {
        return Inertia::render('AccountApplications/Create', [
            'applicationTypes' => [
                'new_account' => '新账号申请',
                'permission_change' => '权限变更',
                'access_request' => '访问申请',
                'password_reset' => '密码重置',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'application_type' => 'required|in:new_account,permission_change,access_request,password_reset',
            'target_system' => 'nullable|string|max:255',
            'reason' => 'required|string',
        ]);

        $validated['applicant_id'] = auth()->id();
        $validated['status'] = 'pending';

        $application = AccountApplication::create($validated);

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'account_application_created',
            'model_type' => AccountApplication::class,
            'model_id' => $application->id,
            'description' => "创建了账号申请 #{$application->id}",
            'new_values' => $validated,
        ]);

        $admins = User::whereIn('role', ['admin', 'manager'])->get();
        foreach ($admins as $admin) {
            Notification::sendToUser(
                $admin,
                '新的账号申请待审批',
                "申请人: " . auth()->user()->name . "\n类型: {$application->application_type}\n原因: {$application->reason}",
                'approval',
                'warning',
                $application,
                ['site', 'email']
            );
        }

        return redirect()->route('account-applications.index')
            ->with('success', '申请提交成功');
    }

    public function show(AccountApplication $application)
    {
        $application->load(['applicant', 'approver']);

        return Inertia::render('AccountApplications/Show', [
            'application' => $application,
            'isAdmin' => auth()->user()->isAdmin(),
        ]);
    }

    public function approve(Request $request, AccountApplication $application)
    {
        $this->authorize('update', $application);

        $validated = $request->validate([
            'approval_notes' => 'nullable|string',
        ]);

        $application->approve(auth()->user(), $validated['approval_notes'] ?? '');

        Notification::sendToUser(
            $application->applicant,
            '账号申请已批准',
            "您的申请已批准\n类型: {$application->application_type}\n审批备注: {$validated['approval_notes']}",
            'approval',
            'info',
            $application,
            ['site', 'email']
        );

        return back()->with('success', '申请已批准');
    }

    public function reject(Request $request, AccountApplication $application)
    {
        $this->authorize('update', $application);

        $validated = $request->validate([
            'approval_notes' => 'required|string',
        ]);

        $application->reject(auth()->user(), $validated['approval_notes']);

        Notification::sendToUser(
            $application->applicant,
            '账号申请被拒绝',
            "您的申请被拒绝\n类型: {$application->application_type}\n拒绝原因: {$validated['approval_notes']}",
            'approval',
            'warning',
            $application,
            ['site', 'email']
        );

        return back()->with('success', '申请已拒绝');
    }

    public function cancel(AccountApplication $application)
    {
        $application->update(['status' => 'cancelled']);

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'account_application_cancelled',
            'model_type' => AccountApplication::class,
            'model_id' => $application->id,
            'description' => '账号申请已取消',
            'old_values' => ['status' => $application->getOriginal('status')],
            'new_values' => ['status' => 'cancelled'],
        ]);

        return back()->with('success', '申请已取消');
    }

    public function export(Request $request)
    {
        $query = AccountApplication::with(['applicant', 'approver']);

        if ($keyword = $request->input('keyword')) {
            $query->search($keyword);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($type = $request->input('application_type')) {
            $query->byType($type);
        }

        if (! auth()->user()->isAdmin()) {
            $query->byApplicant(auth()->id());
        }

        $applications = $query->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="account_applications.csv"',
        ];

        $callback = function () use ($applications) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', '申请人', '类型', '目标系统', '状态', '申请时间', '审批人', '审批时间']);

            foreach ($applications as $app) {
                fputcsv($file, [
                    $app->id,
                    $app->applicant->name ?? '',
                    $app->application_type,
                    $app->target_system,
                    $app->status,
                    $app->created_at,
                    $app->approver?->name ?? '',
                    $app->reviewed_at,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
