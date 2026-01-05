<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EgressController;
use App\Http\Controllers\GuestController;
use App\Http\Controllers\StudioController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/join/{room}/{token}', [GuestController::class, 'join'])->name('guest.join');
Route::post('/join/{room}/livekit-token', [GuestController::class, 'getLiveKitToken'])->name('guest.livekit-token');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('rooms', [DashboardController::class, 'store'])->name('rooms.store');

    Route::get('/studio/{room}', [StudioController::class, 'show'])->name('studio.show');
    Route::post('/studio/{room}/livekit-token', [App\Http\Controllers\Api\RoomController::class, 'getLiveKitToken'])->name('studio.livekit-token');
    Route::post('/studio/{room}/invite-token', [App\Http\Controllers\Api\RoomController::class, 'generateToken'])->name('studio.invite-token');

    // Destination management
    Route::post('/studio/{room}/destinations', [App\Http\Controllers\DestinationController::class, 'store'])->name('destinations.store');
    Route::patch('/studio/{room}/destinations/{destination}', [App\Http\Controllers\DestinationController::class, 'update'])->name('destinations.update');
    Route::delete('/studio/{room}/destinations/{destination}', [App\Http\Controllers\DestinationController::class, 'destroy'])->name('destinations.destroy');
    Route::post('/studio/{room}/destinations/{destination}/toggle', [App\Http\Controllers\DestinationController::class, 'toggle'])->name('destinations.toggle');

    // Egress (Streaming & Recording)
    Route::post('/studio/{room}/stream/start', [EgressController::class, 'startStreaming'])->name('egress.stream.start');
    Route::post('/studio/{room}/stream/stop', [EgressController::class, 'stopStreaming'])->name('egress.stream.stop');
    Route::post('/studio/{room}/record/start', [EgressController::class, 'startRecording'])->name('egress.record.start');
    Route::post('/studio/{room}/record/stop', [EgressController::class, 'stopRecording'])->name('egress.record.stop');
    Route::post('/studio/{room}/go-live', [EgressController::class, 'startBoth'])->name('egress.start-both');
    Route::get('/studio/{room}/egress/status', [EgressController::class, 'status'])->name('egress.status');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
