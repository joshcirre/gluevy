<?php

namespace App\Models;

use App\RoomStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    /** @use HasFactory<\Database\Factories\RoomFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'status',
        'user_id',
        'livekit_room_name',
        'is_streaming',
        'streaming_egress_id',
        'streaming_started_at',
        'is_recording',
        'recording_egress_id',
        'recording_started_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => RoomStatus::class,
            'is_streaming' => 'boolean',
            'streaming_started_at' => 'datetime',
            'is_recording' => 'boolean',
            'recording_started_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function participants(): HasMany
    {
        return $this->hasMany(Participant::class);
    }

    public function destinations(): HasMany
    {
        return $this->hasMany(Destination::class);
    }

    public function recordings(): HasMany
    {
        return $this->hasMany(Recording::class);
    }

    public function scenes(): HasMany
    {
        return $this->hasMany(Scene::class);
    }

    public function activeScene(): ?Scene
    {
        return $this->scenes()->where('is_active', true)->first();
    }

    /**
     * Get enabled destinations for streaming
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, Destination>
     */
    public function enabledDestinations()
    {
        return $this->destinations()->where('is_enabled', true)->get();
    }

    /**
     * Start streaming and update room state
     */
    public function startStreaming(string $egressId): void
    {
        $this->update([
            'is_streaming' => true,
            'streaming_egress_id' => $egressId,
            'streaming_started_at' => now(),
        ]);
    }

    /**
     * Stop streaming and update room state
     */
    public function stopStreaming(): void
    {
        $this->update([
            'is_streaming' => false,
            'streaming_egress_id' => null,
            'streaming_started_at' => null,
        ]);
    }

    /**
     * Start recording and update room state
     */
    public function startRecording(string $egressId): void
    {
        $this->update([
            'is_recording' => true,
            'recording_egress_id' => $egressId,
            'recording_started_at' => now(),
        ]);
    }

    /**
     * Stop recording and update room state
     */
    public function stopRecording(): void
    {
        $this->update([
            'is_recording' => false,
            'recording_egress_id' => null,
            'recording_started_at' => null,
        ]);
    }

    /**
     * Check if room has any active egress (streaming or recording)
     */
    public function hasActiveEgress(): bool
    {
        return $this->is_streaming || $this->is_recording;
    }

    /**
     * Get streaming duration in seconds
     */
    public function getStreamingDuration(): ?int
    {
        if (! $this->is_streaming || ! $this->streaming_started_at) {
            return null;
        }

        return now()->diffInSeconds($this->streaming_started_at);
    }

    /**
     * Get recording duration in seconds
     */
    public function getRecordingDuration(): ?int
    {
        if (! $this->is_recording || ! $this->recording_started_at) {
            return null;
        }

        return now()->diffInSeconds($this->recording_started_at);
    }
}
