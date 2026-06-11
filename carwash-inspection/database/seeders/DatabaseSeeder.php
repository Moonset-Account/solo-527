<?php

namespace Database\Seeders;

use App\Models\InspectionTemplate;
use App\Models\ServiceItem;
use App\Models\Technician;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\WorkOrder;
use App\Models\WorkStation;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->create([
            'name' => '店长',
            'email' => 'admin@carwash.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        User::factory()->create([
            'name' => '收银员小李',
            'email' => 'cashier@carwash.com',
            'password' => bcrypt('password123'),
            'role' => 'cashier',
        ]);

        $techUser = User::factory()->create([
            'name' => '技师小王',
            'email' => 'tech@carwash.com',
            'password' => bcrypt('password123'),
            'role' => 'technician',
        ]);

        ServiceItem::create([
            'name' => '标准洗车',
            'category' => '洗车',
            'price' => 39.90,
            'duration_minutes' => 30,
            'is_active' => true,
            'description' => '外观精洗 + 轮毂清洁',
        ]);

        ServiceItem::create([
            'name' => '精洗打蜡',
            'category' => '美容',
            'price' => 128.00,
            'duration_minutes' => 60,
            'is_active' => true,
            'description' => '精细清洗 + 棕榈蜡',
        ]);

        ServiceItem::create([
            'name' => '内饰清洁',
            'category' => '内饰',
            'price' => 89.00,
            'duration_minutes' => 45,
            'is_active' => true,
            'description' => '内饰深度清洁 + 消毒',
        ]);

        $tech = Technician::create([
            'name' => '王技师',
            'phone' => '13900139000',
            'specialties' => ['洗车', '美容', '内饰'],
            'is_active' => true,
            'user_id' => $techUser->id,
        ]);

        Technician::create([
            'name' => '李技师',
            'phone' => '13800138000',
            'specialties' => ['洗车', '美容'],
            'is_active' => true,
        ]);

        WorkStation::create([
            'name' => '1号工位',
            'station_type' => '洗车',
            'is_active' => true,
            'description' => '标准洗车位',
        ]);

        WorkStation::create([
            'name' => '2号工位',
            'station_type' => '美容',
            'is_active' => true,
            'description' => '美容工位',
        ]);

        WorkStation::create([
            'name' => '3号工位',
            'station_type' => '内饰',
            'is_active' => true,
            'description' => '内饰清洁工位',
        ]);

        $vehicle = Vehicle::create([
            'plate_number' => '京A12345',
            'make' => '宝马',
            'model' => '3系',
            'year' => 2023,
            'color' => '白色',
            'owner_name' => '张先生',
            'owner_phone' => '13800138000',
            'owner_id_number' => '110101199001011234',
            'notes' => '常客，VIP',
        ]);

        Vehicle::create([
            'plate_number' => '京B67890',
            'make' => '奔驰',
            'model' => 'C级',
            'year' => 2022,
            'color' => '黑色',
            'owner_name' => '李女士',
            'owner_phone' => '13900139000',
        ]);

        InspectionTemplate::create([
            'name' => '标准洗车检测',
            'category' => '洗车',
            'items' => [
                ['item_name' => '车身外观检查', 'category' => '外观', 'required' => true],
                ['item_name' => '轮胎轮毂检查', 'category' => '轮胎', 'required' => true],
                ['item_name' => '玻璃清洁度', 'category' => '玻璃', 'required' => true],
                ['item_name' => '内饰除尘检查', 'category' => '内饰', 'required' => false],
            ],
            'is_active' => true,
            'version' => 1,
        ]);

        InspectionTemplate::create([
            'name' => '美容服务检测',
            'category' => '美容',
            'items' => [
                ['item_name' => '漆面光泽度', 'category' => '漆面', 'required' => true],
                ['item_name' => '蜡层均匀度', 'category' => '漆面', 'required' => true],
                ['item_name' => '边角处理', 'category' => '细节', 'required' => true],
                ['item_name' => '轮胎上光', 'category' => '轮胎', 'required' => false],
                ['item_name' => '玻璃驱水', 'category' => '玻璃', 'required' => false],
            ],
            'is_active' => true,
            'version' => 1,
        ]);

        WorkOrder::create([
            'order_no' => 'WO-20260612-0001',
            'vehicle_id' => $vehicle->id,
            'technician_id' => $tech->id,
            'station_id' => 1,
            'service_item_id' => 1,
            'inspection_template_id' => 1,
            'status' => 'completed',
            'scheduled_time' => now()->subHours(3),
            'started_at' => now()->subHours(2),
            'completed_at' => now()->subHour(),
            'total_amount' => 39.90,
            'paid_amount' => 39.90,
            'payment_method' => 'wechat',
            'payment_status' => 'paid',
            'payment_paid_at' => now()->subHour(),
            'notes' => '客户要求重点清洁轮毂',
        ]);
    }
}
