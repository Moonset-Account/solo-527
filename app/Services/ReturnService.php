<?php

namespace App\Services;

use App\Models\ReturnRequest;
use App\Models\ReturnItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Inventory;
use App\Models\Debt;
use App\Models\AuditTrail;
use Illuminate\Support\Facades\DB;

class ReturnService
{
    public function createReturn(array $data)
    {
        return DB::transaction(function () use ($data) {
            $order = Order::findOrFail($data['order_id']);
            
            $totalAmount = 0;
            $returnItems = [];

            foreach ($data['items'] as $itemData) {
                $orderItem = OrderItem::findOrFail($itemData['order_item_id']);
                
                if ($itemData['quantity'] > $orderItem->can_return_quantity) {
                    throw new \Exception("商品 {$orderItem->product->name} 可退货数量不足");
                }

                $totalPrice = $orderItem->unit_price * $itemData['quantity'];
                $totalAmount += $totalPrice;

                $returnItems[] = [
                    'order_item_id' => $orderItem->id,
                    'product_id' => $orderItem->product_id,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $orderItem->unit_price,
                    'total_price' => $totalPrice,
                    'reason' => $itemData['reason'] ?? null,
                ];
            }

            $return = ReturnRequest::create([
                'return_no' => (new ReturnRequest())->generateReturnNo(),
                'order_id' => $order->id,
                'customer_id' => $order->customer_id,
                'total_amount' => $totalAmount,
                'refund_amount' => $totalAmount,
                'status' => ReturnRequest::STATUS_PENDING,
                'reason' => $data['reason'] ?? null,
                'return_type' => $data['return_type'] ?? ReturnRequest::TYPE_OTHER,
                'created_by' => auth()->id(),
            ]);

            foreach ($returnItems as $item) {
                $return->items()->create($item);
            }

            AuditTrail::log(AuditTrail::ACTION_CREATE, 'returns', $return->id, null, $return->toArray(), '创建退货申请');

            return $return->load('items.product', 'order', 'customer');
        });
    }

    public function approveReturn(ReturnRequest $return, $approvalRemarks = '')
    {
        if ($return->status !== ReturnRequest::STATUS_PENDING) {
            throw new \Exception('退货单状态不允许审批');
        }

        return DB::transaction(function () use ($return, $approvalRemarks) {
            $return->update([
                'status' => ReturnRequest::STATUS_APPROVED,
                'approved_by' => auth()->id(),
                'approved_at' => now(),
                'approval_remarks' => $approvalRemarks,
            ]);

            AuditTrail::log(AuditTrail::ACTION_APPROVE, 'returns', $return->id, null, ['status' => ReturnRequest::STATUS_APPROVED], '审批通过退货');

            return $return->fresh();
        });
    }

    public function rejectReturn(ReturnRequest $return, $rejectionReason)
    {
        if ($return->status !== ReturnRequest::STATUS_PENDING) {
            throw new \Exception('退货单状态不允许审批');
        }

        return DB::transaction(function () use ($return, $rejectionReason) {
            $return->update([
                'status' => ReturnRequest::STATUS_REJECTED,
                'approved_by' => auth()->id(),
                'approved_at' => now(),
                'approval_remarks' => $rejectionReason,
            ]);

            AuditTrail::log(AuditTrail::ACTION_REJECT, 'returns', $return->id, null, ['status' => ReturnRequest::STATUS_REJECTED], "拒绝退货: {$rejectionReason}");

            return $return->fresh();
        });
    }

