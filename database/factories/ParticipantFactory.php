<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Participant>
 */
class ParticipantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'room_id' => \App\Models\Room::factory(),
            'name' => fake()->name(),
            'role' => 'guest',
            'token' => \Illuminate\Support\Str::random(32),
            'livekit_identity' => \Illuminate\Support\Str::random(32),
            'is_connected' => false,
        ];
    }
}
