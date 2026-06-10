<?php

namespace App\Http\Controllers;

use App\Models\DatasetPermission;
use App\Services\AuditService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DatasetPermissionController extends Controller
{
    public function store()
    {
        if (!request()->user()->hasPermission('dataset_permission.create')) {
            abort(403);
        }

        $validated = request()->validate([
            'business_order_id' => ['required', 'integer', 'exists:business_orders,id'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'dataset_name' => ['required', 'string', 'max:255'],
            'expires_at' => ['required', 'date'],
        ]);

        DB::transaction(function () use ($validated) {
            $permission = DatasetPermission::create([
                'business_order_id' => $validated['business_order_id'],
                'user_id' => $validated['user_id'],
                'dataset_name' => $validated['dataset_name'],
                'expires_at' => $validated['expires_at'],
                'granted_by' => Auth::id(),
                'is_active' => true,
            ]);

            app(AuditService::class)->log(
                'create',
                'dataset_permission',
                $permission->id,
                null,
                $permission->toArray(),
            );
        });

        return redirect()->back()->with('message', '数据集权限创建成功');
    }

    public function update(DatasetPermission $datasetPermission)
    {
        if (!request()->user()->hasPermission('dataset_permission.update')) {
            abort(403);
        }

        $validated = request()->validate([
            'expires_at' => ['required', 'date'],
        ]);

        $oldValues = $datasetPermission->toArray();

        DB::transaction(function () use ($datasetPermission, $validated) {
            $datasetPermission->update($validated);

            app(AuditService::class)->log(
                'update',
                'dataset_permission',
                $datasetPermission->id,
                $oldValues,
                $datasetPermission->fresh()->toArray(),
            );
        });

        return redirect()->back()->with('message', '数据集权限更新成功');
    }

    public function deactivate(DatasetPermission $datasetPermission)
    {
        if (!request()->user()->hasPermission('dataset_permission.deactivate')) {
            abort(403);
        }

        $oldValues = $datasetPermission->toArray();

        DB::transaction(function () use ($datasetPermission) {
            $datasetPermission->update(['is_active' => false]);

            app(AuditService::class)->log(
                'deactivate',
                'dataset_permission',
                $datasetPermission->id,
                $oldValues,
                $datasetPermission->fresh()->toArray(),
            );
        });

        return redirect()->back()->with('message', '数据集权限已停用');
    }
}
