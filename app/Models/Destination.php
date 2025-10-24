<?php

namespace App\Models;

use App\DestinationType;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Destination extends Model
{
    /** @use HasFactory<\Database\Factories\DestinationFactory> */
    use HasFactory;

    protected $fillable = [
        'room_id',
        'type',
        'name',
        'config',
        'is_enabled',
    ];

    protected function casts(): array
    {
        return [
            'type' => DestinationType::class,
            'config' => 'encrypted:array',
            'is_enabled' => 'boolean',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function getRtmpUrl(): ?string
    {
        return $this->config['url'] ?? null;
    }

    public function getStreamKey(): ?string
    {
        return $this->config['key'] ?? null;
    }
}
