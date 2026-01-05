import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    ExternalLink,
    LoaderCircle,
    Monitor,
    Plus,
    Radio,
    Settings,
    Users,
    Video,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface Room {
    id: number;
    name: string;
    slug: string;
    status: string;
    participants_count: number;
    destinations_count: number;
    created_at: string;
    studio_url: string;
}

interface DashboardProps {
    rooms: Room[];
}

export default function Dashboard({ rooms }: DashboardProps) {
    const [newRoomName, setNewRoomName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const createRoom = () => {
        if (!newRoomName.trim()) return;

        setIsCreating(true);
        router.post(
            '/rooms',
            {
                name: newRoomName,
            },
            {
                onSuccess: () => {
                    setNewRoomName('');
                },
                onError: (errors) => {
                    console.error('Failed to create room:', errors);
                },
                onFinish: () => setIsCreating(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-8 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Your Studios
                    </h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                        Create and manage your live streaming rooms
                    </p>
                </div>

                {/* Create Room Section */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.02]">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                            <Plus className="h-5 w-5 text-violet-500 dark:text-violet-400" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900 dark:text-white">
                                Create New Studio
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Start a new live streaming room
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Enter studio name..."
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            onKeyPress={(e) =>
                                e.key === 'Enter' && createRoom()
                            }
                            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
                            disabled={isCreating}
                        />
                        <button
                            onClick={createRoom}
                            disabled={isCreating || !newRoomName.trim()}
                            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isCreating ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            {isCreating ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </div>

                {/* Rooms Grid */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            Your Studios ({rooms.length})
                        </h2>
                    </div>

                    {rooms.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-16 text-center dark:border-white/10 dark:bg-white/[0.01]">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10">
                                <Video className="h-8 w-8 text-violet-500 dark:text-violet-400" />
                            </div>
                            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                                No studios yet
                            </h3>
                            <p className="mb-6 text-gray-500 dark:text-gray-400">
                                Create your first streaming studio to get
                                started
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {rooms.map((room) => (
                                <div
                                    key={room.id}
                                    className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-violet-500/30"
                                >
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                                                <Monitor className="h-5 w-5 text-violet-500 dark:text-violet-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {room.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    /{room.slug}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                                room.status === 'live'
                                                    ? 'bg-red-500/10 text-red-500'
                                                    : room.status === 'active'
                                                      ? 'bg-green-500/10 text-green-500'
                                                      : 'bg-gray-500/10 text-gray-500'
                                            }`}
                                        >
                                            {room.status === 'live' && (
                                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                                            )}
                                            {room.status}
                                        </span>
                                    </div>

                                    <div className="mb-6 space-y-2.5">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Users className="h-4 w-4" />
                                            {room.participants_count}{' '}
                                            participant
                                            {room.participants_count !== 1
                                                ? 's'
                                                : ''}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Radio className="h-4 w-4" />
                                            {room.destinations_count}{' '}
                                            destination
                                            {room.destinations_count !== 1
                                                ? 's'
                                                : ''}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(
                                                room.created_at,
                                            ).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link
                                            href={room.studio_url}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl hover:shadow-violet-500/30"
                                        >
                                            <Monitor className="h-4 w-4" />
                                            Open Studio
                                        </Link>
                                        <button className="rounded-lg border border-gray-200 bg-white p-2.5 text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10">
                                            <Settings className="h-4 w-4" />
                                        </button>
                                        <button className="rounded-lg border border-gray-200 bg-white p-2.5 text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10">
                                            <ExternalLink className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
