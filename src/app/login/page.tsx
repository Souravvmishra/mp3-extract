'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../../hooks/lib/authFunctions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/providers/AuthProvider';

// Map Firebase error codes to user-friendly messages
const getFriendlyErrorMessage = (error: unknown): string => {
    const errorCode = typeof error === 'object' && error !== null && 'code' in error ? (error as { code: string }).code : 'unknown';
    const errorMessages: { [key: string]: string } = {
        'auth/invalid-email': 'The email address is not valid. Please check and try again.',
        'auth/user-not-found': 'No account found with this email. Please sign up or try a different email.',
        'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
        'auth/email-already-in-use': 'This email is already registered. Please sign in or use a different email.',
        'auth/weak-password': 'The password is too weak. Please use at least 8 characters, including letters and numbers.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
        'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
        'auth/popup-closed-by-user': 'Google sign-in was canceled. Please try again.',
        'auth/cancelled-popup-request': 'Google sign-in was interrupted. Please try again.',
        default: 'An unexpected error occurred. Please try again later.'
    };

    return errorMessages[errorCode] || errorMessages['default'];
};

export default function AuthPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user, role } = useAuth();

    // Redirect when both user and role are available
    useEffect(() => {
        if (user && role) {
            const targetPath = role === 'teacher' ? '/teacher' : '/student/quadrat';
            router.push(targetPath);
        }
    }, [user, role, router]);

    const handleGoogleAuth = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithGoogle();
            // Redirect will happen in useEffect once role is loaded
        } catch (error: unknown) {
            console.error('Google authentication failed', error);
            setError(getFriendlyErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmail(email, password);
            // Redirect will happen in useEffect once role is loaded
        } catch (error: unknown) {
            console.error('Login failed', error);
            setError(getFriendlyErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match. Please ensure both passwords are identical.');
            setLoading(false);
            return;
        }

        try {
            await signUpWithEmail(email, password);
            // Redirect will happen in useEffect once role is loaded
        } catch (error: unknown) {
            console.error('Sign up failed', error);
            setError(getFriendlyErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('');
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        resetForm();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-800">Quadrat</h1>
                <p className="text-gray-600 mt-2">Your digital workspace</p>
            </div>

            <Card className="w-full max-w-md shadow-lg border-gray-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-center">Welcome to Quadrat</CardTitle>
                    <CardDescription className="text-center">
                        Sign in or create an account to get started
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="login">Sign In</TabsTrigger>
                            <TabsTrigger value="signup">Create Account</TabsTrigger>
                        </TabsList>

                        {/* Login Tab Content */}
                        <TabsContent value="login" className="space-y-6">
                            {/* Google Authentication */}
                            <Button
                                onClick={handleGoogleAuth}
                                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300"
                                variant="outline"
                                disabled={loading}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                                    {/* paths omitted for brevity */}
                                </svg>
                                {loading ? 'Signing in...' : 'Continue with Google'}
                            </Button>

                            <div className="flex items-center">
                                <hr className="flex-grow border-gray-200" />
                                <span className="px-2 text-gray-400 text-sm">or sign in with email</span>
                                <hr className="flex-grow border-gray-200" />
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <Alert variant="destructive" className="border-red-200 bg-red-50">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Login Form */}
                            <form onSubmit={handleSignIn} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                                    <Input
                                        id="login-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-white"
                                        required
                                        aria-invalid={error ? 'true' : 'false'}
                                        aria-describedby={error ? 'login-error' : undefined}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                                    <Input
                                        id="login-password"
                                        type="password"
                                        placeholder="********"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-white"
                                        required
                                        aria-invalid={error ? 'true' : 'false'}
                                        aria-describedby={error ? 'login-error' : undefined}
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* Sign Up Tab Content */}
                        <TabsContent value="signup" className="space-y-6">
                            {/* Google Authentication */}
                            <Button
                                onClick={handleGoogleAuth}
                                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300"
                                variant="outline"
                                disabled={loading}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                                    {/* paths omitted for brevity */}
                                </svg>
                                {loading ? 'Signing up...' : 'Sign up with Google'}
                            </Button>

                            <div className="flex items-center">
                                <hr className="flex-grow border-gray-200" />
                                <span className="px-2 text-gray-400 text-sm">or sign up with email</span>
                                <hr className="flex-grow border-gray-200" />
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <Alert variant="destructive" className="border-red-200 bg-red-50">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Sign Up Form */}
                            <form onSubmit={handleSignUp} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                                    <Input
                                        id="signup-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-white"
                                        required
                                        aria-invalid={error ? 'true' : 'false'}
                                        aria-describedby={error ? 'signup-error' : undefined}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                                    <Input
                                        id="signup-password"
                                        type="password"
                                        placeholder="********"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-white"
                                        required
                                        minLength={8}
                                        aria-invalid={error ? 'true' : 'false'}
                                        aria-describedby={error ? 'signup-error' : undefined}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-confirm-password" className="text-sm font-medium">Confirm Password</Label>
                                    <Input
                                        id="signup-confirm-password"
                                        type="password"
                                        placeholder="********"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-white"
                                        required
                                        aria-invalid={error ? 'true' : 'false'}
                                        aria-describedby={error ? 'signup-error' : undefined}
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                                    {loading ? 'Creating account...' : 'Create Account'}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <p className="mt-8 text-xs text-gray-500">
                By using Quadrat, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>
            </p>
        </div>
    );
}
