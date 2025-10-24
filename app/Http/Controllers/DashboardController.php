<?php

namespace App\Http\Controllers;

use App\Actions\CreateRoomAction;
use App\Http\Requests\CreateRoomRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $rooms = $user->rooms()
            ->withCount(['participants', 'destinations'])
            ->latest()
            ->get();

        return Inertia::render('dashboard', [
            'rooms' => $rooms->map(fn($room) => [
                'id' => $room->id,
                'name' => $room->name,
                'slug' => $room->slug,
                'status' => $room->status->value,
                'participants_count' => $room->participants_count,
                'destinations_count' => $room->destinations_count,
                'created_at' => $room->created_at,
                'studio_url' => route('studio.show', $room),
            ]),
        ]);
    }

    public function store(CreateRoomRequest $request, CreateRoomAction $createRoomAction): RedirectResponse
    {
        $room = $createRoomAction->handle(
            user: $request->user(),
            name: $request->validated('name')
        );

        return redirect()->route('dashboard')->with('success', "Room '{$room->name}' created successfully!");
    }
}
