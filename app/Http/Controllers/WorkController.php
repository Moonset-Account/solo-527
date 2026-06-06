<?php

namespace App\Http\Controllers;

use App\Models\Work;
use App\Models\WorkPhoto;
use App\Services\PhotoStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WorkController extends Controller
{
    protected PhotoStorageService $photoStorageService;

    public function __construct(PhotoStorageService $photoStorageService)
    {
        $this->photoStorageService = $photoStorageService;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Work::with(['student', 'clay', 'glazes', 'current_batch']);

        if ($user->isStudent()) {
            $query->where('student_id', $user->id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('student_id') && $user->isTeacher()) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('for_exhibition')) {
            $query->where('for_exhibition', true);
        }

        $works = $query->latest()->paginate(15);

        if ($user->isStudent()) {
            $works->through(function ($work) use ($user) {
                if (!$work->canViewFailureDetails($user)) {
                    $work->makeHidden(['breakage_reason', 'compensation_status', 'compensation_notes']);
                }
                return $work;
            });
        }

        return response()->json($works);
    }

    public function show(Request $request, Work $work)
    {
        $user = $request->user();

        if (!$work->isVisibleTo($user)) {
            return response()->json(['message' => '无权查看此作品'], 403);
        }

        $work->load(['student', 'clay', 'glazes', 'photos', 'kilnBatches.kiln']);

        if (!$work->canViewFailureDetails($user)) {
            $work->makeHidden(['breakage_reason', 'compensation_status', 'compensation_notes']);
        }

        return response()->json($work);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'title' => 'required|string|max:255',
            'clay_id' => 'required|exists:clays,id',
            'description' => 'nullable|string',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'depth' => 'nullable|numeric|min:0',
            'estimated_volume' => 'nullable|numeric|min:0',
            'temperature_zone_preference' => 'nullable|integer',
            'glazes' => 'nullable|array',
            'glazes.*.id' => 'exists:glazes,id',
            'glazes.*.layer_number' => 'integer|min:1',
        ]);

        $work = Work::create([
            'title' => $request->title,
            'student_id' => $user->isStudent() ? $user->id : $request->student_id,
            'clay_id' => $request->clay_id,
            'description' => $request->description,
            'width' => $request->width,
            'height' => $request->height,
            'depth' => $request->depth,
            'estimated_volume' => $request->estimated_volume,
            'temperature_zone_preference' => $request->temperature_zone_preference,
            'status' => 'created',
        ]);

        if ($request->has('glazes')) {
            foreach ($request->glazes as $glazeData) {
                $work->glazes()->attach($glazeData['id'], [
                    'layer_number' => $glazeData['layer_number'] ?? 1,
                    'notes' => $glazeData['notes'] ?? null,
                ]);
            }
        }

        return response()->json($work->load(['clay', 'glazes']), 201);
    }

    public function update(Request $request, Work $work)
    {
        $user = $request->user();

        if (!$work->isVisibleTo($user)) {
            return response()->json(['message' => '无权修改此作品'], 403);
        }

        $request->validate([
            'title' => 'string|max:255',
            'clay_id' => 'exists:clays,id',
            'description' => 'nullable|string',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'depth' => 'nullable|numeric|min:0',
            'status' => 'in:created,drying,bisque_fired,glazing,ready_for_firing,completed',
            'for_exhibition' => 'boolean',
            'breakage_reason' => 'nullable|string',
            'compensation_status' => 'in:none,pending,approved,paid,rejected',
        ]);

        $work->update($request->except(['glazes']));

        return response()->json($work->fresh());
    }

    public function uploadPhoto(Request $request, Work $work)
    {
        $user = $request->user();

        if (!$work->isVisibleTo($user)) {
            return response()->json(['message' => '无权操作此作品'], 403);
        }

        $request->validate([
            'photo' => 'required|image|max:10240',
            'type' => 'required|in:creation,bisque,glazed,pre_firing,post_firing,detail',
            'caption' => 'nullable|string',
        ]);

        $photo = $this->photoStorageService->storePhoto(
            $work,
            $request->file('photo'),
            $request->type,
            $request->caption
        );

        return response()->json($photo, 201);
    }

    public function deletePhoto(Work $work, WorkPhoto $photo)
    {
        if ($photo->work_id !== $work->id) {
            return response()->json(['message' => '照片不属于此作品'], 400);
        }

        $this->photoStorageService->deletePhoto($photo);

        return response()->json(['message' => '照片已删除']);
    }

    public function destroy(Work $work)
    {
        $user = Auth::user();

        if (!$work->isVisibleTo($user)) {
            return response()->json(['message' => '无权删除此作品'], 403);
        }

        if ($work->is_scheduled) {
            return response()->json(['message' => '已排烧的作品无法删除'], 422);
        }

        $work->delete();

        return response()->json(['message' => '作品已删除']);
    }
}
