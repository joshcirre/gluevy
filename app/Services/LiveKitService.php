<?php

namespace App\Services;

class LiveKitService
{
    private string $apiKey;
    private string $apiSecret;
    private string $wsUrl;

    public function __construct()
    {
        $this->apiKey = config('services.livekit.api_key') ?? '';
        $this->apiSecret = config('services.livekit.api_secret') ?? '';
        $this->wsUrl = config('services.livekit.ws_url') ?? '';

        if (empty($this->apiKey) || empty($this->apiSecret) || empty($this->wsUrl)) {
            throw new \RuntimeException('LiveKit configuration is missing. Please set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_WS_URL in your .env file.');
        }
    }

    public function generateAccessToken(
        string $roomName,
        string $participantIdentity,
        string $participantName,
        array $permissions = []
    ): string {
        $now = time();
        $exp = $now + (6 * 60 * 60); // 6 hours

        $defaultPermissions = [
            'canPublish' => true,
            'canSubscribe' => true,
            'canPublishData' => true,
            'canUpdateMetadata' => false,
        ];

        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT'
        ];

        $payload = [
            'iss' => $this->apiKey,
            'sub' => $participantIdentity,
            'iat' => $now,
            'exp' => $exp,
            'video' => array_merge($defaultPermissions, $permissions, [
                'room' => $roomName,
                'roomJoin' => true,
            ]),
        ];

        if (!empty($participantName)) {
            $payload['name'] = $participantName;
        }

        return $this->encodeJWT($header, $payload, $this->apiSecret);
    }

    public function getWsUrl(): string
    {
        return $this->wsUrl;
    }

    private function encodeJWT(array $header, array $payload, string $secret): string
    {
        $headerEncoded = $this->base64UrlEncode(json_encode($header));
        $payloadEncoded = $this->base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, $secret, true);
        $signatureEncoded = $this->base64UrlEncode($signature);

        return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
