import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { request } from '@/routes/password';
import { Form, Head, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <AuthLayout
            title="Welcome back"
            description="Sign in to your Gluevy account"
        >
            <Head title="Log in" />

            <Form
                {...AuthenticatedSessionController.store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <label
                                    htmlFor="email"
                                    className="text-sm font-medium text-gray-300"
                                >
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                                />
                                <InputError
                                    message={errors.email}
                                    className="text-red-400"
                                />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <label
                                        htmlFor="password"
                                        className="text-sm font-medium text-gray-300"
                                    >
                                        Password
                                    </label>
                                    {canResetPassword && (
                                        <Link
                                            href={request()}
                                            className="text-sm text-violet-400 transition hover:text-violet-300"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                                />
                                <InputError
                                    message={errors.password}
                                    className="text-red-400"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    name="remember"
                                    tabIndex={3}
                                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/20 focus:ring-offset-0"
                                />
                                <label
                                    htmlFor="remember"
                                    className="text-sm text-gray-400"
                                >
                                    Remember me
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                )}
                                Sign in
                            </button>
                        </div>

                        <div className="text-center text-sm text-gray-400">
                            Don't have an account?{' '}
                            <Link
                                href={register()}
                                tabIndex={5}
                                className="font-medium text-violet-400 transition hover:text-violet-300"
                            >
                                Create one
                            </Link>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mt-4 rounded-lg bg-green-500/10 p-3 text-center text-sm font-medium text-green-400">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
