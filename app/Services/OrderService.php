<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Inventory;
use App\Models\InventoryLock;
use App\Models\Debt;
use App\Models\AuditTrail;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function createOrder(array $data)
    {
        return DB::transaction(function () use ($data) {
            $customer = Customer::findOrFail($data['customer_id']);
            
            $totalAmount = 0;
            $orderItems = [];
            $splitWarnings = [];

            foreach ($data['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
                $unitPrice = $customer->getProductPrice($itemData['product_id'], $itemData['quantity']);
                $totalPrice = $unitPrice * $itemData['quantity'];
                $totalAmount += $totalPrice;

                $availableStock = $product->total_available_stock;
                if ($itemData['quantity'] > $availableStock) {
                    $splitWarnings[] = [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'requested' => $itemData['quantity'],
                        'available' => $availableStock,
                        'shortage' => $itemData['quantity'] - $availableStock,
                    ];
                }

                $orderItems[] = [
                    'product_id' => $itemData['product_id'],
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $unitPrice,
                    'total_price' => $totalPrice,
                    'cost_price' => $product->cost_price,
                    'remarks' => $itemData['remarks'] ?? null,
                ];
            }

            $paidAmount = $data['paid_amount'] ?? 0;
            $discountAmount = $data['discount_amount'] ?? 0;
            $debtAmount = max(0, $totalAmount - $discountAmount - $paidAmount);

            if ($debtAmount > 0) {
                $newDebt = $customer->current_debt + $debtAmount;
                if ($newDebt > $customer->credit_limit) {
                    throw ValidationException::withMessages([
                        'credit_limit' => "客户赊账额度不足，可用额度: {$customer->available_credit}，本次赊账: {$debtAmount}",
                    ]);
                }
            }

            $order = Order::create([
                'order_no' => (new Order())->generateOrderNo(),
                'customer_id' => $customer->id,
                'salesperson_id' => $data['salesperson_id'] ?? auth()->id(),
                'total_amount' => $totalAmount,
                'discount_amount' => $discountAmount,
                'paid_amount' => $paidAmount,
                'debt_amount' => $debtAmount,
                'status' => Order::STATUS_PENDING,
                'payment_method' => $data['payment_method'] ?? null,
                'urgent_level' => $data['urgent_level'] ?? 0,
                'expected_delivery_at' => $data['expected_delivery_at'] ?? null,
                'shipping_address' => $data['shipping_address'] ?? $customer->address,
                'remarks' => $data['remarks'] ?? null,
                'source' => $data['source'] ?? 'phone',
                'created_by' => auth()->id(),
            ]);

            foreach ($orderItems as $item) {
                $order->items()->create($item);
            }

            if ($debtAmount > 0) {
                $dueDate = null;
                switch ($customer->payment_terms) {
                    case 1: $dueDate = now()->addWeek(); break;
                    case 2: $dueDate = now()->addMonth(); break;
                    case 3: $dueDate = now()->addMonths(3); break;
                }

                Debt::create([
                    'debt_no' => (new Debt())->generateDebtNo(),
                    'customer_id' => $customer->id,
                    'order_id' => $order->id,
                    'amount' => $debtAmount,
                    'remaining_amount' => $debtAmount,
                    'status' => Debt::STATUS_UNPAID,
                    'due_date' => $dueDate,
                    'created_by' => auth()->id(),
                ]);

                $customer->increment('current_debt', $debtAmount);
            }

            AuditTrail::log(AuditTrail::ACTION_CREATE, 'orders', $order->id, null, $order->toArray(), '创建订单');

            return [
                'order' => $order->load('items.product', 'customer'),
                'split_warnings' => $splitWarnings,
            ];
        });
    }

    public function confirmOrder(Order $order)
    {
        if ($order->status !== Order::STATUS_PENDING) {
            throw new \Exception('订单状态不允许确认');
        }

        return DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                $product = $item->product;
                $remainingQuantity = $item->quantity;
                $inventories = Inventory::where('product_id', $product->id)
                    ->where('available_quantity', '>', 0)
                    ->orderBy('expiry_date', 'asc')
                    ->get();

                foreach ($inventories as $inventory) {
                    if ($remainingQuantity <= 0) break;
                    
                    $lockQuantity = min($remainingQuantity, $inventory->available_quantity);
                    $inventory->lock($lockQuantity, $order->id, $item->id);
                    $remainingQuantity -= $lockQuantity;
                }

                if ($remainingQuantity > 0) {
                    throw new \Exception("商品 {$product->name} 库存不足，还差 {$remainingQuantity} 件");
                }

                $item->status = OrderItem::STATUS_PENDING;
                $item->save();
            }

            $order->status = Order::STATUS_CONFIRMED;
            $order->confirmed_by = auth()->id();
            $order->confirmed_at = now();
            $order->save();

            AuditTrail::log(AuditTrail::ACTION_UPDATE, 'orders', $order->id, null, ['status' => Order::STATUS_CONFIRMED], '确认订单');

            return $order->load('items.product');
        });
    }

    public function cancelOrder(Order $order, $reason = '')
    {
        if (in_array($order->status, [Order::STATUS_COMPLETED, Order::STATUS_CANCELLED])) {
            throw new \Exception('订单状态不允许取消');
        }

        return DB::transaction(function () use ($order, $reason) {
            InventoryLock::where('order_id', $order->id)
                ->where('status', 'locked')
                ->get()
                ->each(function ($lock) {
                    $lock->release();
                });

            if ($order->debt_amount > 0) {
                $order->customer->decrement('current_debt', $order->debt_amount);
                $order->debts()->where('status', '!=', Debt::STATUS_PAID)->update([
                    'status' => Debt::STATUS_PAID,
                    'remaining_amount' => 0,
                ]);
            }

            $order->status = Order::STATUS_CANCELLED;
            $order->remarks = ($order->remarks ? $order->remarks . "\n" : '') . "取消原因: {$reason}";
            $order->save();

            foreach ($order->items as $item) {
                $item->status = OrderItem::STATUS_CANCELLED;
                $item->save();
            }

            AuditTrail::log(AuditTrail::ACTION_UPDATE, 'orders', $order->id, null, ['status' => Order::STATUS_CANCELLED], "取消订单: {$reason}");

            return $order;
        });
    }

    public function splitOrder(Order $order, array $splitData)
    {
        return DB::transaction(function () use ($order, $splitData) {
            $newOrder = Order::create([
                'order_no' => (new Order())->generateOrderNo(),
                'customer_id' => $order->customer_id,
                'salesperson_id' => $order->salesperson_id,
                'total_amount' => 0,
                'status' => Order::STATUS_PENDING,
                'payment_method' => $order->payment_method,
                'urgent_level' => $order->urgent_level,
                'expected_delivery_at' => $order->expected_delivery_at,
                'shipping_address' => $order->shipping_address,
                'remarks' => '拆单自订单: ' . $order->order_no,
                'source' => $order->source,
                'created_by' => auth()->id(),
            ]);

            $totalAmount = 0;
            foreach ($splitData['items'] as $itemData) {
                $originalItem = OrderItem::findOrFail($itemData['order_item_id']);
                $splitQuantity = $itemData['quantity'];

                if ($splitQuantity >= $originalItem->quantity) {
                    throw new \Exception('拆单数量不能大于等于原数量');
                }

                $newItem = $newOrder->items()->create([
                    'product_id' => $originalItem->product_id,
                    'quantity' => $splitQuantity,
                    'unit_price' => $originalItem->unit_price,
                    'total_price' => $originalItem->unit_price * $splitQuantity,
                    'cost_price' => $originalItem->cost_price,
                    'status' => OrderItem::STATUS_PENDING,
                ]);

                $totalAmount += $newItem->total_price;

                $originalItem->quantity -= $splitQuantity;
                $originalItem->total_price = $originalItem->unit_price * $originalItem->quantity;
                $originalItem->save();
            }

            $newOrder->total_amount = $totalAmount;
            $newOrder->save();

            AuditTrail::log(AuditTrail::ACTION_UPDATE, 'orders', $order->id, null, ['split_to' => $newOrder->id], '拆单处理');

            return collect([$order->fresh('items'), $newOrder->load('items')]);
        });
    }
}
