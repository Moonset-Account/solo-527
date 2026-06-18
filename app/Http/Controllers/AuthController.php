<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function login()
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/Login');
    }

    public function authenticate(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'remember' => 'boolean',
        ]);

        if (Auth::attempt($credentials, $credentials['remember'] ?? false)) {
            $request->session()->regenerate();

            $user = Auth::user();
            $user->update(['last_active_at' => now()]);

            \App\Models\OperationLog::create([
                'user_id' => $user->id,
                'action' => 'user_login',
                'description' => "用户 {$user->name} 登录系统",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return redirect()->intended(route('dashboard'));
        }

        return back()->withErrors([
            'email' => '提供的凭证无效。',
        ])->onlyInput('email');
    }

    public function logout(Request $request)
    {
        $user = Auth::user();

        \App\Models\OperationLog::create([
            'user_id' => $user->id,
            'action' => 'user_logout',
            'description' => "用户 {$user->name} 退出系统",
            'ip_address' => $request->ip(),
        ]);

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    public function profile()
    {
        return Inertia::render('Auth/Profile', [
            'user' => auth()->user(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . auth()->id(),
            'phone' => 'nullable|string|max:20',
        ]);

        $oldValues = auth()->user()->toArray();
        auth()->user()->update($validated);

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'profile_updated',
            'description' => '更新了个人资料',
            'old_values' => $oldValues,
            'new_values' => $validated,
        ]);

        return back()->with('success', '个人资料已更新');
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|current_password',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = auth()->user();
        $user->update(['password' => Hash::make($validated['password'])]);

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'password_changed',
            'description' => '修改了密码',
        ]);

        return back()->with('success', '密码已更新');
    }

    public function users(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $query = User::latest();

        if ($keyword = $request->input('keyword')) {
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('email', 'like', "%{$keyword}%")
                    ->orWhere('department', 'like', "%{$keyword}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->byRole($role);
        }

        if ($onDuty = $request->input('on_duty')) {
            if ($onDuty === 'yes') {
                $query->onDuty();
            }
        }

        $users = $query->paginate(20)->withQueryString();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => $request->all(),
        ]);
    }

    public function createUser()
    {
        $this->authorize('create', User::class);

        return Inertia::render('Users/Create');
    }

    public function storeUser(Request $request)
    {
        $this->authorize('create', User::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:engineer,admin,manager',
            'phone' => 'nullable|string|max:20',
            'department' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'user_created',
            'model_type' => User::class,
            'model_id' => $user->id,
            'description' => "创建了用户: {$user->name}",
            'new_values' => $validated,
        ]);

        return redirect()->route('users.index')
            ->with('success', '用户创建成功');
    }

    public function editUser(User $user)
    {
        $this->authorize('update', $user);

        return Inertia::render('Users/Edit', [
            'user' => $user,
        ]);
    }

    public function updateUser(Request $request, User $user)
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role' => 'required|in:engineer,admin,manager',
            'phone' => 'nullable|string|max:20',
            'department' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
            'is_on_duty' => 'boolean',
        ]);

        $oldValues = $user->toArray();
        $user->update($validated);

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'user_updated',
            'model_type' => User::class,
            'model_id' => $user->id,
            'description' => "更新了用户: {$user->name}",
            'old_values' => $oldValues,
            'new_values' => $validated,
        ]);

        return redirect()->route('users.index')
            ->with('success', '用户更新成功');
    }

    public function toggleDutyStatus(User $user)
    {
        $this->authorize('update', $user);

        $user->update(['is_on_duty' => ! $user->is_on_duty]);

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'duty_status_changed',
            'model_type' => User::class,
            'model_id' => $user->id,
            'description' => $user->is_on_duty ? "{$user->name} 已标记为值班中" : "{$user->name} 已取消值班状态",
            'new_values' => ['is_on_duty' => $user->is_on_duty],
        ]);

        return back()->with('success', '值班状态已更新');
    }
}
