'use client';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth, db } from '@/hooks/lib/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

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
                // ensure both role and email exist
                if (savedRole && savedEmail) {
                    setRole(savedRole);
                    window.localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
                    window.localStorage.setItem(USER_ROLE_KEY, savedRole);
                    window.localStorage.setItem(USER_EMAIL_KEY, savedEmail);
                } else {
                    // missing info, prompt
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
            // check localStorage and current auth email match
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

    // Role selection modal
    const RoleSelectionModal = () => {
        if (!showRoleModal || !user) return null;
        return (
            <div className="fixed inset-0 bg-black backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4 overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold">Select Your Role</h2>
                        <p className="mt-2 text-sm">Please select whether you are a student or teacher.</p>
                        <form onSubmit={handleRoleSubmit} className="mt-6 space-y-4">
                            <label className="flex items-center p-3 border rounded-md cursor-pointer">
                                <input
                                    type="radio"
                                    name="role"
                                    onChange={() => setSelectedRole('student')}
                                    checked={selectedRole === 'student'}
                                />
                                <span className="ml-2">Student</span>
                            </label>
                            <label className="flex items-center p-3 border rounded-md cursor-pointer">
                                <input
                                    type="radio"
                                    name="role"
                                    onChange={() => setSelectedRole('teacher')}
                                    checked={selectedRole === 'teacher'}
                                />
                                <span className="ml-2">Teacher</span>
                            </label>
                            <button
                                type="submit"
                                disabled={!selectedRole}
                                className="w-full py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                            >
                                Continue
                            </button>
                        </form>
                    </div>
                </div>
            </div>
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
            {isLoginPage || (user && role) ? children : <RoleSelectionModal />}
        </AuthContext.Provider>
    );
}

// 3. Custom Hook
export const useAuth = () => useContext(AuthContext);
