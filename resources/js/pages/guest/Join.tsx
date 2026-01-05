import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Head } from '@inertiajs/react';
import {
    RemoteParticipant,
    Room,
    RoomEvent,
    Track,
    VideoPresets,
} from 'livekit-client';
import { Mic, MicOff, PhoneOff, Users, Video, VideoOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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

interface ParticipantVideo {
    identity: string;
    name: string;
    videoElement: HTMLVideoElement | null;
    audioElement: HTMLAudioElement | null;
    isLocal: boolean;
}

export default function Join({ room, participant }: JoinProps) {
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [liveKitRoom, setLiveKitRoom] = useState<Room | null>(null);
    const [participants, setParticipants] = useState<
        Map<string, ParticipantVideo>
    >(new Map());
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    const participantsContainerRef = useRef<HTMLDivElement>(null);

    // Start camera preview before joining
    useEffect(() => {
        let stream: MediaStream | null = null;

        const startPreview = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: isVideoEnabled,
                    audio: isAudioEnabled,
                });
                if (previewVideoRef.current && !isConnected) {
                    previewVideoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Failed to start camera preview:', error);
            }
        };

        if (!isConnected) {
            startPreview();
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [isVideoEnabled, isAudioEnabled, isConnected]);

    const handleJoinRoom = async () => {
        setIsConnecting(true);

        try {
            // Stop preview stream
            if (previewVideoRef.current?.srcObject) {
                const stream = previewVideoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach((track) => track.stop());
                previewVideoRef.current.srcObject = null;
            }

            // Get LiveKit token using the participant token
            const response = await fetch(`/join/${room.slug}/livekit-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
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

            if (result.data) {
                await connectToLiveKit(result.data);
            } else {
                throw new Error('No token data in response');
            }
        } catch (error: any) {
            console.error('Failed to join room:', error);
            alert('Failed to join room: ' + error.message);
            setIsConnecting(false);
        }
    };

    const connectToLiveKit = async (tokenData: any) => {
        try {
            const livekitRoom = new Room({
                videoCaptureDefaults: {
                    resolution: VideoPresets.h720.resolution,
                },
                audioCaptureDefaults: {
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            // Handle connection
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
                setParticipants(new Map());
            });

            // Handle remote participants joining
            livekitRoom.on(
                RoomEvent.ParticipantConnected,
                (remoteParticipant: RemoteParticipant) => {
                    console.log(
                        'Participant connected:',
                        remoteParticipant.identity,
                        remoteParticipant.name,
                    );
                    addParticipant(remoteParticipant);
                },
            );

            // Handle remote participants leaving
            livekitRoom.on(
                RoomEvent.ParticipantDisconnected,
                (remoteParticipant: RemoteParticipant) => {
                    console.log(
                        'Participant disconnected:',
                        remoteParticipant.identity,
                    );
                    removeParticipant(remoteParticipant.identity);
                },
            );

            // Handle track subscriptions
            livekitRoom.on(
                RoomEvent.TrackSubscribed,
                (track, publication, remoteParticipant) => {
                    console.log(
                        'Track subscribed:',
                        track.kind,
                        remoteParticipant.name,
                    );
                    attachTrack(track, remoteParticipant.identity);
                },
            );

            livekitRoom.on(
                RoomEvent.TrackUnsubscribed,
                (track, publication, remoteParticipant) => {
                    console.log(
                        'Track unsubscribed:',
                        track.kind,
                        remoteParticipant.name,
                    );
                    track.detach();
                },
            );

            // Handle local track published
            livekitRoom.on(
                RoomEvent.LocalTrackPublished,
                (publication, localParticipant) => {
                    console.log('Local track published:', publication.kind);
                    if (
                        publication.track &&
                        publication.kind === Track.Kind.Video &&
                        localVideoRef.current
                    ) {
                        publication.track.attach(localVideoRef.current);
                    }
                },
            );

            // Connect to room
            await livekitRoom.connect(tokenData.ws_url, tokenData.access_token);

            // Enable camera and microphone
            await livekitRoom.localParticipant.enableCameraAndMicrophone();

            // Add existing remote participants
            livekitRoom.remoteParticipants.forEach((remoteParticipant) => {
                addParticipant(remoteParticipant);
                remoteParticipant.trackPublications.forEach((publication) => {
                    if (publication.track && publication.isSubscribed) {
                        attachTrack(
                            publication.track,
                            remoteParticipant.identity,
                        );
                    }
                });
            });
        } catch (error) {
            console.error('Failed to connect to LiveKit:', error);
            alert('Failed to connect to room');
            setIsConnecting(false);
        }
    };

    const addParticipant = (remoteParticipant: RemoteParticipant) => {
        setParticipants((prev) => {
            const updated = new Map(prev);
            updated.set(remoteParticipant.identity, {
                identity: remoteParticipant.identity,
                name: remoteParticipant.name || 'Unknown',
                videoElement: null,
                audioElement: null,
                isLocal: false,
            });
            return updated;
        });
    };

    const removeParticipant = (identity: string) => {
        setParticipants((prev) => {
            const updated = new Map(prev);
            updated.delete(identity);
            return updated;
        });
    };

    const attachTrack = (track: any, identity: string) => {
        if (track.kind === Track.Kind.Video) {
            const element = track.attach() as HTMLVideoElement;
            element.className = 'w-full h-full object-cover';

            setParticipants((prev) => {
                const updated = new Map(prev);
                const participant = updated.get(identity);
                if (participant) {
                    updated.set(identity, {
                        ...participant,
                        videoElement: element,
                    });
                }
                return updated;
            });
        } else if (track.kind === Track.Kind.Audio) {
            const element = track.attach() as HTMLAudioElement;
            element.play();
        }
    };

    const toggleVideo = async () => {
        if (liveKitRoom) {
            await liveKitRoom.localParticipant.setCameraEnabled(
                !isVideoEnabled,
            );
        }
        setIsVideoEnabled(!isVideoEnabled);
    };

    const toggleAudio = async () => {
        if (liveKitRoom) {
            await liveKitRoom.localParticipant.setMicrophoneEnabled(
                !isAudioEnabled,
            );
        }
        setIsAudioEnabled(!isAudioEnabled);
    };

    const handleLeaveRoom = async () => {
        if (liveKitRoom) {
            await liveKitRoom.disconnect();
        }
        setIsConnected(false);
        setLiveKitRoom(null);
        setParticipants(new Map());
    };

    // Connected room view
    if (isConnected) {
        const participantCount = participants.size + 1; // +1 for local participant
        const gridCols =
            participantCount <= 1
                ? 'grid-cols-1'
                : participantCount <= 4
                  ? 'grid-cols-2'
                  : 'grid-cols-3';

        return (
            <>
                <Head title={room.name} />
                <div className="flex min-h-screen flex-col bg-gray-900">
                    {/* Header */}
                    <div className="border-b border-gray-700 bg-gray-800 px-6 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h1 className="text-xl font-semibold text-white">
                                    {room.name}
                                </h1>
                                <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                >
                                    <Users className="h-3 w-3" />
                                    {participantCount}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="default"
                                    className="bg-green-600"
                                >
                                    Connected as {participant.name}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Video Grid */}
                    <div className="flex-1 p-4">
                        <div className={`grid ${gridCols} h-full gap-4`}>
                            {/* Local participant */}
                            <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-800">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="mirror h-full w-full object-cover"
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                                <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-sm text-white">
                                    {participant.name} (You)
                                </div>
                                {!isVideoEnabled && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                        <div className="text-center text-white">
                                            <VideoOff className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                            <p>Camera off</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Remote participants */}
                            {Array.from(participants.values()).map((p) => (
                                <div
                                    key={p.identity}
                                    className="relative aspect-video overflow-hidden rounded-lg bg-gray-800"
                                >
                                    {p.videoElement ? (
                                        <div
                                            className="h-full w-full"
                                            ref={(container) => {
                                                if (
                                                    container &&
                                                    p.videoElement &&
                                                    !container.contains(
                                                        p.videoElement,
                                                    )
                                                ) {
                                                    container.innerHTML = '';
                                                    container.appendChild(
                                                        p.videoElement,
                                                    );
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center text-white">
                                                <VideoOff className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                                <p>No video</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-sm text-white">
                                        {p.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="border-t border-gray-700 bg-gray-800 px-6 py-4">
                        <div className="flex items-center justify-center gap-4">
                            <Button
                                variant={
                                    isVideoEnabled ? 'secondary' : 'destructive'
                                }
                                size="lg"
                                onClick={toggleVideo}
                                className="h-14 w-14 rounded-full"
                            >
                                {isVideoEnabled ? (
                                    <Video className="h-6 w-6" />
                                ) : (
                                    <VideoOff className="h-6 w-6" />
                                )}
                            </Button>

                            <Button
                                variant={
                                    isAudioEnabled ? 'secondary' : 'destructive'
                                }
                                size="lg"
                                onClick={toggleAudio}
                                className="h-14 w-14 rounded-full"
                            >
                                {isAudioEnabled ? (
                                    <Mic className="h-6 w-6" />
                                ) : (
                                    <MicOff className="h-6 w-6" />
                                )}
                            </Button>

                            <Button
                                variant="destructive"
                                size="lg"
                                onClick={handleLeaveRoom}
                                className="h-14 w-14 rounded-full"
                            >
                                <PhoneOff className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Pre-join view
    return (
        <>
            <Head title={`Join ${room.name}`} />
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
                <div className="w-full max-w-4xl">
                    <div className="mb-8 text-center">
                        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                            Join {room.name}
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Welcome, {participant.name}!
                        </p>
                    </div>

                    <div className="grid items-start gap-8 md:grid-cols-2">
                        {/* Video Preview */}
                        <Card className="p-6">
                            <h2 className="mb-4 text-xl font-semibold">
                                Camera Preview
                            </h2>
                            <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-gray-900">
                                {isVideoEnabled ? (
                                    <video
                                        ref={previewVideoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="h-full w-full object-cover"
                                        style={{ transform: 'scaleX(-1)' }}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
                                        <VideoOff className="h-12 w-12" />
                                        <span className="ml-2">
                                            Camera disabled
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Media Controls */}
                            <div className="flex justify-center gap-3">
                                <Button
                                    variant={
                                        isVideoEnabled
                                            ? 'default'
                                            : 'destructive'
                                    }
                                    size="lg"
                                    onClick={() =>
                                        setIsVideoEnabled(!isVideoEnabled)
                                    }
                                    className="flex items-center gap-2"
                                >
                                    {isVideoEnabled ? (
                                        <Video className="h-5 w-5" />
                                    ) : (
                                        <VideoOff className="h-5 w-5" />
                                    )}
                                    {isVideoEnabled
                                        ? 'Camera On'
                                        : 'Camera Off'}
                                </Button>

                                <Button
                                    variant={
                                        isAudioEnabled
                                            ? 'default'
                                            : 'destructive'
                                    }
                                    size="lg"
                                    onClick={() =>
                                        setIsAudioEnabled(!isAudioEnabled)
                                    }
                                    className="flex items-center gap-2"
                                >
                                    {isAudioEnabled ? (
                                        <Mic className="h-5 w-5" />
                                    ) : (
                                        <MicOff className="h-5 w-5" />
                                    )}
                                    {isAudioEnabled ? 'Mic On' : 'Mic Off'}
                                </Button>
                            </div>
                        </Card>

                        {/* Join Controls */}
                        <Card className="p-6">
                            <h2 className="mb-4 text-xl font-semibold">
                                Ready to join?
                            </h2>

                            <div className="mb-6 space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Room
                                    </label>
                                    <p className="text-lg font-semibold">
                                        {room.name}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Your Name
                                    </label>
                                    <p className="text-lg font-semibold">
                                        {participant.name}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Role
                                    </label>
                                    <span
                                        className={`inline-block rounded px-2 py-1 text-sm font-medium ${
                                            participant.role === 'host'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                        }`}
                                    >
                                        {participant.role === 'host'
                                            ? 'Host'
                                            : 'Guest'}
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

                            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                Make sure your camera and microphone are working
                                properly before joining.
                            </p>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
