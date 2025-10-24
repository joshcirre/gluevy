<?php

use App\Actions\CreateRoomAction;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);
use App\Models\Room;
use App\Models\Scene;
use App\Models\User;
use App\LayoutType;

it('creates a room with a default scene', function () {
    $user = User::factory()->create();
    $action = new CreateRoomAction();

    $room = $action->handle($user, 'Test Room');

    expect($room)->toBeInstanceOf(Room::class)
        ->and($room->name)->toBe('Test Room')
        ->and($room->slug)->toBe('test-room')
        ->and($room->user_id)->toBe($user->id)
        ->and($room->livekit_room_name)->toBe('test-room');

    expect($room->scenes)->toHaveCount(1)
        ->and($room->scenes->first()->layout)->toBe(LayoutType::Solo)
        ->and($room->scenes->first()->is_active)->toBeTrue();
});

it('generates unique slugs for rooms with the same name', function () {
    $user = User::factory()->create();
    $action = new CreateRoomAction();

    $room1 = $action->handle($user, 'Duplicate Room');
    $room2 = $action->handle($user, 'Duplicate Room');

    expect($room1->slug)->toBe('duplicate-room')
        ->and($room2->slug)->toBe('duplicate-room-1');
});

it('handles special characters in room names', function () {
    $user = User::factory()->create();
    $action = new CreateRoomAction();

    $room = $action->handle($user, 'My Room & Show!');

    expect($room->slug)->toBe('my-room-show');
});
