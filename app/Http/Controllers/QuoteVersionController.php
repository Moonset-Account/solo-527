<?php

namespace App\Http\Controllers;

use App\Models\QuoteVersion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuoteVersionController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'is_active' => 'nullable|boolean',
            'search' => 'nullable|string|max:100',
        ]);

        $query = QuoteVersion::with('items')->withCount('leads');

        if (isset($validated['is_active'])) {
            $query->where('is_active', (bool) $validated['is_active']);
        }

        if (!empty($validated['search'])) {
            $search = "%{$validated['search']}%";
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                    ->orWhere('version', 'like', $search);
            });
        }

        $quoteVersions = $query
            ->orderBy('is_active', 'desc')
            ->orderBy('effective_date', 'desc')
            ->get()
            ->map(function ($qv) {
                return [
                    'id' => $qv->id,
                    'version' => $qv->version,
                    'name' => $qv->name,
                    'description' => $qv->description,
                    'is_active' => (bool) $qv->is_active,
                    'effective_date' => $qv->effective_date?->toDateString(),
                    'leads_count' => $qv->leads_count ?? 0,
                    'items' => $qv->items->groupBy('category')->map(function ($group, $category) {
                        return [
                            'category' => $category,
                            'items' => $group->map(function ($item) {
                                return [
                                    'id' => $item->id,
                                    'name' => $item->name,
                                    'price' => round((float) $item->price, 2),
                                    'unit' => $item->unit,
                                ];
                            })->values()->toArray(),
                            'total' => round((float) $group->sum('price'), 2),
                        ];
                    })->values()->toArray(),
                    'grand_total' => round((float) $qv->items->sum('price'), 2),
                    'created_at' => $qv->created_at?->toDateTimeString(),
                ];
            })
            ->toArray();

        return Inertia::render('References/QuoteVersions', [
            'filters' => [
                'is_active' => $validated['is_active'] ?? null,
                'search' => $validated['search'] ?? null,
            ],
            'quoteVersions' => $quoteVersions,
        ]);
    }
}
