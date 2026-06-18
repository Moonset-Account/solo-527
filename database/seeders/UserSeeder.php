<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => '超级管理员',
                'password' => bcrypt('password'),
                'phone' => '13800138000',
                'status' => 'active',
                'department' => '管理部',
            ]
        );
        $admin->assignRole('super-admin');

        $manager = User::firstOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => '大棚管理员',
                'password' => bcrypt('password'),
                'phone' => '13800138001',
                'status' => 'active',
                'department' => '生产部',
            ]
        );
        $manager->assignRole('manager');

        $operator = User::firstOrCreate(
            ['email' => 'operator@example.com'],
            [
                'name' => '分拣操作员',
                'password' => bcrypt('password'),
                'phone' => '13800138002',
                'status' => 'active',
                'department' => '分拣部',
            ]
        );
        $operator->assignRole('operator');
    }
}
