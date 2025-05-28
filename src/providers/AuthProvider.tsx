'use client';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/hooks/lib/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
// Role selection modal
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, BookOpen, ArrowRight } from 'lucide-react';

// Define user role type
export type UserRole = 'student' | 'teacher' | null;

// Define localStorage keys
const LOCAL_STORAGE_KEY = 'loclatsoreg';
const USER_ROLE_KEY = 'userRole';
const USER_EMAIL_KEY = 'userEmail';

// 1. Create Context with Auth info
interface AuthContextType {
    user: User | null;
    loading: boolean;
    role: UserRole;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    role: null,
});

// 2. Provider Component
export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<UserRole>(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<UserRole>(null);
    const router = useRouter();

    useEffect(() => {
        console.log(selectedRole, 'selectedRole changed');
    }, [selectedRole]);

    // Save user role & profile to Firestore and flag localStorage
    const saveUserRole = async (newRole: UserRole) => {
        if (!user || !newRole) return;
        setLoading(true);
        try {
            const userData = {
                role: newRole,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                updatedAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'userRoles', user.uid), userData, { merge: true });
            setRole(newRole);
            window.localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
            window.localStorage.setItem(USER_ROLE_KEY, newRole);
            if (user.email) window.localStorage.setItem(USER_EMAIL_KEY, user.email);
            setShowRoleModal(false);
            // Redirect user now that role is set
            const targetPath = newRole === 'teacher' ? '/teacher' : '/student/quadrat';
            router.push(targetPath);
        } catch (error) {
            console.error('Error setting user role:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch user profile & role from Firestore
    const fetchUserProfile = async (uid: string) => {
        try {
            const ref = doc(db, 'userRoles', uid);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data();
                const savedRole = data.role as UserRole;
                const savedEmail = data.email as string | undefined;
                if (savedRole && savedEmail) {
                    setRole(savedRole);
                    window.localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
                    window.localStorage.setItem(USER_ROLE_KEY, savedRole);
                    window.localStorage.setItem(USER_EMAIL_KEY, savedEmail);
                } else {
                    setShowRoleModal(true);
                }
            } else {
                setShowRoleModal(true);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setShowRoleModal(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
            if (!fbUser) {
                router.push('/login');
                setUser(null);
                setRole(null);
                setLoading(false);
                return;
            }
            setUser(fbUser);
            const hasSaved = window.localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';
            const savedRole = window.localStorage.getItem(USER_ROLE_KEY) as UserRole;
            const savedEmail = window.localStorage.getItem(USER_EMAIL_KEY);
            if (hasSaved && savedRole && savedEmail === fbUser.email) {
                setRole(savedRole);
                setLoading(false);
            } else {
                fetchUserProfile(fbUser.uid);
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Handle role submission
    const handleRoleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRole) await saveUserRole(selectedRole);
    };



    const RoleSelectionModal = () => {
        if (!showRoleModal || !user) return null;

        return (
            <Dialog open={showRoleModal} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="text-center space-y-3">
                        <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-bold">Welcome!</DialogTitle>
                        <DialogDescription className="text-base">
                            Choose your role to get started with a personalized experience
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleRoleSubmit} className="space-y-6 mt-6">
                        <RadioGroup
                            value={selectedRole || 'student'}
                            onValueChange={(value) => setSelectedRole(value as UserRole)}
                            className="space-y-3"
                            defaultValue="student"
                        >
                            {/* Student Option */}
                            <div className="relative">
                                <Label htmlFor="student" className="cursor-pointer">
                                    <Card className={`relative overflow-hidden border-2 transition-all duration-200 hover:shadow-md ${(selectedRole || 'student') === 'student'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-md backdrop-blur-sm'
                                        : 'border-border hover:border-blue-300 blur-sm opacity-50'
                                        }`}>
                                        <CardContent className="flex items-center p-4">
                                            <div className="flex items-center space-x-4 flex-1">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                                    <BookOpen className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-semibold text-lg">Student</h3>
                                                        <Badge variant="secondary" className="text-xs">
                                                            Learn
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Access courses, assignments, and learning materials
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`transition-opacity duration-200 ${(selectedRole || 'student') === 'student' ? 'opacity-100' : 'opacity-0'
                                                }`}>
                                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-white rounded-full" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Label>
                                <RadioGroupItem
                                    value="student"
                                    id="student"
                                    className="sr-only"
                                />
                            </div>

                            {/* Teacher Option */}
                            <div className="relative">
                                <Label htmlFor="teacher" className="cursor-pointer">
                                    <Card className={`relative overflow-hidden border-2 transition-all duration-200 hover:shadow-md ${(selectedRole || 'student') === 'teacher'
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/50 shadow-md'
                                        : 'border-border hover:border-purple-300 blur-sm opacity-50'
                                        }`}>
                                        <CardContent className="flex items-center p-4">
                                            <div className="flex items-center space-x-4 flex-1">
                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                                    <GraduationCap className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-semibold text-lg">Teacher</h3>
                                                        <Badge variant="secondary" className="text-xs">
                                                            Teach
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Create courses, manage students, and track progress
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`transition-opacity duration-200 ${(selectedRole || 'student') === 'teacher' ? 'opacity-100' : 'opacity-0'
                                                }`}>
                                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-white rounded-full" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Label>
                                <RadioGroupItem
                                    value="teacher"
                                    id="teacher"
                                    className="sr-only"
                                />
                            </div>
                        </RadioGroup>

                        <Button
                            type="submit"
                            disabled={!selectedRole}
                            className="w-full h-12 text-base font-semibold"
                            size="lg"
                        >
                            {(selectedRole || 'student') ? (
                                <>
                                    Continue as {(selectedRole || 'student').charAt(0).toUpperCase() + (selectedRole || 'student').slice(1)}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            ) : (
                                'Select a role to continue'
                            )}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        );
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
                <span className="ml-3">Loading...</span>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, loading, role }}>
            {children}
            {user && !role && <RoleSelectionModal />}
        </AuthContext.Provider>
    );
}

// 3. Custom Hook
export const useAuth = () => useContext(AuthContext);
