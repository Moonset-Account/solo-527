<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'name' => '经典生日蛋糕',
                'description' => '新鲜奶油水果蛋糕，适合各种生日派对',
                'size' => '6寸',
                'price' => 128.00,
                'deposit' => 50.00,
                'flavor' => '原味',
                'preparation_hours' => 24,
            ],
            [
                'name' => '经典生日蛋糕',
                'description' => '新鲜奶油水果蛋糕，适合各种生日派对',
                'size' => '8寸',
                'price' => 188.00,
                'deposit' => 80.00,
                'flavor' => '原味',
                'preparation_hours' => 24,
            ],
            [
                'name' => '巧克力慕斯',
                'description' => '浓郁比利时巧克力，入口即化',
                'size' => '6寸',
                'price' => 158.00,
                'deposit' => 60.00,
                'flavor' => '巧克力',
                'preparation_hours' => 48,
            ],
            [
                'name' => '巧克力慕斯',
                'description' => '浓郁比利时巧克力，入口即化',
                'size' => '8寸',
                'price' => 228.00,
                'deposit' => 90.00,
                'flavor' => '巧克力',
                'preparation_hours' => 48,
            ],
            [
                'name' => '抹茶红豆',
                'description' => '日式宇治抹茶配有机红豆',
                'size' => '6寸',
                'price' => 148.00,
                'deposit' => 60.00,
                'flavor' => '抹茶',
                'preparation_hours' => 36,
            ],
            [
                'name' => '芝士蛋糕',
                'description' => '纽约经典重芝士蛋糕',
                'size' => '6寸',
                'price' => 138.00,
                'deposit' => 55.00,
                'flavor' => '芝士',
                'preparation_hours' => 24,
            ],
            [
                'name' => '红丝绒蛋糕',
                'description' => '经典红丝绒配奶油芝士霜',
                'size' => '8寸',
                'price' => 218.00,
                'deposit' => 85.00,
                'flavor' => '红丝绒',
                'preparation_hours' => 36,
            ],
        ];

        foreach ($products as $product) {
            Product::firstOrCreate(
                ['name' => $product['name'], 'size' => $product['size'], 'flavor' => $product['flavor']],
                $product
            );
        }
    }
}
