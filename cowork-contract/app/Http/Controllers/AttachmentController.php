<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Contract;
use App\Models\OperationLog;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'attachable_type' => 'required|string',
            'attachable_id' => 'required|integer',
        ]);

        $model = $this->resolveModel($request->input('attachable_type'), $request->input('attachable_id'));

        return JsonResource::collection($model->attachments()->with('uploader')->get());
    }

    public function upload(Request $request): JsonResource
    {
        $request->validate([
            'attachable_type' => 'required|string',
            'attachable_id' => 'required|integer',
            'file' => 'required|file|max:10240',
        ]);

        $model = $this->resolveModel($request->input('attachable_type'), $request->input('attachable_id'));

        $file = $request->file('file');
        $path = $file->store('attachments', 'local');

        $attachment = $model->attachments()->create([
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);

        OperationLog::create([
            'user_id' => $request->user()->id,
            'action' => 'upload_attachment',
            'subject_type' => Attachment::class,
            'subject_id' => $attachment->id,
            'payload' => ['file_name' => $attachment->file_name],
            'ip_address' => $request->ip(),
        ]);

        return new JsonResource($attachment->load('uploader'));
    }

    public function download(Attachment $attachment): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        if (!Storage::disk('local')->exists($attachment->file_path)) {
            abort(404, 'File not found.');
        }

        return Storage::disk('local')->download($attachment->file_path, $attachment->file_name);
    }

    public function destroy(Request $request, Attachment $attachment): JsonResponse
    {
        if (Storage::disk('local')->exists($attachment->file_path)) {
            Storage::disk('local')->delete($attachment->file_path);
        }

        OperationLog::create([
            'user_id' => $request->user()->id,
            'action' => 'delete_attachment',
            'subject_type' => Attachment::class,
            'subject_id' => $attachment->id,
            'payload' => ['file_name' => $attachment->file_name],
            'ip_address' => $request->ip(),
        ]);

        $attachment->delete();

        return response()->json(null, 204);
    }

    private function resolveModel(string $type, int $id)
    {
        $classMap = [
            'contract' => Contract::class,
            'property' => Property::class,
        ];

        $class = $classMap[$type] ?? null;

        if (!$class) {
            abort(400, 'Invalid attachable type.');
        }

        return $class::findOrFail($id);
    }
}
