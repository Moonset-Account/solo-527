<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@bakery.com'],
            [
                'name' => 'Admin',
                'phone' => '13800138000',
                'password' => Hash::make('password123'),
                'user_type' => 'admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $admin->assignRole('admin');

        $staff = User::firstOrCreate(
            ['email' => 'staff@bakery.com'],
            [
                'name' => 'Baker',
                'phone' => '13800138001',
                'password' => Hash::make('password123'),
                'user_type' => 'staff',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $staff->assignRole('staff');

        $customer = User::firstOrCreate(
            ['email' => 'customer@example.com'],
            [
                'name' => 'Customer',
                'phone' => '13900139000',
                'password' => Hash::make('password123'),
                'user_type' => 'customer',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $customer->assignRole('customer');
    }
}
