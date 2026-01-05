<?php

use App\Models\Destination;
use App\Models\Room;
use App\Models\User;
use App\Services\LiveKitEgressService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Mock the LiveKitEgressService to avoid actual API calls
    $this->mock(LiveKitEgressService::class, function ($mock) {
        $mock->shouldReceive('startStreaming')
            ->andReturn(['egress_id' => 'test-egress-123', 'status' => 'EGRESS_STARTING']);

        $mock->shouldReceive('stopEgress')
            ->andReturn(['egress_id' => 'test-egress-123', 'status' => 'EGRESS_ENDING']);

        $mock->shouldReceive('startRecording')
            ->andReturn(['egress_id' => 'test-record-456', 'status' => 'EGRESS_STARTING']);

        $mock->shouldReceive('startStreamingAndRecording')
            ->andReturn(['egress_id' => 'test-both-789', 'status' => 'EGRESS_STARTING']);

        $mock->shouldReceive('listEgress')
            ->andReturn([]);
    });
});

it('cannot start streaming without authentication', function () {
    $room = Room::factory()->create();

    $response = $this->postJson("/studio/{$room->id}/stream/start");

    $response->assertStatus(401);
});

it('cannot start streaming for another users room', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $room = Room::factory()->for($owner)->create();

    $response = $this->actingAs($other)->postJson("/studio/{$room->id}/stream/start");

    $response->assertStatus(403);
});

it('cannot start streaming without enabled destinations', function () {
    $user = User::factory()->create();
    $room = Room::factory()->for($user)->create();

    $response = $this->actingAs($user)->postJson("/studio/{$room->id}/stream/start");

    $response->assertStatus(400)
        ->assertJson(['error' => 'No enabled destinations configured. Add at least one streaming destination.']);
});

it('can start streaming with enabled destinations', function () {
    $user = User::factory()->create();
    $room = Room::factory()->for($user)->create();
    Destination::factory()->for($room)->enabled()->create();

    $response = $this->actingAs($user)->postJson("/studio/{$room->id}/stream/start");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'egress_id' => 'test-egress-123',
        ]);

    $this->assertDatabaseHas('rooms', [
        'id' => $room->id,
        'is_streaming' => true,
        'streaming_egress_id' => 'test-egress-123',
    ]);
});

it('cannot start streaming when already streaming', function () {
    $user = User::factory()->create();
    $room = Room::factory()->for($user)->create([
        'is_streaming' => true,
        'streaming_egress_id' => 'existing-egress',
    ]);
    Destination::factory()->for($room)->enabled()->create();

    $response = $this->actingAs($user)->postJson("/studio/{$room->id}/stream/start");

    $response->assertStatus(400)
        ->assertJson(['error' => 'Room is already streaming']);
});

it('can stop streaming', function () {
    $user = User::factory()->create();
    $room = Room::factory()->for($user)->create([
        'is_streaming' => true,
        'streaming_egress_id' => 'test-egress-123',
        'streaming_started_at' => now(),
    ]);

    $response = $this->actingAs($user)->postJson("/studio/{$room->id}/stream/stop");

    $response->assertStatus(200)
        ->assertJson(['success' => true]);

    $this->assertDatabaseHas('rooms', [
        'id' => $room->id,
        'is_streaming' => false,
        'streaming_egress_id' => null,
    ]);
});

it('cannot stop streaming when not streaming', function () {
    $user = User::factory()->create();
    $room = Room::factory()->for($user)->create([
        'is_streaming' => false,
    ]);

    $response = $this->actingAs($user)->postJson("/studio/{$room->id}/stream/stop");

    $response->assertStatus(400)
        ->assertJson(['error' => 'Room is not currently streaming']);
});

it('can start recording', function () {
    $user = User::factory()->create();
    $room = Room::factory()->for($user)->create();

    $response = $this->actingAs($user)->postJson("/studio/{$room->id}/record/start");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'egress_id' => 'test-record-456',
        ]);

    $this->assertDatabaseHas('rooms', [
        'id' => $room->id,
        'is_recording' => true,
        'recording_egress_id' => 'test-record-456',
    ]);

    $this->assertDatabaseHas('recordings', [
        'room_id' => $room->id,
        'livekit_egress_id' => 'test-record-456',
    ]);
});

it('cannot start recording when already recording', function () {
    $user = User::factory()->create();
    $room = Room::factory()->for($user)->create([
        'is_recording' => true,
        'recording_egress_id' => 'existing-record',
    ]);

    $response = $this->actingAs($user)->postJson("/studio/{$room->id}/record/start");

    $response->assertStatus(400)
        ->assertJson(['error' => 'Room is already recording']);
});

it('can stop recording', function () {
    $user = User::factory()->create();
    $room = Room::factory()->for($user)->create([
        'is_recording' => true,
        'recording_egress_id' => 'test-record-456',
        'recording_started_at' => now(),
    ]);

    $response = $this->actingAs($user)->postJson("/studio/{$room->id}/record/stop");

    $response->assertStatus(200)
        ->assertJson(['success' => true]);

    $this->assertDatabaseHas('rooms', [
        'id' => $room->id,
        'is_recording' => false,
        'recording_egress_id' => null,
    ]);
});

it('can get egress status', function () {
    $user = User::factory()->create();
    $room = Room::factory()->for($user)->create([
        'is_streaming' => true,
        'streaming_egress_id' => 'test-stream',
        'streaming_started_at' => now()->subMinutes(5),
        'is_recording' => true,
        'recording_egress_id' => 'test-record',
        'recording_started_at' => now()->subMinutes(3),
    ]);

    $response = $this->actingAs($user)->getJson("/studio/{$room->id}/egress/status");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'is_streaming',
            'streaming_egress_id',
            'streaming_started_at',
            'streaming_duration',
            'is_recording',
            'recording_egress_id',
            'recording_started_at',
            'recording_duration',
        ]);
});

it('can start both streaming and recording', function () {
    $user = User::factory()->create();
    $room = Room::factory()->for($user)->create();
    Destination::factory()->for($room)->enabled()->create();

    $response = $this->actingAs($user)->postJson("/studio/{$room->id}/go-live");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'egress_id' => 'test-both-789',
        ]);

    $this->assertDatabaseHas('rooms', [
        'id' => $room->id,
        'is_streaming' => true,
        'is_recording' => true,
    ]);

    $this->assertDatabaseHas('recordings', [
        'room_id' => $room->id,
        'livekit_egress_id' => 'test-both-789',
    ]);
});
