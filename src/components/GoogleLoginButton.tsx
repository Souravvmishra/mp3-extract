'use client';

import { signInWithGoogle } from '@/lib/authFunctions';

export default function GoogleLoginButton() {
    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error('Login failed', error);
        }
    };

    return (
        <button onClick={handleGoogleLogin} className="bg-blue-500 text-white p-2 rounded">
            Sign in with Google
        </button>
    );
}
