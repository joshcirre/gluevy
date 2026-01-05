<?php

namespace Database\Factories;

use App\DestinationType;
use App\Models\Room;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Destination>
 */
class DestinationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'room_id' => Room::factory(),
            'type' => fake()->randomElement(DestinationType::cases()),
            'name' => fake()->words(2, true).' Stream',
            'config' => [
                'url' => 'rtmp://live.example.com/live',
                'key' => fake()->uuid(),
            ],
            'is_enabled' => true,
        ];
    }

    public function youtube(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => DestinationType::Youtube,
            'name' => 'YouTube Live',
            'config' => [
                'url' => 'rtmp://a.rtmp.youtube.com/live2',
                'key' => fake()->uuid(),
            ],
        ]);
    }

    public function twitch(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => DestinationType::Twitch,
            'name' => 'Twitch Stream',
            'config' => [
                'url' => 'rtmp://live.twitch.tv/app',
                'key' => 'live_'.fake()->uuid(),
            ],
        ]);
    }

    public function disabled(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_enabled' => false,
        ]);
    }

    public function enabled(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_enabled' => true,
        ]);
    }
}
