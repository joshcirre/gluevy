<?php

namespace App\Models;

use App\ParticipantRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Participant extends Model
{
    /** @use HasFactory<\Database\Factories\ParticipantFactory> */
    use HasFactory;

    protected $fillable = [
        'room_id',
        'name',
        'role',
        'token',
        'livekit_identity',
        'is_connected',
        'joined_at',
        'left_at',
    ];

    protected function casts(): array
    {
        return [
            'role' => ParticipantRole::class,
            'is_connected' => 'boolean',
            'joined_at' => 'datetime',
            'left_at' => 'datetime',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function isHost(): bool
    {
        return $this->role === ParticipantRole::Host;
    }

    public function isGuest(): bool
    {
        return $this->role === ParticipantRole::Guest;
    }
}
