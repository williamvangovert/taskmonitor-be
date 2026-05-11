<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', auth()->id())
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($notifications);
    }

    public function markRead($id)
    {
        Notification::where('id', $id)
            ->where('user_id', auth()->id())
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Notifikasi ditandai dibaca.']);
    }

    public function markAllRead()
    {
        Notification::where('user_id', auth()->id())
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Semua notifikasi ditandai dibaca.']);
    }
}