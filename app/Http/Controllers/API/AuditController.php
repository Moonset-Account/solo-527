<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AuditTrail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('audit.view');

        $query = AuditTrail::with('user')
            ->when($request->keyword, function ($q) use ($request) {
                $q->where('table_name', 'like', "%{$request->keyword}%")
                    ->orWhere('action', 'like', "%{$request->keyword}%")
                    ->orWhereHas('user', function ($subQ) use ($request) {
                        $subQ->where('name', 'like', "%{$request->keyword}%");
                    });
            })
            ->when($request->table_name, function ($q) use ($request) {
                $tableMap = [
                    'return_requests' => 'returns',
                    'order_items' => 'order_items',
                ];
                $tableName = $tableMap[$request->table_name] ?? $request->table_name;
                $q->where('table_name', $tableName);
            })
            ->when($request->action, fn($q) => $q->where('action', strtolower($request->action)))
            ->when($request->user_id, fn($q) => $q->where('user_id', $request->user_id))
            ->when($request->user_name, function ($q) use ($request) {
                $q->whereHas('user', function ($subQ) use ($request) {
                    $subQ->where('name', 'like', "%{$request->user_name}%");
                });
            })
            ->when($request->start_date, fn($q) => $q->where('created_at', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->where('created_at', '<=', $request->end_date . ' 23:59:59'))
            ->orderBy('created_at', 'desc');

        return response()->json([
            'data' => $query->paginate($request->per_page ?? 30),
        ]);
    }

    public function showByRecord($tableName, $recordId)
    {
        Gate::authorize('audit.view');

        $trails = AuditTrail::with('user')
            ->where('table_name', $tableName)
            ->where('record_id', $recordId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'data' => $trails,
        ]);
    }
}
