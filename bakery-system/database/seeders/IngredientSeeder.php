<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use App\Models\IngredientStock;
use Illuminate\Database\Seeder;

class IngredientSeeder extends Seeder
{
    public function run(): void
    {
        $ingredients = [
            ['name' => '低筋面粉', 'unit' => 'kg', 'unit_price' => 12.50, 'alert_threshold' => 5, 'expiry_alert_days' => 30],
            ['name' => '鸡蛋', 'unit' => '个', 'unit_price' => 1.50, 'alert_threshold' => 30, 'expiry_alert_days' => 7],
            ['name' => '牛奶', 'unit' => 'L', 'unit_price' => 12.00, 'alert_threshold' => 5, 'expiry_alert_days' => 3],
            ['name' => '白砂糖', 'unit' => 'kg', 'unit_price' => 8.00, 'alert_threshold' => 3, 'expiry_alert_days' => 180],
            ['name' => '黄油', 'unit' => 'kg', 'unit_price' => 65.00, 'alert_threshold' => 2, 'expiry_alert_days' => 14],
            ['name' => '淡奶油', 'unit' => 'L', 'unit_price' => 35.00, 'alert_threshold' => 3, 'expiry_alert_days' => 7],
            ['name' => '巧克力', 'unit' => 'kg', 'unit_price' => 120.00, 'alert_threshold' => 2, 'expiry_alert_days' => 90],
            ['name' => '抹茶粉', 'unit' => 'g', 'unit_price' => 0.80, 'alert_threshold' => 100, 'expiry_alert_days' => 180],
            ['name' => '红豆', 'unit' => 'kg', 'unit_price' => 18.00, 'alert_threshold' => 2, 'expiry_alert_days' => 365],
            ['name' => '芝士奶酪', 'unit' => 'kg', 'unit_price' => 85.00, 'alert_threshold' => 2, 'expiry_alert_days' => 14],
            ['name' => '草莓', 'unit' => 'kg', 'unit_price' => 45.00, 'alert_threshold' => 2, 'expiry_alert_days' => 2],
            ['name' => '蓝莓', 'unit' => 'kg', 'unit_price' => 60.00, 'alert_threshold' => 1, 'expiry_alert_days' => 3],
        ];

        foreach ($ingredients as $ing) {
            $ingredient = Ingredient::firstOrCreate(['name' => $ing['name']], $ing);

            IngredientStock::create([
                'ingredient_id' => $ingredient->id,
                'quantity' => rand(10, 50),
                'expiry_date' => now()->addDays(rand(5, 60)),
                'batch_number' => 'BATCH-' . strtoupper(substr(md5(rand()), 0, 8)),
                'supplier' => '供应商' . rand(1, 5),
            ]);
        }
    }
}
