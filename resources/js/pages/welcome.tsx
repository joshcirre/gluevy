import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Globe, Radio, Shield, Users, Video, Zap } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Professional Live Streaming Studio">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
                {/* Navigation */}
                <nav className="border-b border-white/5">
                    <div className="mx-auto max-w-7xl px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
                                    <Video className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xl font-bold">
                                    Gluevy
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:text-white"
                                        >
                                            Sign in
                                        </Link>
                                        <Link
                                            href={register()}
                                            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
                                        >
                                            Get Started
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="relative overflow-hidden">
                    {/* Background gradient effects */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />
                        <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-fuchsia-500/10 blur-3xl" />
                    </div>

                    <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:py-40">
                        <div className="text-center">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                                Now with LiveKit Cloud
                            </div>

                            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                                Professional live streaming
                                <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                                    made simple
                                </span>
                            </h1>

                            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
                                Create stunning live streams with guests, custom
                                layouts, and multi-platform streaming. No
                                downloads required - everything runs in your
                                browser.
                            </p>

                            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                                <Link
                                    href={register()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl hover:shadow-violet-500/30"
                                >
                                    Start Streaming Free
                                    <Zap className="h-5 w-5" />
                                </Link>
                                <a
                                    href="#features"
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-medium text-white transition hover:bg-white/10"
                                >
                                    See Features
                                </a>
                            </div>
                        </div>

                        {/* Preview mockup */}
                        <div className="mt-16 sm:mt-24">
                            <div className="relative mx-auto max-w-5xl">
                                <div className="rounded-2xl border border-white/10 bg-gray-900/50 p-2 shadow-2xl backdrop-blur-sm">
                                    <div className="rounded-xl bg-gray-900 p-4">
                                        {/* Fake studio UI */}
                                        <div className="flex gap-4">
                                            {/* Video preview area */}
                                            <div className="flex-1">
                                                <div className="relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-gray-800 to-gray-900">
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="text-center">
                                                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/20">
                                                                <Video className="h-8 w-8 text-violet-400" />
                                                            </div>
                                                            <p className="text-gray-400">
                                                                Live Preview
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {/* LIVE badge */}
                                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded bg-red-500 px-2 py-1 text-xs font-medium">
                                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                                                        LIVE
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sidebar */}
                                            <div className="w-48 space-y-3">
                                                <div className="rounded-lg bg-gray-800 p-3">
                                                    <div className="mb-2 text-xs font-medium text-gray-400">
                                                        Participants
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-violet-500/30" />
                                                            <span className="text-sm text-gray-300">
                                                                You (Host)
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-blue-500/30" />
                                                            <span className="text-sm text-gray-300">
                                                                Guest 1
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="rounded-lg bg-gray-800 p-3">
                                                    <div className="mb-2 text-xs font-medium text-gray-400">
                                                        Destinations
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2 text-xs text-green-400">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                            YouTube
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-green-400">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                            Twitch
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section
                    id="features"
                    className="border-t border-white/5 py-24"
                >
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold sm:text-4xl">
                                Everything you need to go live
                            </h2>
                            <p className="mt-4 text-lg text-gray-400">
                                Professional streaming tools without the
                                complexity
                            </p>
                        </div>

                        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            <FeatureCard
                                icon={Users}
                                title="Invite Guests"
                                description="Bring guests into your stream with a simple link. No account or download needed."
                            />
                            <FeatureCard
                                icon={Radio}
                                title="Multi-Platform"
                                description="Stream to YouTube, Twitch, Facebook, and custom RTMP destinations simultaneously."
                            />
                            <FeatureCard
                                icon={Video}
                                title="HD Recording"
                                description="Record your streams in high quality for repurposing later."
                            />
                            <FeatureCard
                                icon={Zap}
                                title="Low Latency"
                                description="Powered by LiveKit for real-time, sub-second latency video."
                            />
                            <FeatureCard
                                icon={Shield}
                                title="Secure"
                                description="End-to-end encryption and secure stream keys keep your content safe."
                            />
                            <FeatureCard
                                icon={Globe}
                                title="Browser-Based"
                                description="No software to install. Works on any modern browser."
                            />
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="border-t border-white/5 py-24">
                    <div className="mx-auto max-w-4xl px-6 text-center">
                        <h2 className="text-3xl font-bold sm:text-4xl">
                            Ready to start streaming?
                        </h2>
                        <p className="mt-4 text-lg text-gray-400">
                            Create your free account and go live in minutes.
                        </p>
                        <div className="mt-8">
                            <Link
                                href={register()}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-gray-900 transition hover:bg-gray-100"
                            >
                                Get Started Free
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-white/5 py-12">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
                                    <Video className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-semibold">Gluevy</span>
                            </div>
                            <p className="text-sm text-gray-500">
                                Professional live streaming made simple.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}

function FeatureCard({
    icon: Icon,
    title,
    description,
}: {
    icon: any;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition hover:border-white/10 hover:bg-white/[0.04]">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                <Icon className="h-6 w-6 text-violet-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">{title}</h3>
            <p className="text-gray-400">{description}</p>
        </div>
    );
}
