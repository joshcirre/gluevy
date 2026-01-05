import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { Video } from 'lucide-react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-6 md:p-10">
            {/* Background gradient effects */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
                <div className="absolute right-0 bottom-0 h-[300px] w-[300px] rounded-full bg-fuchsia-500/10 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-3 font-medium"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
                                <Video className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">
                                Gluevy
                            </span>
                        </Link>

                        <div className="mt-2 space-y-2 text-center">
                            <h1 className="text-2xl font-semibold text-white">
                                {title}
                            </h1>
                            <p className="text-sm text-gray-400">
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* Form container with subtle border */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
