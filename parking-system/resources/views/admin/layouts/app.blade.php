<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>社区停车共享管理系统 - @yield('title')</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css">
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="flex">
        <aside class="w-64 bg-slate-800 text-white min-h-screen fixed left-0 top-0">
            <div class="p-6 border-b border-slate-700">
                <h1 class="text-xl font-bold flex items-center gap-2">
                    <i class="ri-parking-line text-2xl text-blue-400"></i>
                    停车共享管理
                </h1>
            </div>
            <nav class="p-4">
                <ul class="space-y-1">
                    <li>
                        <a href="{{ route('admin.property.dashboard') }}" class="flex items-center gap-3 px-4 py-3 rounded-lg {{ request()->routeIs('admin.property.dashboard') ? 'bg-blue-600' : 'hover:bg-slate-700' }} transition">
                            <i class="ri-dashboard-line text-lg"></i>
                            <span>仪表盘</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.property.bookings') }}" class="flex items-center gap-3 px-4 py-3 rounded-lg {{ request()->routeIs('admin.property.bookings') ? 'bg-blue-600' : 'hover:bg-slate-700' }} transition">
                            <i class="ri-calendar-check-line text-lg"></i>
                            <span>订单管理</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.property.payments') }}" class="flex items-center gap-3 px-4 py-3 rounded-lg {{ request()->routeIs('admin.property.payments') ? 'bg-blue-600' : 'hover:bg-slate-700' }} transition">
                            <i class="ri-bank-card-line text-lg"></i>
                            <span>支付流水</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.property.entry-records') }}" class="flex items-center gap-3 px-4 py-3 rounded-lg {{ request()->routeIs('admin.property.entry-records') ? 'bg-blue-600' : 'hover:bg-slate-700' }} transition">
                            <i class="ri-camera-line text-lg"></i>
                            <span>入场记录</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.property.violations') }}" class="flex items-center gap-3 px-4 py-3 rounded-lg {{ request()->routeIs('admin.property.violations') ? 'bg-blue-600' : 'hover:bg-slate-700' }} transition">
                            <i class="ri-alarm-warning-line text-lg"></i>
                            <span>违停记录</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.property.appeals') }}" class="flex items-center gap-3 px-4 py-3 rounded-lg {{ request()->routeIs('admin.property.appeals') ? 'bg-blue-600' : 'hover:bg-slate-700' }} transition">
                            <i class="ri-file-list-3-line text-lg"></i>
                            <span>违停申诉</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.property.spot-revenue') }}" class="flex items-center gap-3 px-4 py-3 rounded-lg {{ request()->routeIs('admin.property.spot-revenue') ? 'bg-blue-600' : 'hover:bg-slate-700' }} transition">
                            <i class="ri-line-chart-line text-lg"></i>
                            <span>车位收益</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.property.settlements') }}" class="flex items-center gap-3 px-4 py-3 rounded-lg {{ request()->routeIs('admin.property.settlements', 'admin.property.settlement-detail') ? 'bg-blue-600' : 'hover:bg-slate-700' }} transition">
                            <i class="ri-money-dollar-circle-line text-lg"></i>
                            <span>结算管理</span>
                        </a>
                    </li>
                </ul>
            </nav>
            <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
                <div class="flex items-center gap-3 px-2">
                    <div class="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                        <i class="ri-user-line text-xl"></i>
                    </div>
                    <div>
                        <p class="font-medium text-sm">物业管理员</p>
                        <p class="text-xs text-slate-400">admin@parking.com</p>
                    </div>
                </div>
            </div>
        </aside>

        <main class="ml-64 flex-1 p-6">
            <header class="mb-6">
                <h2 class="text-2xl font-bold text-gray-800">@yield('title')</h2>
            </header>

            @if(session('success'))
                <div class="mb-4 p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg">
                    <i class="ri-checkbox-circle-line mr-2"></i>
                    {{ session('success') }}
                </div>
            @endif

            @yield('content')
        </main>
    </div>
</body>
</html>
