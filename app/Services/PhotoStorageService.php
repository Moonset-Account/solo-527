<?php

namespace App\Services;

use App\Models\Work;
use App\Models\WorkPhoto;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Facades\Image;

class PhotoStorageService
{
    public function storePhoto(Work $work, UploadedFile $file, string $type, ?string $caption = null): WorkPhoto
    {
        $workId = $work->id;
        $timestamp = now()->timestamp;
        $extension = $file->getClientOriginalExtension();

        $fileName = "work_{$workId}_{$timestamp}.{$extension}";
        $thumbnailName = "work_{$workId}_{$timestamp}_thumb.{$extension}";

        $directory = "works/{$workId}";

        $originalPath = $file->storeAs($directory, $fileName, 'public');

        $thumbnail = Image::make($file->getRealPath())
            ->resize(300, 300, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            })
            ->encode($extension, 80);

        Storage::disk('public')->put("{$directory}/{$thumbnailName}", $thumbnail->__toString());

        $sortOrder = $work->photos()->max('sort_order') + 1;

        return $work->photos()->create([
            'file_path' => $originalPath,
            'thumbnail_path' => "{$directory}/{$thumbnailName}",
            'type' => $type,
            'caption' => $caption,
            'sort_order' => $sortOrder,
        ]);
    }

    public function deletePhoto(WorkPhoto $photo): bool
    {
        Storage::disk('public')->delete($photo->file_path);
        if ($photo->thumbnail_path) {
            Storage::disk('public')->delete($photo->thumbnail_path);
        }

        return $photo->delete();
    }

    public function getPhotosByType(Work $work, string $type)
    {
        return $work->photos()->where('type', $type)->get();
    }

    public function reorderPhotos(Work $work, array $photoIds): void
    {
        foreach ($photoIds as $index => $photoId) {
            WorkPhoto::where('work_id', $work->id)
                ->where('id', $photoId)
                ->update(['sort_order' => $index]);
        }
    }
}
