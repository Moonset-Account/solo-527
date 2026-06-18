<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

trait Filterable
{
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        foreach ($filters as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            $method = 'filter' . Str::studly($key);

            if (method_exists($this, $method)) {
                $this->$method($query, $value);
            } elseif (property_exists($this, 'filterable') && in_array($key, $this->filterable)) {
                if (is_array($value)) {
                    $query->whereIn($key, $value);
                } else {
                    $query->where($key, $value);
                }
            } else {
                $this->applyDefaultFilter($query, $key, $value);
            }
        }

        return $query;
    }

    public function scopeSearch(Builder $query, ?string $search, array $columns): Builder
    {
        if (!$search) {
            return $query;
        }

        return $query->where(function ($q) use ($search, $columns) {
            foreach ($columns as $column) {
                if (str_contains($column, '.')) {
                    [$relation, $relColumn] = explode('.', $column, 2);
                    $q->orWhereHas($relation, function ($subQuery) use ($relColumn, $search) {
                        $subQuery->where($relColumn, 'like', "%{$search}%");
                    });
                } else {
                    $q->orWhere($column, 'like', "%{$search}%");
                }
            }
        });
    }

    public function scopeSort(Builder $query, ?string $sortBy, ?string $sortDirection = 'asc'): Builder
    {
        if (!$sortBy) {
            return $query;
        }

        $direction = in_array(strtolower($sortDirection), ['asc', 'desc']) ? $sortDirection : 'asc';

        if (str_contains($sortBy, '.')) {
            [$relation, $column] = explode('.', $sortBy, 2);

            return $query->orderBy(
                static::select($column)
                    ->from((new static)->getTable() . ' as related')
                    ->whereColumn('related.id', (new static)->getTable() . '.id')
                    ->limit(1),
                $direction
            );
        }

        return $query->orderBy($sortBy, $direction);
    }

    protected function applyDefaultFilter(Builder $query, string $key, mixed $value): void
    {
        if (is_array($value)) {
            $query->whereIn($key, $value);
        } elseif (is_string($value) && $this->isLikeSearchable($key)) {
            $query->where($key, 'like', "%{$value}%");
        } else {
            $query->where($key, $value);
        }
    }

    protected function isLikeSearchable(string $key): bool
    {
        $likeColumns = property_exists($this, 'searchable') ? $this->searchable : [];

        return in_array($key, $likeColumns);
    }
}
