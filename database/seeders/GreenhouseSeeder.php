<?php

namespace Database\Seeders;

use App\Models\Greenhouse;
use App\Models\User;
use Illuminate\Database\Seeder;

class GreenhouseSeeder extends Seeder
{
    public function run(): void
    {
        $manager = User::where('email', 'manager@example.com')->first();
        $operator = User::where('email', 'operator@example.com')->first();

        $greenhouses = [
            [
                'name' => '1号大棚',
                'code' => 'GH-001',
                'location' => '东区A1',
                'area' => 500,
                'crop_type' => '番茄',
                'status' => 'active',
                'manager_id' => $manager?->id,
            ],
            [
                'name' => '2号大棚',
                'code' => 'GH-002',
                'location' => '东区A2',
                'area' => 600,
                'crop_type' => '黄瓜',
                'status' => 'active',
                'manager_id' => $manager?->id,
            ],
            [
                'name' => '3号大棚',
                'code' => 'GH-003',
                'location' => '西区B1',
                'area' => 450,
                'crop_type' => '草莓',
                'status' => 'active',
                'manager_id' => $operator?->id,
            ],
            [
                'name' => '4号大棚',
                'code' => 'GH-004',
                'location' => '西区B2',
                'area' => 550,
                'crop_type' => '生菜',
                'status' => 'maintenance',
                'manager_id' => $manager?->id,
            ],
            [
                'name' => '5号大棚',
                'code' => 'GH-005',
                'location' => '南区C1',
                'area' => 400,
                'crop_type' => '青椒',
                'status' => 'inactive',
                'manager_id' => null,
            ],
        ];

        foreach ($greenhouses as $gh) {
            Greenhouse::firstOrCreate(['code' => $gh['code']], $gh);
        }
    }
}
