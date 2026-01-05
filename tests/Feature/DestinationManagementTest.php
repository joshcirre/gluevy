<?php

use App\Models\Destination;
use App\Models\Room;
use App\Models\User;

it('can create a destination for own room', function () {
    $user = User::factory()->create();
    $room = Room::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->postJson("/studio/{$room->id}/destinations", [
        'type' => 'youtube',
        'name' => 'My YouTube Stream',
        'rtmp_url' => 'rtmp://a.rtmp.youtube.com/live2',
        'stream_key' => 'my-secret-key',
    ]);

    $response->assertCreated()
        ->assertJsonStructure([
            'data' => [
                'id',
                'type',
                'name',
                'is_enabled',
            ],
        ]);

    $this->assertDatabaseHas('destinations', [
        'room_id' => $room->id,
        'type' => 'youtube',
        'name' => 'My YouTube Stream',
        'is_enabled' => true,
    ]);
});

it('cannot create a destination for another users room', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $room = Room::factory()->create(['user_id' => $otherUser->id]);

    $response = $this->actingAs($user)->postJson("/studio/{$room->id}/destinations", [
        'type' => 'youtube',
        'name' => 'My YouTube Stream',
        'rtmp_url' => 'rtmp://a.rtmp.youtube.com/live2',
        'stream_key' => 'my-secret-key',
    ]);

    $response->assertForbidden();
});

it('validates destination type is valid', function () {
    $user = User::factory()->create();
    $room = Room::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->postJson("/studio/{$room->id}/destinations", [
        'type' => 'invalid-type',
        'name' => 'My Stream',
        'rtmp_url' => 'rtmp://example.com/live',
        'stream_key' => 'key',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['type']);
});

it('can update a destination', function () {
    $user = User::factory()->create();
    $room = Room::factory()->create(['user_id' => $user->id]);
    $destination = Destination::factory()->create(['room_id' => $room->id]);

    $response = $this->actingAs($user)->patchJson("/studio/{$room->id}/destinations/{$destination->id}", [
        'name' => 'Updated Stream Name',
    ]);

    $response->assertSuccessful()
        ->assertJson([
            'data' => [
                'id' => $destination->id,
                'name' => 'Updated Stream Name',
            ],
        ]);

    $this->assertDatabaseHas('destinations', [
        'id' => $destination->id,
        'name' => 'Updated Stream Name',
    ]);
});

it('can toggle a destination', function () {
    $user = User::factory()->create();
    $room = Room::factory()->create(['user_id' => $user->id]);
    $destination = Destination::factory()->create([
        'room_id' => $room->id,
        'is_enabled' => true,
    ]);

    $response = $this->actingAs($user)->postJson("/studio/{$room->id}/destinations/{$destination->id}/toggle");

    $response->assertSuccessful()
        ->assertJson([
            'data' => [
                'id' => $destination->id,
                'is_enabled' => false,
            ],
        ]);

    $this->assertDatabaseHas('destinations', [
        'id' => $destination->id,
        'is_enabled' => false,
    ]);
});

it('can delete a destination', function () {
    $user = User::factory()->create();
    $room = Room::factory()->create(['user_id' => $user->id]);
    $destination = Destination::factory()->create(['room_id' => $room->id]);

    $response = $this->actingAs($user)->deleteJson("/studio/{$room->id}/destinations/{$destination->id}");

    $response->assertSuccessful()
        ->assertJson([
            'message' => 'Destination deleted successfully.',
        ]);

    $this->assertDatabaseMissing('destinations', [
        'id' => $destination->id,
    ]);
});

it('cannot delete a destination from another users room', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $room = Room::factory()->create(['user_id' => $otherUser->id]);
    $destination = Destination::factory()->create(['room_id' => $room->id]);

    $response = $this->actingAs($user)->deleteJson("/studio/{$room->id}/destinations/{$destination->id}");

    $response->assertForbidden();

    $this->assertDatabaseHas('destinations', [
        'id' => $destination->id,
    ]);
});
