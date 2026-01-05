import RegisteredUserController from '@/actions/App/Http/Controllers/Auth/RegisteredUserController';
import InputError from '@/components/input-error';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { Form, Head, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

export default function Register() {
    return (
        <AuthLayout
            title="Create your account"
            description="Start streaming in minutes"
        >
            <Head title="Register" />
            <Form
                {...RegisteredUserController.store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <label
                                    htmlFor="name"
                                    className="text-sm font-medium text-gray-300"
                                >
                                    Full name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="John Doe"
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                                />
                                <InputError
                                    message={errors.name}
                                    className="text-red-400"
                                />
                            </div>

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
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                                />
                                <InputError
                                    message={errors.email}
                                    className="text-red-400"
                                />
                            </div>

                            <div className="grid gap-2">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium text-gray-300"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Create a password"
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                                />
                                <InputError
                                    message={errors.password}
                                    className="text-red-400"
                                />
                            </div>

                            <div className="grid gap-2">
                                <label
                                    htmlFor="password_confirmation"
                                    className="text-sm font-medium text-gray-300"
                                >
                                    Confirm password
                                </label>
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm your password"
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                    className="text-red-400"
                                />
                            </div>

                            <button
                                type="submit"
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                )}
                                Create account
                            </button>
                        </div>

                        <div className="text-center text-sm text-gray-400">
                            Already have an account?{' '}
                            <Link
                                href={login()}
                                tabIndex={6}
                                className="font-medium text-violet-400 transition hover:text-violet-300"
                            >
                                Sign in
                            </Link>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
