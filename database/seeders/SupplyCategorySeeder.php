<?php

namespace Database\Seeders;

use App\Models\SupplyCategory;
use Illuminate\Database\Seeder;

class SupplyCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => '办公文具',
                'code' => 'STAT',
                'description' => '日常办公文具用品',
                'children' => [
                    ['name' => '书写工具', 'code' => 'STAT-WRIT', 'description' => '笔类、记号笔等'],
                    ['name' => '纸制品', 'code' => 'STAT-PAPR', 'description' => '打印纸、笔记本、便签等'],
                    ['name' => '装订用品', 'code' => 'STAT-BIND', 'description' => '文件夹、订书机、回形针等'],
                ],
            ],
            [
                'name' => '办公设备耗材',
                'code' => 'EQUI',
                'description' => '办公设备相关耗材',
                'children' => [
                    ['name' => '打印机耗材', 'code' => 'EQUI-PRNT', 'description' => '墨盒、硒鼓、色带等'],
                    ['name' => '电脑配件', 'code' => 'EQUI-COMP', 'description' => '鼠标、键盘、U盘等'],
                ],
            ],
            [
                'name' => '清洁用品',
                'code' => 'CLEN',
                'description' => '办公区域清洁用品',
                'children' => [
                    ['name' => '日常清洁', 'code' => 'CLEN-DAIL', 'description' => '抹布、清洁剂、垃圾袋等'],
                    ['name' => '个人卫生', 'code' => 'CLEN-PERS', 'description' => '纸巾、洗手液等'],
                ],
            ],
            [
                'name' => '茶水间用品',
                'code' => 'PANR',
                'description' => '茶水间及休息室用品',
                'children' => [
                    ['name' => '饮品', 'code' => 'PANR-BEVG', 'description' => '咖啡、茶叶、饮用水等'],
                    ['name' => '一次性用品', 'code' => 'PANR-DISP', 'description' => '纸杯、吸管、餐具等'],
                ],
            ],
        ];

        foreach ($categories as $category) {
            $parent = SupplyCategory::firstOrCreate(
                ['code' => $category['code']],
                ['name' => $category['name'], 'description' => $category['description']]
            );

            foreach ($category['children'] ?? [] as $child) {
                SupplyCategory::firstOrCreate(
                    ['code' => $child['code']],
                    [
                        'name' => $child['name'],
                        'description' => $child['description'],
                        'parent_id' => $parent->id,
                    ]
                );
            }
        }
    }
}
