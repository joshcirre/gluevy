<?php

namespace App\Http\Controllers;

use App\Models\Participant;
use App\Models\Room;
use App\ParticipantRole;
use App\Services\LiveKitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GuestController extends Controller
{
    public function __construct(
        private readonly LiveKitService $liveKitService
    ) {}

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

    public function getLiveKitToken(Request $request, string $roomSlug): JsonResponse
    {
        $request->validate([
            'participant_token' => ['required', 'string'],
        ]);

        $room = Room::where('slug', $roomSlug)->firstOrFail();

        $participant = Participant::where('token', $request->input('participant_token'))
            ->where('room_id', $room->id)
            ->firstOrFail();

        $permissions = $participant->role === ParticipantRole::Host ? [
            'canPublish' => true,
            'canSubscribe' => true,
            'canPublishData' => true,
            'canUpdateMetadata' => true,
        ] : [
            'canPublish' => true,
            'canSubscribe' => true,
            'canPublishData' => false,
            'canUpdateMetadata' => false,
        ];

        $liveKitToken = $this->liveKitService->generateAccessToken(
            roomName: $room->slug,
            participantIdentity: (string) $participant->id,
            participantName: $participant->name,
            permissions: $permissions
        );

        // Mark participant as connected
        $participant->update([
            'is_connected' => true,
            'joined_at' => now(),
        ]);

        return response()->json([
            'data' => [
                'access_token' => $liveKitToken,
                'ws_url' => $this->liveKitService->getWsUrl(),
                'participant' => [
                    'id' => $participant->id,
                    'name' => $participant->name,
                    'role' => $participant->role,
                ],
            ],
        ]);
    }
}
