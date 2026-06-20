<?php

namespace App\Http\Middleware;

use App\Services\OperationLogService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogOperations
{
    public function __construct(
        private OperationLogService $operationLogService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $action = $request->method() . ' ' . $request->path();

            $subjectType = null;
            $subjectId = null;

            $route = $request->route();
            if ($route) {
                foreach ($route->parameters() as $parameter) {
                    if (is_object($parameter) && method_exists($parameter, 'getMorphClass')) {
                        $subjectType = $parameter->getMorphClass();
                        $subjectId = $parameter->getKey();
                        break;
                    } elseif (is_object($parameter) && $parameter instanceof \Illuminate\Database\Eloquent\Model) {
                        $subjectType = get_class($parameter);
                        $subjectId = $parameter->getKey();
                        break;
                    }
                }
            }

            if ($request->user()) {
                $this->operationLogService->log(
                    $request->user(),
                    $action,
                    $subjectType,
                    $subjectId,
                );
            }
        }

        return $response;
    }
}
