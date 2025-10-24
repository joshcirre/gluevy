<?php

namespace App\Models;

use App\LayoutType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Scene extends Model
{
    /** @use HasFactory<\Database\Factories\SceneFactory> */
    use HasFactory;

    protected $fillable = [
        'room_id',
        'layout',
        'overlays',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'layout' => LayoutType::class,
            'overlays' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function activate(): void
    {
        $this->room->scenes()->update(['is_active' => false]);
        $this->update(['is_active' => true]);
    }
}
