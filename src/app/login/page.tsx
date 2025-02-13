'use client';

import GoogleLoginButton from '@/components/GoogleLoginButton';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="p-6 bg-gray-100 rounded-lg shadow-lg">
                <h1 className="text-2xl mb-4">Login</h1>
                <GoogleLoginButton />
            </div>
        </div>
    );
}
