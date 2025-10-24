<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Room;
use App\Models\Scene;
use App\Models\User;
use App\LayoutType;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final readonly class CreateRoomAction
{
    public function handle(User $user, string $name): Room
    {
        return DB::transaction(function () use ($user, $name): Room {
            $slug = $this->generateUniqueSlug($name);

            $room = Room::create([
                'user_id' => $user->id,
                'name' => $name,
                'slug' => $slug,
                'livekit_room_name' => $slug,
            ]);

            Scene::create([
                'room_id' => $room->id,
                'layout' => LayoutType::Solo,
                'is_active' => true,
            ]);

            return $room;
        });
    }

    private function generateUniqueSlug(string $name): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;

        while (Room::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}
