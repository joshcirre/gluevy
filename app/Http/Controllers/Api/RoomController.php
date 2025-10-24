<?php

namespace App\Http\Controllers\Api;

use App\Actions\CreateRoomAction;
use App\Actions\GenerateParticipantTokenAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateRoomRequest;
use App\Models\Participant;
use App\Models\Room;
use App\ParticipantRole;
use App\Services\LiveKitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function __construct(
        private readonly CreateRoomAction $createRoomAction,
        private readonly GenerateParticipantTokenAction $generateParticipantTokenAction,
        private readonly LiveKitService $liveKitService
    ) {}

    public function store(CreateRoomRequest $request): JsonResponse
    {
        $room = $this->createRoomAction->handle(
            user: $request->user(),
            name: $request->validated('name')
        );

        return response()->json([
            'data' => [
                'id' => $room->id,
                'name' => $room->name,
                'slug' => $room->slug,
                'status' => $room->status?->value ?? 'active',
                'created_at' => $room->created_at,
            ],
        ], 201);
    }

    public function generateToken(Request $request, Room $room): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'role' => ['sometimes', 'string', 'in:host,guest'],
        ]);

        $participant = $this->generateParticipantTokenAction->handle(
            room: $room,
            name: $request->input('name'),
            role: ParticipantRole::from($request->input('role', 'guest'))
        );

        return response()->json([
            'data' => [
                'token' => $participant->token,
                'participant' => [
                    'id' => $participant->id,
                    'name' => $participant->name,
                    'role' => $participant->role,
                ],
            ],
        ]);
    }

    public function getLiveKitToken(Request $request, Room $room): JsonResponse|RedirectResponse
    {
        $request->validate([
            'participant_token' => ['required', 'string'],
        ]);

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
            participantIdentity: $participant->id,
            participantName: $participant->name,
            permissions: $permissions
        );

        // For Inertia requests, return redirect back to studio with token data
        if (request()->header('X-Inertia')) {
            return redirect()->route('studio.show', $room)->with('livekit_token_data', [
                'access_token' => $liveKitToken,
                'ws_url' => $this->liveKitService->getWsUrl(),
                'participant' => [
                    'id' => $participant->id,
                    'name' => $participant->name,
                    'role' => $participant->role,
                ],
            ]);
        }

        // For fetch/AJAX requests, always return JSON
        if (request()->wantsJson() || request()->ajax()) {
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
