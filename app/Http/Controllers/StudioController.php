<?php

namespace App\Http\Controllers;

use App\Actions\GenerateParticipantTokenAction;
use App\Models\Room;
use App\ParticipantRole;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudioController extends Controller
{
    public function __construct(
        private readonly GenerateParticipantTokenAction $generateParticipantTokenAction
    ) {}

    public function show(Request $request, Room $room): Response
    {
        if ($room->user_id !== $request->user()->id) {
            abort(403, 'You can only access your own studio.');
        }

        // Create or get host participant for the studio owner
        $hostParticipant = $room->participants()
            ->where('role', ParticipantRole::Host)
            ->where('name', $request->user()->name)
            ->first();

        if (!$hostParticipant) {
            $hostParticipant = $this->generateParticipantTokenAction->handle(
                room: $room,
                name: $request->user()->name,
                role: ParticipantRole::Host
            );
        }

        $room->load([
            'participants',
            'destinations',
            'scenes' => function ($query) {
                $query->orderBy('created_at', 'desc');
            },
        ]);

        return Inertia::render('studio/Show', [
            'room' => [
                'id' => $room->id,
                'name' => $room->name,
                'slug' => $room->slug,
                'status' => $room->status,
                'livekit_room_name' => $room->livekit_room_name,
                'participants' => $room->participants->map(fn($participant) => [
                    'id' => $participant->id,
                    'name' => $participant->name,
                    'role' => $participant->role,
                    'is_connected' => $participant->is_connected,
                    'joined_at' => $participant->joined_at,
                ]),
                'destinations' => $room->destinations->map(fn($destination) => [
                    'id' => $destination->id,
                    'type' => $destination->type,
                    'name' => $destination->name,
                    'is_enabled' => $destination->is_enabled,
                ]),
                'active_scene' => $room->activeScene() ? [
                    'id' => $room->activeScene()->id,
                    'layout' => $room->activeScene()->layout,
                    'overlays' => $room->activeScene()->overlays,
                ] : null,
                'scenes' => $room->scenes->map(fn($scene) => [
                    'id' => $scene->id,
                    'layout' => $scene->layout,
                    'overlays' => $scene->overlays,
                    'is_active' => $scene->is_active,
                ]),
            ],
            'host_participant_token' => $hostParticipant->token,
        ]);
    }
}
