<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TeacherMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()?->isTeacher()) {
            return response()->json([
                'message' => '此操作需要老师权限',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
