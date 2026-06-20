<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        $allowedRoles = explode('|', $roles);

        if (!$request->user() || !in_array($request->user()->role, $allowedRoles)) {
            abort(403);
        }

        return $next($request);
    }
}
