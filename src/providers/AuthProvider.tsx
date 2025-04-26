'use client';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth, db } from '@/hooks/lib/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Define user role type
type UserRole = 'student' | 'teacher' | null;

// 1. Create Context with role info
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
    
    // Function to save user role to Firestore
    const saveUserRole = async (newRole: UserRole) => {
        if (!user || !newRole) return;

        try {
            await setDoc(doc(db, 'userRoles', user.uid), {
                role: newRole,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            setRole(newRole);
            setShowRoleModal(false);
        } catch (error) {
            console.error("Error setting user role:", error);
        }
    };

    // Fetch user role from Firestore
    const fetchUserRole = async (userId: string) => {
        try {
            const docRef = doc(db, 'userRoles', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                setRole(userData.role as UserRole);
                setLoading(false);
            } else {
                // If no role is found, show the modal and stop loading
                setShowRoleModal(true);
                setLoading(false);
            }
        } catch (error) {
            console.error("Error fetching user role:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/login');
                setRole(null);
                setLoading(false);
                return;
            }

            setUser(user);
            fetchUserRole(user.uid);
        });

        return () => unsubscribe();
    }, [router]);

    // Handle role submission
    const handleRoleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRole) {
            setLoading(true);
            await saveUserRole(selectedRole);
            setLoading(false);
        }
    };

    // Custom Modal Component (similar to Shadcn but without dependencies)
    const RoleSelectionModal = () => {
        if (!showRoleModal || !user) return null;

        return (
            <div className="fixed inset-0 bg-black backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4 overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Select Your Role</h2>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Please select whether you are a student or teacher.
                        </p>

                        <form onSubmit={handleRoleSubmit} className="mt-6">
                            <div className="space-y-4">
                                <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <input
                                        type="radio"
                                        name="role"
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        onChange={() => setSelectedRole('student')}
                                        checked={selectedRole === 'student'}
                                    />
                                    <span className="ml-2 font-medium">Student</span>
                                </label>

                                <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <input
                                        type="radio"
                                        name="role"
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        onChange={() => setSelectedRole('teacher')}
                                        checked={selectedRole === 'teacher'}
                                    />
                                    <span className="ml-2 font-medium">Teacher</span>
                                </label>
                            </div>

                            <div className="mt-6">
                                <button
                                    type="submit"
                                    disabled={!selectedRole}
                                    className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Continue
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    // Show loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-300">Loading...</span>
            </div>
        );
    }


    return (
        <>

            <AuthContext.Provider value={{ user, loading, role }}>
                {isLoginPage || (user && role) ? children : <RoleSelectionModal />}
            </AuthContext.Provider>
        </>
    );
}

// 3. Custom Hook for easy access
export const useAuth = () => useContext(AuthContext);
