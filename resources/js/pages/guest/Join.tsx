import { Head } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, Settings } from 'lucide-react';
import { useState, useRef } from 'react';
import { Room, RoomEvent, Track, VideoPresets } from 'livekit-client';

interface JoinProps {
    room: {
        id: number;
        name: string;
        slug: string;
    };
    participant: {
        id: number;
        name: string;
        role: string;
        token: string;
    };
}

export default function Join({ room, participant }: JoinProps) {
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [liveKitRoom, setLiveKitRoom] = useState<Room | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleJoinRoom = async () => {
        setIsConnecting(true);
        console.log('Joining room with participant:', participant.id, participant.name, participant.role, participant.token.substring(0, 20) + '...');

        try {
            // Get LiveKit token using the participant token
            const response = await fetch(`/api/rooms/${room.id}/livekit-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    participant_token: participant.token,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('LiveKit token response:', result);

            if (result.data) {
                await connectToLiveKit(result.data);
            } else {
                throw new Error('No token data in response');
            }
        } catch (error) {
            console.error('Failed to join room:', error);
            alert('Failed to join room: ' + error.message);
            setIsConnecting(false);
        }
    };

    const connectToLiveKit = async (tokenData: any) => {
        try {
            // Create and connect to LiveKit room
            const livekitRoom = new Room({
                videoCaptureDefaults: {
                    resolution: VideoPresets.h720.resolution,
                },
            });

            // Setup event listeners
            livekitRoom.on(RoomEvent.Connected, () => {
                console.log('Connected to LiveKit room');
                setIsConnected(true);
                setIsConnecting(false);
                setLiveKitRoom(livekitRoom);
            });

            livekitRoom.on(RoomEvent.Disconnected, () => {
                console.log('Disconnected from LiveKit room');
                setIsConnected(false);
                setLiveKitRoom(null);
            });

            livekitRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                console.log('Track subscribed:', track.kind, participant.name);
                if (track.kind === Track.Kind.Video && videoRef.current) {
                    const videoElement = track.attach();
                    videoElement.style.width = '100%';
                    videoElement.style.height = '100%';
                    videoElement.style.objectFit = 'cover';
                    videoRef.current.appendChild(videoElement);
                }
            });

            // Connect to room
            await livekitRoom.connect(tokenData.ws_url, tokenData.access_token);

            // Enable camera and microphone if enabled
            if (isVideoEnabled || isAudioEnabled) {
                await livekitRoom.localParticipant.enableCameraAndMicrophone();
            }

            // Attach local video to preview if enabled
            if (isVideoEnabled) {
                const videoTracks = livekitRoom.localParticipant.videoTrackPublications;
                videoTracks.forEach((publication) => {
                    if (publication.track && videoRef.current) {
                        publication.track.attach(videoRef.current);
                    }
                });
            }

        } catch (error) {
            console.error('Failed to connect to LiveKit:', error);
            alert('Failed to connect to room');
            setIsConnecting(false);
        }
    };

    const toggleVideo = async () => {
        if (liveKitRoom) {
            await liveKitRoom.localParticipant.setCameraEnabled(!isVideoEnabled);
        }
        setIsVideoEnabled(!isVideoEnabled);
    };

    const toggleAudio = async () => {
        if (liveKitRoom) {
            await liveKitRoom.localParticipant.setMicrophoneEnabled(!isAudioEnabled);
        }
        setIsAudioEnabled(!isAudioEnabled);
    };

    return (
        <>
            <Head title={`Join ${room.name}`} />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="w-full max-w-4xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Join {room.name}
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Welcome, {participant.name}!
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        {/* Video Preview */}
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold mb-4">Camera Preview</h2>
                            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                                {isVideoEnabled ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-white">
                                        <Video className="w-12 h-12" />
                                        <span className="ml-2">Camera will appear here</span>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-800">
                                        <VideoOff className="w-12 h-12" />
                                        <span className="ml-2">Camera disabled</span>
                                    </div>
                                )}
                            </div>

                            {/* Media Controls */}
                            <div className="flex gap-3 justify-center">
                                <Button
                                    variant={isVideoEnabled ? "default" : "destructive"}
                                    size="lg"
                                    onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                                    className="flex items-center gap-2"
                                >
                                    {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                                    {isVideoEnabled ? 'Camera On' : 'Camera Off'}
                                </Button>

                                <Button
                                    variant={isAudioEnabled ? "default" : "destructive"}
                                    size="lg"
                                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                                    className="flex items-center gap-2"
                                >
                                    {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                                    {isAudioEnabled ? 'Mic On' : 'Mic Off'}
                                </Button>

                                <Button variant="outline" size="lg">
                                    <Settings className="w-5 h-5" />
                                </Button>
                            </div>
                        </Card>

                        {/* Join Controls */}
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold mb-4">Ready to join?</h2>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Room
                                    </label>
                                    <p className="text-lg font-semibold">{room.name}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Your Name
                                    </label>
                                    <p className="text-lg font-semibold">{participant.name}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Role
                                    </label>
                                    <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                                        participant.role === 'host'
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                    }`}>
                                        {participant.role === 'host' ? 'Host' : 'Guest'}
                                    </span>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="w-full"
                                onClick={handleJoinRoom}
                                disabled={isConnecting}
                            >
                                {isConnecting ? 'Connecting...' : 'Join Room'}
                            </Button>

                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
                                Make sure your camera and microphone are working properly before joining.
                            </p>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}