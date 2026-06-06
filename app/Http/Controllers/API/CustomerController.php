<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Models\AuditTrail;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('customer.view');

        $query = Customer::with('salesperson')
            ->when($request->keyword, function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->keyword}%")
                    ->orWhere('customer_code', 'like', "%{$request->keyword}%")
                    ->orWhere('phone', 'like', "%{$request->keyword}%");
            })
            ->when($request->is_vip, fn($q) => $q->where('is_vip', true))
            ->when($request->is_active, fn($q) => $q->where('is_active', $request->is_active))
            ->when($request->salesperson_id, fn($q) => $q->where('salesperson_id', $request->salesperson_id))
            ->when($request->has_overdue_debt, function ($q) {
                $q->whereHas('debts', function ($subQ) {
                    $subQ->where('status', 'overdue');
                });
            })
            ->orderBy('created_at', 'desc');

        return response()->json([
            'data' => $query->paginate($request->per_page ?? 20),
        ]);
    }

    public function show(Customer $customer)
    {
        Gate::authorize('customer.view');

        return response()->json([
            'data' => $customer->load(['salesperson', 'priceLists.product', 'orders' => function ($q) {
                $q->latest()->limit(10);
            }]),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('customer.create');

        $validated = $request->validate([
            'customer_code' => 'required|string|unique:customers,customer_code',
            'name' => 'required|string',
            'contact_person' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'id_card' => 'nullable|string',
            'business_license' => 'nullable|string',
            'credit_limit' => 'nullable|numeric|min:0',
            'is_vip' => 'nullable|boolean',
            'payment_terms' => 'nullable|integer|in:0,1,2,3',
            'remarks' => 'nullable|string',
            'salesperson_id' => 'nullable|exists:users,id',
        ]);

        $customer = Customer::create($validated);

        AuditTrail::log(AuditTrail::ACTION_CREATE, 'customers', $customer->id, null, $customer->toArray());

        return response()->json([
            'message' => '客户创建成功',
            'data' => $customer,
        ], 201);
    }

    public function update(Request $request, Customer $customer)
    {
        Gate::authorize('customer.edit');

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'contact_person' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'id_card' => 'nullable|string',
            'business_license' => 'nullable|string',
            'credit_limit' => 'nullable|numeric|min:0',
            'is_vip' => 'nullable|boolean',
            'payment_terms' => 'nullable|integer|in:0,1,2,3',
            'remarks' => 'nullable|string',
            'salesperson_id' => 'nullable|exists:users,id',
            'is_active' => 'nullable|boolean',
        ]);

        $oldValues = $customer->toArray();
        $customer->update($validated);

        AuditTrail::log(AuditTrail::ACTION_UPDATE, 'customers', $customer->id, $oldValues, $customer->toArray());

        return response()->json([
            'message' => '客户更新成功',
            'data' => $customer,
        ]);
    }

    public function getPriceList(Customer $customer)
    {
        Gate::authorize('customer.price_list');

        return response()->json([
            'data' => $customer->priceLists()->with('product')->where('is_active', true)->get(),
        ]);
    }

    public function addPriceList(Request $request, Customer $customer)
    {
        Gate::authorize('customer.price_list');

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'price' => 'required|numeric|min:0',
            'min_quantity' => 'nullable|integer|min:1',
            'effective_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after:effective_date',
            'remarks' => 'nullable|string',
        ]);

        $priceList = $customer->priceLists()->create($validated);

        return response()->json([
            'message' => '价格添加成功',
            'data' => $priceList->load('product'),
        ], 201);
    }
}
