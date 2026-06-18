<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function store(Request $request, $attachableType, $attachableId)
    {
        $validated = $request->validate([
            'files' => 'required|array',
            'files.*' => 'required|file|max:10240',
        ]);

        $attachableType = $this->getModelClass($attachableType);
        $attachable = $attachableType::findOrFail($attachableId);

        foreach ($validated['files'] as $file) {
            $path = $file->store('attachments', 'public');

            $attachable->attachments()->create([
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'user_id' => Auth::id(),
            ]);
        }

        return redirect()->back()->with('success', '附件已上传');
    }

    public function destroy(Attachment $attachment)
    {
        if ($attachment->user_id !== Auth::id()) {
            abort(403, '无权删除此附件');
        }

        Storage::disk('public')->delete($attachment->file_path);
        $attachment->delete();

        return redirect()->back()->with('success', '附件已删除');
    }

    public function download(Attachment $attachment)
    {
        return Storage::disk('public')->download($attachment->file_path, $attachment->file_name);
    }

    private function getModelClass($type)
    {
        $models = [
            'orders' => \App\Models\Order::class,
            'sorting-tasks' => \App\Models\SortingTask::class,
            'sorting-discrepancies' => \App\Models\SortingDiscrepancy::class,
            'shipments' => \App\Models\Shipment::class,
        ];

        return $models[$type] ?? abort(404, '无效的资源类型');
    }
}
