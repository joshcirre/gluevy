import { Head, useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Play,
    Square,
    Video,
    VideoOff,
    Mic,
    MicOff,
    Users,
    Settings,
    Monitor,
    Grid3X3,
    User,
    Plus,
    Copy,
    Check
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, LocalTrack, RemoteTrack, Track, VideoPresets, ConnectOptions } from 'livekit-client';

interface Participant {
    id: number;
    name: string;
    role: string;
    is_connected: boolean;
    joined_at: string | null;
}

interface Destination {
    id: number;
    type: string;
    name: string;
    is_enabled: boolean;
}

interface Scene {
    id: number;
    layout: string;
    overlays: any;
    is_active: boolean;
}

interface Room {
    id: number;
    name: string;
    slug: string;
    status: string;
    livekit_room_name: string;
    participants: Participant[];
    destinations: Destination[];
    active_scene: Scene | null;
    scenes: Scene[];
}

interface StudioProps {
    room: Room;
    host_participant_token: string;
}

export default function Show({ room, host_participant_token }: StudioProps) {
    const [isStreaming, setIsStreaming] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [liveKitRoom, setLiveKitRoom] = useState<Room | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isCameraEnabled, setIsCameraEnabled] = useState(true);
    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [participantName, setParticipantName] = useState('');
    const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
    const [generatedInviteLink, setGeneratedInviteLink] = useState('');
    const [copied, setCopied] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Connect to LiveKit room
    const connectToLiveKit = async () => {
        if (isConnected || isConnecting) return;

        setIsConnecting(true);
        try {
            const response = await fetch(`/studio/${room.id}/livekit-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    participant_token: host_participant_token,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('API response:', result);

            if (result.data) {
                handleLiveKitConnection(result.data);
            } else {
                throw new Error('No token data in response');
            }
        } catch (error) {
            console.error('Failed to get LiveKit token:', error);
            alert('Failed to get LiveKit token: ' + error.message);
        } finally {
            setIsConnecting(false);
        }
    };

    // Handle LiveKit connection after getting token
    const handleLiveKitConnection = async (tokenData: any) => {
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
                setLiveKitRoom(livekitRoom);
            });

            livekitRoom.on(RoomEvent.Disconnected, () => {
                console.log('Disconnected from LiveKit room');
                setIsConnected(false);
                setLiveKitRoom(null);
            });

            livekitRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                if (track.kind === Track.Kind.Video) {
                    const videoElement = track.attach();
                    videoElement.style.width = '100%';
                    videoElement.style.height = '100%';
                    videoElement.style.objectFit = 'cover';

                    // Add to canvas preview
                    if (canvasRef.current) {
                        canvasRef.current.appendChild(videoElement);
                    }
                }
            });

            // Connect to room
            await livekitRoom.connect(tokenData.ws_url, tokenData.access_token);

            // Enable camera and microphone
            await livekitRoom.localParticipant.enableCameraAndMicrophone();

            // Attach local video to preview
            const videoTracks = livekitRoom.localParticipant.videoTrackPublications;
            videoTracks.forEach((publication) => {
                if (publication.track && videoRef.current) {
                    publication.track.attach(videoRef.current);
                }
            });

        } catch (error) {
            console.error('Failed to connect to LiveKit:', error);
            alert('Failed to connect to LiveKit room');
        }
    };

    // Disconnect from LiveKit room
    const disconnectFromLiveKit = async () => {
        if (liveKitRoom) {
            await liveKitRoom.disconnect();
            setLiveKitRoom(null);
            setIsConnected(false);
        }
    };

    // Toggle camera
    const toggleCamera = async () => {
        if (liveKitRoom) {
            await liveKitRoom.localParticipant.setCameraEnabled(!isCameraEnabled);
            setIsCameraEnabled(!isCameraEnabled);
        }
    };

    // Toggle microphone
    const toggleMicrophone = async () => {
        if (liveKitRoom) {
            await liveKitRoom.localParticipant.setMicrophoneEnabled(!isMicEnabled);
            setIsMicEnabled(!isMicEnabled);
        }
    };

    // Generate invite link
    const generateInviteLink = async () => {
        if (!participantName.trim()) return;

        setIsGeneratingInvite(true);
        try {
            const response = await fetch(`/studio/${room.id}/invite-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    name: participantName,
                    role: 'guest'
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const inviteUrl = `${window.location.origin}/join/${room.slug}/${result.data.token}`;
            setGeneratedInviteLink(inviteUrl);
        } catch (error) {
            console.error('Failed to generate invite:', error);
            alert('Failed to generate invite link: ' + error.message);
        } finally {
            setIsGeneratingInvite(false);
        }
    };

    // Copy invite link to clipboard
    const copyInviteLink = async () => {
        try {
            await navigator.clipboard.writeText(generatedInviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    // Reset invite modal
    const resetInviteModal = () => {
        setParticipantName('');
        setGeneratedInviteLink('');
        setCopied(false);
        setIsInviteModalOpen(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (liveKitRoom) {
                liveKitRoom.disconnect();
            }
        };
    }, [liveKitRoom]);

    const connectedParticipants = room.participants.filter(p => p.is_connected);
    const layoutIcons = {
        solo: User,
        '2up': Grid3X3,
        grid: Grid3X3,
    };

    const getLayoutIcon = (layout: string) => {
        const Icon = layoutIcons[layout as keyof typeof layoutIcons] || Grid3X3;
        return Icon;
    };

    return (
        <>
            <Head title={`Studio - ${room.name}`} />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Top Bar */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {room.name}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Studio • {connectedParticipants.length} participant(s) connected
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Badge variant={isConnected ? 'default' : 'secondary'}>
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </Badge>

                            {/* Camera and Mic Controls */}
                            {isConnected && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant={isCameraEnabled ? 'default' : 'destructive'}
                                        onClick={toggleCamera}
                                    >
                                        {isCameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={isMicEnabled ? 'default' : 'destructive'}
                                        onClick={toggleMicrophone}
                                    >
                                        {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                                    </Button>
                                </div>
                            )}

                            <Button
                                variant={isRecording ? 'destructive' : 'outline'}
                                onClick={() => setIsRecording(!isRecording)}
                                className="flex items-center gap-2"
                                disabled={!isConnected}
                            >
                                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-red-500'}`} />
                                {isRecording ? 'Stop Recording' : 'Start Recording'}
                            </Button>

                            {!isConnected ? (
                                <Button
                                    size="lg"
                                    onClick={connectToLiveKit}
                                    disabled={isConnecting}
                                    className="flex items-center gap-2"
                                >
                                    <Video className="w-5 h-5" />
                                    {isConnecting ? 'Connecting...' : 'Connect Studio'}
                                </Button>
                            ) : (
                                <Button
                                    variant={isStreaming ? 'destructive' : 'default'}
                                    size="lg"
                                    onClick={() => setIsStreaming(!isStreaming)}
                                    className="flex items-center gap-2"
                                >
                                    {isStreaming ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                    {isStreaming ? 'Stop Stream' : 'Go Live'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-1">
                    {/* Left Sidebar - Participants */}
                    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Participants ({room.participants.length})
                            </h2>

                            <div className="space-y-3">
                                {room.participants.map((participant) => (
                                    <Card key={participant.id} className="p-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{participant.name}</p>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Badge variant="outline" className="text-xs">
                                                        {participant.role}
                                                    </Badge>
                                                    <span className={`w-2 h-2 rounded-full ${
                                                        participant.is_connected ? 'bg-green-500' : 'bg-gray-400'
                                                    }`} />
                                                    {participant.is_connected ? 'Connected' : 'Disconnected'}
                                                </div>
                                            </div>

                                            {participant.is_connected && (
                                                <div className="flex gap-1">
                                                    <Button size="sm" variant="ghost">
                                                        <Mic className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost">
                                                        <Video className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ))}

                                <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full flex items-center gap-2">
                                            <Plus className="w-4 h-4" />
                                            Invite Participant
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Invite Participant</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            {!generatedInviteLink ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="participant-name">Participant Name</Label>
                                                        <Input
                                                            id="participant-name"
                                                            placeholder="Enter participant name"
                                                            value={participantName}
                                                            onChange={(e) => setParticipantName(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && generateInviteLink()}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={generateInviteLink}
                                                            disabled={!participantName.trim() || isGeneratingInvite}
                                                            className="flex-1"
                                                        >
                                                            {isGeneratingInvite ? 'Generating...' : 'Generate Invite Link'}
                                                        </Button>
                                                        <Button variant="outline" onClick={resetInviteModal}>
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label>Invite Link for {participantName}</Label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                value={generatedInviteLink}
                                                                readOnly
                                                                className="flex-1"
                                                            />
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={copyInviteLink}
                                                                className="flex items-center gap-2"
                                                            >
                                                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                                {copied ? 'Copied!' : 'Copy'}
                                                            </Button>
                                                        </div>
                                                        <p className="text-sm text-gray-500">
                                                            Share this link with {participantName} to join the room.
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" onClick={resetInviteModal} className="flex-1">
                                                            Create Another Invite
                                                        </Button>
                                                        <Button onClick={resetInviteModal}>
                                                            Done
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* Scene Layouts */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Layouts</h3>
                            <div className="space-y-2">
                                {room.scenes.map((scene) => {
                                    const Icon = getLayoutIcon(scene.layout);
                                    return (
                                        <Button
                                            key={scene.id}
                                            variant={scene.is_active ? 'default' : 'outline'}
                                            className="w-full justify-start"
                                        >
                                            <Icon className="w-4 h-4 mr-2" />
                                            {scene.layout === '2up' ? '2-Up' :
                                             scene.layout.charAt(0).toUpperCase() + scene.layout.slice(1)}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-6">
                        {/* Canvas Preview */}
                        <Card className="mb-6">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold">Live Preview</h2>
                                    <div className="flex items-center gap-2">
                                        <Monitor className="w-5 h-5" />
                                        <span className="text-sm text-gray-500">
                                            {room.active_scene?.layout || 'No layout selected'}
                                        </span>
                                    </div>
                                </div>

                                <div className="aspect-video bg-gray-900 rounded-lg relative overflow-hidden">
                                    {isConnected ? (
                                        <>
                                            {/* Local video preview */}
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                muted
                                                playsInline
                                                className="w-full h-full object-cover"
                                            />

                                            {/* Canvas for remote participants */}
                                            <div
                                                ref={canvasRef}
                                                className="absolute inset-0 grid grid-cols-2 gap-1 p-2"
                                                style={{ display: liveKitRoom?.remoteParticipants.size ? 'grid' : 'none' }}
                                            />
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-white">
                                            <div className="text-center">
                                                <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                                <p className="text-lg">Canvas Preview</p>
                                                <p className="text-sm opacity-75">
                                                    {isConnecting
                                                        ? 'Connecting to studio...'
                                                        : 'Click "Connect Studio" to start'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Stream Status Overlay */}
                                    {isStreaming && (
                                        <div className="absolute top-4 left-4">
                                            <Badge variant="destructive" className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                                LIVE
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Connection Status */}
                                    <div className="absolute top-4 right-4">
                                        <Badge variant={isConnected ? 'default' : 'secondary'}>
                                            {isConnected ? 'Studio Connected' : 'Studio Offline'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Streaming Destinations */}
                        <Card>
                            <div className="p-4">
                                <h3 className="text-lg font-semibold mb-4">Streaming Destinations</h3>

                                {room.destinations.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {room.destinations.map((destination) => (
                                            <div
                                                key={destination.id}
                                                className={`p-4 rounded-lg border-2 ${
                                                    destination.is_enabled
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">{destination.name}</p>
                                                        <p className="text-sm text-gray-500 capitalize">
                                                            {destination.type}
                                                        </p>
                                                    </div>
                                                    <Badge variant={destination.is_enabled ? 'default' : 'secondary'}>
                                                        {destination.is_enabled ? 'Enabled' : 'Disabled'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-500">No streaming destinations configured</p>
                                        <Button variant="outline" className="mt-4">
                                            Add Destination
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

        </>
    );
}