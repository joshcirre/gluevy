import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head } from '@inertiajs/react';
import {
    Room as LiveKitRoom,
    RoomEvent,
    Track,
    VideoPresets,
} from 'livekit-client';
import {
    Check,
    Copy,
    Globe,
    Grid3X3,
    Loader2,
    Mic,
    MicOff,
    Monitor,
    Play,
    Plus,
    Radio,
    Settings,
    Square,
    Trash2,
    User,
    Users,
    Video,
    VideoOff,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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

interface StudioRoom {
    id: number;
    name: string;
    slug: string;
    status: string;
    livekit_room_name: string;
    participants: Participant[];
    destinations: Destination[];
    active_scene: Scene | null;
    scenes: Scene[];
    is_streaming: boolean;
    streaming_started_at: string | null;
    is_recording: boolean;
    recording_started_at: string | null;
}

interface StudioProps {
    room: StudioRoom;
    host_participant_token: string;
}

export default function Show({ room, host_participant_token }: StudioProps) {
    const [isStreaming, setIsStreaming] = useState(room.is_streaming || false);
    const [isRecording, setIsRecording] = useState(room.is_recording || false);
    const [streamingStartedAt, setStreamingStartedAt] = useState<Date | null>(
        room.streaming_started_at ? new Date(room.streaming_started_at) : null,
    );
    const [recordingStartedAt, setRecordingStartedAt] = useState<Date | null>(
        room.recording_started_at ? new Date(room.recording_started_at) : null,
    );
    const [liveKitRoom, setLiveKitRoom] = useState<LiveKitRoom | null>(null);
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
    const canvasRef = useRef<HTMLDivElement>(null);

    // Egress loading states
    const [isStartingStream, setIsStartingStream] = useState(false);
    const [isStoppingStream, setIsStoppingStream] = useState(false);
    const [isStartingRecording, setIsStartingRecording] = useState(false);
    const [isStoppingRecording, setIsStoppingRecording] = useState(false);

    // Duration display
    const [streamDuration, setStreamDuration] = useState(0);
    const [recordDuration, setRecordDuration] = useState(0);

    // Destination management state
    const [destinations, setDestinations] = useState<Destination[]>(
        room.destinations,
    );
    const [isDestinationModalOpen, setIsDestinationModalOpen] = useState(false);
    const [newDestination, setNewDestination] = useState({
        type: 'youtube',
        name: '',
        rtmp_url: '',
        stream_key: '',
    });
    const [isAddingDestination, setIsAddingDestination] = useState(false);

    // Update duration counters
    useEffect(() => {
        let streamInterval: NodeJS.Timeout | null = null;
        let recordInterval: NodeJS.Timeout | null = null;

        if (isStreaming && streamingStartedAt) {
            streamInterval = setInterval(() => {
                setStreamDuration(
                    Math.floor(
                        (Date.now() - streamingStartedAt.getTime()) / 1000,
                    ),
                );
            }, 1000);
        }

        if (isRecording && recordingStartedAt) {
            recordInterval = setInterval(() => {
                setRecordDuration(
                    Math.floor(
                        (Date.now() - recordingStartedAt.getTime()) / 1000,
                    ),
                );
            }, 1000);
        }

        return () => {
            if (streamInterval) clearInterval(streamInterval);
            if (recordInterval) clearInterval(recordInterval);
        };
    }, [isStreaming, isRecording, streamingStartedAt, recordingStartedAt]);

    // Format duration as HH:MM:SS
    const formatDuration = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':');
    };

    // Helper for API calls
    const apiCall = async (
        url: string,
        method: string = 'POST',
        body?: any,
    ) => {
        const response = await fetch(url, {
            method,
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
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.error || `HTTP error! status: ${response.status}`,
            );
        }

        return response.json();
    };

    // Start streaming
    const startStreaming = async () => {
        const enabledDestinations = destinations.filter((d) => d.is_enabled);
        if (enabledDestinations.length === 0) {
            alert(
                'Please enable at least one streaming destination before going live.',
            );
            return;
        }

        setIsStartingStream(true);
        try {
            const result = await apiCall(`/studio/${room.id}/stream/start`);
            setIsStreaming(true);
            setStreamingStartedAt(new Date());
            console.log('Streaming started:', result);
        } catch (error: any) {
            console.error('Failed to start streaming:', error);
            alert('Failed to start streaming: ' + error.message);
        } finally {
            setIsStartingStream(false);
        }
    };

    // Stop streaming
    const stopStreaming = async () => {
        if (!confirm('Are you sure you want to stop streaming?')) return;

        setIsStoppingStream(true);
        try {
            await apiCall(`/studio/${room.id}/stream/stop`);
            setIsStreaming(false);
            setStreamingStartedAt(null);
            setStreamDuration(0);
        } catch (error: any) {
            console.error('Failed to stop streaming:', error);
            // Still update state since backend clears it even on error
            setIsStreaming(false);
            setStreamingStartedAt(null);
        } finally {
            setIsStoppingStream(false);
        }
    };

    // Start recording
    const startRecording = async () => {
        setIsStartingRecording(true);
        try {
            const result = await apiCall(`/studio/${room.id}/record/start`);
            setIsRecording(true);
            setRecordingStartedAt(new Date());
            console.log('Recording started:', result);
        } catch (error: any) {
            console.error('Failed to start recording:', error);
            alert('Failed to start recording: ' + error.message);
        } finally {
            setIsStartingRecording(false);
        }
    };

    // Stop recording
    const stopRecording = async () => {
        if (!confirm('Are you sure you want to stop recording?')) return;

        setIsStoppingRecording(true);
        try {
            await apiCall(`/studio/${room.id}/record/stop`);
            setIsRecording(false);
            setRecordingStartedAt(null);
            setRecordDuration(0);
        } catch (error: any) {
            console.error('Failed to stop recording:', error);
            // Still update state since backend clears it even on error
            setIsRecording(false);
            setRecordingStartedAt(null);
        } finally {
            setIsStoppingRecording(false);
        }
    };

    // Connect to LiveKit room
    const connectToLiveKit = async () => {
        if (isConnected || isConnecting) return;

        setIsConnecting(true);
        try {
            const result = await apiCall(
                `/studio/${room.id}/livekit-token`,
                'POST',
                {
                    participant_token: host_participant_token,
                },
            );
            console.log('API response:', result);

            if (result.data) {
                handleLiveKitConnection(result.data);
            } else {
                throw new Error('No token data in response');
            }
        } catch (error: any) {
            console.error('Failed to get LiveKit token:', error);
            alert('Failed to get LiveKit token: ' + error.message);
        } finally {
            setIsConnecting(false);
        }
    };

    // Handle LiveKit connection after getting token
    const handleLiveKitConnection = async (tokenData: any) => {
        try {
            const livekitRoom = new LiveKitRoom({
                videoCaptureDefaults: {
                    resolution: VideoPresets.h720.resolution,
                },
            });

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

            livekitRoom.on(
                RoomEvent.TrackSubscribed,
                (track, publication, participant) => {
                    if (track.kind === Track.Kind.Video) {
                        const videoElement = track.attach();
                        videoElement.style.width = '100%';
                        videoElement.style.height = '100%';
                        videoElement.style.objectFit = 'cover';

                        if (canvasRef.current) {
                            canvasRef.current.appendChild(videoElement);
                        }
                    }
                },
            );

            await livekitRoom.connect(tokenData.ws_url, tokenData.access_token);
            await livekitRoom.localParticipant.enableCameraAndMicrophone();

            const videoTracks =
                livekitRoom.localParticipant.videoTrackPublications;
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
            await liveKitRoom.localParticipant.setCameraEnabled(
                !isCameraEnabled,
            );
            setIsCameraEnabled(!isCameraEnabled);
        }
    };

    // Toggle microphone
    const toggleMicrophone = async () => {
        if (liveKitRoom) {
            await liveKitRoom.localParticipant.setMicrophoneEnabled(
                !isMicEnabled,
            );
            setIsMicEnabled(!isMicEnabled);
        }
    };

    // Generate invite link
    const generateInviteLink = async () => {
        if (!participantName.trim()) return;

        setIsGeneratingInvite(true);
        try {
            const result = await apiCall(
                `/studio/${room.id}/invite-token`,
                'POST',
                {
                    name: participantName,
                    role: 'guest',
                },
            );
            const inviteUrl = `${window.location.origin}/join/${room.slug}/${result.data.token}`;
            setGeneratedInviteLink(inviteUrl);
        } catch (error: any) {
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

    // Add destination
    const addDestination = async () => {
        if (
            !newDestination.name.trim() ||
            !newDestination.rtmp_url.trim() ||
            !newDestination.stream_key.trim()
        ) {
            return;
        }

        setIsAddingDestination(true);
        try {
            const result = await apiCall(
                `/studio/${room.id}/destinations`,
                'POST',
                newDestination,
            );
            setDestinations([...destinations, result.data]);
            setNewDestination({
                type: 'youtube',
                name: '',
                rtmp_url: '',
                stream_key: '',
            });
            setIsDestinationModalOpen(false);
        } catch (error: any) {
            console.error('Failed to add destination:', error);
            alert('Failed to add destination: ' + error.message);
        } finally {
            setIsAddingDestination(false);
        }
    };

    // Toggle destination
    const toggleDestination = async (destinationId: number) => {
        try {
            const result = await apiCall(
                `/studio/${room.id}/destinations/${destinationId}/toggle`,
                'POST',
            );
            setDestinations(
                destinations.map((d) =>
                    d.id === destinationId
                        ? { ...d, is_enabled: result.data.is_enabled }
                        : d,
                ),
            );
        } catch (error: any) {
            console.error('Failed to toggle destination:', error);
            alert('Failed to toggle destination: ' + error.message);
        }
    };

    // Delete destination
    const deleteDestination = async (destinationId: number) => {
        if (!confirm('Are you sure you want to delete this destination?')) {
            return;
        }

        try {
            await apiCall(
                `/studio/${room.id}/destinations/${destinationId}`,
                'DELETE',
            );
            setDestinations(destinations.filter((d) => d.id !== destinationId));
        } catch (error: any) {
            console.error('Failed to delete destination:', error);
            alert('Failed to delete destination: ' + error.message);
        }
    };

    // Get destination icon
    const getDestinationIcon = (type: string) => {
        return Globe;
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (liveKitRoom) {
                liveKitRoom.disconnect();
            }
        };
    }, [liveKitRoom]);

    const connectedParticipants = room.participants.filter(
        (p) => p.is_connected,
    );
    const layoutIcons = {
        solo: User,
        '2up': Grid3X3,
        grid: Grid3X3,
    };

    const getLayoutIcon = (layout: string) => {
        const Icon = layoutIcons[layout as keyof typeof layoutIcons] || Grid3X3;
        return Icon;
    };

    const enabledDestinationsCount = destinations.filter(
        (d) => d.is_enabled,
    ).length;

    return (
        <>
            <Head title={`Studio - ${room.name}`} />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Top Bar */}
                <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {room.name}
                            </h1>
                            <div className="mt-1 flex items-center gap-3">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Studio • {connectedParticipants.length}{' '}
                                    participant(s) connected
                                </span>
                                {isStreaming && (
                                    <span className="text-sm font-medium text-red-500">
                                        Streaming:{' '}
                                        {formatDuration(streamDuration)}
                                    </span>
                                )}
                                {isRecording && (
                                    <span className="text-sm font-medium text-orange-500">
                                        Recording:{' '}
                                        {formatDuration(recordDuration)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Badge
                                variant={isConnected ? 'default' : 'secondary'}
                            >
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </Badge>

                            {/* Camera and Mic Controls */}
                            {isConnected && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant={
                                            isCameraEnabled
                                                ? 'default'
                                                : 'destructive'
                                        }
                                        onClick={toggleCamera}
                                    >
                                        {isCameraEnabled ? (
                                            <Video className="h-4 w-4" />
                                        ) : (
                                            <VideoOff className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={
                                            isMicEnabled
                                                ? 'default'
                                                : 'destructive'
                                        }
                                        onClick={toggleMicrophone}
                                    >
                                        {isMicEnabled ? (
                                            <Mic className="h-4 w-4" />
                                        ) : (
                                            <MicOff className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            )}

                            {/* Recording Button */}
                            <Button
                                variant={
                                    isRecording ? 'destructive' : 'outline'
                                }
                                onClick={
                                    isRecording ? stopRecording : startRecording
                                }
                                className="flex items-center gap-2"
                                disabled={
                                    !isConnected ||
                                    isStartingRecording ||
                                    isStoppingRecording
                                }
                            >
                                {isStartingRecording || isStoppingRecording ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <div
                                        className={`h-3 w-3 rounded-full ${isRecording ? 'animate-pulse bg-white' : 'bg-red-500'}`}
                                    />
                                )}
                                {isStartingRecording
                                    ? 'Starting...'
                                    : isStoppingRecording
                                      ? 'Stopping...'
                                      : isRecording
                                        ? 'Stop Recording'
                                        : 'Record'}
                            </Button>

                            {/* Connect / Go Live Button */}
                            {!isConnected ? (
                                <Button
                                    size="lg"
                                    onClick={connectToLiveKit}
                                    disabled={isConnecting}
                                    className="flex items-center gap-2"
                                >
                                    {isConnecting ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Video className="h-5 w-5" />
                                    )}
                                    {isConnecting
                                        ? 'Connecting...'
                                        : 'Connect Studio'}
                                </Button>
                            ) : (
                                <Button
                                    variant={
                                        isStreaming ? 'destructive' : 'default'
                                    }
                                    size="lg"
                                    onClick={
                                        isStreaming
                                            ? stopStreaming
                                            : startStreaming
                                    }
                                    disabled={
                                        isStartingStream ||
                                        isStoppingStream ||
                                        (!isStreaming &&
                                            enabledDestinationsCount === 0)
                                    }
                                    className="flex items-center gap-2"
                                >
                                    {isStartingStream || isStoppingStream ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : isStreaming ? (
                                        <Square className="h-5 w-5" />
                                    ) : (
                                        <Play className="h-5 w-5" />
                                    )}
                                    {isStartingStream
                                        ? 'Going Live...'
                                        : isStoppingStream
                                          ? 'Stopping...'
                                          : isStreaming
                                            ? 'End Stream'
                                            : enabledDestinationsCount > 0
                                              ? `Go Live (${enabledDestinationsCount})`
                                              : 'Add Destination'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-1">
                    {/* Left Sidebar - Participants */}
                    <div className="w-80 overflow-y-auto border-r border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-6">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <Users className="h-5 w-5" />
                                Participants ({room.participants.length})
                            </h2>

                            <div className="space-y-3">
                                {room.participants.map((participant) => (
                                    <Card key={participant.id} className="p-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {participant.name}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {participant.role}
                                                    </Badge>
                                                    <span
                                                        className={`h-2 w-2 rounded-full ${
                                                            participant.is_connected
                                                                ? 'bg-green-500'
                                                                : 'bg-gray-400'
                                                        }`}
                                                    />
                                                    {participant.is_connected
                                                        ? 'Connected'
                                                        : 'Disconnected'}
                                                </div>
                                            </div>

                                            {participant.is_connected && (
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                    >
                                                        <Mic className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                    >
                                                        <Video className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ))}

                                <Dialog
                                    open={isInviteModalOpen}
                                    onOpenChange={setIsInviteModalOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="flex w-full items-center gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Invite Participant
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>
                                                Invite Participant
                                            </DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            {!generatedInviteLink ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="participant-name">
                                                            Participant Name
                                                        </Label>
                                                        <Input
                                                            id="participant-name"
                                                            placeholder="Enter participant name"
                                                            value={
                                                                participantName
                                                            }
                                                            onChange={(e) =>
                                                                setParticipantName(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            onKeyDown={(e) =>
                                                                e.key ===
                                                                    'Enter' &&
                                                                generateInviteLink()
                                                            }
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={
                                                                generateInviteLink
                                                            }
                                                            disabled={
                                                                !participantName.trim() ||
                                                                isGeneratingInvite
                                                            }
                                                            className="flex-1"
                                                        >
                                                            {isGeneratingInvite
                                                                ? 'Generating...'
                                                                : 'Generate Invite Link'}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={
                                                                resetInviteModal
                                                            }
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label>
                                                            Invite Link for{' '}
                                                            {participantName}
                                                        </Label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                value={
                                                                    generatedInviteLink
                                                                }
                                                                readOnly
                                                                className="flex-1"
                                                            />
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={
                                                                    copyInviteLink
                                                                }
                                                                className="flex items-center gap-2"
                                                            >
                                                                {copied ? (
                                                                    <Check className="h-4 w-4" />
                                                                ) : (
                                                                    <Copy className="h-4 w-4" />
                                                                )}
                                                                {copied
                                                                    ? 'Copied!'
                                                                    : 'Copy'}
                                                            </Button>
                                                        </div>
                                                        <p className="text-sm text-gray-500">
                                                            Share this link with{' '}
                                                            {participantName} to
                                                            join the room.
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={
                                                                resetInviteModal
                                                            }
                                                            className="flex-1"
                                                        >
                                                            Create Another
                                                            Invite
                                                        </Button>
                                                        <Button
                                                            onClick={
                                                                resetInviteModal
                                                            }
                                                        >
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
                            <h3 className="mb-4 text-lg font-semibold">
                                Layouts
                            </h3>
                            <div className="space-y-2">
                                {room.scenes.map((scene) => {
                                    const Icon = getLayoutIcon(scene.layout);
                                    return (
                                        <Button
                                            key={scene.id}
                                            variant={
                                                scene.is_active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            className="w-full justify-start"
                                        >
                                            <Icon className="mr-2 h-4 w-4" />
                                            {scene.layout === '2up'
                                                ? '2-Up'
                                                : scene.layout
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                  scene.layout.slice(1)}
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
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">
                                        Live Preview
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <Monitor className="h-5 w-5" />
                                        <span className="text-sm text-gray-500">
                                            {room.active_scene?.layout ||
                                                'No layout selected'}
                                        </span>
                                    </div>
                                </div>

                                <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-900">
                                    {isConnected ? (
                                        <>
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                muted
                                                playsInline
                                                className="h-full w-full object-cover"
                                            />

                                            <div
                                                ref={canvasRef}
                                                className="absolute inset-0 grid grid-cols-2 gap-1 p-2"
                                                style={{
                                                    display: liveKitRoom
                                                        ?.remoteParticipants
                                                        .size
                                                        ? 'grid'
                                                        : 'none',
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-white">
                                            <div className="text-center">
                                                <Monitor className="mx-auto mb-4 h-16 w-16 opacity-50" />
                                                <p className="text-lg">
                                                    Canvas Preview
                                                </p>
                                                <p className="text-sm opacity-75">
                                                    {isConnecting
                                                        ? 'Connecting to studio...'
                                                        : 'Click "Connect Studio" to start'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Stream Status Overlay */}
                                    {isStreaming && (
                                        <div className="absolute top-4 left-4 flex items-center gap-2">
                                            <Badge
                                                variant="destructive"
                                                className="flex items-center gap-2"
                                            >
                                                <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                                                LIVE
                                            </Badge>
                                            <Badge variant="secondary">
                                                {formatDuration(streamDuration)}
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Recording Status Overlay */}
                                    {isRecording && (
                                        <div
                                            className="absolute top-4 left-4 flex items-center gap-2"
                                            style={{
                                                left: isStreaming
                                                    ? 'auto'
                                                    : '1rem',
                                                right: isStreaming
                                                    ? '1rem'
                                                    : 'auto',
                                            }}
                                        >
                                            <Badge
                                                variant="secondary"
                                                className="flex items-center gap-2 bg-orange-500 text-white"
                                            >
                                                <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                                                REC
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Connection Status */}
                                    {!isStreaming && !isRecording && (
                                        <div className="absolute top-4 right-4">
                                            <Badge
                                                variant={
                                                    isConnected
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {isConnected
                                                    ? 'Studio Connected'
                                                    : 'Studio Offline'}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Streaming Destinations */}
                        <Card>
                            <div className="p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold">
                                            Streaming Destinations
                                        </h3>
                                        {enabledDestinationsCount > 0 && (
                                            <Badge variant="outline">
                                                {enabledDestinationsCount}{' '}
                                                enabled
                                            </Badge>
                                        )}
                                    </div>
                                    <Dialog
                                        open={isDestinationModalOpen}
                                        onOpenChange={setIsDestinationModalOpen}
                                    >
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-2"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Destination
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Add Streaming Destination
                                                </DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="dest-type">
                                                        Platform
                                                    </Label>
                                                    <select
                                                        id="dest-type"
                                                        value={
                                                            newDestination.type
                                                        }
                                                        onChange={(e) =>
                                                            setNewDestination({
                                                                ...newDestination,
                                                                type: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        className="w-full rounded-md border px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                                                    >
                                                        <option value="youtube">
                                                            YouTube
                                                        </option>
                                                        <option value="twitch">
                                                            Twitch
                                                        </option>
                                                        <option value="facebook">
                                                            Facebook
                                                        </option>
                                                        <option value="rtmp">
                                                            Custom RTMP
                                                        </option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="dest-name">
                                                        Name
                                                    </Label>
                                                    <Input
                                                        id="dest-name"
                                                        placeholder="e.g., My YouTube Channel"
                                                        value={
                                                            newDestination.name
                                                        }
                                                        onChange={(e) =>
                                                            setNewDestination({
                                                                ...newDestination,
                                                                name: e.target
                                                                    .value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="dest-url">
                                                        RTMP URL
                                                    </Label>
                                                    <Input
                                                        id="dest-url"
                                                        placeholder="rtmp://a.rtmp.youtube.com/live2"
                                                        value={
                                                            newDestination.rtmp_url
                                                        }
                                                        onChange={(e) =>
                                                            setNewDestination({
                                                                ...newDestination,
                                                                rtmp_url:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="dest-key">
                                                        Stream Key
                                                    </Label>
                                                    <Input
                                                        id="dest-key"
                                                        type="password"
                                                        placeholder="Your stream key"
                                                        value={
                                                            newDestination.stream_key
                                                        }
                                                        onChange={(e) =>
                                                            setNewDestination({
                                                                ...newDestination,
                                                                stream_key:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                    />
                                                    <p className="text-xs text-gray-500">
                                                        Your stream key is
                                                        encrypted and stored
                                                        securely.
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        onClick={addDestination}
                                                        disabled={
                                                            isAddingDestination ||
                                                            !newDestination.name.trim() ||
                                                            !newDestination.rtmp_url.trim() ||
                                                            !newDestination.stream_key.trim()
                                                        }
                                                        className="flex-1"
                                                    >
                                                        {isAddingDestination
                                                            ? 'Adding...'
                                                            : 'Add Destination'}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            setIsDestinationModalOpen(
                                                                false,
                                                            )
                                                        }
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {destinations.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {destinations.map((destination) => {
                                            const DestIcon = getDestinationIcon(
                                                destination.type,
                                            );
                                            return (
                                                <div
                                                    key={destination.id}
                                                    className={`rounded-lg border-2 p-4 ${
                                                        destination.is_enabled
                                                            ? isStreaming
                                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                                : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-3">
                                                            <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                                                                <DestIcon className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">
                                                                    {
                                                                        destination.name
                                                                    }
                                                                </p>
                                                                <p className="text-sm text-gray-500 capitalize">
                                                                    {
                                                                        destination.type
                                                                    }
                                                                </p>
                                                                {isStreaming &&
                                                                    destination.is_enabled && (
                                                                        <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                                                                            <Radio className="h-3 w-3 animate-pulse" />
                                                                            Streaming
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                                                        <Button
                                                            variant={
                                                                destination.is_enabled
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                            size="sm"
                                                            onClick={() =>
                                                                toggleDestination(
                                                                    destination.id,
                                                                )
                                                            }
                                                            disabled={
                                                                isStreaming
                                                            }
                                                        >
                                                            {destination.is_enabled
                                                                ? 'Enabled'
                                                                : 'Disabled'}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                deleteDestination(
                                                                    destination.id,
                                                                )
                                                            }
                                                            disabled={
                                                                isStreaming
                                                            }
                                                            className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <Settings className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                        <p className="text-gray-500">
                                            No streaming destinations configured
                                        </p>
                                        <p className="mt-1 text-sm text-gray-400">
                                            Add a destination to stream to
                                            YouTube, Twitch, or other platforms
                                        </p>
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
