<?php

namespace App\Http\Middleware;

use App\Services\AuditService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditTrail
{
    public function __construct(protected AuditService $auditService)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $parameters = $request->except(['password', 'password_confirmation']);

            $routeParams = $request->route()?->parameters() ?? [];
            $entityId = (int) (last($routeParams) ?? 0);

            $this->auditService->log(
                action: $request->method(),
                entityType: $request->route()?->getName() ?? $request->path(),
                entityId: is_numeric($entityId) ? $entityId : 0,
                newValues: $parameters,
            );
        }

        return $response;
    }
}
