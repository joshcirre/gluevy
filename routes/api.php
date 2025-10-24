<?php

use App\Http\Controllers\Api\RoomController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/rooms', [RoomController::class, 'store']);
    Route::post('/rooms/{room}/token', [RoomController::class, 'generateToken']);
    Route::post('/rooms/{room}/livekit-token', [RoomController::class, 'getLiveKitToken']);
});
