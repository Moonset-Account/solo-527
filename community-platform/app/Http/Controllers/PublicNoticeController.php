<?php

namespace App\Http\Controllers;

use App\Models\PublicNotice;
use Inertia\Inertia;

class PublicNoticeController extends Controller
{
    public function index()
    {
        $filters = request()->only(['type']);

        $notices = PublicNotice::with('publisher')
            ->when($filters['type'] ?? null, fn($q, $type) => $q->where('type', $type))
            ->latest('published_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Notice/Index', [
            'notices' => $notices,
            'filters' => $filters,
        ]);
    }
}
