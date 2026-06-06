<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StudentMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()?->isStudent()) {
            return response()->json([
                'message' => '此操作需要学员权限',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
