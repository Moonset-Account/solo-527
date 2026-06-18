<?php

namespace App\Http\Controllers;

use App\Models\Greenhouse;
use App\Models\SubsidyVoucher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
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

        $vouchers->getCollection()->transform(function ($item) {
            return array_merge($item->toArray(), [
                'type' => $item->subsidy_type,
                'applicant_name' => $item->applicant?->name,
                'reviewer_name' => $item->approvedBy?->name,
                'description' => $item->remark,
                'reject_reason' => $item->remark,
                'proof_files' => collect($item->documents ?? [])->map(fn($doc, $i) => [
                    'id' => $i + 1,
                    'name' => is_array($doc) ? ($doc['name'] ?? basename($doc['path'] ?? '')) : basename($doc),
                    'url' => is_array($doc) ? ($doc['url'] ?? Storage::url($doc['path'] ?? '')) : Storage::url($doc),
                    'size' => is_array($doc) ? ($doc['size'] ?? '') : '',
                ])->values()->all(),
            ]);
        });

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

        $proofFiles = collect($subsidyVoucher->documents ?? [])->map(fn($doc, $i) => [
            'id' => $i + 1,
            'name' => is_array($doc) ? ($doc['name'] ?? basename($doc['path'] ?? '')) : basename($doc),
            'url' => is_array($doc) ? ($doc['url'] ?? Storage::url($doc['path'] ?? '')) : Storage::url($doc),
            'size' => is_array($doc) ? ($doc['size'] ?? '') : '',
        ])->values()->all();

        $data = array_merge($subsidyVoucher->toArray(), [
            'type' => $subsidyVoucher->subsidy_type,
            'applicant_name' => $subsidyVoucher->applicant?->name,
            'reviewer_name' => $subsidyVoucher->approvedBy?->name,
            'description' => $subsidyVoucher->remark,
            'reject_reason' => $subsidyVoucher->status === 'rejected' ? $subsidyVoucher->remark : null,
        ]);

        return Inertia::render('SubsidyVouchers/Show', [
            'voucher' => $data,
            'proofFiles' => $proofFiles,
        ]);
    }

    public function edit(SubsidyVoucher $subsidyVoucher)
    {
        $subsidyVoucher->load(['greenhouse', 'applicant', 'approvedBy']);

        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);
        $applicants = User::orderBy('name')->get(['id', 'name']);

        $proofFiles = collect($subsidyVoucher->documents ?? [])->map(fn($doc, $i) => [
            'id' => $i + 1,
            'name' => is_array($doc) ? ($doc['name'] ?? basename($doc['path'] ?? '')) : basename($doc),
            'url' => is_array($doc) ? ($doc['url'] ?? Storage::url($doc['path'] ?? '')) : Storage::url($doc),
            'size' => is_array($doc) ? ($doc['size'] ?? '') : '',
        ])->values()->all();

        return Inertia::render('SubsidyVouchers/Edit', [
            'voucher' => array_merge($subsidyVoucher->toArray(), [
                'type' => $subsidyVoucher->subsidy_type,
                'description' => $subsidyVoucher->remark,
            ]),
            'proofFiles' => $proofFiles,
            'greenhouses' => $greenhouses,
            'applicants' => $applicants,
        ]);
    }

    public function update(Request $request, SubsidyVoucher $subsidyVoucher)
    {
        $validated = $request->validate([
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

    public function uploadDocuments(Request $request, SubsidyVoucher $subsidyVoucher)
    {
        $request->validate([
            'files' => 'required|array|min:1',
            'files.*' => 'file|mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx|max:10240',
        ]);

        $existing = $subsidyVoucher->documents ?? [];
        $newDocs = [];

        foreach ($request->file('files') as $file) {
            $path = $file->store('subsidy-documents', 'public');
            $newDocs[] = [
                'name' => $file->getClientOriginalName(),
                'path' => $path,
                'url' => Storage::url($path),
                'size' => $this->formatFileSize($file->getSize()),
            ];
        }

        $subsidyVoucher->update([
            'documents' => array_merge($existing, $newDocs),
        ]);

        return redirect()->back()->with('success', '证明文件上传成功');
    }

    protected function formatFileSize($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
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
            'remark' => $request->remark,
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
