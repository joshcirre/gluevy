<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GuestController;
use App\Http\Controllers\StudioController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/join/{room}/{token}', [GuestController::class, 'join'])->name('guest.join');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('rooms', [DashboardController::class, 'store'])->name('rooms.store');

    Route::get('/studio/{room}', [StudioController::class, 'show'])->name('studio.show');
    Route::post('/studio/{room}/livekit-token', [App\Http\Controllers\Api\RoomController::class, 'getLiveKitToken'])->name('studio.livekit-token');
    Route::post('/studio/{room}/invite-token', [App\Http\Controllers\Api\RoomController::class, 'generateToken'])->name('studio.invite-token');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
