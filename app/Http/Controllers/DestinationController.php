<?php

namespace App\Http\Controllers;

use App\DestinationType;
use App\Models\Destination;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DestinationController extends Controller
{
    public function store(Request $request, Room $room): JsonResponse
    {
        // Ensure user owns the room
        if ($room->user_id !== $request->user()->id) {
            abort(403, 'You can only manage destinations for your own rooms.');
        }

        $validated = $request->validate([
            'type' => ['required', 'string', Rule::enum(DestinationType::class)],
            'name' => ['required', 'string', 'max:255'],
            'rtmp_url' => ['required', 'string', 'max:500'],
            'stream_key' => ['required', 'string', 'max:500'],
        ]);

        $destination = $room->destinations()->create([
            'type' => $validated['type'],
            'name' => $validated['name'],
            'config' => [
                'url' => $validated['rtmp_url'],
                'key' => $validated['stream_key'],
            ],
            'is_enabled' => true,
        ]);

        return response()->json([
            'data' => [
                'id' => $destination->id,
                'type' => $destination->type->value,
                'name' => $destination->name,
                'is_enabled' => $destination->is_enabled,
            ],
        ], 201);
    }

    public function update(Request $request, Room $room, Destination $destination): JsonResponse
    {
        // Ensure user owns the room
        if ($room->user_id !== $request->user()->id) {
            abort(403, 'You can only manage destinations for your own rooms.');
        }

        // Ensure destination belongs to the room
        if ($destination->room_id !== $room->id) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'rtmp_url' => ['sometimes', 'string', 'max:500'],
            'stream_key' => ['sometimes', 'string', 'max:500'],
            'is_enabled' => ['sometimes', 'boolean'],
        ]);

        $updateData = [];

        if (isset($validated['name'])) {
            $updateData['name'] = $validated['name'];
        }

        if (isset($validated['is_enabled'])) {
            $updateData['is_enabled'] = $validated['is_enabled'];
        }

        if (isset($validated['rtmp_url']) || isset($validated['stream_key'])) {
            $config = $destination->config ?? [];
            if (isset($validated['rtmp_url'])) {
                $config['url'] = $validated['rtmp_url'];
            }
            if (isset($validated['stream_key'])) {
                $config['key'] = $validated['stream_key'];
            }
            $updateData['config'] = $config;
        }

        $destination->update($updateData);

        return response()->json([
            'data' => [
                'id' => $destination->id,
                'type' => $destination->type->value,
                'name' => $destination->name,
                'is_enabled' => $destination->is_enabled,
            ],
        ]);
    }

    public function destroy(Request $request, Room $room, Destination $destination): JsonResponse
    {
        // Ensure user owns the room
        if ($room->user_id !== $request->user()->id) {
            abort(403, 'You can only manage destinations for your own rooms.');
        }

        // Ensure destination belongs to the room
        if ($destination->room_id !== $room->id) {
            abort(404);
        }

        $destination->delete();

        return response()->json([
            'message' => 'Destination deleted successfully.',
        ]);
    }

    public function toggle(Request $request, Room $room, Destination $destination): JsonResponse
    {
        // Ensure user owns the room
        if ($room->user_id !== $request->user()->id) {
            abort(403, 'You can only manage destinations for your own rooms.');
        }

        // Ensure destination belongs to the room
        if ($destination->room_id !== $room->id) {
            abort(404);
        }

        $destination->update([
            'is_enabled' => ! $destination->is_enabled,
        ]);

        return response()->json([
            'data' => [
                'id' => $destination->id,
                'is_enabled' => $destination->is_enabled,
            ],
        ]);
    }
}
