<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $roles = ['admin', 'principal', 'teacher', 'parent', 'student'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        $permissions = [
            'view dashboard', 'manage classes', 'manage students', 'manage teachers',
            'manage artworks', 'manage reports', 'manage feedback', 'manage bookings',
            'manage hours', 'manage dictionaries', 'manage strategies', 'manage conflicts',
            'manage conversions', 'export data',
        ];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        Role::findByName('admin')->givePermissionTo(Permission::all());
        Role::findByName('principal')->givePermissionTo(Permission::all());
        Role::findByName('teacher')->givePermissionTo([
            'view dashboard', 'manage classes', 'manage students', 'manage artworks',
            'manage reports', 'manage feedback', 'manage hours',
        ]);
        Role::findByName('parent')->givePermissionTo([
            'view dashboard', 'manage feedback', 'manage bookings',
        ]);
        Role::findByName('student')->givePermissionTo([
            'view dashboard', 'manage artworks',
        ]);
    }
}
