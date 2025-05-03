import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth, db } from './firebaseConfig';

export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log('Google login success:', user);
        return user;
    } catch (error) {
        console.error('Google login error:', error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
        // Clear local storage or any other cleanup if necessary
        window.localStorage.removeItem('userRole');
        window.localStorage.removeItem('loclatsoreg');
        console.log('User logged out');
    } catch (error) {
        console.error('Logout error:', error);
    }
};


export async function signInWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
}

interface TestResponse {
    question: string;
    correct_answer: string;
    user_answer: string;
}

interface TestResult {
    username: string;
    responses: TestResponse[];
    score: number;
}

export const saveTestResult = async (testResult: TestResult): Promise<void> => {
    try {
        const testResultsRef = collection(db, 'test-results');

        await addDoc(testResultsRef, {
            ...testResult,
            timestamp: serverTimestamp(),
            dateCompleted: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error saving test result:', error);
        throw new Error('Failed to save test result');
    }
};
