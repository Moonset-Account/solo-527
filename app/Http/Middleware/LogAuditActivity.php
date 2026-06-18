<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class LogAuditActivity
{
    protected $crudActions = [
        'POST' => 'create',
        'PUT' => 'update',
        'PATCH' => 'update',
        'DELETE' => 'delete',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $method = $request->method();

        if (isset($this->crudActions[$method]) && Auth::check()) {
            $action = $this->crudActions[$method];
            $routeName = $request->route()?->getName() ?? $request->path();

            AuditLog::create([
                'user_id' => Auth::id(),
                'action' => $action,
                'auditable_type' => $this->extractModelFromRoute($routeName),
                'auditable_id' => $request->route('id'),
                'old_values' => $method !== 'POST' ? null : null,
                'new_values' => $method !== 'DELETE' ? $request->except(['_token', '_method', 'password']) : null,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        return $response;
    }

    protected function extractModelFromRoute(?string $routeName): ?string
    {
        if (!$routeName) {
            return null;
        }

        $parts = explode('.', $routeName);
        $resource = $parts[0] ?? null;

        if ($resource) {
            $mapping = [
                'greenhouses' => \App\Models\Greenhouse::class,
                'environment-data' => \App\Models\EnvironmentData::class,
                'environment-alerts' => \App\Models\EnvironmentAlert::class,
                'orders' => \App\Models\Order::class,
                'sorting-tasks' => \App\Models\SortingTask::class,
                'sorting-discrepancies' => \App\Models\SortingDiscrepancy::class,
                'shipments' => \App\Models\Shipment::class,
                'subsidy-vouchers' => \App\Models\SubsidyVoucher::class,
                'machinery-appointments' => \App\Models\MachineryAppointment::class,
                'saved-filters' => \App\Models\SavedFilter::class,
                'users' => \App\Models\User::class,
            ];

            return $mapping[$resource] ?? null;
        }

        return null;
    }
}
