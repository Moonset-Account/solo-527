<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSavedFilterRequest;
use App\Http\Requests\UpdateSavedFilterRequest;
use App\Http\Resources\SavedFilterResource;
use App\Models\SavedFilter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SavedFilterController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $request->user()->savedFilters();

        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        return SavedFilterResource::collection($query->get());
    }

    public function store(StoreSavedFilterRequest $request): SavedFilterResource
    {
        $savedFilter = $request->user()->savedFilters()->create($request->validated());

        return new SavedFilterResource($savedFilter);
    }

    public function show(int $id): SavedFilterResource
    {
        $savedFilter = SavedFilter::findOrFail($id);

        $this->authorize('view', $savedFilter);

        return new SavedFilterResource($savedFilter);
    }

    public function update(UpdateSavedFilterRequest $request, int $id): SavedFilterResource
    {
        $savedFilter = SavedFilter::findOrFail($id);

        $this->authorize('update', $savedFilter);

        $savedFilter->update($request->validated());

        return new SavedFilterResource($savedFilter);
    }

    public function destroy(int $id): JsonResponse
    {
        $savedFilter = SavedFilter::findOrFail($id);

        $this->authorize('delete', $savedFilter);

        $savedFilter->delete();

        return response()->json(null, 204);
    }
}
