<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    public function store(Request $request, $commentableType, $commentableId)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $commentableType = $this->getModelClass($commentableType);
        $commentable = $commentableType::findOrFail($commentableId);

        $comment = $commentable->comments()->create([
            'content' => $validated['content'],
            'user_id' => Auth::id(),
        ]);

        return redirect()->back()->with('success', '备注已添加');
    }

    public function destroy(Comment $comment)
    {
        if ($comment->user_id !== Auth::id()) {
            abort(403, '无权删除此备注');
        }

        $comment->delete();

        return redirect()->back()->with('success', '备注已删除');
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
