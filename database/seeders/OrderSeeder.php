<?php

namespace Database\Seeders;

use App\Models\Greenhouse;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $greenhouses = Greenhouse::all();
        $admin = User::where('email', 'admin@example.com')->first();

        $statuses = ['pending', 'confirmed', 'sorting', 'shipped', 'completed', 'cancelled'];
        $products = [
            ['name' => '有机番茄', 'spec' => '一级/5kg箱装', 'unit' => '箱', 'price' => 120],
            ['name' => '水果黄瓜', 'spec' => '精品/10kg箱装', 'unit' => '箱', 'price' => 85],
            ['name' => '奶油草莓', 'spec' => '特级/2kg盒装', 'unit' => '盒', 'price' => 98],
            ['name' => '有机生菜', 'spec' => '新鲜/5kg袋装', 'unit' => '袋', 'price' => 45],
            ['name' => '精品青椒', 'spec' => '一级/10kg箱装', 'unit' => '箱', 'price' => 65],
        ];

        $customers = [
            ['name' => '上海生鲜超市', 'phone' => '021-88881111', 'address' => '上海市浦东新区张江路100号'],
            ['name' => '北京绿色食品公司', 'phone' => '010-66662222', 'address' => '北京市朝阳区建国路88号'],
            ['name' => '广州有机蔬菜批发', 'phone' => '020-33334444', 'address' => '广州市天河区珠江新城'],
            ['name' => '深圳健康生活超市', 'phone' => '0755-55556666', 'address' => '深圳市南山区科技园'],
            ['name' => '杭州农产品配送中心', 'phone' => '0571-77778888', 'address' => '杭州市西湖区文三路'],
        ];

        for ($i = 1; $i <= 10; $i++) {
            $product = $products[array_rand($products)];
            $customer = $customers[array_rand($customers)];
            $quantity = rand(10, 100);
            $status = $statuses[array_rand($statuses)];

            Order::create([
                'order_no' => 'ORD-' . date('Ymd') . '-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'greenhouse_id' => $greenhouses->random()->id,
                'customer_name' => $customer['name'],
                'customer_phone' => $customer['phone'],
                'customer_address' => $customer['address'],
                'product_name' => $product['name'],
                'product_spec' => $product['spec'],
                'quantity' => $quantity,
                'unit' => $product['unit'],
                'unit_price' => $product['price'],
                'total_amount' => $quantity * $product['price'],
                'expected_delivery_date' => now()->addDays(rand(1, 10)),
                'status' => $status,
                'payment_status' => rand(0, 1) ? 'paid' : 'unpaid',
                'remark' => $i % 3 === 0 ? '请尽快发货' : null,
                'created_by' => $admin?->id,
            ]);
        }
    }
}
