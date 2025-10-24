import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Monitor, Users, Settings, ExternalLink, Calendar } from 'lucide-react';
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
        router.post('/rooms', {
            name: newRoomName,
        }, {
            onSuccess: () => {
                setNewRoomName('');
            },
            onError: (errors) => {
                console.error('Failed to create room:', errors);
            },
            onFinish: () => setIsCreating(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Studio Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage your live streaming rooms
                        </p>
                    </div>
                </div>

                {/* Create Room Section */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Create New Room</h2>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Enter room name..."
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && createRoom()}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            disabled={isCreating}
                        />
                        <Button
                            onClick={createRoom}
                            disabled={isCreating || !newRoomName.trim()}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            {isCreating ? 'Creating...' : 'Create Room'}
                        </Button>
                    </div>
                </Card>

                {/* Rooms Grid */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Your Rooms ({rooms.length})</h2>

                    {rooms.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Monitor className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No rooms yet
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Create your first streaming room to get started
                            </p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {rooms.map((room) => (
                                <Card key={room.id} className="p-6 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {room.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                /{room.slug}
                                            </p>
                                        </div>
                                        <Badge variant={room.status === 'active' ? 'default' : 'secondary'}>
                                            {room.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Users className="w-4 h-4" />
                                            {room.participants_count} participant(s)
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Settings className="w-4 h-4" />
                                            {room.destinations_count} destination(s)
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Calendar className="w-4 h-4" />
                                            Created {new Date(room.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button asChild className="flex-1">
                                            <Link href={room.studio_url}>
                                                <Monitor className="w-4 h-4 mr-2" />
                                                Open Studio
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="icon">
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
