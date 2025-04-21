'use client';

import { onAuthStateChanged, User } from 'firebase/auth';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/hooks/lib/firebaseConfig';

// 1. Create Context
interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

// 2. Provider Component
export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/login')
            }
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// 3. Custom Hook for easy access
export const useAuth = () => useContext(AuthContext);
