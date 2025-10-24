<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Participant;
use App\Models\Room;
use App\ParticipantRole;
use Illuminate\Support\Str;

final readonly class GenerateParticipantTokenAction
{
    public function handle(Room $room, string $name, ParticipantRole $role = ParticipantRole::Guest): Participant
    {
        $token = $this->generateUniqueToken();

        return Participant::create([
            'room_id' => $room->id,
            'name' => $name,
            'role' => $role,
            'token' => $token,
            'livekit_identity' => $token,
        ]);
    }

    private function generateUniqueToken(): string
    {
        do {
            $token = Str::random(32);
        } while (Participant::where('token', $token)->exists());

        return $token;
    }
}
