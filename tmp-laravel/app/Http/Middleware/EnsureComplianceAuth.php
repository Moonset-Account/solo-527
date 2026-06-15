<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureComplianceAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            $user = User::firstOrCreate(
                ['email' => 'compliance@example.com'],
                [
                    'name' => '合规经理',
                    'password' => bcrypt('password123'),
                    'role' => User::ROLE_COMPLIANCE_MANAGER,
                    'department' => '合规部',
                ]
            );

            User::firstOrCreate(
                ['email' => 'secretary@example.com'],
                [
                    'name' => '项目秘书',
                    'password' => bcrypt('password123'),
                    'role' => User::ROLE_PROJECT_SECRETARY,
                    'department' => '项目办',
                ]
            );

            User::firstOrCreate(
                ['email' => 'admin@example.com'],
                [
                    'name' => '管理员',
                    'password' => bcrypt('password123'),
                    'role' => User::ROLE_ADMIN,
                    'department' => '技术部',
                ]
            );

            Auth::login($user);
        }

        return $next($request);
    }
}
