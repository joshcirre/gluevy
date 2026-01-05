<?php

use App\Models\Room;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('can create a room via API', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/rooms', [
        'name' => 'My Test Room',
    ]);

    $response->assertCreated()
        ->assertJson([
            'data' => [
                'name' => 'My Test Room',
                'slug' => 'my-test-room',
                'status' => 'active',
            ],
        ]);

    $this->assertDatabaseHas('rooms', [
        'name' => 'My Test Room',
        'slug' => 'my-test-room',
        'user_id' => $user->id,
    ]);
});

it('requires authentication to create a room', function () {
    $response = $this->postJson('/api/rooms', [
        'name' => 'Test Room',
    ]);

    $response->assertUnauthorized();
});

it('validates room name is required', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/rooms', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('can generate a participant token', function () {
    $user = User::factory()->create();
    $room = Room::factory()->create(['user_id' => $user->id]);
    Sanctum::actingAs($user);

    $response = $this->postJson("/api/rooms/{$room->id}/token", [
        'name' => 'John Doe',
        'role' => 'guest',
    ]);

    $response->assertSuccessful()
        ->assertJsonStructure([
            'data' => [
                'token',
                'participant' => [
                    'id',
                    'name',
                    'role',
                ],
            ],
        ]);

    $this->assertDatabaseHas('participants', [
        'room_id' => $room->id,
        'name' => 'John Doe',
        'role' => 'guest',
    ]);
});

it('can access studio page for own room', function () {
    $user = User::factory()->create();
    $room = Room::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->get("/studio/{$room->id}");

    $response->assertSuccessful();
});

it('cannot access studio page for other users room', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $room = Room::factory()->create(['user_id' => $otherUser->id]);

    $response = $this->actingAs($user)->get("/studio/{$room->id}");

    $response->assertForbidden();
});

it('can access guest join page with valid token', function () {
    $room = Room::factory()->create();
    $participant = \App\Models\Participant::factory()->create([
        'room_id' => $room->id,
    ]);

    $response = $this->get("/join/{$room->slug}/{$participant->token}");

    $response->assertSuccessful();
});

it('returns 404 for invalid room slug', function () {
    $response = $this->get('/join/nonexistent-room/some-token');

    $response->assertNotFound();
});

it('returns 404 for invalid participant token', function () {
    $room = Room::factory()->create();

    $response = $this->get("/join/{$room->slug}/invalid-token");

    $response->assertNotFound();
});

it('guest can get livekit token with valid participant token', function () {
    $room = Room::factory()->create();
    $participant = \App\Models\Participant::factory()->create([
        'room_id' => $room->id,
    ]);

    $response = $this->postJson("/join/{$room->slug}/livekit-token", [
        'participant_token' => $participant->token,
    ]);

    $response->assertSuccessful()
        ->assertJsonStructure([
            'data' => [
                'access_token',
                'ws_url',
                'participant' => [
                    'id',
                    'name',
                    'role',
                ],
            ],
        ]);

    // Participant should be marked as connected
    $this->assertDatabaseHas('participants', [
        'id' => $participant->id,
        'is_connected' => true,
    ]);
});

it('guest cannot get livekit token with invalid participant token', function () {
    $room = Room::factory()->create();

    $response = $this->postJson("/join/{$room->slug}/livekit-token", [
        'participant_token' => 'invalid-token',
    ]);

    $response->assertNotFound();
});
