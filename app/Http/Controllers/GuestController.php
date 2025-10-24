<?php

namespace App\Http\Controllers;

use App\Models\Participant;
use App\Models\Room;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GuestController extends Controller
{
    public function join(string $roomSlug, string $token): Response
    {
        $room = Room::where('slug', $roomSlug)->firstOrFail();

        $participant = Participant::where('token', $token)
            ->where('room_id', $room->id)
            ->firstOrFail();

        return Inertia::render('guest/Join', [
            'room' => [
                'id' => $room->id,
                'name' => $room->name,
                'slug' => $room->slug,
            ],
            'participant' => [
                'id' => $participant->id,
                'name' => $participant->name,
                'role' => $participant->role,
                'token' => $participant->token,
            ],
        ]);
    }
}
