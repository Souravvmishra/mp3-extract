'use client';

import { signInWithGoogle } from '../hooks/lib/authFunctions';
import { useRouter } from 'next/navigation';

export default function GoogleLoginButton() {
    const router = useRouter();
    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
            router.push('/quadrat')
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
