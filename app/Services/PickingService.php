<?php

namespace App\Services;

use App\Models\PickingList;
use App\Models\PickingItem;
use App\Models\PickingScan;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Inventory;
use App\Models\InventoryLock;
use App\Models\AuditTrail;
use Illuminate\Support\Facades\DB;

class PickingService
{
    public function createPickingList(Order $order, $pickerId = null)
    {
        if (!in_array($order->status, [Order::STATUS_CONFIRMED, Order::STATUS_PICKING])) {
            throw new \Exception('订单状态不允许生成拣货单');
        }

        return DB::transaction(function () use ($order, $pickerId) {
            $pendingItems = $order->items()->whereIn('status', [
                OrderItem::STATUS_PENDING,
                OrderItem::STATUS_PICKING,
            ])->get();

            if ($pendingItems->isEmpty()) {
                throw new \Exception('没有待拣货的商品');
            }

            $pickingList = PickingList::create([
                'picking_no' => (new PickingList())->generatePickingNo(),
                'order_id' => $order->id,
                'picker_id' => $pickerId,
                'status' => PickingList::STATUS_PENDING,
                'total_items' => $pendingItems->count(),
                'created_by' => auth()->id(),
            ]);

            foreach ($pendingItems as $orderItem) {
                $inventory = Inventory::where('product_id', $orderItem->product_id)
                    ->where('locked_quantity', '>', 0)
                    ->first();

                $remainingToPick = $orderItem->quantity - $orderItem->picked_quantity;
                if ($remainingToPick <= 0) continue;

                PickingItem::create([
                    'picking_list_id' => $pickingList->id,
                    'order_item_id' => $orderItem->id,
                    'product_id' => $orderItem->product_id,
                    'location_id' => $inventory->location_id ?? null,
                    'quantity' => $remainingToPick,
                    'status' => PickingItem::STATUS_PENDING,
                ]);

                $orderItem->status = OrderItem::STATUS_PICKING;
                $orderItem->save();
            }

            $order->status = Order::STATUS_PICKING;
            $order->save();

            AuditTrail::log(AuditTrail::ACTION_CREATE, 'picking_lists', $pickingList->id, null, $pickingList->toArray(), '生成拣货单');

            return $pickingList->load('items.product', 'items.location', 'order.customer');
        });
    }

    public function startPicking(PickingList $pickingList, $pickerId)
    {
        if ($pickingList->status !== PickingList::STATUS_PENDING) {
            throw new \Exception('拣货单状态不允许开始');
        }

        $pickingList->update([
            'status' => PickingList::STATUS_PICKING,
            'picker_id' => $pickerId,
            'started_at' => now(),
        ]);

        AuditTrail::log(AuditTrail::ACTION_UPDATE, 'picking_lists', $pickingList->id, null, ['status' => PickingList::STATUS_PICKING], '开始拣货');

        return $pickingList->fresh();
    }

    public function scanPickItem(PickingItem $pickingItem, $barcode, $quantity, $pickerId)
    {
        if ($pickingItem->status === PickingItem::STATUS_PICKED) {
            throw new \Exception('该商品已完成拣货');
        }

        if ($pickingItem->picked_quantity + $quantity > $pickingItem->quantity) {
            throw new \Exception('拣货数量超过需求数量');
        }

        return DB::transaction(function () use ($pickingItem, $barcode, $quantity, $pickerId) {
            $pickingItem->increment('picked_quantity', $quantity);
            $pickingItem->status = $pickingItem->picked_quantity >= $pickingItem->quantity 
                ? PickingItem::STATUS_PICKED 
                : PickingItem::STATUS_PICKING;
            $pickingItem->picked_at = now();
            $pickingItem->picked_by = $pickerId;
            $pickingItem->save();

            PickingScan::create([
                'picking_item_id' => $pickingItem->id,
                'picker_id' => $pickerId,
                'barcode' => $barcode,
                'quantity' => $quantity,
                'scan_type' => PickingScan::SCAN_TYPE_PICK,
            ]);

            $orderItem = $pickingItem->orderItem;
            $orderItem->increment('picked_quantity', $quantity);
            if ($orderItem->picked_quantity >= $orderItem->quantity) {
                $orderItem->status = OrderItem::STATUS_PICKED;
            }
            $orderItem->save();

            $pickingList = $pickingItem->pickingList;
            $pickedItems = $pickingList->items()->where('status', PickingItem::STATUS_PICKED)->count();
            $pickingList->picked_items = $pickedItems;
            
            $allItemsPicked = $pickingList->items()->where('status', '!=', PickingItem::STATUS_PICKED)->count() === 0;
            if ($allItemsPicked) {
                $pickingList->status = PickingList::STATUS_COMPLETED;
                $pickingList->completed_at = now();
                $this->completePicking($pickingList);
            }
            $pickingList->save();

            return $pickingItem->fresh();
        });
    }

    protected function completePicking(PickingList $pickingList)
    {
        DB::transaction(function () use ($pickingList) {
            $order = $pickingList->order;

            foreach ($pickingList->items as $pickingItem) {
                $locks = InventoryLock::where('order_item_id', $pickingItem->order_item_id)
                    ->where('status', 'locked')
                    ->get();

                foreach ($locks as $lock) {
                    $lock->consume();
                }

                $orderItem = $pickingItem->orderItem;
                $orderItem->shipped_quantity = $orderItem->picked_quantity;
                $orderItem->status = OrderItem::STATUS_SHIPPED;
                $orderItem->save();
            }

            $allShipped = $order->items()->whereIn('status', [
                OrderItem::STATUS_PENDING,
                OrderItem::STATUS_PICKING,
                OrderItem::STATUS_PICKED,
            ])->count() === 0;

            if ($allShipped) {
                $order->status = Order::STATUS_SHIPPED;
                $order->save();
            }

            AuditTrail::log(AuditTrail::ACTION_UPDATE, 'picking_lists', $pickingList->id, null, ['status' => PickingList::STATUS_COMPLETED], '完成拣货');
        });
    }

    public function skipPickItem(PickingItem $pickingItem, $reason, $pickerId)
    {
        $pickingItem->update([
            'status' => PickingItem::STATUS_SKIPPED,
            'remarks' => $reason,
        ]);

        AuditTrail::log(AuditTrail::ACTION_UPDATE, 'picking_items', $pickingItem->id, null, ['status' => PickingItem::STATUS_SKIPPED], "跳过拣货: {$reason}");

        return $pickingItem->fresh();
    }
}
