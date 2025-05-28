'use client';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/hooks/lib/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, BookOpen, ArrowRight } from 'lucide-react';

export type UserRole = 'student' | 'teacher' | null;

const LOCAL_STORAGE_KEY = 'localStorageFlag'; // Fixed typo
const USER_ROLE_KEY = 'userRole';
const USER_EMAIL_KEY = 'userEmail';

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

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<UserRole>(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>('student'); // Changed from null to 'student'
    const router = useRouter();

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
        } catch (error) {
            console.error('Error setting user role:', error);
        } finally {
            setLoading(false);
        }
    };

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
    }, []);

    const handleRoleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRole) await saveUserRole(selectedRole); // Check kept for type safety
    };

    const RoleSelectionModal = () => {
        if (!showRoleModal || !user) return null;

        return (
            <Dialog open={showRoleModal} >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="text-center space-y-4">
                        <DialogTitle className="text-3xl font-bold text-gray-800">Welcome to Quadrat!</DialogTitle>
                        <DialogDescription className="text-lg text-gray-600">
                            Select your role to personalize your experience
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleRoleSubmit} className="space-y-6 mt-6">
                        <RadioGroup
                            value={selectedRole}
                            onValueChange={(value) => setSelectedRole(value as 'student' | 'teacher')}
                            className="space-y-4"
                        >
                            {/* Student Card */}
                            <Label htmlFor="student" className="cursor-pointer">
                                <Card
                                    className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg ${selectedRole === 'student'
                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                            : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    <CardContent className="flex items-center p-4">
                                        <div className="flex items-center space-x-4 flex-1">
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <BookOpen className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="font-semibold text-lg text-gray-800">Student</h3>
                                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                                        Learn
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Access courses, assignments, and learning materials
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            className={`transition-opacity duration-200 ${selectedRole === 'student' ? 'opacity-100' : 'opacity-0'
                                                }`}
                                        >
                                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Label>
                            <RadioGroupItem value="student" id="student" className="sr-only" />

                            {/* Teacher Card */}
                            <Label htmlFor="teacher" className="cursor-pointer">
                                <Card
                                    className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg ${selectedRole === 'teacher'
                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                            : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    <CardContent className="flex items-center p-4">
                                        <div className="flex items-center space-x-4 flex-1">
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <GraduationCap className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="font-semibold text-lg text-gray-800">Teacher</h3>
                                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                                        Teach
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Create courses, manage students, and track progress
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            className={`transition-opacity duration-200 ${selectedRole === 'teacher' ? 'opacity-100' : 'opacity-0'
                                                }`}
                                        >
                                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Label>
                            <RadioGroupItem value="teacher" id="teacher" className="sr-only" />
                        </RadioGroup>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                            size="lg"
                        >
                            Continue as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        );
      };

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

export const useAuth = () => useContext(AuthContext);
