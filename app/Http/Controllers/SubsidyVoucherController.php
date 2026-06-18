<?php

namespace App\Http\Controllers;

use App\Models\Greenhouse;
use App\Models\SubsidyVoucher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SubsidyVoucherController extends Controller
{
    public function index(Request $request)
    {
        $query = SubsidyVoucher::with(['greenhouse', 'applicant', 'approvedBy']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('voucher_no', 'like', "%{$search}%")
                    ->orWhereHas('applicant', function ($subQ) use ($search) {
                        $subQ->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($greenhouseId = $request->input('greenhouse_id')) {
            $query->where('greenhouse_id', $greenhouseId);
        }

        if ($subsidyType = $request->input('subsidy_type')) {
            $query->where('subsidy_type', $subsidyType);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($applicantId = $request->input('applicant_id')) {
            $query->where('applicant_id', $applicantId);
        }

        if ($startDate = $request->input('start_date')) {
            $query->whereDate('apply_date', '>=', $startDate);
        }

        if ($endDate = $request->input('end_date')) {
            $query->whereDate('apply_date', '<=', $endDate);
        }

        $query->orderBy($request->input('sort_by', 'created_at'), $request->input('sort_direction', 'desc'));

        $vouchers = $query->paginate($request->input('per_page', 15))->withQueryString();

        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);
        $applicants = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('SubsidyVouchers/Index', [
            'vouchers' => $vouchers,
            'greenhouses' => $greenhouses,
            'applicants' => $applicants,
            'filters' => $request->only([
                'search', 'greenhouse_id', 'subsidy_type', 'status',
                'applicant_id', 'start_date', 'end_date',
            ]),
        ]);
    }

    public function create()
    {
        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);
        $applicants = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('SubsidyVouchers/Create', [
            'greenhouses' => $greenhouses,
            'applicants' => $applicants,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'voucher_no' => 'required|string|unique:subsidy_vouchers,voucher_no|max:50',
            'greenhouse_id' => 'required|exists:greenhouses,id',
            'subsidy_type' => 'required|string|in:fertilizer,seed,equipment,irrigation,other',
            'amount' => 'required|numeric|min:0',
            'apply_date' => 'required|date',
            'status' => 'required|string|in:pending,approved,rejected,paid',
            'documents' => 'nullable|array',
            'documents.*' => 'string',
            'remark' => 'nullable|string|max:1000',
        ]);

        $validated['applicant_id'] = Auth::id();

        $voucher = SubsidyVoucher::create($validated);

        return redirect()->route('subsidy-vouchers.show', $voucher)->with('success', '补贴凭证创建成功');
    }

    public function show(SubsidyVoucher $subsidyVoucher)
    {
        $subsidyVoucher->load(['greenhouse', 'applicant', 'approvedBy']);

        return Inertia::render('SubsidyVouchers/Show', [
            'voucher' => $subsidyVoucher,
        ]);
    }

    public function update(Request $request, SubsidyVoucher $subsidyVoucher)
    {
        $validated = $request->validate([
            'voucher_no' => 'required|string|unique:subsidy_vouchers,voucher_no,' . $subsidyVoucher->id . '|max:50',
            'greenhouse_id' => 'required|exists:greenhouses,id',
            'subsidy_type' => 'required|string|in:fertilizer,seed,equipment,irrigation,other',
            'amount' => 'required|numeric|min:0',
            'apply_date' => 'required|date',
            'status' => 'required|string|in:pending,approved,rejected,paid',
            'documents' => 'nullable|array',
            'documents.*' => 'string',
            'remark' => 'nullable|string|max:1000',
        ]);

        $subsidyVoucher->update($validated);

        return redirect()->route('subsidy-vouchers.show', $subsidyVoucher)->with('success', '补贴凭证更新成功');
    }

    public function approve(Request $request, SubsidyVoucher $subsidyVoucher)
    {
        $request->validate([
            'remark' => 'nullable|string|max:1000',
        ]);

        $subsidyVoucher->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', '补贴凭证已批准');
    }

    public function reject(Request $request, SubsidyVoucher $subsidyVoucher)
    {
        $request->validate([
            'remark' => 'required|string|max:1000',
        ]);

        $subsidyVoucher->update([
            'status' => 'rejected',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', '补贴凭证已拒绝');
    }

    public function pay(SubsidyVoucher $subsidyVoucher)
    {
        $subsidyVoucher->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return redirect()->back()->with('success', '补贴已支付');
    }
}
