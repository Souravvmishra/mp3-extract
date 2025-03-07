'use client';

import { useEffect, useState } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '@/lib/authFunctions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/providers/AuthProvider';

export default function AuthPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("login");
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            redirect('/quadrat')
        }
    }, [user])

    const handleGoogleAuth = async () => {
        try {
            setLoading(true);
            await signInWithGoogle();
            router.push('/quadrat');
        } catch (error) {
            console.error('Google authentication failed', error);
            setError('Google authentication failed. Please try again.');
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
            router.push('/quadrat');
        } catch (error) {
            console.error('Login failed', error);
            setError('Login failed. Please verify your credentials and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        try {
            await signUpWithEmail(email, password);
            router.push('/quadrat');
        } catch (error) {
            console.error('Sign up failed', error);
            setError('Sign up failed. Please check your information and try again.');
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
                    <Tabs defaultValue="login" value={activeTab} onValueChange={handleTabChange} className="w-full">
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
                                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                                </svg>
                                {loading ? 'Signing in...' : 'Continue with Google'}
                            </Button>

                            {/* Divider */}
                            <div className="flex items-center">
                                <hr className="flex-grow border-gray-200" />
                                <span className="px-2 text-gray-400 text-sm">or sign in with email</span>
                                <hr className="flex-grow border-gray-200" />
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <Alert variant="destructive" className="border-red-200 bg-red-50">
                                    <AlertCircle className="h-4 w-4" />
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
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                                    </div>
                                    <Input
                                        id="login-password"
                                        type="password"
                                        placeholder="********"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-white"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={loading}
                                >
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
                                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                                </svg>
                                {loading ? 'Signing up...' : 'Sign up with Google'}
                            </Button>

                            {/* Divider */}
                            <div className="flex items-center">
                                <hr className="flex-grow border-gray-200" />
                                <span className="px-2 text-gray-400 text-sm">or sign up with email</span>
                                <hr className="flex-grow border-gray-200" />
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <Alert variant="destructive" className="border-red-200 bg-red-50">
                                    <AlertCircle className="h-4 w-4" />
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
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Must be at least 8 characters
                                    </p>
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
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={loading}
                                >
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
