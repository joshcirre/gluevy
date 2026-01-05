<?php

namespace App\Services;

use App\Models\Destination;
use App\Models\Room;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LiveKitEgressService
{
    private string $apiKey;

    private string $apiSecret;

    private string $apiUrl;

    public function __construct()
    {
        $this->apiKey = config('services.livekit.api_key') ?? '';
        $this->apiSecret = config('services.livekit.api_secret') ?? '';

        // Convert wss:// to https:// for API calls
        $wsUrl = config('services.livekit.ws_url') ?? '';
        $this->apiUrl = str_replace(['wss://', 'ws://'], 'https://', $wsUrl);

        if (empty($this->apiKey) || empty($this->apiSecret) || empty($this->apiUrl)) {
            throw new \RuntimeException('LiveKit configuration is missing.');
        }
    }

    /**
     * Start streaming to RTMP destinations
     *
     * @param  array<Destination>  $destinations
     * @return array{egress_id: string, status: string}
     *
     * @throws \Exception
     */
    public function startStreaming(Room $room, array $destinations, string $layout = 'grid'): array
    {
        $urls = collect($destinations)
            ->filter(fn (Destination $d) => $d->is_enabled)
            ->map(fn (Destination $d) => $this->buildRtmpUrl($d))
            ->filter()
            ->values()
            ->toArray();

        if (empty($urls)) {
            throw new \Exception('No enabled destinations with valid RTMP configuration.');
        }

        $request = [
            'room_name' => $room->livekit_room_name,
            'layout' => $layout,
            'stream_outputs' => [
                [
                    'protocol' => 0, // RTMP
                    'urls' => $urls,
                ],
            ],
        ];

        $response = $this->makeRequest('StartRoomCompositeEgress', $request);

        return [
            'egress_id' => $response['egress_id'] ?? '',
            'status' => $response['status'] ?? 'EGRESS_STARTING',
        ];
    }

    /**
     * Start recording to file storage
     *
     * @return array{egress_id: string, status: string}
     *
     * @throws \Exception
     */
    public function startRecording(Room $room, string $layout = 'grid'): array
    {
        // For now, use S3 or direct file output
        // You can configure this based on your storage setup
        $request = [
            'room_name' => $room->livekit_room_name,
            'layout' => $layout,
            'file_outputs' => [
                [
                    'file_type' => 0, // MP4
                    'filepath' => "recordings/{$room->slug}/{$room->slug}-".time().'.mp4',
                    's3' => $this->getS3Config(),
                ],
            ],
        ];

        $response = $this->makeRequest('StartRoomCompositeEgress', $request);

        return [
            'egress_id' => $response['egress_id'] ?? '',
            'status' => $response['status'] ?? 'EGRESS_STARTING',
        ];
    }

    /**
     * Start both streaming and recording simultaneously
     *
     * @param  array<Destination>  $destinations
     * @return array{egress_id: string, status: string}
     */
    public function startStreamingAndRecording(Room $room, array $destinations, string $layout = 'grid'): array
    {
        $urls = collect($destinations)
            ->filter(fn (Destination $d) => $d->is_enabled)
            ->map(fn (Destination $d) => $this->buildRtmpUrl($d))
            ->filter()
            ->values()
            ->toArray();

        $request = [
            'room_name' => $room->livekit_room_name,
            'layout' => $layout,
            'stream_outputs' => empty($urls) ? [] : [
                [
                    'protocol' => 0,
                    'urls' => $urls,
                ],
            ],
            'file_outputs' => [
                [
                    'file_type' => 0,
                    'filepath' => "recordings/{$room->slug}/{$room->slug}-".time().'.mp4',
                    's3' => $this->getS3Config(),
                ],
            ],
        ];

        $response = $this->makeRequest('StartRoomCompositeEgress', $request);

        return [
            'egress_id' => $response['egress_id'] ?? '',
            'status' => $response['status'] ?? 'EGRESS_STARTING',
        ];
    }

    /**
     * Stop an active egress (streaming or recording)
     *
     * @return array{egress_id: string, status: string}
     *
     * @throws \Exception
     */
    public function stopEgress(string $egressId): array
    {
        $response = $this->makeRequest('StopEgress', [
            'egress_id' => $egressId,
        ]);

        return [
            'egress_id' => $response['egress_id'] ?? $egressId,
            'status' => $response['status'] ?? 'EGRESS_ENDING',
            'file_results' => $response['file_results'] ?? [],
            'stream_results' => $response['stream_results'] ?? [],
        ];
    }

    /**
     * List egresses for a room
     *
     * @return array<array{egress_id: string, status: string, room_name: string}>
     */
    public function listEgress(?string $roomName = null, bool $activeOnly = false): array
    {
        $request = [];

        if ($roomName) {
            $request['room_name'] = $roomName;
        }

        if ($activeOnly) {
            $request['active'] = true;
        }

        $response = $this->makeRequest('ListEgress', $request);

        return $response['items'] ?? [];
    }

    /**
     * Update stream destinations (add or remove RTMP URLs)
     *
     * @param  array<string>  $addUrls
     * @param  array<string>  $removeUrls
     * @return array{egress_id: string, status: string}
     */
    public function updateStream(string $egressId, array $addUrls = [], array $removeUrls = []): array
    {
        $request = [
            'egress_id' => $egressId,
        ];

        if (! empty($addUrls)) {
            $request['add_output_urls'] = $addUrls;
        }

        if (! empty($removeUrls)) {
            $request['remove_output_urls'] = $removeUrls;
        }

        $response = $this->makeRequest('UpdateStream', $request);

        return [
            'egress_id' => $response['egress_id'] ?? $egressId,
            'status' => $response['status'] ?? 'EGRESS_ACTIVE',
        ];
    }

    /**
     * Build full RTMP URL from destination
     */
    private function buildRtmpUrl(Destination $destination): ?string
    {
        $url = $destination->getRtmpUrl();
        $key = $destination->getStreamKey();

        if (empty($url)) {
            return null;
        }

        // If URL already contains the stream key, return as-is
        if (empty($key)) {
            return $url;
        }

        // Append stream key to URL
        return rtrim($url, '/').'/'.$key;
    }

    /**
     * Get S3 configuration for file uploads
     *
     * @return array<string, mixed>
     */
    private function getS3Config(): array
    {
        return [
            'access_key' => config('filesystems.disks.s3.key', ''),
            'secret' => config('filesystems.disks.s3.secret', ''),
            'bucket' => config('filesystems.disks.s3.bucket', ''),
            'region' => config('filesystems.disks.s3.region', 'us-east-1'),
            'endpoint' => config('filesystems.disks.s3.endpoint', ''),
            'force_path_style' => config('filesystems.disks.s3.use_path_style_endpoint', false),
        ];
    }

    /**
     * Make an authenticated request to the LiveKit Egress API
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     *
     * @throws \Exception
     */
    private function makeRequest(string $method, array $payload): array
    {
        $token = $this->generateApiToken();
        $url = "{$this->apiUrl}/twirp/livekit.Egress/{$method}";

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$token}",
                'Content-Type' => 'application/json',
            ])->post($url, $payload);

            if ($response->failed()) {
                $error = $response->json('msg') ?? $response->body();
                Log::error("LiveKit Egress API error: {$method}", [
                    'status' => $response->status(),
                    'error' => $error,
                    'payload' => $payload,
                ]);
                throw new \Exception("LiveKit Egress API error: {$error}");
            }

            return $response->json() ?? [];
        } catch (ConnectionException $e) {
            Log::error('LiveKit Egress API connection failed', [
                'method' => $method,
                'error' => $e->getMessage(),
            ]);
            throw new \Exception('Failed to connect to LiveKit server.');
        } catch (RequestException $e) {
            Log::error('LiveKit Egress API request failed', [
                'method' => $method,
                'error' => $e->getMessage(),
            ]);
            throw new \Exception('LiveKit API request failed: '.$e->getMessage());
        }
    }

    /**
     * Generate JWT token for API authentication
     */
    private function generateApiToken(): string
    {
        $now = time();
        $exp = $now + 600; // 10 minutes

        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT',
        ];

        $payload = [
            'iss' => $this->apiKey,
            'sub' => $this->apiKey,
            'iat' => $now,
            'exp' => $exp,
            'video' => [
                'roomRecord' => true,
            ],
        ];

        return $this->encodeJWT($header, $payload, $this->apiSecret);
    }

    private function encodeJWT(array $header, array $payload, string $secret): string
    {
        $headerEncoded = $this->base64UrlEncode(json_encode($header));
        $payloadEncoded = $this->base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $headerEncoded.'.'.$payloadEncoded, $secret, true);
        $signatureEncoded = $this->base64UrlEncode($signature);

        return $headerEncoded.'.'.$payloadEncoded.'.'.$signatureEncoded;
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
