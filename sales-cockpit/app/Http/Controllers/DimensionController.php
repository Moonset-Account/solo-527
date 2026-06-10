<?php

namespace App\Http\Controllers;

use App\Models\Dimension;
use App\Services\AuditService;
use Illuminate\Support\Facades\DB;

class DimensionController extends Controller
{
    public function store()
    {
        if (!request()->user()->hasPermission('dimension.create')) {
            abort(403);
        }

        $validated = request()->validate([
            'business_order_id' => ['required', 'integer', 'exists:business_orders,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100'],
            'values_json' => ['required', 'array'],
        ]);

        DB::transaction(function () use ($validated) {
            $dimension = Dimension::create([
                'business_order_id' => $validated['business_order_id'],
                'name' => $validated['name'],
                'code' => $validated['code'],
                'values_json' => $validated['values_json'],
                'is_active' => true,
            ]);

            app(AuditService::class)->log(
                'create',
                'dimension',
                $dimension->id,
                null,
                $dimension->toArray(),
            );
        });

        return redirect()->back()->with('message', '维度创建成功');
    }

    public function update(Dimension $dimension)
    {
        if (!request()->user()->hasPermission('dimension.update')) {
            abort(403);
        }

        $validated = request()->validate([
            'business_order_id' => ['required', 'integer', 'exists:business_orders,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100'],
            'values_json' => ['required', 'array'],
        ]);

        $oldValues = $dimension->toArray();

        DB::transaction(function () use ($dimension, $validated) {
            $dimension->update($validated);

            app(AuditService::class)->log(
                'update',
                'dimension',
                $dimension->id,
                $oldValues,
                $dimension->fresh()->toArray(),
            );
        });

        return redirect()->back()->with('message', '维度更新成功');
    }

    public function destroy(Dimension $dimension)
    {
        if (!request()->user()->hasPermission('dimension.delete')) {
            abort(403);
        }

        DB::transaction(function () use ($dimension) {
            $oldValues = $dimension->toArray();
            $dimension->delete();

            app(AuditService::class)->log(
                'delete',
                'dimension',
                $oldValues['id'],
                $oldValues,
                null,
            );
        });

        return redirect()->back()->with('message', '维度已删除');
    }
}