    public function receiveReturnItem(ReturnItem $returnItem, $quantity, $receiverId)
    {
        if ($returnItem->returnRequest->status !== ReturnRequest::STATUS_APPROVED) {
            throw new \Exception('退货单未审批，无法收货');
        }

        if ($returnItem->received_quantity + $quantity > $returnItem->quantity) {
            throw new \Exception('收货数量超过退货数量');
        }

        return DB::transaction(function () use ($returnItem, $quantity, $receiverId) {
            $returnItem->increment('received_quantity', $quantity);
            $returnItem->status = $returnItem->received_quantity >= $returnItem->quantity
                ? ReturnItem::STATUS_RECEIVED
                : ReturnItem::STATUS_PENDING;
            $returnItem->received_by = $receiverId;
            $returnItem->received_at = now();
            $returnItem->save();

            $return = $returnItem->returnRequest;
            $allReceived = $return->items()->where('received_quantity', '<', \DB::raw('quantity'))->count() === 0;
            if ($allReceived) {
                $return->status = ReturnRequest::STATUS_PROCESSING;
                $return->save();
            }

            AuditTrail::log(AuditTrail::ACTION_UPDATE, 'return_items', $returnItem->id, null, ['received_quantity' => $returnItem->received_quantity], '退货收货');

            return $returnItem->fresh();
        });
    }

    public function restockReturnItem(ReturnItem $returnItem, $quantity, $locationId)
    {
        if ($returnItem->restocked_quantity + $quantity > $returnItem->received_quantity) {
            throw new \Exception('入库数量超过收货数量');
        }

        return DB::transaction(function () use ($returnItem, $quantity, $locationId) {
            $inventory = Inventory::firstOrCreate(
                ['product_id' => $returnItem->product_id, 'location_id' => $locationId, 'batch_no' => 'RTN' . date('Ymd')],
                ['quantity' => 0, 'locked_quantity' => 0, 'available_quantity' => 0]
            );

            $inventory->addStock($quantity);

            $returnItem->increment('restocked_quantity', $quantity);
            $returnItem->status = $returnItem->restocked_quantity >= $returnItem->received_quantity
                ? ReturnItem::STATUS_RESTOCKED
                : ReturnItem::STATUS_RECEIVED;
            $returnItem->save();

            $orderItem = $returnItem->orderItem;
            $orderItem->increment('returned_quantity', $quantity);
            if ($orderItem->returned_quantity >= $orderItem->shipped_quantity) {
                $orderItem->status = OrderItem::STATUS_RETURNED;
            }
            $orderItem->save();

            $return = $returnItem->returnRequest;
            $allRestocked = $return->items()->whereRaw('restocked_quantity < quantity')->count() === 0;
            if ($allRestocked) {
                $return->status = ReturnRequest::STATUS_COMPLETED;
                $return->save();
                $this->adjustDebtForReturn($return);
            }

            AuditTrail::log(AuditTrail::ACTION_UPDATE, 'return_items', $returnItem->id, null, ['restocked_quantity' => $returnItem->restocked_quantity], '退货入库');

            return $returnItem->fresh();
        });
    }

    protected function adjustDebtForReturn(ReturnRequest $return)
    {
        DB::transaction(function () use ($return) {
            $customer = $return->customer;
            $refundAmount = $return->refund_amount;

            if ($customer->current_debt > 0) {
                $debtAdjustment = min($refundAmount, $customer->current_debt);
                $customer->decrement('current_debt', $debtAdjustment);

                $remainingRefund = $refundAmount - $debtAdjustment;
                
                $debts = Debt::where('customer_id', $customer->id)
                    ->whereIn('status', [Debt::STATUS_UNPAID, Debt::STATUS_PARTIAL, Debt::STATUS_OVERDUE])
                    ->orderBy('due_date')
                    ->get();

                foreach ($debts as $debt) {
                    if ($remainingRefund <= 0) break;
                    
                    $payment = min($remainingRefund, $debt->remaining_amount);
                    $debt->increment('paid_amount', $payment);
                    $debt->remaining_amount -= $payment;
                    $debt->updateStatus();
                    $debt->save();
                    
                    $remainingRefund -= $payment;
                }
            }

            AuditTrail::log(AuditTrail::ACTION_UPDATE, 'customers', $customer->id, null, ['current_debt' => $customer->current_debt], '退货调整欠款');
        });
    }
}
