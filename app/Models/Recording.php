<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Recording extends Model
{
    /** @use HasFactory<\Database\Factories\RecordingFactory> */
    use HasFactory;

    protected $fillable = [
        'room_id',
        'type',
        'file_url',
        'livekit_egress_id',
        'started_at',
        'ended_at',
        'file_size',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'file_size' => 'integer',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function isInProgress(): bool
    {
        return $this->started_at !== null && $this->ended_at === null;
    }

    public function getDurationInSeconds(): ?int
    {
        if ($this->started_at === null || $this->ended_at === null) {
            return null;
        }

        return $this->ended_at->diffInSeconds($this->started_at);
    }
}
