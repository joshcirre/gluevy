<?php

namespace App\Http\Controllers;

use App\Models\Recording;
use App\Models\Room;
use App\Services\LiveKitEgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EgressController extends Controller
{
    public function __construct(
        private LiveKitEgressService $egressService
    ) {}

    /**
     * Start streaming to RTMP destinations
     */
    public function startStreaming(Request $request, Room $room): JsonResponse
    {
        // Authorization check
        if ($room->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if already streaming
        if ($room->is_streaming) {
            return response()->json([
                'error' => 'Room is already streaming',
                'egress_id' => $room->streaming_egress_id,
            ], 400);
        }

        // Get enabled destinations
        $destinations = $room->enabledDestinations();

        if ($destinations->isEmpty()) {
            return response()->json([
                'error' => 'No enabled destinations configured. Add at least one streaming destination.',
            ], 400);
        }

        try {
            $layout = $request->input('layout', 'grid');
            $result = $this->egressService->startStreaming($room, $destinations->all(), $layout);

            // Update room state
            $room->startStreaming($result['egress_id']);

            return response()->json([
                'success' => true,
                'egress_id' => $result['egress_id'],
                'status' => $result['status'],
                'message' => 'Streaming started successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to start streaming', [
                'room_id' => $room->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to start streaming: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Stop streaming
     */
    public function stopStreaming(Request $request, Room $room): JsonResponse
    {
        // Authorization check
        if ($room->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if streaming
        if (! $room->is_streaming || ! $room->streaming_egress_id) {
            return response()->json([
                'error' => 'Room is not currently streaming',
            ], 400);
        }

        try {
            $result = $this->egressService->stopEgress($room->streaming_egress_id);

            // Update room state
            $room->stopStreaming();

            return response()->json([
                'success' => true,
                'egress_id' => $result['egress_id'],
                'status' => $result['status'],
                'message' => 'Streaming stopped successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to stop streaming', [
                'room_id' => $room->id,
                'egress_id' => $room->streaming_egress_id,
                'error' => $e->getMessage(),
            ]);

            // Still update room state even if API call fails
            // (egress might have already stopped)
            $room->stopStreaming();

            return response()->json([
                'success' => true,
                'message' => 'Streaming state cleared',
                'warning' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Start recording
     */
    public function startRecording(Request $request, Room $room): JsonResponse
    {
        // Authorization check
        if ($room->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if already recording
        if ($room->is_recording) {
            return response()->json([
                'error' => 'Room is already recording',
                'egress_id' => $room->recording_egress_id,
            ], 400);
        }

        try {
            $layout = $request->input('layout', 'grid');
            $result = $this->egressService->startRecording($room, $layout);

            // Update room state
            $room->startRecording($result['egress_id']);

            // Create recording entry
            $recording = Recording::create([
                'room_id' => $room->id,
                'type' => 'program',
                'livekit_egress_id' => $result['egress_id'],
                'started_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'egress_id' => $result['egress_id'],
                'recording_id' => $recording->id,
                'status' => $result['status'],
                'message' => 'Recording started successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to start recording', [
                'room_id' => $room->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to start recording: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Stop recording
     */
    public function stopRecording(Request $request, Room $room): JsonResponse
    {
        // Authorization check
        if ($room->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if recording
        if (! $room->is_recording || ! $room->recording_egress_id) {
            return response()->json([
                'error' => 'Room is not currently recording',
            ], 400);
        }

        try {
            $egressId = $room->recording_egress_id;
            $result = $this->egressService->stopEgress($egressId);

            // Update recording entry
            $recording = Recording::where('livekit_egress_id', $egressId)->first();
            if ($recording) {
                $fileUrl = null;
                $fileSize = null;

                // Extract file info from result if available
                if (! empty($result['file_results'])) {
                    $fileResult = $result['file_results'][0] ?? null;
                    if ($fileResult) {
                        $fileUrl = $fileResult['location'] ?? $fileResult['filename'] ?? null;
                        $fileSize = $fileResult['size'] ?? null;
                    }
                }

                $recording->update([
                    'ended_at' => now(),
                    'file_url' => $fileUrl,
                    'file_size' => $fileSize,
                ]);
            }

            // Update room state
            $room->stopRecording();

            return response()->json([
                'success' => true,
                'egress_id' => $result['egress_id'],
                'status' => $result['status'],
                'recording_id' => $recording?->id,
                'message' => 'Recording stopped successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to stop recording', [
                'room_id' => $room->id,
                'egress_id' => $room->recording_egress_id,
                'error' => $e->getMessage(),
            ]);

            // Still update room and recording state
            $recording = Recording::where('livekit_egress_id', $room->recording_egress_id)->first();
            $recording?->update(['ended_at' => now()]);
            $room->stopRecording();

            return response()->json([
                'success' => true,
                'message' => 'Recording state cleared',
                'warning' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Start both streaming and recording simultaneously
     */
    public function startBoth(Request $request, Room $room): JsonResponse
    {
        // Authorization check
        if ($room->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if already active
        if ($room->is_streaming || $room->is_recording) {
            return response()->json([
                'error' => 'Room already has active streaming or recording',
            ], 400);
        }

        $destinations = $room->enabledDestinations();

        try {
            $layout = $request->input('layout', 'grid');
            $result = $this->egressService->startStreamingAndRecording(
                $room,
                $destinations->all(),
                $layout
            );

            // Update room state (same egress handles both)
            $room->update([
                'is_streaming' => $destinations->isNotEmpty(),
                'streaming_egress_id' => $destinations->isNotEmpty() ? $result['egress_id'] : null,
                'streaming_started_at' => $destinations->isNotEmpty() ? now() : null,
                'is_recording' => true,
                'recording_egress_id' => $result['egress_id'],
                'recording_started_at' => now(),
            ]);

            // Create recording entry
            $recording = Recording::create([
                'room_id' => $room->id,
                'type' => 'program',
                'livekit_egress_id' => $result['egress_id'],
                'started_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'egress_id' => $result['egress_id'],
                'recording_id' => $recording->id,
                'status' => $result['status'],
                'message' => 'Streaming and recording started successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to start streaming and recording', [
                'room_id' => $room->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to start: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get current egress status for room
     */
    public function status(Request $request, Room $room): JsonResponse
    {
        // Authorization check
        if ($room->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $egresses = $this->egressService->listEgress($room->livekit_room_name, true);

            return response()->json([
                'is_streaming' => $room->is_streaming,
                'streaming_egress_id' => $room->streaming_egress_id,
                'streaming_started_at' => $room->streaming_started_at?->toISOString(),
                'streaming_duration' => $room->getStreamingDuration(),
                'is_recording' => $room->is_recording,
                'recording_egress_id' => $room->recording_egress_id,
                'recording_started_at' => $room->recording_started_at?->toISOString(),
                'recording_duration' => $room->getRecordingDuration(),
                'active_egresses' => $egresses,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'is_streaming' => $room->is_streaming,
                'streaming_egress_id' => $room->streaming_egress_id,
                'streaming_started_at' => $room->streaming_started_at?->toISOString(),
                'streaming_duration' => $room->getStreamingDuration(),
                'is_recording' => $room->is_recording,
                'recording_egress_id' => $room->recording_egress_id,
                'recording_started_at' => $room->recording_started_at?->toISOString(),
                'recording_duration' => $room->getRecordingDuration(),
                'active_egresses' => [],
                'warning' => 'Could not fetch live egress status',
            ]);
        }
    }
}
