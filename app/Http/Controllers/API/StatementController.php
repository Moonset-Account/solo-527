<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Statement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use App\Models\AuditTrail;

class StatementController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('statement.view');

        $query = Statement::with('customer', 'createdBy')
            ->when($request->keyword, function ($q) use ($request) {
                $q->where('statement_no', 'like', "%{$request->keyword}%")
                    ->orWhereHas('customer', function ($subQ) use ($request) {
                        $subQ->where('name', 'like', "%{$request->keyword}%");
                    });
            })
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->customer_id, fn($q) => $q->where('customer_id', $request->customer_id))
            ->when($request->start_date, fn($q) => $q->where('start_date', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->where('end_date', '<=', $request->end_date))
            ->orderBy('created_at', 'desc');

        return response()->json([
            'data' => $query->paginate($request->per_page ?? 20),
        ]);
    }

    public function show(Statement $statement)
    {
        Gate::authorize('statement.view');

        return response()->json([
            'data' => $statement->load('customer', 'createdBy', 'items.order'),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('statement.create');

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        $existing = Statement::where('customer_id', $validated['customer_id'])
            ->where('start_date', $validated['start_date'])
            ->where('end_date', $validated['end_date'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => '该时间段的对账单已存在',
            ], 422);
        }

        $statement = DB::transaction(function () use ($validated, $request) {
            $statement = Statement::create([
                'statement_no' => 'STM' . date('YmdHis') . rand(100, 999),
                'customer_id' => $validated['customer_id'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'status' => Statement::STATUS_DRAFT,
                'created_by' => $request->user()->id,
            ]);

            $statement->generateItems();

            return $statement->load('items');
        });

        AuditTrail::log(AuditTrail::ACTION_CREATE, 'statements', $statement->id, null, $statement->toArray());

        return response()->json([
            'message' => '对账单创建成功',
            'data' => $statement,
        ], 201);
    }

    public function confirm(Request $request, Statement $statement)
    {
        Gate::authorize('statement.confirm');

        if ($statement->status !== Statement::STATUS_DRAFT) {
            return response()->json([
                'message' => '只能确认草稿状态的对账单',
            ], 422);
        }

        $statement->update([
            'status' => Statement::STATUS_CONFIRMED,
            'confirmed_at' => now(),
            'confirmed_by' => $request->user()->id,
        ]);

        AuditTrail::log(AuditTrail::ACTION_UPDATE, 'statements', $statement->id, null, $statement->toArray());

        return response()->json([
            'message' => '对账单已确认',
            'data' => $statement,
        ]);
    }

    public function send(Request $request, Statement $statement)
    {
        Gate::authorize('statement.send');

        if ($statement->status !== Statement::STATUS_CONFIRMED) {
            return response()->json([
                'message' => '只能发送已确认的对账单',
            ], 422);
        }

        $statement->update([
            'status' => Statement::STATUS_SENT,
            'sent_at' => now(),
            'sent_by' => $request->user()->id,
        ]);

        AuditTrail::log(AuditTrail::ACTION_UPDATE, 'statements', $statement->id, null, $statement->toArray());

        return response()->json([
            'message' => '对账单已发送',
            'data' => $statement,
        ]);
    }
}
