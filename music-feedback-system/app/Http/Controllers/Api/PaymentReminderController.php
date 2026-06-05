<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentReminderRequest;
use App\Http\Resources\PaymentReminderResource;
use App\Models\ApprovalFlow;
use App\Models\PaymentReminder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentReminderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', PaymentReminder::class);

        $query = PaymentReminder::with(['student']);

        if ($request->filled('saved_filter_id')) {
            $savedFilter = $request->user()->savedFilters()->findOrFail($request->saved_filter_id);
            $request->merge($savedFilter->filter_config);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('due_date_from')) {
            $query->where('due_date', '>=', $request->due_date_from);
        }

        if ($request->filled('due_date_to')) {
            $query->where('due_date', '<=', $request->due_date_to);
        }

        return PaymentReminderResource::collection(
            $query->paginate(20)
        );
    }

    public function store(StorePaymentReminderRequest $request): PaymentReminderResource
    {
        $this->authorize('create', PaymentReminder::class);

        $reminder = PaymentReminder::create($request->validated());

        return new PaymentReminderResource($reminder->load(['student']));
    }

    public function show(int $id): PaymentReminderResource
    {
        $reminder = PaymentReminder::with(['student', 'latestApproval'])->findOrFail($id);

        $this->authorize('view', $reminder);

        return new PaymentReminderResource($reminder);
    }

    public function update(Request $request, int $id): PaymentReminderResource
    {
        $reminder = PaymentReminder::findOrFail($id);

        $this->authorize('update', $reminder);

        $validated = $request->validate([
            'amount' => 'sometimes|numeric|min:0',
            'due_date' => 'sometimes|date',
            'status' => 'sometimes|in:pending,paid,overdue,cancelled',
            'note' => 'nullable|string',
        ]);

        $reminder->update($validated);

        return new PaymentReminderResource($reminder->load(['student']));
    }

    public function markPaid(Request $request, int $id): PaymentReminderResource
    {
        $reminder = PaymentReminder::findOrFail($id);

        $this->authorize('markPaid', $reminder);

        $reminder->update(['status' => 'paid']);

        ApprovalFlow::create([
            'approvable_type' => PaymentReminder::class,
            'approvable_id' => $reminder->id,
            'approver_user_id' => $request->user()->id,
            'action' => 'approve',
        ]);

        return new PaymentReminderResource($reminder->load(['student', 'latestApproval']));
    }

    public function destroy(int $id): JsonResponse
    {
        $reminder = PaymentReminder::findOrFail($id);

        $this->authorize('delete', $reminder);

        $reminder->delete();

        return response()->json(null, 204);
    }
}
